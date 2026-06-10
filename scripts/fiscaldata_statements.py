#!/usr/bin/env python3
"""
fiscaldata_statements.py — AUDITED financial statements from Treasury's Fiscal
Data API (the Financial Report of the U.S. Government, audited by GAO), pulled
for the last 10+ statement years, broken down by agency where the statement
carries agency detail, stored in sourcedata/ and loaded into the same DuckDB
warehouse as the USAspending data.

  python scripts/fiscaldata_statements.py pull            # API → sourcedata/FiscalData/
  python scripts/fiscaldata_statements.py load            # JSON → DuckDB warehouse tables
  python scripts/fiscaldata_statements.py gold            # per-registry-agency 10yr summary
  python scripts/fiscaldata_statements.py all             # pull + load + gold

Data facts (probed live 2026-06):
  • v2/accounting/od/statement_net_cost — BY AGENCY (agency_nm): gross_cost_bil_amt,
    earned_revenue_bil_amt, change_assumptions_bil_amt, net_cost_bil_amt per
    stmt_fiscal_year (audited; restmt_flag marks restatements). ~1,950 rows total.
  • v2/accounting/od/balance_sheets — government-wide line items (no agency split).
  • Other FR tables are PROBED from the candidate list; misses are recorded in
    the manifest rather than failing the run. Amounts are in BILLIONS of dollars.
"""
import json, os, sys, time, urllib.request, urllib.parse
from datetime import datetime, timezone

BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sourcedata", "FiscalData", "financial-report")
WH   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sourcedata", "USAspending", "warehouse")
DB   = os.environ.get("USA_DUCKDB", os.path.join(WH, "usaspending.duckdb"))

# confirmed + candidate FR tables (script probes; misses recorded, not fatal)
TABLES = {
  "statement_net_cost":  {"confirmed": True,  "byAgency": True,
    "desc": "Statements of Net Cost — gross cost, earned revenue, net cost BY AGENCY (audited, $B)"},
  "balance_sheets":      {"confirmed": True,  "byAgency": False,
    "desc": "Balance Sheets — government-wide assets/liabilities/net position (audited, $B)"},
  "statements_of_operations_and_changes_in_net_position": {"confirmed": False, "byAgency": False,
    "desc": "Operations & Changes in Net Position (candidate endpoint name)"},
  "reconciliations_of_net_operating_cost_and_unified_budget_deficit": {"confirmed": False, "byAgency": False,
    "desc": "Net Operating Cost ↔ Budget Deficit reconciliation (candidate)"},
  "statements_of_changes_in_cash_balance": {"confirmed": False, "byAgency": False,
    "desc": "Changes in Cash Balance (candidate)"},
  "statements_of_long_term_fiscal_projections": {"confirmed": False, "byAgency": False,
    "desc": "Long-Term Fiscal Projections (candidate)"},
}

# FR agency_nm → portal registry id (extend as needed)
AGENCY_MAP = {
  "Department of Defense": "DOD", "Department of the Treasury": "TREAS",
  "Department of Health and Human Services": "HHS", "Department of Veterans Affairs": "VA",
  "Social Security Administration": "SSA", "Department of Homeland Security": "DHS",
  "Department of Energy": "DOE", "Department of Justice": "DOJ", "Department of State": "DOS",
  "Department of Transportation": "DOT", "Department of Education": "ED",
  "Department of Agriculture": "USDA", "Department of Commerce": "DOC",
  "Department of Labor": "DOL", "Department of Housing and Urban Development": "HUD",
  "Department of the Interior": "DOI", "Environmental Protection Agency": "EPA",
  "National Aeronautics and Space Administration": "NASA",
  "General Services Administration": "GSA", "National Science Foundation": "NSF",
  "Office of Personnel Management": "OPM", "Small Business Administration": "SBA",
  "Agency for International Development": "USAID", "Nuclear Regulatory Commission": "NRC",
  "Federal Deposit Insurance Corporation": "FDIC", "Securities and Exchange Commission": "SEC",
  "Federal Communications Commission": "FCC",
}

def fetch(table, page=1, size=10000):
    url = f"{BASE}/v2/accounting/od/{table}?page%5Bsize%5D={size}&page%5Bnumber%5D={page}"
    req = urllib.request.Request(url, headers={"User-Agent": "anyfed-portal"})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode()
        return json.loads(body) if body.strip() else None

def pull():
    os.makedirs(ROOT, exist_ok=True)
    manifest = {"pulled": datetime.now(timezone.utc).isoformat(), "source": BASE, "tables": {}}
    for table, meta in TABLES.items():
        try:
            rows, page = [], 1
            while True:
                j = fetch(table, page)
                if not j or not j.get("data"): break
                rows += j["data"]
                if page >= int(j["meta"].get("total-pages", 1)) or len(j["data"]) < 10000: break
                page += 1
            if not rows:
                manifest["tables"][table] = {"status": "ENDPOINT NOT FOUND or EMPTY", **meta}
                print(f"[pull] ✗ {table}: no data (candidate name may differ — check fiscaldata.gov dataset page)")
                continue
            tdir = os.path.join(ROOT, table); os.makedirs(tdir, exist_ok=True)
            # full table + per-statement-year split for the last 10+ years
            json.dump({"table": table, **meta, "unit": "billions USD", "audited": True,
                       "pulled": manifest["pulled"], "rows": len(rows), "data": rows},
                      open(os.path.join(tdir, f"{table}_ALL.json"), "w"), indent=1)
            years = sorted({r.get("stmt_fiscal_year") or r.get("record_fiscal_year") for r in rows if r})
            for y in years:
                yr = [r for r in rows if (r.get("stmt_fiscal_year") or r.get("record_fiscal_year")) == y]
                json.dump(yr, open(os.path.join(tdir, f"FY{y}.json"), "w"), indent=1)
            manifest["tables"][table] = {"status": "OK", "rows": len(rows),
                "statementYears": years, **meta}
            print(f"[pull] ✓ {table}: {len(rows):,} rows · statement years {years[0]}–{years[-1]}")
            time.sleep(0.3)
        except Exception as e:
            manifest["tables"][table] = {"status": f"ERROR {e}", **meta}
            print(f"[pull] ✗ {table}: {e}")
    json.dump(manifest, open(os.path.join(ROOT, "manifest.json"), "w"), indent=2)
    print(f"[pull] manifest → sourcedata/FiscalData/financial-report/manifest.json")

def load():
    import duckdb
    os.makedirs(WH, exist_ok=True)
    con = duckdb.connect(DB)
    for table in TABLES:
        f = os.path.join(ROOT, table, f"{table}_ALL.json")
        if not os.path.exists(f): continue
        con.execute(f"""CREATE OR REPLACE TABLE fr_{table} AS
            SELECT unnest(data, recursive:=true) FROM read_json_auto('{f}')""")
        n = con.sql(f"SELECT count(*) FROM fr_{table}").fetchone()[0]
        print(f"[load] fr_{table}: {n:,} rows in DuckDB ({os.path.basename(DB)})")

def gold():
    import duckdb
    con = duckdb.connect(DB)
    last10 = datetime.now().year - 10
    rows = con.sql(f"""
        SELECT agency_nm, CAST(stmt_fiscal_year AS INT) fy,
               CAST(gross_cost_bil_amt AS DOUBLE) gross_cost_bil,
               CAST(earned_revenue_bil_amt AS DOUBLE) earned_rev_bil,
               CAST(net_cost_bil_amt AS DOUBLE) net_cost_bil, restmt_flag
        FROM fr_statement_net_cost
        WHERE CAST(stmt_fiscal_year AS INT) >= {last10}
        ORDER BY agency_nm, fy""").fetchall()
    by = {}
    for a, fy, g, e, n, rf in rows:
        rid = AGENCY_MAP.get(a)
        by.setdefault(a, {"registryId": rid, "agency": a, "unit": "billions USD, audited SNC",
                          "years": {}})["years"][f"FY{fy}"] = {
            "grossCost": g, "earnedRevenue": e, "netCost": n, "restated": rf == "Y"}
    out = {"generated": datetime.now(timezone.utc).isoformat(),
           "source": "Fiscal Data v2/accounting/od/statement_net_cost (audited Financial Report)",
           "registryAgenciesCovered": sorted({v["registryId"] for v in by.values() if v["registryId"]}),
           "agencies": by}
    p = os.path.join(ROOT, "snc_by_agency_10yr.json")
    json.dump(out, open(p, "w"), indent=1)
    print(f"[gold] {len(by)} FR agencies ({len(out['registryAgenciesCovered'])} mapped to registry) → {os.path.relpath(p, ROOT)}")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    if cmd in ("pull", "all"): pull()
    if cmd in ("load", "all"): load()
    if cmd in ("gold", "all"): gold()
