#!/usr/bin/env python3
"""
ETL — sourcedata/ → lib/data/*.json
====================================
Parses the agency source-data folder (default: ./sourcedata) into compact,
deploy-ready JSON bundles consumed by the AnyFed FM portal.

Run whenever you drop new agency data into sourcedata/:
    python scripts/etl_sourcedata.py

Outputs (lib/data/):
    dod_budget.json   — M-1/O-1/P-1/R-1/RF-1 exhibit aggregates FY2024-FY2027
    dod_awards.json   — USAspending contract + assistance transactions (slim) & aggregates
    ml_datasets.json  — dataset registry for the AI/ML workbench
"""
import json
import csv
import os
import re
import sys
from collections import defaultdict
from datetime import datetime

try:
    import pandas as pd
except ImportError:
    sys.exit("pandas + openpyxl required:  pip install pandas openpyxl")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "sourcedata")
DOD = os.path.join(SRC, "Department of Defense")
OUT = os.path.join(ROOT, "lib", "data")
os.makedirs(OUT, exist_ok=True)

ORG_NAMES = {"A": "Army", "N": "Navy / Marine Corps", "F": "Air Force / Space Force",
             "D": "Defense-Wide", "M": "Marine Corps", "S": "Space Force"}

EXHIBITS = {
    "m1":  {"title": "Military Personnel (M-1)",        "appn": "MILPERS"},
    "o1":  {"title": "Operation & Maintenance (O-1)",   "appn": "O&M"},
    "p1":  {"title": "Procurement (P-1)",               "appn": "PROC"},
    "r1":  {"title": "RDT&E (R-1)",                     "appn": "RDT&E"},
    "rf1": {"title": "Revolving & Management Funds (RF-1)", "appn": "REVOLVING"},
}

# book folder -> sheets to pull:  (sheet name, output FY label)
BOOK_SHEETS = {
    "FY2026": [("FY 2024 Actuals", "FY2024")],
    "FY2027": [("FY 2025 Total", "FY2025"), ("FY 2026 Total", "FY2026"), ("FY 2027 Total", "FY2027")],
}


def read_exhibit_sheet(path, sheet):
    """Read one exhibit sheet -> DataFrame with normalized columns + 'value'."""
    try:
        df = pd.read_excel(path, sheet_name=sheet, header=None)
    except Exception:
        return None
    hdr_idx = None
    for i in range(min(8, len(df))):
        if "Account Title" in df.iloc[i].astype(str).values:
            hdr_idx = i
            break
    if hdr_idx is None:
        return None
    df.columns = [str(c).strip() for c in df.iloc[hdr_idx]]
    df = df.iloc[hdr_idx + 1:].copy()
    # value column = the FY-named cost column (skip P-1 "Quantity" columns)
    fy_cols = [c for c in df.columns if re.match(r"FY ?20\d\d", str(c))]
    val_col = next((c for c in fy_cols if "quantity" not in str(c).lower()), None)
    if val_col is None:
        return None
    df["value"] = pd.to_numeric(df[val_col], errors="coerce").fillna(0)
    # filter to additive rows counted in TOA where those columns exist
    if "Add/Non-Add" in df.columns:
        df = df[df["Add/Non-Add"].astype(str).str.strip().str.lower() == "add"]
    if "Include In TOA" in df.columns:
        df = df[df["Include In TOA"].astype(str).str.strip().str.upper() == "Y"]
    return df


def etl_dod_budget():
    out = {"agency": "Department of Defense", "unit": "$K", "exhibits": {},
           "generated": datetime.utcnow().isoformat() + "Z"}
    for key, meta in EXHIBITS.items():
        ex = {"title": meta["title"], "appn": meta["appn"], "years": {},
              "byOrg": {}, "byBudgetActivity": {}, "topAccounts": {}}
        for book, sheets in BOOK_SHEETS.items():
            cands = [f"{book}_{key}_display.xlsx", f"{book}_{key}.xlsx"]
            path = next((os.path.join(DOD, "dod_1", book, c) for c in cands
                         if os.path.exists(os.path.join(DOD, "dod_1", book, c))), None)
            if not path:
                continue
            xl = pd.ExcelFile(path)
            for sheet, fy in sheets:
                actual = next((s for s in xl.sheet_names if s.lower() == sheet.lower()), None)
                if actual is None:
                    actual = next((s for s in xl.sheet_names
                                   if sheet.split()[1] in s and "Total" in s), None)
                if actual is None and "Actuals" in sheet:
                    # tolerate "Acuals" typo in RF-1 book
                    actual = next((s for s in xl.sheet_names if "cual" in s.lower()), None)
                if actual is None:
                    continue
                df = read_exhibit_sheet(path, actual)
                if df is None or df.empty:
                    continue
                ex["years"][fy] = round(float(df["value"].sum()))
                if "Organization" in df.columns:
                    g = df.groupby(df["Organization"].astype(str).str.strip())["value"].sum()
                    ex["byOrg"][fy] = {ORG_NAMES.get(k, k): round(float(v))
                                       for k, v in g.items() if k and k != "nan"}
                bat = "Budget Activity Title"
                if bat in df.columns:
                    g = (df.groupby(df[bat].astype(str).str.strip())["value"]
                         .sum().sort_values(ascending=False))
                    ex["byBudgetActivity"][fy] = {k: round(float(v))
                                                  for k, v in g.head(12).items()
                                                  if k and k != "nan"}
                if "Account Title" in df.columns:
                    g = (df.groupby(df["Account Title"].astype(str).str.strip())["value"]
                         .sum().sort_values(ascending=False))
                    ex["topAccounts"][fy] = {k: round(float(v))
                                             for k, v in g.head(10).items()
                                             if k and k != "nan"}
        out["exhibits"][key] = ex
    fys = ["FY2024", "FY2025", "FY2026", "FY2027"]
    out["totalsByFY"] = {fy: sum(e["years"].get(fy, 0) for e in out["exhibits"].values())
                         for fy in fys}
    with open(os.path.join(OUT, "dod_budget.json"), "w") as f:
        json.dump(out, f)
    print("dod_budget.json", {k: v["years"] for k, v in out["exhibits"].items()})


def slim_csv(path, kind):
    """Slim transaction rows for ML + aggregates."""
    rows = []
    with open(path, encoding="utf-8", errors="replace") as fh:
        for r in csv.DictReader(fh):
            try:
                amt = float(r.get("federal_action_obligation") or 0)
            except ValueError:
                amt = 0.0
            rows.append({
                "amount": round(amt, 2),
                "date": (r.get("action_date") or "")[:10],
                "fy": r.get("action_date_fiscal_year") or "",
                "recipient": (r.get("recipient_name") or r.get("recipient_name_raw") or "")[:60],
                "subAgency": (r.get("awarding_sub_agency_name") or "")[:60],
                "type": (r.get("award_type") or r.get("assistance_type_description")
                         or r.get("action_type") or "")[:40],
                "naics": (r.get("naics_description") or r.get("cfda_title")
                          or r.get("assistance_listing_title") or "")[:60],
                "kind": kind,
            })
    return rows


def etl_dod_awards():
    usadir = os.path.join(DOD, "USASPENDING")
    contracts, assistance = [], []
    for f in os.listdir(usadir):
        p = os.path.join(usadir, f)
        if "Contracts_PrimeTransactions" in f:
            contracts += slim_csv(p, "contract")
        elif "Assistance_PrimeTransactions" in f:
            assistance += slim_csv(p, "assistance")
    txns = contracts + assistance

    def agg(field, n=15):
        d = defaultdict(float)
        for t in txns:
            if t[field]:
                d[t[field]] += t["amount"]
        return sorted(({"name": k, "total": round(v)} for k, v in d.items()),
                      key=lambda x: -abs(x["total"]))[:n]

    monthly = defaultdict(float)
    for t in txns:
        if len(t["date"]) >= 7:
            monthly[t["date"][:7]] += t["amount"]
    out = {
        "agency": "Department of Defense",
        "counts": {"contracts": len(contracts), "assistance": len(assistance)},
        "topRecipients": agg("recipient"),
        "bySubAgency": agg("subAgency", 12),
        "byType": agg("type", 12),
        "byNaics": agg("naics", 12),
        "monthly": [{"month": m, "total": round(v)} for m, v in sorted(monthly.items())],
        "transactions": txns,
        "generated": datetime.utcnow().isoformat() + "Z",
    }
    with open(os.path.join(OUT, "dod_awards.json"), "w") as f:
        json.dump(out, f)
    print("dod_awards.json", out["counts"], "monthly pts:", len(out["monthly"]))


def etl_ml_registry():
    reg = {
        "datasets": [
            {"id": "dod_awards_contracts",
             "label": "DoD Contract Prime Transactions (USAspending)",
             "agency": "DOD", "source": "sourcedata/Department of Defense/USASPENDING",
             "file": "dod_awards.json", "table": "transactions",
             "filter": {"kind": "contract"}, "target": "amount",
             "features": ["date", "recipient", "subAgency", "type", "naics"]},
            {"id": "dod_awards_assistance",
             "label": "DoD Assistance Prime Transactions (USAspending)",
             "agency": "DOD", "source": "sourcedata/Department of Defense/USASPENDING",
             "file": "dod_awards.json", "table": "transactions",
             "filter": {"kind": "assistance"}, "target": "amount",
             "features": ["date", "recipient", "subAgency", "type", "naics"]},
            {"id": "dod_monthly_obligations", "label": "DoD Monthly Obligation Series",
             "agency": "DOD", "source": "USAspending action dates",
             "file": "dod_awards.json", "table": "monthly",
             "target": "total", "features": ["month"]},
            {"id": "dod_budget_exhibits",
             "label": "DoD Budget Exhibits M-1/O-1/P-1/R-1/RF-1 (FY24-FY27)",
             "agency": "DOD", "source": "sourcedata/Department of Defense/dod_1",
             "file": "dod_budget.json", "table": "exhibits",
             "target": "value", "features": ["exhibit", "fy", "org"]},
            {"id": "sec_budget_history", "label": "SEC Budget & FTE History (FY23-FY27 CBJ)",
             "agency": "SEC", "source": "sourcedata/Security Exchange Commission",
             "file": "(bundled)", "table": "BUDGET_HISTORY",
             "target": "enacted", "features": ["fy", "fte"]},
            {"id": "sec_object_class", "label": "SEC Object Class Obligations (FY25-FY27)",
             "agency": "SEC", "source": "FY2027 CBJ", "file": "(bundled)",
             "table": "OBJECT_CLASS", "target": "fy27", "features": ["code", "name"]},
        ],
        "generated": datetime.utcnow().isoformat() + "Z",
    }
    with open(os.path.join(OUT, "ml_datasets.json"), "w") as f:
        json.dump(reg, f, indent=1)
    print("ml_datasets.json", len(reg["datasets"]), "datasets")


if __name__ == "__main__":
    import etl_dod_budget as _budget  # enriched budget ETL (MILCON + decomposition)
    _budget.main()
    etl_dod_awards()
    etl_ml_registry()
    print("ETL complete ->", OUT)
