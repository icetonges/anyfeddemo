# Fiscal Data — Audited Financial Report Statements

Treasury Fiscal Data API (api.fiscaldata.treasury.gov) — the AUDITED
consolidated financial statements (GAO-audited Financial Report of the U.S.
Government). Accrual basis, $ BILLIONS. This is the proprietary-statement data
USAspending cannot provide (see Accounting → Statement Builder).

Confirmed endpoints (probed live):
- v2/accounting/od/statement_net_cost  — Statements of Net Cost BY AGENCY:
  gross_cost, earned_revenue, change_in_assumptions, net_cost per
  stmt_fiscal_year; restmt_flag marks restated years.
- v2/accounting/od/balance_sheets — government-wide Balance Sheet lines.
Candidate tables (SCNP, deficit reconciliation, cash balance, long-term
projections) are probed by the script; misses are recorded in manifest.json.

Layout:
  financial-report/<table>/<table>_ALL.json   full history (10+ statement years)
  financial-report/<table>/FY<year>.json      per-statement-year split
  financial-report/manifest.json              pull status per table
  financial-report/snc_by_agency_10yr.json    GOLD: per-registry-agency 10yr SNC

Run (same pattern as the USAspending solution):
  python scripts/fiscaldata_statements.py all     # pull → DuckDB load → gold
DuckDB tables land in the SAME warehouse (fr_statement_net_cost, fr_balance_sheets…)
so statements JOIN against USAspending silver:  net cost (accrual, audited) vs
obligations/outlays (budgetary) per agency per year — the cross-basis analysis.
Data volume is tiny (<5 MB) — safe to commit.
