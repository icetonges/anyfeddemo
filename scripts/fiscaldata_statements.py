#!/usr/bin/env python3
"""
fiscaldata_statements.py — pull ALL audited Financial Report statements from
Treasury Fiscal Data (api.fiscaldata.treasury.gov), ALL agencies, last 10+
statement years, into sourcedata/FiscalData/financial-report/ (JSON + CSV)
and optionally the DuckDB warehouse.

RUN (from the repo root, no dependencies beyond Python 3.8+):
    python scripts/fiscaldata_statements.py
Optional:
    python scripts/fiscaldata_statements.py --years 15
    pip install duckdb   (enables the warehouse load automatically)
"""
import argparse, csv, json, os, sys, time, urllib.request
from datetime import datetime, timezone

BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "sourcedata", "FiscalData", "financial-report")
WH   = os.path.join(HERE, "..", "sourcedata", "USAspending", "warehouse")
DB   = os.environ.get("USA_DUCKDB", os.path.join(WH, "usaspending.duckdb"))

# Each statement: list of endpoint-name VARIANTS tried in order (v2 then v1).
# statement_net_cost and balance_sheets are confirmed live.
STATEMENTS = {
  "statement_net_cost":   ["statement_net_cost"],
  "balance_sheets":       ["balance_sheets"],
  "operations_and_changes_in_net_position": [
      "statements_of_operations_and_changes_in_net_position",
      "statement_of_operations_and_changes_in_net_position",
      "stmt_operations_changes_net_position", "operations_net_position"],
  "reconciliation_net_cost_to_deficit": [
      "reconciliations_of_net_operating_cost_and_unified_budget_deficit",
      "reconciliation_net_operating_cost_budget_deficit", "net_cost_budget_deficit"],
  "changes_in_cash_balance": [
      "statements_of_changes_in_cash_balance",
      "statement_changes_cash_balance", "changes_in_cash_balance"],
  "long_term_fiscal_projections": [
      "statements_of_long_term_fiscal_projections",
      "long_term_fiscal_projection", "long_term_fiscal_projections"],
  "social_insurance": [
      "statements_of_social_insurance", "statement_social_insurance"],
}

AGENCY_MAP = {
  "Department of Defense":"DOD","Department of the Treasury":"TREAS",
  "Department of Health and Human Services":"HHS","Department of Veterans Affairs":"VA",
  "Social Security Administration":"SSA","Department of Homeland Security":"DHS",
  "Department of Energy":"DOE","Department of Justice":"DOJ","Department of State":"DOS",
  "Department of Transportation":"DOT","Department of Education":"ED",
  "Department of Agriculture":"USDA","Department of Commerce":"DOC",
  "Department of Labor":"DOL","Department of Housing and Urban Development":"HUD",
  "Department of the Interior":"DOI","Environmental Protection Agency":"EPA",
  "National Aeronautics and Space Administration":"NASA",
  "General Services Administration":"GSA","National Science Foundation":"NSF",
  "Office of Personnel Management":"OPM","Small Business Administration":"SBA",
  "Agency for International Development":"USAID","U.S. Nuclear Regulatory Commission":"NRC",
  "Federal Deposit Insurance Corporation":"FDIC","Securities and Exchange Commission":"SEC",
  "Federal Communications Commission":"FCC",
}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "anyfed-portal/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode("utf-8", "replace")
    return json.loads(body) if body.strip() else None

def fetch_table(endpoint):
    """Full table via pagination (these tables are small: <3K rows)."""
    rows, page = [], 1
    while True:
        for ver in ("v2", "v1"):
            try:
                j = get(f"{BASE}/{ver}/accounting/od/{endpoint}?page%5Bsize%5D=10000&page%5Bnumber%5D={page}")
            except Exception:
                j = None
            if j and j.get("data"):
                break
        if not j or not j.get("data"):
            return rows if rows else None
        rows += j["data"]
        if page >= int(j.get("meta", {}).get("total-pages", 1)) or len(j["data"]) < 10000:
            return rows
        page += 1

def year_of(r):
    return r.get("stmt_fiscal_year") or r.get("record_fiscal_year") or ""

def write_csv(path, rows):
    if not rows: return
    cols = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in rows: w.writerow(r)

def pull_mts(years_back):
    """MTS Table 5 - outlays BY AGENCY, MONTHLY (most frequent by-agency
    statement data published). Confirmed endpoint: v1/accounting/mts/mts_table_5.
    Columns: classification_desc (agency/bureau), current_month gross/receipts/
    net outlays, FYTD and prior-FYTD - dollars in millions."""
    cutoff = (datetime.now().year + (1 if datetime.now().month >= 10 else 0)) - years_back
    tdir = os.path.join(ROOT, "mts_outlays_by_agency_monthly")
    os.makedirs(tdir, exist_ok=True)
    rows, page = [], 1
    print(f"[try ] MTS Table 5 (outlays by agency, monthly) fy>={cutoff} ...", flush=True)
    while True:
        url = (f"{BASE}/v1/accounting/mts/mts_table_5?filter=record_fiscal_year:gte:{cutoff}"
               f"&page%5Bsize%5D=10000&page%5Bnumber%5D={page}")
        try:
            j = get(url)
        except Exception as e:
            print(f"[MISS] mts_table_5 page {page}: {e}"); break
        if not j or not j.get("data"): break
        rows += j["data"]
        print(f"       page {page}: +{len(j['data']):,} rows (total {len(rows):,})", flush=True)
        if page >= int(j.get("meta", {}).get("total-pages", 1)) or len(j["data"]) < 10000: break
        page += 1
    if not rows:
        return {"status": "FAILED"}
    json.dump({"table": "mts_table_5", "endpoint": "v1/accounting/mts/mts_table_5",
               "unit": "millions USD", "cadence": "MONTHLY (published ~8th business day after month end)",
               "grain": "agency/bureau classification x month", "pulled": datetime.now(timezone.utc).isoformat(),
               "rows": len(rows), "data": rows},
              open(os.path.join(tdir, "mts_table_5_ALL.json"), "w", encoding="utf-8"))
    write_csv(os.path.join(tdir, "mts_table_5_ALL.csv"), rows)
    fys = sorted({r.get("record_fiscal_year") for r in rows if r.get("record_fiscal_year")})
    for y in fys:
        yr = [r for r in rows if r.get("record_fiscal_year") == y]
        write_csv(os.path.join(tdir, f"FY{y}.csv"), yr)
        json.dump(yr, open(os.path.join(tdir, f"FY{y}.json"), "w", encoding="utf-8"))
    # naive monthly rollup by classification (agency line) - net outlays
    roll = {}
    for r in rows:
        k = (r.get("classification_desc") or "").strip().rstrip(":")
        v = r.get("current_month_net_outly_amt")
        if not k or v in (None, "", "null"): continue
        m = f"{r.get('record_calendar_year')}-{r.get('record_calendar_month')}"
        roll.setdefault(k, {})[m] = roll.setdefault(k, {}).get(m, 0.0) + float(v)
    json.dump({"generated": datetime.now(timezone.utc).isoformat(),
               "unit": "millions USD, net outlays (cash), MONTHLY",
               "note": "classification_desc includes agencies AND sub-lines; filter to top-level agency names when analyzing",
               "byClassificationMonthly": roll},
              open(os.path.join(ROOT, "mts_net_outlays_by_agency_monthly.json"), "w", encoding="utf-8"))
    print(f"[ OK ] mts_table_5: {len(rows):,} rows | FY{fys[0]}-FY{fys[-1]} | MONTHLY by agency -> {os.path.basename(tdir)}/")
    return {"status": "OK", "rows": len(rows), "fiscalYears": f"{fys[0]}-{fys[-1]}"}

def load_user_endpoints():
    """Optional: sourcedata/FiscalData/financial-report/fr_endpoints.txt
    Lines of  friendly_name = exact_endpoint_name  (from each table's
    fiscaldata.treasury.gov page, 'API Quick Guide' section)."""
    f = os.path.join(ROOT, "fr_endpoints.txt")
    if not os.path.exists(f): return
    for line in open(f, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        name, ep = [x.strip() for x in line.split("=", 1)]
        if name and ep:
            STATEMENTS.setdefault(name, [])
            if ep not in STATEMENTS[name]:
                STATEMENTS[name].insert(0, ep)
            print(f"[user] added endpoint for '{name}': {ep}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", type=int, default=10, help="how many most-recent statement years to split out (default 10)")
    a = ap.parse_args()
    os.makedirs(ROOT, exist_ok=True)
    load_user_endpoints()
    manifest = {"pulled": datetime.now(timezone.utc).isoformat(), "source": BASE, "tables": {}}
    print("=" * 72)
    print("FISCAL DATA - AUDITED FINANCIAL REPORT STATEMENTS - FULL PULL")
    print("=" * 72)

    for name, variants in STATEMENTS.items():
        rows = endpoint = None
        for v in variants:
            print(f"[try ] {name}: endpoint '{v}' ...", flush=True)
            rows = fetch_table(v)
            if rows:
                endpoint = v
                break
            time.sleep(0.2)
        if not rows:
            manifest["tables"][name] = {"status": "NOT FOUND - endpoint name unknown; check fiscaldata.treasury.gov dataset page", "tried": variants}
            print(f"[MISS] {name}: no variant answered")
            continue

        tdir = os.path.join(ROOT, name)
        os.makedirs(tdir, exist_ok=True)
        years = sorted({year_of(r) for r in rows if year_of(r)})
        keep = years[-a.years:]
        # full history JSON + CSV
        json.dump({"table": name, "endpoint": endpoint, "unit": "billions USD",
                   "audited": True, "pulled": manifest["pulled"], "rows": len(rows),
                   "statementYears": years, "data": rows},
                  open(os.path.join(tdir, f"{name}_ALL.json"), "w", encoding="utf-8"), indent=1)
        write_csv(os.path.join(tdir, f"{name}_ALL.csv"), rows)
        # per-year splits for the last N years
        for y in keep:
            yr = [r for r in rows if year_of(r) == y]
            json.dump(yr, open(os.path.join(tdir, f"FY{y}.json"), "w", encoding="utf-8"), indent=1)
            write_csv(os.path.join(tdir, f"FY{y}.csv"), yr)
        manifest["tables"][name] = {"status": "OK", "endpoint": endpoint, "rows": len(rows),
                                    "statementYears": f"{years[0]}-{years[-1]}", "perYearFiles": keep}
        print(f"[ OK ] {name}: {len(rows):,} rows | years {years[0]}-{years[-1]} | per-year files FY{keep[0]}-FY{keep[-1]}")
        time.sleep(0.3)

    # GOLD: SNC by agency, last N years, mapped to the portal registry
    snc_path = os.path.join(ROOT, "statement_net_cost", "statement_net_cost_ALL.json")
    if os.path.exists(snc_path):
        snc = json.load(open(snc_path, encoding="utf-8"))["data"]
        cutoff = sorted({year_of(r) for r in snc})[-a.years:]
        by = {}
        for r in snc:
            y = year_of(r)
            if y not in cutoff: continue
            ag = r.get("agency_nm", "")
            fnum = lambda k: (lambda v: float(v) if v not in (None, "", "null") else 0.0)(r.get(k))
            by.setdefault(ag, {"registryId": AGENCY_MAP.get(ag), "years": {}})["years"][f"FY{y}"] = {
                "grossCost": fnum("gross_cost_bil_amt"), "earnedRevenue": fnum("earned_revenue_bil_amt"),
                "changeAssumptions": fnum("change_assumptions_bil_amt"), "netCost": fnum("net_cost_bil_amt"),
                "restated": r.get("restmt_flag") == "Y"}
        gold = {"generated": manifest["pulled"], "unit": "billions USD, accrual, GAO-audited",
                "yearsHeld": [f"FY{y}" for y in cutoff],
                "registryAgenciesCovered": sorted({v["registryId"] for v in by.values() if v["registryId"]}),
                "agencies": by}
        json.dump(gold, open(os.path.join(ROOT, "snc_by_agency_10yr.json"), "w", encoding="utf-8"), indent=1)
        print(f"[GOLD] snc_by_agency_10yr.json: {len(by)} FR entities, {len(gold['registryAgenciesCovered'])} registry agencies, years FY{cutoff[0]}-FY{cutoff[-1]}")

    # MONTHLY BY-AGENCY data (the most frequently updated by-agency source)
    manifest["tables"]["mts_outlays_by_agency_monthly"] = pull_mts(a.years)

    json.dump(manifest, open(os.path.join(ROOT, "manifest.json"), "w", encoding="utf-8"), indent=2)

    # optional DuckDB load
    try:
        import duckdb
        os.makedirs(WH, exist_ok=True)
        con = duckdb.connect(DB)
        for name in manifest["tables"]:
            f = os.path.join(ROOT, name, f"{name}_ALL.json")
            if manifest["tables"][name].get("status") == "OK" and os.path.exists(f):
                con.execute(f"CREATE OR REPLACE TABLE fr_{name} AS SELECT unnest(data, recursive:=true) FROM read_json_auto('{f.replace(chr(92), '/')}')")
                n = con.sql(f"SELECT count(*) FROM fr_{name}").fetchone()[0]
                print(f"[DUCK] fr_{name}: {n:,} rows loaded into warehouse")
    except ImportError:
        print("[note] duckdb not installed - skipped warehouse load (pip install duckdb to enable)")

    print("=" * 72)
    ok = sum(1 for t in manifest["tables"].values() if t.get("status") == "OK")
    print(f"DONE: {ok}/{len(STATEMENTS)} statements pulled -> {os.path.normpath(ROOT)}")
    print("Missing tables are name-variant misses, not data absence - send me the")
    print("endpoint name from the dataset page and I will add it.")

if __name__ == "__main__":
    main()
