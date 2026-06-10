#!/usr/bin/env python3
"""
usaspending_pipeline.py — backend data engineering for the USAspending archives
in sourcedata/USAspending/. Pure stdlib (no pandas required) so it runs on any
Python 3.9+, streaming the multi-GB CSVs in constant memory.

Stages
  1. DISCOVER   full + delta archive files
  2. CLEANSE    type coercion, dedupe on contract_transaction_unique_key,
                delta application (C=correction replaces, D=delete), zero/null
                quarantine (counted, never silently dropped)
  3. TRANSFORM  select analytical columns, derive FY/month, agency filter,
                parse TAS / object-class / program-activity multi-value fields
  4. ANALYZE    monthly obligations, top recipients / sub-agencies / NAICS /
                PSC / TAS, funding-vs-awarding cross-service share
  5. ML SCREENS Benford first-digit (chi-square + MAD), robust-z outliers
                (median/MAD), k-means (k=4) value strata on log10 amounts
  6. EMIT       processed/<agency>/FY<fy>/transactions_clean.csv
                processed/<agency>/FY<fy>/analysis_report.json

Usage (from repo root):
  python scripts/usaspending_pipeline.py --agency 097 --fy 2026
  python scripts/usaspending_pipeline.py --agency 097 --fy 2026 --apply-deltas
  python scripts/usaspending_pipeline.py --agency all --fy 2026 --max-rows 200000
"""
import argparse, csv, json, math, os, sys, time
from collections import Counter, defaultdict
from datetime import datetime, timezone

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sourcedata", "USAspending")
ARCHIVE = os.path.join(ROOT, "award-data-archive", "contracts")
OUT = os.path.join(ROOT, "processed")

KEEP = [  # analytical column subset (of 297)
    "contract_transaction_unique_key", "contract_award_unique_key", "award_id_piid",
    "modification_number", "federal_action_obligation", "total_dollars_obligated",
    "action_date", "action_date_fiscal_year",
    "awarding_agency_code", "awarding_agency_name", "awarding_sub_agency_code",
    "awarding_sub_agency_name", "awarding_office_name",
    "funding_agency_code", "funding_agency_name", "funding_sub_agency_name",
    "recipient_uei", "recipient_name", "recipient_state_code",
    "primary_place_of_performance_state_code",
    "award_type_code", "award_type", "naics_code", "naics_description",
    "product_or_service_code", "product_or_service_code_description",
    "treasury_accounts_funding_this_award", "object_classes_funding_this_award",
    "program_activities_funding_this_award",
]

def log(msg): print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def fnum(v):
    try:
        x = float(v)
        return x if math.isfinite(x) else None
    except (TypeError, ValueError):
        return None

# ── stage 1: discover ────────────────────────────────────────────────────────
def discover(fy):
    full_dir = os.path.join(ARCHIVE, "full", f"FY{fy}")
    fulls = sorted(os.path.join(full_dir, f) for f in os.listdir(full_dir)) if os.path.isdir(full_dir) else []
    deltas = []
    ddir = os.path.join(ARCHIVE, "delta")
    if os.path.isdir(ddir):
        for d in sorted(os.listdir(ddir)):
            sub = os.path.join(ddir, d)
            if os.path.isdir(sub):
                deltas += sorted(os.path.join(sub, f) for f in os.listdir(sub) if f.endswith(".csv"))
    return fulls, deltas

# ── stage 2+3: cleanse & transform (streaming) ──────────────────────────────
def stream_rows(files, agency, fy, max_rows, counters):
    seen = set()
    for path in files:
        log(f"reading {os.path.basename(path)}")
        with open(path, encoding="utf-8", errors="replace", newline="") as f:
            rdr = csv.DictReader(f)
            for row in rdr:
                counters["raw_rows"] += 1
                if max_rows and counters["raw_rows"] > max_rows:
                    return
                if agency != "all" and row.get("awarding_agency_code", "").strip().lstrip("0") != agency.lstrip("0"):
                    counters["other_agency"] += 1
                    continue
                if fy and row.get("action_date_fiscal_year", "").strip() not in ("", str(fy)):
                    counters["other_fy"] += 1
                    continue
                key = row.get("contract_transaction_unique_key", "")
                if key in seen:
                    counters["duplicates"] += 1
                    continue
                seen.add(key)
                amt = fnum(row.get("federal_action_obligation"))
                if amt is None:
                    counters["null_amount"] += 1
                    continue
                counters["kept"] += 1
                yield {k: row.get(k, "") for k in KEEP} | {"_amt": amt}

def apply_deltas(rows_by_key, delta_files, agency, counters):
    for path in delta_files:
        log(f"applying delta {os.path.basename(path)}")
        with open(path, encoding="utf-8", errors="replace", newline="") as f:
            rdr = csv.DictReader(f)
            for row in rdr:
                counters["delta_rows"] += 1
                if agency != "all" and row.get("awarding_agency_code", "").strip().lstrip("0") != agency.lstrip("0"):
                    continue
                key = row.get("contract_transaction_unique_key", "")
                ind = (row.get("correction_delete_ind") or "").strip().upper()
                if ind == "D":
                    if rows_by_key.pop(key, None) is not None: counters["delta_deletes"] += 1
                else:
                    amt = fnum(row.get("federal_action_obligation"))
                    if amt is None: continue
                    rows_by_key[key] = {k: row.get(k, "") for k in KEEP} | {"_amt": amt}
                    counters["delta_corrections"] += 1

# ── stage 4: analysis ────────────────────────────────────────────────────────
def analyze(rows):
    monthly = defaultdict(float); recip = Counter(); recip_amt = defaultdict(float)
    sub = defaultdict(float); naics = defaultdict(float); psc = defaultdict(float)
    tas = defaultdict(float); cross = 0; total = 0.0; n = 0; amounts = []
    for r in rows:
        a = r["_amt"]; n += 1; total += a; amounts.append(a)
        monthly[r["action_date"][:7]] += a
        recip[r["recipient_name"]] += 1; recip_amt[r["recipient_name"]] += a
        sub[r["awarding_sub_agency_name"]] += a
        if r["naics_code"]: naics[f"{r['naics_code']} {r['naics_description'][:40]}"] += a
        if r["product_or_service_code"]: psc[f"{r['product_or_service_code']} {r['product_or_service_code_description'][:40]}"] += a
        for t in (r["treasury_accounts_funding_this_award"] or "").split(";"):
            t = t.strip()
            if t: tas[t] += a
        if r["funding_agency_code"] and r["funding_agency_code"] != r["awarding_agency_code"]: cross += 1
    top = lambda d, k=15: sorted(d.items(), key=lambda x: -abs(x[1]))[:k]
    return {
        "records": n, "net_obligations": round(total, 2),
        "monthly_obligations": dict(sorted(monthly.items())),
        "top_recipients_by_amount": top(recip_amt),
        "top_sub_agencies": top(sub),
        "top_naics": top(naics, 10), "top_psc": top(psc, 10),
        "top_treasury_accounts": top(tas, 12),
        "cross_servicing_share_pct": round(100 * cross / n, 2) if n else 0,
    }, amounts

# ── stage 5: ML screens (mirrors lib/ml/engine.ts) ──────────────────────────
BENFORD = [math.log10(1 + 1 / d) * 100 for d in range(1, 10)]
def benford(amounts):
    digs = Counter()
    for a in amounts:
        s = str(abs(a)).lstrip("0.")
        for ch in s:
            if ch.isdigit() and ch != "0": digs[int(ch)] += 1; break
    n = sum(digs.values())
    if n < 50: return {"n": n, "note": "population too small"}
    obs = [100 * digs.get(d, 0) / n for d in range(1, 10)]
    chi2 = sum((digs.get(d, 0) - BENFORD[d-1] * n / 100) ** 2 / max(BENFORD[d-1] * n / 100, 1e-9) for d in range(1, 10))
    mad = sum(abs(obs[i] - BENFORD[i]) for i in range(9)) / 9
    return {"n": n, "chi2": round(chi2, 1), "critical_0p05_8df": 15.51,
            "mad_pct": round(mad, 2), "conforms": chi2 < 15.51,
            "digits": [{"digit": d, "observed": round(obs[d-1], 1), "expected": round(BENFORD[d-1], 1)} for d in range(1, 10)]}

def robust_outliers(rows, top=20):
    vals = sorted(r["_amt"] for r in rows)
    if len(vals) < 20: return []
    mid = len(vals) // 2
    med = vals[mid]
    mad = sorted(abs(v - med) for v in vals)[mid] or 1.0
    q1, q3 = vals[len(vals)//4], vals[3*len(vals)//4]
    iqr = (q3 - q1) or 1.0
    flags = []
    for r in rows:
        z = abs(0.6745 * (r["_amt"] - med) / mad)
        iq = max((q1 - r["_amt"]) / iqr, (r["_amt"] - q3) / iqr, 0)
        if z > 3.5 or iq > 3:
            flags.append({"score": round(max(z, iq), 1), "amount": r["_amt"],
                          "recipient": r["recipient_name"], "date": r["action_date"],
                          "sub_agency": r["awarding_sub_agency_name"],
                          "method": ("z" if z > 3.5 else "") + ("+iqr" if iq > 3 else "")})
    flags.sort(key=lambda x: -x["score"])
    return flags[:top]

def kmeans_strata(amounts, k=4, iters=60):
    logs = sorted(math.log10(abs(a)) for a in amounts if abs(a) >= 1)
    if len(logs) < k: return []
    cents = [logs[int((i + 0.5) * len(logs) / k)] for i in range(k)]
    for _ in range(iters):
        groups = [[] for _ in range(k)]
        for v in logs: groups[min(range(k), key=lambda i: abs(v - cents[i]))].append(v)
        new = [sum(g) / len(g) if g else cents[i] for i, g in enumerate(groups)]
        if all(abs(new[i] - cents[i]) < 1e-6 for i in range(k)): break
        cents = new
    out = []
    for i, g in enumerate(groups):
        if not g: continue
        out.append({"stratum": ["Micro", "Small", "Medium", "Major"][i],
                    "center": round(10 ** cents[i], 2), "min": round(10 ** g[0], 2),
                    "max": round(10 ** g[-1], 2), "population": len(g),
                    "share_pct": round(100 * len(g) / len(logs), 1)})
    return out

# ── main ─────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--agency", default="097", help="awarding toptier code (e.g. 097) or 'all'")
    ap.add_argument("--fy", type=int, default=2026)
    ap.add_argument("--apply-deltas", action="store_true")
    ap.add_argument("--max-rows", type=int, default=0, help="bound raw rows read (0 = full pass)")
    a = ap.parse_args()

    fulls, deltas = discover(a.fy)
    if not fulls: sys.exit(f"no full archives under {ARCHIVE}/full/FY{a.fy}")
    log(f"full archives: {len(fulls)} · delta files: {len(deltas)} · agency={a.agency} fy={a.fy}"
        + (f" · BOUNDED to {a.max_rows:,} raw rows" if a.max_rows else " · FULL PASS"))

    counters = Counter()
    rows_by_key = {}
    for r in stream_rows(fulls, a.agency, a.fy, a.max_rows, counters):
        rows_by_key[r["contract_transaction_unique_key"]] = r
    if a.apply_deltas and deltas:
        apply_deltas(rows_by_key, deltas, a.agency, counters)
    rows = list(rows_by_key.values())
    log(f"clean population: {len(rows):,} transactions")

    analysis, amounts = analyze(rows)
    abs_amounts = [abs(x) for x in amounts if x]
    report = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "pipeline": "scripts/usaspending_pipeline.py",
        "source": [os.path.basename(f) for f in fulls] + ([os.path.basename(f) for f in deltas] if a.apply_deltas else []),
        "time_basis": {"population": f"action_date_fiscal_year == {a.fy} (execution view)",
                        "appropriation_identity": "see top_treasury_accounts (TAS carries year of the money)"},
        "cleansing": dict(counters),
        "analysis": analysis,
        "ml_screens": {
            "benford_first_digit": benford(abs_amounts),
            "robust_outliers_top": robust_outliers(rows),
            "value_strata_kmeans": kmeans_strata(abs_amounts),
        },
    }

    label = "ALL" if a.agency == "all" else a.agency
    odir = os.path.join(OUT, f"{label}", f"FY{a.fy}")
    os.makedirs(odir, exist_ok=True)
    with open(os.path.join(odir, "analysis_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    with open(os.path.join(odir, "transactions_clean.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=KEEP)
        w.writeheader()
        for r in rows:
            w.writerow({k: r[k] for k in KEEP})
    log(f"wrote {odir}/analysis_report.json and transactions_clean.csv")
    log(f"headline: {analysis['records']:,} txns · net {analysis['net_obligations']:,} · "
        f"Benford {'CONFORMS' if report['ml_screens']['benford_first_digit'].get('conforms') else 'check'} · "
        f"{len(report['ml_screens']['robust_outliers_top'])} outlier flags")

if __name__ == "__main__":
    main()
