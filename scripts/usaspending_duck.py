#!/usr/bin/env python3
"""
usaspending_duck.py — production local lakehouse for USAspending data.
Free, embedded, zero-server: DuckDB (vectorized OLAP) + Parquet (zstd columnar),
medallion architecture. Scales from today's 8 GB to all-federal hundreds of GB
on a laptop: Parquet compresses the CSVs ~8-12x, hive partitioning prunes scans
to the agency/FY you query, and DuckDB streams larger-than-memory work to disk.

  pip install duckdb           (the only dependency)

LAYOUT (under sourcedata/USAspending/)
  award-data-archive/...                       BRONZE — raw CSVs as landed (git-ignored)
  warehouse/silver/contracts/                  SILVER — typed, deduped, delta-applied
      agency=<code>/fy=<year>/*.parquet                  hive-partitioned Parquet
  warehouse/usaspending.duckdb                 catalog + gold views
  processed/<agency>/FY<fy>/analysis_report.json  GOLD — compact app-ready JSON (committed)

COMMANDS
  python scripts/usaspending_duck.py build  [--fy 2026] [--limit N]   CSV → silver Parquet (+deltas)
  python scripts/usaspending_duck.py gold   --agency 097 --fy 2026    aggregates + ML screens → JSON
  python scripts/usaspending_duck.py sql    "SELECT ..."              ad-hoc SQL over the lake
  python scripts/usaspending_duck.py status                           lake inventory & sizes
"""
import argparse, glob, json, os, sys
from datetime import datetime, timezone

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sourcedata", "USAspending")
BRONZE_FULL  = os.path.join(ROOT, "award-data-archive", "contracts", "full")
BRONZE_DELTA = os.path.join(ROOT, "award-data-archive", "contracts", "delta")
WH     = os.path.join(ROOT, "warehouse")
SILVER = os.path.join(WH, "silver", "contracts")
DB     = os.environ.get("USA_DUCKDB", os.path.join(WH, "usaspending.duckdb"))
OUT    = os.path.join(ROOT, "processed")

# analytical column subset of the 297-column archive schema
COLS = """contract_transaction_unique_key, contract_award_unique_key, award_id_piid,
  modification_number, TRY_CAST(federal_action_obligation AS DOUBLE) AS amount,
  TRY_CAST(action_date AS DATE) AS action_date,
  TRY_CAST(action_date_fiscal_year AS INTEGER) AS fy,
  awarding_agency_code AS agency, awarding_agency_name,
  awarding_sub_agency_name, awarding_office_name,
  funding_agency_code, funding_agency_name,
  recipient_uei, recipient_name, recipient_state_code,
  primary_place_of_performance_state_code AS pop_state,
  award_type_code, award_type, naics_code, naics_description,
  product_or_service_code AS psc, product_or_service_code_description AS psc_desc,
  treasury_accounts_funding_this_award AS tas_list,
  object_classes_funding_this_award AS oc_list,
  program_activities_funding_this_award AS pa_list"""

def connect():
    try:
        import duckdb
    except ImportError:
        sys.exit("DuckDB not installed. Run:  pip install duckdb")
    os.makedirs(WH, exist_ok=True)
    con = duckdb.connect(DB)
    con.execute("SET preserve_insertion_order=false")  # lower memory on big scans
    return con

def csv_read(files, limit=0, extra_cols=""):
    lst = "[" + ",".join(f"'{f}'" for f in files) + "]"
    lim = f" LIMIT {limit}" if limit else ""
    return (f"SELECT {extra_cols}{COLS} FROM read_csv({lst}, header=true, sample_size=20000, "
            f"strict_mode=false, ignore_errors=true, all_varchar=true){lim}")

# ── BUILD: bronze CSV → silver Parquet, dedupe + delta application ───────────
def build(args):
    con = connect()
    fy_dirs = sorted(glob.glob(os.path.join(BRONZE_FULL, "FY*"))) if not args.fy else \
              [os.path.join(BRONZE_FULL, f"FY{args.fy}")]
    deltas = sorted(glob.glob(os.path.join(BRONZE_DELTA, "*", "*.csv")))
    for d in fy_dirs:
        fulls = sorted(glob.glob(os.path.join(d, "*.csv")))
        if not fulls: continue
        fy = os.path.basename(d).replace("FY", "")
        print(f"[build] FY{fy}: {len(fulls)} full file(s), {len(deltas)} delta file(s)"
              + (f", LIMIT {args.limit:,}" if args.limit else " (full pass)"))
        con.execute(f"CREATE OR REPLACE TEMP TABLE staged AS {csv_read(fulls, args.limit)}")
        if deltas and not args.skip_deltas:
            con.execute(f"""CREATE OR REPLACE TEMP TABLE delta AS
                SELECT UPPER(TRIM(correction_delete_ind)) AS ind, {COLS}
                FROM read_csv({"[" + ",".join(f"'{f}'" for f in deltas) + "]"},
                     header=true, sample_size=20000, strict_mode=false,
                     ignore_errors=true, all_varchar=true)
                {f"LIMIT {args.limit}" if args.limit else ""}""")
            con.execute("""DELETE FROM staged WHERE contract_transaction_unique_key IN
                           (SELECT contract_transaction_unique_key FROM delta)""")
            con.execute("""INSERT INTO staged SELECT * EXCLUDE(ind) FROM delta WHERE ind != 'D'""")
            print(f"[build]   deltas applied: {con.sql('SELECT count(*) FROM delta').fetchone()[0]:,} change rows")
        # dedupe + quality gates, then write hive-partitioned zstd parquet
        os.makedirs(SILVER, exist_ok=True)
        con.execute(f"""
            COPY (
              SELECT * FROM staged
              WHERE amount IS NOT NULL AND fy IS NOT NULL AND agency IS NOT NULL
              QUALIFY row_number() OVER (PARTITION BY contract_transaction_unique_key
                                         ORDER BY action_date DESC NULLS LAST) = 1
            ) TO '{SILVER}' (FORMAT parquet, COMPRESSION zstd,
                             PARTITION_BY (agency, fy), OVERWRITE_OR_IGNORE)
        """)
        n = con.sql(f"SELECT count(*) FROM read_parquet('{SILVER}/**/*.parquet', hive_partitioning=true) WHERE fy={fy}").fetchone()[0]
        print(f"[build]   silver rows FY{fy}: {n:,}")
    status(args)

# ── GOLD: aggregates + ML screens → compact JSON for the app ────────────────
def gold(args):
    con = connect()
    src = f"read_parquet('{SILVER}/**/*.parquet', hive_partitioning=true)"
    where = f"WHERE fy = {args.fy}" + ("" if args.agency == "all" else
            f" AND ltrim(agency,'0') = '{args.agency.lstrip('0')}'")
    base = f"(SELECT * FROM {src} {where})"
    one = lambda q: con.sql(q).fetchone()[0]
    rows = lambda q: [list(r) for r in con.sql(q).fetchall()]
    n = one(f"SELECT count(*) FROM {base} t")
    if not n: sys.exit(f"no silver rows for agency={args.agency} fy={args.fy} — run build first")
    report = {
      "generated": datetime.now(timezone.utc).isoformat(),
      "engine": "DuckDB local lakehouse (silver parquet, hive-partitioned, zstd)",
      "agency": args.agency, "fy": args.fy, "records": n,
      "net_obligations": round(one(f"SELECT sum(amount) FROM {base} t"), 2),
      "monthly_obligations": dict(rows(f"SELECT strftime(action_date,'%Y-%m'), round(sum(amount),2) FROM {base} t GROUP BY 1 ORDER BY 1")),
      "top_recipients_by_amount": rows(f"SELECT recipient_name, round(sum(amount),2) FROM {base} t GROUP BY 1 ORDER BY abs(sum(amount)) DESC LIMIT 15"),
      "top_sub_agencies": rows(f"SELECT awarding_sub_agency_name, round(sum(amount),2) FROM {base} t GROUP BY 1 ORDER BY abs(sum(amount)) DESC LIMIT 15"),
      "top_naics": rows(f"SELECT naics_code || ' ' || left(naics_description,40), round(sum(amount),2) FROM {base} t WHERE naics_code IS NOT NULL GROUP BY 1 ORDER BY abs(sum(amount)) DESC LIMIT 10"),
      "top_treasury_accounts": rows(f"""SELECT trim(u.tas), round(sum(t.amount),2)
          FROM {base} t, unnest(string_split(t.tas_list,';')) AS u(tas)
          WHERE length(trim(u.tas))>3 GROUP BY 1 ORDER BY abs(sum(t.amount)) DESC LIMIT 12"""),
      "cross_servicing_share_pct": round(one(f"SELECT 100.0*count(*) FILTER (WHERE funding_agency_code IS NOT NULL AND funding_agency_code != agency)/count(*) FROM {base} t"), 2),
      "ml_screens": {
        "benford_first_digit": benford_sql(con, base),
        "robust_outliers_top": [dict(zip(["score","amount","recipient","date","sub_agency"], r)) for r in rows(f"""
            WITH s AS (SELECT median(amount) m, median(abs(amount - (SELECT median(amount) FROM {base} t))) mad,
                              quantile_cont(amount,0.25) q1, quantile_cont(amount,0.75) q3 FROM {base} t)
            SELECT round(abs(0.6745*(t.amount-s.m)/nullif(s.mad,0)),1) score, t.amount, t.recipient_name,
                   t.action_date, t.awarding_sub_agency_name
            FROM {base} t, s
            WHERE abs(0.6745*(t.amount-s.m)/nullif(s.mad,0)) > 3.5
               OR t.amount > s.q3 + 3*(s.q3-s.q1) OR t.amount < s.q1 - 3*(s.q3-s.q1)
            ORDER BY score DESC NULLS LAST LIMIT 20""")],
        "value_strata": [dict(zip(["stratum","min","max","population","share_pct"], r)) for r in rows(f"""
            WITH b AS (SELECT amount, ntile(4) OVER (ORDER BY log10(abs(amount)+1)) tile FROM {base} t WHERE amount != 0)
            SELECT ['Micro','Small','Medium','Major'][tile], round(min(abs(amount)),2), round(max(abs(amount)),2),
                   count(*), round(100.0*count(*)/sum(count(*)) OVER (),1)
            FROM b GROUP BY tile ORDER BY tile""")],
      },
      "time_basis": {"population": f"action_date_fiscal_year == {args.fy} (execution view)",
                     "appropriation_identity": "top_treasury_accounts carries the TAS (year of the money)"},
    }
    label = "ALL" if args.agency == "all" else args.agency
    odir = os.path.join(OUT, label, f"FY{args.fy}"); os.makedirs(odir, exist_ok=True)
    p = os.path.join(odir, "analysis_report.json")
    json.dump(report, open(p, "w", encoding="utf-8"), indent=2, default=str)
    print(f"[gold] {n:,} rows → {p}")
    print(f"[gold] net {report['net_obligations']:,} · Benford {'CONFORMS' if report['ml_screens']['benford_first_digit'].get('conforms') else 'CHECK'} · {len(report['ml_screens']['robust_outliers_top'])} outliers")

def benford_sql(con, base):
    r = con.sql(f"""
      WITH d AS (SELECT TRY_CAST(nullif(left(regexp_replace(CAST(round(abs(amount),2) AS VARCHAR),'[^1-9]',''),1),'') AS INT) dig
                 FROM {base} t WHERE abs(amount) >= 1),
      o AS (SELECT dig, count(*) c FROM d WHERE dig BETWEEN 1 AND 9 GROUP BY dig),
      e AS (SELECT dig, log10(1+1.0/dig) p FROM range(1,10) r(dig))
      SELECT sum(pow(coalesce(o.c,0) - e.p*(SELECT sum(c) FROM o), 2) / (e.p*(SELECT sum(c) FROM o))) chi2,
             avg(abs(100.0*coalesce(o.c,0)/(SELECT sum(c) FROM o) - 100*e.p)) mad, (SELECT sum(c) FROM o) n
      FROM e LEFT JOIN o USING(dig)""").fetchone()
    chi2, mad, n = (round(r[0] or 0, 1), round(r[1] or 0, 2), int(r[2] or 0))
    return {"n": n, "chi2": chi2, "critical_0p05_8df": 15.51, "mad_pct": mad, "conforms": chi2 < 15.51}

def status(_):
    con = connect()
    print("── lake status ─────────────────────────────")
    for label, pat in [("bronze full CSV", os.path.join(BRONZE_FULL, "*", "*.csv")),
                       ("bronze delta CSV", os.path.join(BRONZE_DELTA, "*", "*.csv")),
                       ("silver parquet", os.path.join(SILVER, "**", "*.parquet"))]:
        fs = glob.glob(pat, recursive=True)
        sz = sum(os.path.getsize(f) for f in fs) / 1e9
        print(f"  {label:18} {len(fs):4} files  {sz:8.2f} GB")
    if glob.glob(os.path.join(SILVER, "**", "*.parquet"), recursive=True):
        for r in con.sql(f"SELECT agency, fy, count(*), round(sum(amount)/1e9,2) FROM read_parquet('{SILVER}/**/*.parquet', hive_partitioning=true) GROUP BY 1,2 ORDER BY 3 DESC LIMIT 10").fetchall():
            print(f"  silver agency={r[0]} fy={r[1]}: {r[2]:,} rows · ${r[3]}B net")

def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build");  b.add_argument("--fy", type=int); b.add_argument("--limit", type=int, default=0); b.add_argument("--skip-deltas", action="store_true")
    g = sub.add_parser("gold");   g.add_argument("--agency", default="097"); g.add_argument("--fy", type=int, default=2026)
    q = sub.add_parser("sql");    q.add_argument("query")
    sub.add_parser("status")
    a = ap.parse_args()
    if a.cmd == "build": build(a)
    elif a.cmd == "gold": gold(a)
    elif a.cmd == "status": status(a)
    else:
        con = connect()
        con.sql(f"CREATE OR REPLACE VIEW contracts AS SELECT * FROM read_parquet('{SILVER}/**/*.parquet', hive_partitioning=true)")
        print(con.sql(a.query))

if __name__ == "__main__":
    main()
