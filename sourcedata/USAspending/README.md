# USAspending Data — Folder Structure & Data Model

Organized 2026-06-10. This tree mirrors USAspending.gov's official data products
(per `catalog/USAspending-data-catalog.json`, DCAT-US). Know which file you are
holding — each product has a different grain, time basis, and source system.

## The USAspending data model (full scope)

### Account data (DABS — agency-certified, GTAS/SF-133 lineage)
| File | Name | Grain | What it is |
|------|------|-------|-----------|
| **File A** | Account Balances | TAS × period | Budgetary resources, obligations, unobligated balance per Treasury Account Symbol — ties to SF-133/GTAS. The authoritative "how much money, how much used" view. |
| **File B** | Account Breakdown by Program Activity & Object Class | TAS × PA × OC × period | Obligations/outlays split by program activity and OMB A-11 §83 object class. The cost-structure view. |
| **File C** | Account Breakdown by Award | TAS × award × period | Links appropriation accounts to individual awards — the bridge between budget (A/B) and award (D) worlds. THIS carries appropriation-year attribution for awards. |
→ download via "Custom Account Data"; place under `account-data/file-{a,b,c}-*/FY<year>/`.

### Award data (award/transaction grain)
| File | Name | Source | What it is |
|------|------|--------|-----------|
| **D1** | Contract awards & transactions | FPDS-NG | Every contract action (the archives below are D1 extracts, 297 columns). |
| **D2** | Financial assistance | FABS | Grants, loans, direct payments, insurance. |
| **E/F** | FFATA sub-awards & exec comp | FSRS | Sub-award detail and executive compensation. |

### Bulk products in this folder
- `award-data-archive/contracts/full/FY<year>/` — **Full archives**: complete D1
  transaction population for the fiscal year as of the date in the filename
  (`*_Full_20260506_*.csv` = snapshot generated May 6, 2026). All agencies.
- `award-data-archive/contracts/delta/<date>/` — **Delta archives**: changes since
  the previous full generation. First column `correction_delete_ind`:
  `C`=correction (replace by `contract_transaction_unique_key`), `D`=delete.
  Apply deltas AFTER the full file to get a current population.
- `custom-award-data/` — GUI-built Custom Award Data extracts (place here).
- `catalog/` — the DCAT-US machine-readable catalog of all 7 products
  (archives, custom award, custom account, DABS submissions, FABS submissions,
  full PostgreSQL database snapshot, API).

### Time bases in the archive columns (don't mix)
- `action_date` / `action_date_fiscal_year` — when the obligation event occurred (execution view).
- `treasury_accounts_funding_this_award` — the TAS list (appropriation identity & year of the money).
- `period_of_performance_*` — delivery window, not spending timing.
- `last_modified_date` — record maintenance only; never analytical.
- Full-archive filename date — the snapshot "as of" date.

## Processing pipeline
`scripts/usaspending_pipeline.py` (repo root) — stdlib-only Python: cleansing
(dedupe, delta application, type coercion), per-agency extraction, analysis
(monthly obligations, top recipients/sub-agencies/NAICS/TAS), and ML screens
(Benford, robust-z outliers, k-means value strata). Outputs land in
`processed/<agency>/FY<year>/` as analysis-ready CSV + analysis_report.json.

Run locally from the repo root (full pass over 4.6 GB takes a few minutes):
```
python scripts/usaspending_pipeline.py --agency 097 --fy 2026
python scripts/usaspending_pipeline.py --agency 097 --fy 2026 --apply-deltas
python scripts/usaspending_pipeline.py --agency all --fy 2026 --max-rows 500000   # bounded test
```

## Local lakehouse (production path — DuckDB + Parquet)
`scripts/usaspending_duck.py` (pip install duckdb) is the scale path for
all-federal expansion. Medallion architecture:
- **Bronze** = the raw CSVs above, kept as landed (git-ignored — GitHub's 100MB
  limit makes committing them impossible; .gitignore enforces this).
- **Silver** = `warehouse/silver/contracts/agency=<code>/fy=<year>/*.parquet` —
  typed, deduped (transaction key), delta-applied, zstd-compressed (~8-12x
  smaller than CSV), hive-partitioned so queries scan only the agency/FY needed.
- **Gold** = `processed/<agency>/FY<fy>/analysis_report.json` — compact,
  committed, consumed by the portal.

```
python scripts/usaspending_duck.py build                 # all FYs found, deltas applied
python scripts/usaspending_duck.py gold --agency 097 --fy 2026
python scripts/usaspending_duck.py sql "SELECT awarding_sub_agency_name, sum(amount) FROM contracts WHERE agency='097' GROUP BY 1 ORDER BY 2 DESC LIMIT 10"
python scripts/usaspending_duck.py status
```
After silver is built, the raw CSVs can be archived/deleted — Parquet is the
working copy. `usaspending_pipeline.py` (stdlib) remains as the zero-dependency
fallback.
