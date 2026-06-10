#!/usr/bin/env python3
"""
ETL — DoD PB exhibit books -> lib/data/dod_budget.json   (VINTAGE-AWARE, v2)
===========================================================================
Parses EVERY fiscal-year/component sheet from BOTH President's Budget books:

  PB2026 book (sourcedata/.../dod_1/FY2026):  FY2024 Actuals | FY2025 Enacted | FY2026 Request
  PB2027 book (sourcedata/.../dod_1/FY2027):  FY2025 Actuals | FY2026 Enacted | FY2027 Request

The same fiscal year therefore appears in two vintages with different meaning —
e.g. FY2025 is ENACTED in PB2026 but ACTUAL (execution) in PB2027. Capturing
both unlocks the budget lifecycle (request -> enacted -> actual) and execution
variance. MILCON (C-1) is multi-year; its prior-year columns are program
amounts, NOT execution actuals.

Output keeps backward-compatible fields (years/byOrg/byBudgetActivity/
topAccounts/totalsByFY) and ADDS: vintages, lifecycle (+variance), 5-level
drill records (org/account/budgetActivity/bsa/bli), components, dims, quality,
discMandatoryByFY, dept-wide lifecycle, and full source catalog.
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

ORG_NAMES = {"nan":"Defense-Wide (unspec.)","":"Defense-Wide (unspec.)",
             "A":"Army","N":"Navy / Marine Corps","F":"Air Force / Space Force",
             "D":"Defense-Wide","M":"Marine Corps","S":"Space Force"}

STD = {
    "m1":  {"title":"Military Personnel (M-1)",            "appn":"MILPERS"},
    "o1":  {"title":"Operation & Maintenance (O-1)",       "appn":"O&M"},
    "p1":  {"title":"Procurement (P-1)",                   "appn":"PROC"},
    "r1":  {"title":"RDT&E (R-1)",                         "appn":"RDT&E"},
    "rf1": {"title":"Revolving & Management Funds (RF-1)", "appn":"REVOLVING"},
}
# book folder -> (vintage label, base budget year)
BOOKS = [("FY2026","PB2026",2026), ("FY2027","PB2027",2027)]
PHASE_LABEL = {"actuals":"Execution actuals","enacted":"Enacted authority","request":"Budget request"}

def fy_of(name):
    m = re.search(r"FY ?20(\d\d)", str(name)); return int("20"+m.group(1)) if m else None

def phase_for(book_year, fy):
    d = book_year - fy
    return "request" if d==0 else "enacted" if d==1 else "actuals" if d>=2 else "future"

def comp_of(sheet):
    s = sheet.lower()
    if "acual" in s or "actual" in s:           return "actuals"
    if "supplemental" in s:                      return "supplemental"
    if "reconciliation request" in s:            return "mandatoryRequest"
    if "discretionary request" in s or "disc request" in s: return "discretionaryRequest"
    if "discretionary enacted" in s:             return "discretionaryEnacted"
    if "pl 119" in s or "pl119" in s or "spend plan" in s:  return "mandatorySpendPlan"
    if "mandatory" in s:                         return "mandatoryRequest"
    if "reconciliation" in s:                    return "reconciliation"
    if "enacted" in s:                           return "enacted"
    if "total" in s:                             return "total"
    return None

def header_df(path, sheet):
    try: raw = pd.read_excel(path, sheet_name=sheet, header=None)
    except Exception: return None, None
    hdr = None
    for i in range(min(10, len(raw))):
        if any("Account Title" in str(x) for x in raw.iloc[i].astype(str).values): hdr=i; break
    if hdr is None: return None, None
    cols = [str(c).strip().replace("\n"," ") for c in raw.iloc[hdr]]
    df = raw.iloc[hdr+1:].copy(); df.columns = cols
    return cols, df

def value_col(cols):
    fy = [c for c in cols if re.match(r"FY ?20\d\d", str(c))]
    v = next((c for c in fy if "quantity" not in str(c).lower() and "amount" in str(c).lower()), None)
    return v or next((c for c in fy if "quantity" not in str(c).lower()), None)

def add_only(df, cols):
    n0 = len(df)
    if "Add/Non-Add" in cols: df = df[df["Add/Non-Add"].astype(str).str.strip().str.lower()=="add"]
    if "Include In TOA" in cols: df = df[df["Include In TOA"].astype(str).str.strip().str.upper()=="Y"]
    return df, n0-len(df)

def detect_hier(cols):
    """Return ordered [(field, column)] drill hierarchy present in this sheet."""
    h = []
    if "Organization" in cols:       h.append(("org","Organization"))
    if "Account Title" in cols:      h.append(("account","Account Title"))
    if "Budget Activity Title" in cols: h.append(("budgetActivity","Budget Activity Title"))
    bsa = next((c for c in cols if "SubActivity" in c and "Title" in c), None)
    if bsa: h.append(("bsa",bsa))
    bli = next((c for c in cols if "BLI" in c and "Title" in c), None) \
          or next((c for c in cols if "Program Element" in c and "Title" in c), None)
    if bli: h.append(("bli",bli))
    return h

def book_path(folder, key):
    for c in (f"{folder}_{key}_display.xlsx", f"{folder}_{key}.xlsx"):
        p = os.path.join(SRC, folder, c)
        if os.path.exists(p): return p
    return None

def canonical_total(comps, phase):
    if "total" in comps: return comps["total"]
    if phase=="request": return comps.get("discretionaryRequest",0)+comps.get("mandatoryRequest",0)
    if phase=="enacted": return comps.get("discretionaryEnacted",comps.get("enacted",0))+comps.get("mandatorySpendPlan",comps.get("supplemental",0))
    if phase=="actuals": return comps.get("actuals",0)+comps.get("reconciliation",0)
    return sum(v for k,v in comps.items() if k!="total")

# ────────────────────────────────────────────────────────────────────────────
def etl_standard(key, meta, catalog):
    ex = {"title":meta["title"], "appn":meta["appn"], "isMilcon":False,
          "years":{}, "byOrg":{}, "byBudgetActivity":{}, "topAccounts":{},
          "components":{}, "orgComponentMix":{}, "vintages":{}, "lifecycle":{},
          "hierarchy":[], "records":[], "dims":{}, "quality":{}}
    primary_df = {}              # fy -> (rank, cols, df) used for canonical rollups/records
    rec = defaultdict(lambda: defaultdict(float))   # tuple(levels) -> {fy:val}, plus meta
    rec_levels = {}              # tuple -> dict(field->value)
    dim_sets = defaultdict(set)
    tot_rows = tot_null = tot_nonadd = 0
    RANK = {"total":3, "actuals":2, "enacted":2, "discretionaryRequest":1}

    for folder, vint, byear in BOOKS:
        path = book_path(folder, key)
        if not path: continue
        try: xl = pd.ExcelFile(path)
        except Exception: continue
        sheets_used = []
        # gather comps per fy for this vintage
        vint_fy = defaultdict(dict)
        vint_primary = {}
        for sheet in xl.sheet_names:
            fy = fy_of(sheet); comp = comp_of(sheet)
            if not fy or not comp: continue
            cols, df = header_df(path, sheet)
            if df is None: continue
            vcol = value_col(cols)
            if not vcol: continue
            df["__v"] = pd.to_numeric(df[vcol], errors="coerce")
            df, nonadd = add_only(df, cols)
            nulls = int(df["__v"].isna().sum()); df = df.assign(__v=df["__v"].fillna(0))
            ssum = round(float(df["__v"].sum()))
            vint_fy[fy][comp] = ssum
            sheets_used.append(sheet)
            tot_rows += len(df); tot_null += nulls; tot_nonadd += nonadd
            rk = RANK.get(comp, 0)
            if rk and (fy not in vint_primary or rk > vint_primary[fy][0]):
                vint_primary[fy] = (rk, cols, df, comp)
        # record this vintage
        for fy, comps in vint_fy.items():
            ph = phase_for(byear, fy)
            ex["vintages"].setdefault(vint, {})[f"FY{fy}"] = {
                "phase": ph, "components": comps, "total": round(canonical_total(comps, ph))}
        # choose global primary per fy (PB2027 wins for FY25/26/27; PB2026 for FY24)
        for fy,(rk,cols,df,comp) in vint_primary.items():
            cur = primary_df.get(fy)
            # prefer later book (PB2027) for any fy it covers; else take what we have
            take = cur is None or (vint=="PB2027")
            if take: primary_df[fy] = (vint, cols, df)
        if sheets_used:
            catalog.append({"file":os.path.basename(path),"exhibit":key.upper(),"vintage":vint,
                            "book":folder,"sheets":sheets_used,
                            "years":sorted({f"FY{fy_of(s)}" for s in sheets_used if fy_of(s)})})

    # canonical rollups, components, deep records from primary df per fy
    for fy,(vint,cols,df) in primary_df.items():
        fyl = f"FY{fy}"
        ex["years"][fyl] = round(float(df["__v"].sum()))
        if "Organization" in cols:
            g = df.groupby(df["Organization"].astype(str).str.strip())["__v"].sum()
            ex["byOrg"][fyl] = {ORG_NAMES.get(k,k):round(float(v)) for k,v in g.items() if str(k).strip()}
        if "Budget Activity Title" in cols:
            g = df.groupby(df["Budget Activity Title"].astype(str).str.strip())["__v"].sum().sort_values(ascending=False)
            ex["byBudgetActivity"][fyl] = {k:round(float(v)) for k,v in g.head(14).items() if k and k!="nan"}
        if "Account Title" in cols:
            g = df.groupby(df["Account Title"].astype(str).str.strip())["__v"].sum().sort_values(ascending=False)
            ex["topAccounts"][fyl] = {k:round(float(v)) for k,v in g.head(10).items() if k and k!="nan"}
        hier = detect_hier(cols)
        if len(hier) > len(ex["hierarchy"]): ex["hierarchy"] = [f for f,_ in hier]
        for _, r in df.iterrows():
            levels = {}
            for field, col in hier:
                val = str(r.get(col,"")).strip()
                if field=="org": val = ORG_NAMES.get(val, val)
                if not val or val=="nan": val = "(unspecified)"
                levels[field] = val
                dim_sets[field].add(val)
            tkey = tuple(levels[f] for f,_ in hier)
            rec[tkey][fyl] += float(r["__v"]); rec_levels[tkey] = levels

    # components (canonical per fy from PB2027 vintage; fall back to whatever exists)
    pref = ex["vintages"].get("PB2027", {}); fb = ex["vintages"].get("PB2026", {})
    for fyl in ["FY2024","FY2025","FY2026","FY2027"]:
        v = pref.get(fyl) or fb.get(fyl)
        if v: ex["components"][fyl] = v["components"]

    # orgComponentMix (disc/mandatory by org for enacted & request years, PB2027)
    # (re-read primary disc/mand sheets is heavy; approximate from components at exhibit level instead)

    # lifecycle: gather phase totals across vintages per fy + variance
    by_fy_phase = defaultdict(dict)   # fy -> phase -> {vintage,total}
    for vint, fys in ex["vintages"].items():
        for fyl, info in fys.items():
            by_fy_phase[fyl][info["phase"]] = info["total"]
    for fyl, phases in by_fy_phase.items():
        lc = dict(phases)
        if "enacted" in phases and "actuals" in phases and phases["enacted"]:
            lc["execVarPct"] = round((phases["actuals"]-phases["enacted"])/phases["enacted"]*1000)/10
        if "request" in phases and "enacted" in phases and phases["request"]:
            lc["reqToEnactedPct"] = round((phases["enacted"]-phases["request"])/phases["request"]*1000)/10
        ex["lifecycle"][fyl] = lc

    # finalize records
    recs = []
    for tkey, fyv in rec.items():
        row = dict(rec_levels[tkey])
        for fyl in ["FY2024","FY2025","FY2026","FY2027"]: row[fyl] = round(fyv.get(fyl,0.0))
        recs.append(row)
    recs.sort(key=lambda r:-abs(r.get("FY2027",0) or r.get("FY2025",0) or 0))
    ex["records"] = recs[:600]
    ex["dims"] = {k:sorted(v) for k,v in dim_sets.items()}
    ex["quality"] = {"totalRows":tot_rows,"nullAmounts":tot_null,"nonAddFiltered":tot_nonadd,
                     "recordRows":len(recs),"recordsKept":len(ex["records"]),
                     "drillLevels":ex["hierarchy"]}
    return ex

# ────────────────────────────────────────────────────────────────── MILCON C-1
def etl_milcon(catalog):
    ex={"title":"Military Construction (C-1)","appn":"MILCON","isMilcon":True,
        "years":{},"byOrg":{},"byBudgetActivity":{},"topAccounts":{},
        "byStateCountry":{},"byFacilityCategory":{},
        "components":{},"vintages":{},"lifecycle":{},
        "hierarchy":["org","account","budgetActivity","stateCountry","project"],
        "records":[],"dims":{},"quality":{},
        "note":"MILCON is a multi-year appropriation (typically 5-year). Prior-year columns are program amounts, NOT execution actuals like the other -1 exhibits — do not compute execution variance the same way."}
    rec=defaultdict(lambda: defaultdict(float)); rec_lv={}; dim=defaultdict(set)
    tot=0; nullc=0; primary={}
    def acols(cols):
        toa=next((c for c in cols if re.search(r"Total Obligation Authority",str(c))),None)
        appr=next((c for c in cols if re.search(r"Appropriation Amount",str(c)) and "Authorization" not in str(c)),None)
        auth=next((c for c in cols if re.search(r"Authorization Amount",str(c))),None)
        return toa,appr,auth
    for folder,vint,byear in BOOKS:
        path=book_path(folder,"c1")
        if not path: continue
        try: xl=pd.ExcelFile(path)
        except Exception: continue
        used=[]
        for sheet in xl.sheet_names:
            fy=fy_of(sheet)
            if not fy or "recon" in sheet.lower(): continue
            cols,df=header_df(path,sheet)
            if df is None: continue
            toa,appr,auth=acols(cols)
            if not toa: continue
            df["__v"]=pd.to_numeric(df[toa],errors="coerce")
            nullc+=int(df["__v"].isna().sum()); df=df.assign(__v=df["__v"].fillna(0))
            ssum=round(float(df["__v"].sum())); fyl=f"FY{fy}"
            comp={"toa":ssum}
            if appr: comp["appropriation"]=round(float(pd.to_numeric(df[appr],errors="coerce").fillna(0).sum()))
            if auth: comp["authorization"]=round(float(pd.to_numeric(df[auth],errors="coerce").fillna(0).sum()))
            ph=phase_for(byear,fy)
            ex["vintages"].setdefault(vint,{})[fyl]={"phase":ph,"components":comp,"total":ssum}
            tot+=len(df); used.append(sheet)
            if fyl not in primary or vint=="PB2027":
                primary[fyl]=(cols,df)
        if used:
            catalog.append({"file":os.path.basename(path),"exhibit":"C1","vintage":vint,"book":folder,
                            "sheets":used,"years":sorted({f"FY{fy_of(s)}" for s in used if fy_of(s)})})
    for fyl,(cols,df) in primary.items():
        ex["years"][fyl]=round(float(df["__v"].sum()))
        def roll(col,store,n=12,mp=False):
            if col not in cols: return
            g=df.groupby(df[col].astype(str).str.strip())["__v"].sum().sort_values(ascending=False)
            store[fyl]={(ORG_NAMES.get(k,k) if mp else k):round(float(v)) for k,v in g.head(n).items() if k and k!="nan"}
        roll("Organization",ex["byOrg"],8,True); roll("Budget Activity Title",ex["byBudgetActivity"])
        roll("State Country Title",ex["byStateCountry"],15); roll("Facility Category Title",ex["byFacilityCategory"],15)
        roll("Account Title",ex["topAccounts"],10)
        for _,r in df.iterrows():
            lv={"org":ORG_NAMES.get(str(r.get("Organization","")).strip(),str(r.get("Organization","")).strip()),
                "account":str(r.get("Account Title","")).strip() or "(unspecified)",
                "budgetActivity":str(r.get("Budget Activity Title","")).strip() or "(unspecified)",
                "stateCountry":str(r.get("State Country Title","")).strip() or "(unspecified)",
                "project":(str(r.get("Construction Project Title","")).strip() or str(r.get("Account Title","")).strip() or "(unspecified)")}
            for f,v in lv.items():
                if not v or v=="nan": lv[f]="(unspecified)"
                dim[f].add(lv[f])
            tkey=tuple(lv[f] for f in ex["hierarchy"]); rec[tkey][fyl]+=float(r["__v"]); rec_lv[tkey]=lv
    pref=ex["vintages"].get("PB2027",{}); fb=ex["vintages"].get("PB2026",{})
    for fyl in ["FY2024","FY2025","FY2026","FY2027"]:
        v=pref.get(fyl) or fb.get(fyl)
        if v: ex["components"][fyl]=v["components"]
    bfp=defaultdict(dict)
    for vint,fys in ex["vintages"].items():
        for fyl,info in fys.items(): bfp[fyl][info["phase"]]=info["total"]
    for fyl,ph in bfp.items(): ex["lifecycle"][fyl]=dict(ph)
    recs=[]
    for tkey,fyv in rec.items():
        row=dict(rec_lv[tkey])
        for fyl in ["FY2024","FY2025","FY2026","FY2027"]: row[fyl]=round(fyv.get(fyl,0.0))
        recs.append(row)
    recs.sort(key=lambda r:-abs(r.get("FY2027",0) or 0))
    ex["records"]=recs[:400]; ex["dims"]={k:sorted(v) for k,v in dim.items()}
    ex["quality"]={"totalRows":tot,"nullAmounts":nullc,"recordRows":len(recs),"recordsKept":len(ex["records"]),"drillLevels":ex["hierarchy"]}
    return ex

def main():
    catalog=[]
    out={"agency":"Department of Defense","unit":"$K","generated":datetime.now(timezone.utc).isoformat(),
         "books":{"PB2026":{"label":"President's Budget FY2026","baseYear":2026,"folder":"FY2026","covers":["FY2024 actuals","FY2025 enacted","FY2026 request"]},
                  "PB2027":{"label":"President's Budget FY2027","baseYear":2027,"folder":"FY2027","covers":["FY2025 actuals","FY2026 enacted","FY2027 request"]}},
         "yearPhase":{"FY2024":{"phase":"actuals","label":"Execution actuals (PB2026 prior-year)"},
                      "FY2025":{"phase":"actuals","label":"Execution actuals (PB2027) — was enacted in PB2026"},
                      "FY2026":{"phase":"enacted","label":"Enacted authority (PB2027) — was request in PB2026: discretionary enacted + PL 119-21 mandatory"},
                      "FY2027":{"phase":"request","label":"President's Budget request (PB2027): discretionary + mandatory"}},
         "exhibits":{}}
    for k,m in STD.items(): out["exhibits"][k]=etl_standard(k,m,catalog)
    out["exhibits"]["c1"]=etl_milcon(catalog)
    fys=["FY2024","FY2025","FY2026","FY2027"]
    out["totalsByFY"]={fy:sum(e["years"].get(fy,0) for e in out["exhibits"].values()) for fy in fys}
    dm={}
    for fy in fys:
        disc=mand=0
        for k,e in out["exhibits"].items():
            if e.get("isMilcon"): continue
            c=e["components"].get(fy,{})
            disc+=c.get("discretionaryEnacted",0)+c.get("discretionaryRequest",0)+c.get("enacted",0)+(c.get("actuals",0) if fy in ("FY2024","FY2025") else 0)
            mand+=c.get("mandatorySpendPlan",0)+c.get("mandatoryRequest",0)+c.get("supplemental",0)
        dm[fy]={"discretionary":round(disc),"mandatory":round(mand)}
    out["discMandatoryByFY"]=dm
    # dept-wide lifecycle (sum of exhibit lifecycles)
    lc=defaultdict(lambda: defaultdict(float))
    for e in out["exhibits"].values():
        if e.get("isMilcon"): continue
        for fyl,info in e["lifecycle"].items():
            for ph in ("actuals","enacted","request"):
                if ph in info: lc[fyl][ph]+=info[ph]
    deptlc={}
    for fyl,ph in lc.items():
        d=dict(ph)
        if d.get("enacted") and d.get("actuals"): d["execVarPct"]=round((d["actuals"]-d["enacted"])/d["enacted"]*1000)/10
        if d.get("request") and d.get("enacted"): d["reqToEnactedPct"]=round((d["enacted"]-d["request"])/d["request"]*1000)/10
        deptlc[fyl]={k:(round(v) if isinstance(v,float) and k not in("execVarPct","reqToEnactedPct") else v) for k,v in d.items()}
    out["lifecycleDept"]=deptlc
    out["catalog"]=catalog
    p=os.path.join(OUT,"dod_budget.json")
    with open(p,"w") as f: json.dump(out,f)
    print("WROTE",p,os.path.getsize(p),"bytes")
    print("totalsByFY:",out["totalsByFY"])
    print("dept lifecycle:",json.dumps(deptlc))
    for k,e in out["exhibits"].items():
        print(f"  {k}: hier={e['hierarchy']} recs={len(e['records'])} vintages={ {v:list(y.keys()) for v,y in e['vintages'].items()} }")

if __name__=="__main__": main()
