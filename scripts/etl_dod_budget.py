#!/usr/bin/env python3
"""
ETL — DoD PB exhibit books -> lib/data/dod_budget.json  (ENRICHED)
=================================================================
Captures the full information content of each -1 exhibit, not just the
"Total" column:

  Standard exhibits (M-1, O-1, P-1, R-1, RF-1) — each FY decomposes into
  meaningful components that carry budget-phase semantics:
    PY  (e.g. FY2025) = EXECUTION ACTUALS  (+ reconciliation)
    CY  (e.g. FY2026) = ENACTED  = Discretionary Enacted + PL 119-21 mandatory
    BY  (e.g. FY2027) = REQUEST  = Discretionary Request + Mandatory Request

  C-1 (MILCON) is structurally different — geographic / project oriented,
  multi-year appropriation, so its PY columns are NOT execution actuals.
  Captured by Organization / State-Country / Facility Category with
  Authorization vs Appropriation vs Total Obligation Authority.

Output is a backward-compatible SUPERSET of the previous dod_budget.json:
keeps exhibits[].years / byOrg / byBudgetActivity / topAccounts / totalsByFY,
and ADDS components, per-record pivot rows, dimension catalogs, data-quality
metrics, year-phase semantics, and source lineage.
"""
import json, os, re, sys
from collections import defaultdict
from datetime import datetime, timezone

try:
    import pandas as pd
except ImportError:
    sys.exit("pip install pandas openpyxl --break-system-packages")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "sourcedata", "Department of Defense", "dod_1")
OUT  = os.path.join(ROOT, "lib", "data")
os.makedirs(OUT, exist_ok=True)

ORG_NAMES = {"nan":"Defense-Wide (unspec.)","":"Defense-Wide (unspec.)","A":"Army","N":"Navy / Marine Corps","F":"Air Force / Space Force",
             "D":"Defense-Wide","M":"Marine Corps","S":"Space Force"}

STD_EXHIBITS = {
    "m1":  {"title":"Military Personnel (M-1)",            "appn":"MILPERS"},
    "o1":  {"title":"Operation & Maintenance (O-1)",       "appn":"O&M"},
    "p1":  {"title":"Procurement (P-1)",                   "appn":"PROC"},
    "r1":  {"title":"RDT&E (R-1)",                         "appn":"RDT&E"},
    "rf1": {"title":"Revolving & Management Funds (RF-1)", "appn":"REVOLVING"},
}

# Year -> budget phase semantics (the heart of the "data insight" layer)
YEAR_PHASE = {
    "FY2024": {"phase":"actuals",  "label":"Prior-year execution actuals"},
    "FY2025": {"phase":"actuals",  "label":"Prior-year execution actuals (+ reconciliation)"},
    "FY2026": {"phase":"enacted",  "label":"Current-year enacted: discretionary enacted + PL 119-21 mandatory spend plan"},
    "FY2027": {"phase":"request",  "label":"Budget-year President's Budget request: discretionary + mandatory"},
}

def fy_of(name):
    m = re.search(r"FY ?20(\d\d)", str(name))
    return f"FY20{m.group(1)}" if m else None

def classify_component(sheet):
    s = sheet.lower()
    if "reconciliation" in s:                       return "reconciliation"
    if "actual" in s:                               return "actuals"
    if "discretionary enacted" in s:                return "discretionaryEnacted"
    if "mandatory enacted" in s:                    return "mandatorySpendPlan"
    if "pl 119" in s or "pl119" in s or "spend plan" in s: return "mandatorySpendPlan"
    if "discretionary request" in s:                return "discretionaryRequest"
    if "mandatory" in s:                            return "mandatoryRequest"
    if "total" in s:                                return "total"
    return None

def read_sheet(path, sheet):
    """Return (headers, dataframe, value_col) for an exhibit sheet, else (None,None,None)."""
    try:
        raw = pd.read_excel(path, sheet_name=sheet, header=None)
    except Exception:
        return None, None, None
    hdr = None
    for i in range(min(10, len(raw))):
        vals = raw.iloc[i].astype(str).values
        if any("Account Title" in str(x) for x in vals):
            hdr = i; break
    if hdr is None:
        return None, None, None
    cols = [str(c).strip() for c in raw.iloc[hdr]]
    df = raw.iloc[hdr+1:].copy()
    df.columns = cols
    fy_cols = [c for c in cols if re.match(r"FY ?20\d\d", str(c))]
    val_col = next((c for c in fy_cols if "quantity" not in str(c).lower()
                    and "amount" in str(c).lower()), None)
    if val_col is None:
        val_col = next((c for c in fy_cols if "quantity" not in str(c).lower()), None)
    if val_col is None:
        return None, None, None
    df["__val"] = pd.to_numeric(df[val_col], errors="coerce")
    return cols, df, val_col

def add_filter(df, cols):
    n0 = len(df)
    if "Add/Non-Add" in cols:
        df = df[df["Add/Non-Add"].astype(str).str.strip().str.lower() == "add"]
    if "Include In TOA" in cols:
        df = df[df["Include In TOA"].astype(str).str.strip().str.upper() == "Y"]
    return df, n0 - len(df)

def book_path(book, key):
    for c in (f"{book}_{key}_display.xlsx", f"{book}_{key}.xlsx"):
        p = os.path.join(SRC, book, c)
        if os.path.exists(p): return p
    return None

def etl_standard(key, meta, catalog):
    ex = {"title":meta["title"], "appn":meta["appn"], "isMilcon":False,
          "years":{}, "byOrg":{}, "byBudgetActivity":{}, "topAccounts":{},
          "components":{}, "orgComponentMix":{},
          "records":[], "dims":{}, "quality":{}}
    rec_map = defaultdict(lambda: defaultdict(float))   # (org,ba,acct) -> {fy: val}
    dim_sets = defaultdict(set)
    total_rows = 0; total_nulls = 0; total_nonadd = 0
    RANK = {"total":3, "actuals":2}                     # primary sheet per FY for rollups
    primary = {}                                        # fy -> (rank, cols, df)

    plan = [("FY2026", "FY2024"), ("FY2027", None)]
    for book, only_fy in plan:
        path = book_path(book, key)
        if not path: continue
        try:
            xl = pd.ExcelFile(path)
        except Exception:
            continue
        sheets_used = []
        for sheet in xl.sheet_names:
            fy = fy_of(sheet); comp = classify_component(sheet)
            if not fy or not comp: continue
            if only_fy and fy != only_fy: continue
            if not only_fy and fy == "FY2024": continue  # FY24 only from the FY2026 book
            cols, df, vcol = read_sheet(path, sheet)
            if df is None: continue
            df, nonadd = add_filter(df, cols)
            nulls = int(df["__val"].isna().sum())
            df = df.assign(__val=df["__val"].fillna(0))
            ssum = round(float(df["__val"].sum()))
            ex["components"].setdefault(fy, {})[comp] = ssum
            sheets_used.append(sheet)
            total_rows += len(df); total_nulls += nulls; total_nonadd += nonadd
            # remember the best (primary) sheet for this FY for dimensional rollups
            rank = RANK.get(comp, 0)
            if rank and (fy not in primary or rank > primary[fy][0]):
                primary[fy] = (rank, cols, df)
            # per-org discretionary/mandatory mix for enacted & request years
            if comp in ("discretionaryEnacted","mandatorySpendPlan","discretionaryRequest","mandatoryRequest") and "Organization" in cols:
                g = df.groupby(df["Organization"].astype(str).str.strip())["__val"].sum()
                for k,v in g.items():
                    if k and k!="nan":
                        ex["orgComponentMix"].setdefault(fy,{}).setdefault(ORG_NAMES.get(k,k),{})[comp]=round(float(v))
        if sheets_used:
            catalog.append({"file":os.path.basename(path),"exhibit":key.upper(),
                            "book":book,"sheets":sheets_used,
                            "years":sorted({fy_of(s) for s in sheets_used if fy_of(s)})})

    # dimensional rollups + pivot records from each FY's primary sheet (no double count)
    bat = "Budget Activity Title"
    for fy,(rank,cols,df) in primary.items():
        ex["years"][fy] = round(float(df["__val"].sum()))
        if "Organization" in cols:
            g = df.groupby(df["Organization"].astype(str).str.strip())["__val"].sum()
            ex["byOrg"][fy] = {ORG_NAMES.get(k,k):round(float(v)) for k,v in g.items() if k and k!="nan"}
        if bat in cols:
            g = df.groupby(df[bat].astype(str).str.strip())["__val"].sum().sort_values(ascending=False)
            ex["byBudgetActivity"][fy] = {k:round(float(v)) for k,v in g.head(12).items() if k and k!="nan"}
        if "Account Title" in cols:
            g = df.groupby(df["Account Title"].astype(str).str.strip())["__val"].sum().sort_values(ascending=False)
            ex["topAccounts"][fy] = {k:round(float(v)) for k,v in g.head(10).items() if k and k!="nan"}
        for _, r in df.iterrows():
            org = ORG_NAMES.get(str(r.get("Organization","")).strip(), str(r.get("Organization","")).strip())
            ba  = str(r.get(bat,"")).strip()
            acct= str(r.get("Account Title","")).strip()
            if not acct or acct=="nan": continue
            rec_map[(org,ba,acct)][fy] += float(r["__val"])
            dim_sets["organization"].add(org)
            if ba and ba!="nan": dim_sets["budgetActivity"].add(ba)
            ct = str(r.get("Cost Type Title","")).strip()
            if ct and ct!="nan": dim_sets["costType"].add(ct)

    recs = []
    for (org,ba,acct),fyv in rec_map.items():
        row = {"org":org,"budgetActivity":ba,"account":acct}
        for fy in ("FY2024","FY2025","FY2026","FY2027"):
            row[fy] = round(fyv.get(fy,0.0))
        recs.append(row)
    recs.sort(key=lambda r:-abs(r.get("FY2027",0) or 0))
    ex["records"] = recs[:300]
    ex["dims"] = {k:sorted(x for x in v if x and x!="nan") for k,v in dim_sets.items()}
    ex["quality"] = {"totalRows":total_rows,"nullAmounts":total_nulls,
                     "nonAddFiltered":total_nonadd,"recordRows":len(recs),
                     "recordsKept":len(ex["records"])}
    return ex

def etl_milcon(catalog):
    key="c1"
    ex={"title":"Military Construction (C-1)","appn":"MILCON","isMilcon":True,
        "years":{}, "byOrg":{}, "byBudgetActivity":{}, "topAccounts":{},
        "byStateCountry":{}, "byFacilityCategory":{},
        "components":{}, "records":[], "dims":{}, "quality":{},
        "note":"MILCON is a multi-year appropriation; prior-year columns are program amounts, NOT execution actuals like the other -1 exhibits."}
    rec_map=defaultdict(lambda: defaultdict(float)); dim_sets=defaultdict(set)
    total_rows=0; total_nulls=0
    plan=[("FY2026","FY2024"),("FY2027",None)]
    def amount_cols(cols):
        toa=next((c for c in cols if re.search(r"Total Obligation Authority",str(c))),None)
        appr=next((c for c in cols if re.search(r"Appropriation Amount",str(c)) and "Authorization" not in str(c)),None)
        auth=next((c for c in cols if re.search(r"Authorization Amount",str(c))),None)
        return toa,appr,auth
    for book,only_fy in plan:
        path=book_path(book,key)
        if not path: continue
        try: xl=pd.ExcelFile(path)
        except Exception: continue
        sheets_used=[]
        for sheet in xl.sheet_names:
            fy=fy_of(sheet)
            if not fy or "recon" in sheet.lower(): continue
            if only_fy and fy!=only_fy: continue
            if not only_fy and fy=="FY2024": continue
            try: raw=pd.read_excel(path,sheet_name=sheet,header=None)
            except Exception: continue
            hdr=None
            for i in range(min(10,len(raw))):
                if any("Account Title" in str(x) for x in raw.iloc[i].astype(str).values): hdr=i;break
            if hdr is None: continue
            cols=[str(c).strip().replace("\n"," ") for c in raw.iloc[hdr]]
            df=raw.iloc[hdr+1:].copy(); df.columns=cols
            toa,appr,auth=amount_cols(cols)
            if not toa: continue
            df["__val"]=pd.to_numeric(df[toa],errors="coerce")
            nulls=int(df["__val"].isna().sum()); df=df.assign(__val=df["__val"].fillna(0))
            ssum=round(float(df["__val"].sum()))
            ex["years"][fy]=ssum
            comp={"toa":ssum}
            if appr: comp["appropriation"]=round(float(pd.to_numeric(df[appr],errors="coerce").fillna(0).sum()))
            if auth: comp["authorization"]=round(float(pd.to_numeric(df[auth],errors="coerce").fillna(0).sum()))
            ex["components"][fy]=comp
            total_rows+=len(df); total_nulls+=nulls; sheets_used.append(sheet)
            def roll(colname, store, topn=12, mapname=False):
                if colname not in cols: return
                g=df.groupby(df[colname].astype(str).str.strip())["__val"].sum().sort_values(ascending=False)
                store[fy]={(ORG_NAMES.get(k,k) if mapname else k):round(float(v)) for k,v in g.head(topn).items() if k and k!="nan"}
            roll("Organization",ex["byOrg"],8,mapname=True)
            roll("Budget Activity Title",ex["byBudgetActivity"])
            roll("State Country Title",ex["byStateCountry"],15)
            roll("Facility Category Title",ex["byFacilityCategory"],15)
            roll("Account Title",ex["topAccounts"],10)
            ptitle="Construction Project Title"
            for _,r in df.iterrows():
                org=ORG_NAMES.get(str(r.get("Organization","")).strip(),str(r.get("Organization","")).strip())
                ba=str(r.get("Budget Activity Title","")).strip()
                loc=str(r.get("State Country Title","")).strip()
                proj=str(r.get(ptitle,"")).strip() or str(r.get("Account Title","")).strip()
                if not proj or proj=="nan": continue
                rec_map[(org,ba,loc,proj)][fy]+=float(r["__val"])
                dim_sets["organization"].add(org)
                if ba and ba!="nan": dim_sets["budgetActivity"].add(ba)
                if loc and loc!="nan": dim_sets["stateCountry"].add(loc)
                fc=str(r.get("Facility Category Title","")).strip()
                if fc and fc!="nan": dim_sets["facilityCategory"].add(fc)
        if sheets_used:
            catalog.append({"file":os.path.basename(path),"exhibit":"C1","book":book,
                            "sheets":sheets_used,"years":sorted({fy_of(s) for s in sheets_used if fy_of(s)})})
    recs=[]
    for (org,ba,loc,proj),fyv in rec_map.items():
        row={"org":org,"budgetActivity":ba,"stateCountry":loc,"project":proj}
        for fy in ("FY2024","FY2025","FY2026","FY2027"): row[fy]=round(fyv.get(fy,0.0))
        recs.append(row)
    recs.sort(key=lambda r:-abs(r.get("FY2027",0) or 0))
    ex["records"]=recs[:250]
    ex["dims"]={k:sorted(x for x in v if x and x!="nan") for k,v in dim_sets.items()}
    ex["quality"]={"totalRows":total_rows,"nullAmounts":total_nulls,"recordRows":len(recs),"recordsKept":len(ex["records"])}
    return ex

def main():
    catalog=[]
    out={"agency":"Department of Defense","unit":"$K",
         "generated":datetime.now(timezone.utc).isoformat(),
         "yearPhase":YEAR_PHASE,"exhibits":{}}
    for key,meta in STD_EXHIBITS.items():
        out["exhibits"][key]=etl_standard(key,meta,catalog)
    out["exhibits"]["c1"]=etl_milcon(catalog)
    fys=["FY2024","FY2025","FY2026","FY2027"]
    out["totalsByFY"]={fy:sum(e["years"].get(fy,0) for e in out["exhibits"].values()) for fy in fys}
    # discretionary vs mandatory rollup across standard exhibits
    dm={}
    for fy in fys:
        disc=mand=0
        for k,e in out["exhibits"].items():
            if e.get("isMilcon"): continue
            c=e["components"].get(fy,{})
            disc+=c.get("discretionaryEnacted",0)+c.get("discretionaryRequest",0)+ (c.get("actuals",0) if fy in ("FY2024","FY2025") else 0)
            mand+=c.get("mandatorySpendPlan",0)+c.get("mandatoryRequest",0)
        dm[fy]={"discretionary":disc,"mandatory":mand}
    out["discMandatoryByFY"]=dm
    out["catalog"]=catalog
    path=os.path.join(OUT,"dod_budget.json")
    with open(path,"w") as f: json.dump(out,f)
    print("WROTE",path,os.path.getsize(path),"bytes")
    print("exhibits:",list(out["exhibits"].keys()))
    print("totalsByFY:",out["totalsByFY"])
    print("discMandatory FY2027:",dm["FY2027"])
    for k,e in out["exhibits"].items():
        print(f"  {k}: years={ {y:e['years'].get(y) for y in fys} } records={len(e['records'])} comps={ {y:list(c.keys()) for y,c in e['components'].items()} }")

if __name__=="__main__":
    main()
