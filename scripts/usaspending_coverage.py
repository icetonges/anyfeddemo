#!/usr/bin/env python3
"""
usaspending_coverage.py — all-federal coverage gap analysis for the local
USAspending holdings, plus automated fill of API-fillable gaps.

  python scripts/usaspending_coverage.py scan          inventory → coverage_manifest.json
  python scripts/usaspending_coverage.py fill          pull missing GTAS account views
                                                       (all registry agencies × recent FYs)
                                                       → account-data/api-gtas/...
  python scripts/usaspending_coverage.py scan --fy-from 2022

The manifest records, per product × fiscal year: HELD or MISSING, how to
acquire (automated script / in-app panel / manual GUI), and refresh cadence.
"""
import argparse, glob, json, os, sys, time, urllib.request
from datetime import datetime, timezone

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sourcedata", "USAspending")
USA = "https://api.usaspending.gov/api/v2"

# the 28 portal registry agencies (toptier codes)
AGENCIES = {"097":"DOD","050":"SEC","051":"FDIC","020":"TREAS","075":"HHS","070":"DHS",
  "089":"DOE","015":"DOJ","019":"DOS","069":"DOT","091":"ED","036":"VA","012":"USDA",
  "013":"DOC","016":"DOL","086":"HUD","014":"DOI","068":"EPA","080":"NASA","047":"GSA",
  "049":"NSF","024":"OPM","073":"SBA","028":"SSA","072":"USAID","031":"NRC","027":"FCC","339":"CFTC"}

CADENCE = {
  "award-archive-full":  "Regenerated monthly by USAspending (filename carries the snapshot date)",
  "award-archive-delta": "Published monthly — apply after the matching full snapshot",
  "account-file-abc":    "Agency DABS submissions: monthly reporting periods, published after period close (~P+3 weeks)",
  "api-gtas":            "Underlying GTAS data refreshes monthly; award search data nightly",
  "api-transactions":    "FPDS-NG feeds nightly (contracts); FABS nightly (assistance)",
}

def current_fy():
    n = datetime.now()
    return n.year + 1 if n.month >= 10 else n.year

def have(pattern):
    return sorted(glob.glob(os.path.join(ROOT, pattern), recursive=True))

def scan(fy_from):
    fys = list(range(fy_from, current_fy() + 1))
    items = []
    def add(product, fy, held_files, acquire, cadence_key, note=""):
        items.append({"product": product, "fy": fy, "status": "HELD" if held_files else "MISSING",
                      "files": [os.path.relpath(f, ROOT) for f in held_files][:6],
                      "acquire": acquire, "refresh": CADENCE[cadence_key], "note": note})
    for fy in fys:
        add("Award Archive — Contracts FULL (D1)", fy, have(f"award-data-archive/contracts/full/FY{fy}/*.csv"),
            "MANUAL GUI: usaspending.gov → Download Center → Award Data Archive → Contracts → FY → save under award-data-archive/contracts/full/FY<fy>/", "award-archive-full")
        add("Award Archive — Assistance FULL (D2)", fy, have(f"award-data-archive/assistance/full/FY{fy}/*.csv"),
            "MANUAL GUI: same page → Financial Assistance → FY → save under award-data-archive/assistance/full/FY<fy>/", "award-archive-full",
            "Assistance is the missing half of the award universe — grants/loans/direct payments")
        for f in ("a-account-balances", "b-program-activity-object-class", "c-account-breakdown-by-award"):
            add(f"Account Data — File {f[0].upper()}", fy, have(f"account-data/file-{f}/FY{fy}/**/*.csv"),
                "MANUAL GUI: Download Center → Custom Account Data → select File "
                f"{f[0].upper()}, all agencies, FY{fy} → save under account-data/file-{f}/FY{fy}/", "account-file-abc",
                "File C carries appropriation-year attribution for awards")
        add("API GTAS account view (all agencies)", fy, have(f"account-data/api-gtas/FY{fy}/*.json"),
            "AUTOMATED: python scripts/usaspending_coverage.py fill  (or the in-app Acquire panel per agency)", "api-gtas")
    add("Award Archive — Contracts DELTA", None, have("award-data-archive/contracts/delta/*/*.csv"),
        "MANUAL GUI: Download Center → Award Data Archive → Delta files (monthly)", "award-archive-delta")
    add("Award Archive — Assistance DELTA", None, have("award-data-archive/assistance/delta/*/*.csv"),
        "MANUAL GUI: same page — assistance delta", "award-archive-delta")
    held = sum(1 for i in items if i["status"] == "HELD")
    manifest = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "scope": f"FY{fy_from}–FY{current_fy()} × official products × all-federal",
        "summary": {"held": held, "missing": len(items) - held, "total": len(items)},
        "items": items,
        "automation": {
            "preferred": "Automated monthly pull: (1) coverage fill for API-fillable gaps, (2) duck build to refresh silver, (3) gold per priority agency.",
            "windows_task_scheduler": "schtasks /Create /SC MONTHLY /D 15 /TN USAspendingRefresh /TR \"cmd /c cd C:\\Users\\Peter-HP\\git\\anyfeddemo && python scripts\\usaspending_coverage.py fill && python scripts\\usaspending_duck.py build && python scripts\\usaspending_duck.py gold --agency 097 --fy " + str(current_fy()) + "\"",
            "manual_remaining": "Bulk archive + File A/B/C GUI downloads (no public bulk URL stable enough to script reliably); ~10 min/month.",
        },
    }
    os.makedirs(os.path.join(ROOT, "catalog"), exist_ok=True)
    p = os.path.join(ROOT, "catalog", "coverage_manifest.json")
    json.dump(manifest, open(p, "w", encoding="utf-8"), indent=2)
    print(f"[scan] {held} HELD / {len(items)-held} MISSING of {len(items)} product-year cells → {os.path.relpath(p, ROOT)}")
    for i in items:
        if i["status"] == "MISSING":
            print(f"  MISSING  {i['product']}" + (f" FY{i['fy']}" if i["fy"] else ""))
    return manifest

def fetch(path):
    req = urllib.request.Request(USA + path, headers={"User-Agent": "anyfed-portal"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def fill(fy_from):
    fys = [fy for fy in range(fy_from, current_fy() + 1)]
    ok = fail = 0
    for fy in fys:
        odir = os.path.join(ROOT, "account-data", "api-gtas", f"FY{fy}")
        os.makedirs(odir, exist_ok=True)
        for code, ab in AGENCIES.items():
            out = os.path.join(odir, f"{ab}_{code}.json")
            if os.path.exists(out): continue
            try:
                bundle = {
                    "agency": ab, "toptier": code, "fy": fy,
                    "fetchedAt": datetime.now(timezone.utc).isoformat(),
                    "timeBasis": "GTAS reporting fiscal year (agency-certified monthly submissions)",
                    "budgetary_resources": fetch(f"/agency/{code}/budgetary_resources/"),
                    "federal_account":     fetch(f"/agency/{code}/federal_account/?fiscal_year={fy}&limit=100"),
                    "object_class":        fetch(f"/agency/{code}/object_class/?fiscal_year={fy}&limit=100"),
                    "budget_function":     fetch(f"/agency/{code}/budget_function/?fiscal_year={fy}&limit=100"),
                }
                json.dump(bundle, open(out, "w", encoding="utf-8"), indent=1)
                ok += 1; print(f"[fill] {ab} FY{fy} ✓")
                time.sleep(0.2)  # be polite to the API
            except Exception as e:
                fail += 1; print(f"[fill] {ab} FY{fy} ✗ {e}")
    print(f"[fill] stored {ok}, failed {fail} → account-data/api-gtas/")
    scan(fy_from)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["scan", "fill"])
    ap.add_argument("--fy-from", type=int, default=2024)
    a = ap.parse_args()
    (fill if a.cmd == "fill" else scan)(a.fy_from)

if __name__ == "__main__":
    main()
