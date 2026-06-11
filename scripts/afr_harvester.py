#!/usr/bin/env python3
"""
afr_harvester.py — download agency-specific AUDITED financial statements:
each agency's Agency Financial Report (AFR) PDFs, last ~10 years, into
sourcedata/AFR/<AGENCY>/. AFRs are the ONLY place agency-level complete
audited statements exist (Balance Sheet, SNC, SCNP, SBR + notes + opinion);
they are PDF-only by nature — no API exists government-wide.

RUN (repo root, stdlib only):
    python scripts/afr_harvester.py
    python scripts/afr_harvester.py --agency DOD          # one agency
    python scripts/afr_harvester.py --years 10 --max-per-agency 12

HOW IT WORKS
  1. For each registry agency, fetch its curated AFR library page(s).
  2. Extract every PDF link whose URL/text suggests an AFR (afr / agency
     financial report / annual financial, plus a year 2015-2026).
  3. Download up to --max-per-agency PDFs (newest years first) into
     sourcedata/AFR/<ID>/, skipping files already present (re-runnable).
  4. Write sourcedata/AFR/index.json - found/downloaded/missed per agency.
OVERRIDES: sourcedata/AFR/afr_links.txt - lines of "AGENCYID = url"
  (either a library page to crawl or a direct .pdf). Use it whenever an
  agency redesigns its site - no code edit needed.
"""
import argparse, json, os, re, sys, time, urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "sourcedata", "AFR")
UA = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 anyfed-research",
  "Accept": "text/html,application/xhtml+xml,application/pdf,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
}

# Curated AFR library landing pages per registry agency. Sites get redesigned;
# misses are recorded in index.json - fix via afr_links.txt, not code.
LIBRARY = {
  "DOD":   ["https://comptroller.defense.gov/ODCFO/afr/", "https://comptroller.war.gov/odcfo/afr/"],
  "TREAS": ["https://home.treasury.gov/about/budget-financial-reporting-planning-and-performance/agency-financial-report"],
  "HHS":   ["https://www.hhs.gov/afr/", "https://www.hhs.gov/about/agencies/asfr/finance/financial-policy-reporting/agency-financial-reports/index.html"],
  "DHS":   ["https://www.dhs.gov/publications-library/collections/agency-financial-report", "https://www.dhs.gov/performance-financial-reports"],
  "VA":    ["https://www.va.gov/finance/afr/", "https://department.va.gov/administrations-and-offices/management/finance/annual-financial-report/"],
  "DOE":   ["https://www.energy.gov/cfo/articles/fy-2025-agency-financial-report", "https://www.energy.gov/cfo/listings/agency-financial-reports"],
  "DOJ":   ["https://www.justice.gov/cfo/annual-financial-statements", "https://www.justice.gov/doj/financial-documents"],
  "DOS":   ["https://www.state.gov/agency-financial-reports/", "https://www.state.gov/reports-bureau-of-the-comptroller-and-global-financial-services"],
  "DOT":   ["https://www.transportation.gov/budget/agency-financial-reports", "https://www.transportation.gov/mission/budget/agency-financial-reports"],
  "ED":    ["https://www2.ed.gov/about/reports/annual/index.html", "https://www.ed.gov/about/ed-overview/annual-performance-reports-and-agency-financial-reports"],
  "USDA":  ["https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-financial-officer/agency-financial-report", "https://www.usda.gov/ocfo/agency-financial-report"],
  "DOC":   ["https://www.commerce.gov/about/strategic-planning-and-performance/agency-financial-reports", "https://www.commerce.gov/about/budget-and-performance"],
  "DOL":   ["https://www.dol.gov/agencies/oasam/centers-offices/office-chief-financial-officer/annual-report", "https://www.dol.gov/agencies/oasam/centers-offices/ocfo/reports"],
  "HUD":   ["https://www.hud.gov/program_offices/cfo/reports/cfo_rpts", "https://www.hud.gov/program_offices/spm/afr"],
  "DOI":   ["https://www.doi.gov/pfm/afr"],
  "EPA":   ["https://www.epa.gov/planandbudget/agency-financial-reports", "https://www.epa.gov/planandbudget/results"],
  "NASA":  ["https://www.nasa.gov/organizations/budget-annual-reports/", "https://www.nasa.gov/ocfo/agency-financial-reports/"],
  "GSA":   ["https://www.gsa.gov/reference/reports/budget-and-performance/agency-financial-reports-afrs", "https://www.gsa.gov/reference/reports/budget-and-performance"],
  "NSF":   ["https://www.nsf.gov/about/performance", "https://new.nsf.gov/about/performance"],
  "OPM":   ["https://www.opm.gov/about-us/reports-publications/agency-plans-and-reports/", "https://www.opm.gov/about-us/budget-performance/performance/"],
  "SBA":   ["https://www.sba.gov/document/report-agency-financial-report", "https://www.sba.gov/about-sba/organization/performance-budget-finances"],
  "SSA":   ["https://www.ssa.gov/finance/", "https://www.ssa.gov/finance/2025/Full%20FY%202025%20AFR.pdf"],
  "USAID": ["https://www.usaid.gov/results-and-data/progress-data/agency-financial-report"],
  "NRC":   ["https://www.nrc.gov/reading-rm/doc-collections/nuregs/staff/sr1542/", "https://www.nrc.gov/about-nrc/plans-budget-performance.html"],
  "FDIC":  ["https://www.fdic.gov/about/financial-reports", "https://www.fdic.gov/analysis/cfr/annual-report"],
  "SEC":   ["https://www.sec.gov/about/reports-publications/secafr", "https://www.sec.gov/about/reports-publications/annual-reports"],
  "FCC":   ["https://www.fcc.gov/reports-research/reports/agency-financial-reports", "https://www.fcc.gov/general/fcc-agency-financial-reports"],
  "CFTC":  ["https://www.cftc.gov/About/CFTCReports/index.htm"],
}

YEAR_RE = re.compile(r"20(1[5-9]|2[0-6])")
ANCHOR_RE = re.compile(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.{0,160}?)</a>', re.I | re.S)
HINT_RE = re.compile(r"afr|agency[\s_-]*financial|annual[\s_-]*financial|financial[\s_-]*report|par[\s_-]*20", re.I)

def extract(page_url, html):
    """Return (pdf_links, subpage_links) - hint can match URL OR anchor text."""
    pdfs, subs = [], []
    for href, text in ANCHOR_RE.findall(html):
        full = absolute(page_url, href.split("#")[0])
        blob = full + " " + re.sub(r"<[^>]+>", " ", text)
        if ".pdf" in full.lower():
            if HINT_RE.search(blob): pdfs.append(full)
        elif HINT_RE.search(blob) and full.startswith("http"):
            # same-host subpage that LOOKS like an AFR detail page
            host = re.match(r"https?://([^/]+)", page_url)
            if host and host.group(1) in full and full != page_url:
                subs.append(full)
    return pdfs, subs

def fetch(url, binary=False, timeout=60):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read()
    return data if binary else data.decode("utf-8", "replace")

def absolute(base, link):
    if link.startswith("http"): return link
    if link.startswith("//"): return "https:" + link
    m = re.match(r"(https?://[^/]+)", base)
    host = m.group(1) if m else base
    return host + link if link.startswith("/") else base.rstrip("/") + "/" + link

def load_overrides():
    f = os.path.join(ROOT, "afr_links.txt")
    if not os.path.exists(f): return
    for line in open(f, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        aid, url = [x.strip() for x in line.split("=", 1)]
        if aid and url:
            LIBRARY.setdefault(aid.upper(), []).insert(0, url)
            print(f"[user] override for {aid.upper()}: {url}")

def harvest(agency_filter, years_back, max_per):
    os.makedirs(ROOT, exist_ok=True)
    load_overrides()
    min_year = datetime.now().year - years_back
    index = {"generated": datetime.now(timezone.utc).isoformat(),
             "note": "agency AFR PDFs - the only agency-level complete audited statements; PDF-only by design",
             "agencies": {}}
    for aid, pages in LIBRARY.items():
        if agency_filter and aid != agency_filter: continue
        adir = os.path.join(ROOT, aid); os.makedirs(adir, exist_ok=True)
        found, downloaded, errors = [], [], []
        for page in pages:
            # direct-PDF override support
            if page.lower().endswith(".pdf") or ".pdf?" in page.lower():
                found.append(page); continue
            try:
                html = fetch(page)
            except Exception as e:
                errors.append(f"{page} -> {e}"); continue
            pdfs, subs = extract(page, html)
            # ONE-HOP: follow up to 8 AFR-looking subpages for their PDFs
            for sub in subs[:8]:
                try:
                    p2, _ = extract(sub, fetch(sub))
                    pdfs += p2
                    time.sleep(0.25)
                except Exception:
                    pass
            for full in pdfs:
                ym = YEAR_RE.search(full)
                if (ym is None or int("20" + ym.group(1)) >= min_year) and full not in found:
                    found.append(full)
        # newest first by year found in URL
        def yr(u):
            m = YEAR_RE.search(u); return int("20" + m.group(1)) if m else 0
        found.sort(key=yr, reverse=True)
        for url in found[:max_per]:
            fname = re.sub(r"[^A-Za-z0-9._-]", "_", url.split("/")[-1].split("?")[0])[:120] or "afr.pdf"
            dest = os.path.join(adir, fname)
            if os.path.exists(dest) and os.path.getsize(dest) > 10000:
                downloaded.append(fname + "  (already present)"); continue
            try:
                data = fetch(url, binary=True)
                if len(data) < 10000 or not data[:5].startswith(b"%PDF"):
                    errors.append(f"{url} -> not a PDF ({len(data)} bytes)"); continue
                open(dest, "wb").write(data)
                downloaded.append(f"{fname}  ({len(data)//1024} KB)")
                print(f"[ OK ] {aid}: {fname} ({len(data)//1024} KB)")
                time.sleep(0.4)   # be polite
            except Exception as e:
                errors.append(f"{url} -> {e}")
        status = "OK" if downloaded else ("PAGE ERRORS" if errors and not found else "NO PDFS MATCHED - add afr_links.txt override")
        index["agencies"][aid] = {"status": status, "pdfLinksFound": len(found),
                                  "downloaded": downloaded, "errors": errors[:4],
                                  "libraryPages": pages}
        if not downloaded:
            print(f"[MISS] {aid}: {status} ({len(found)} candidate links)")
    json.dump(index, open(os.path.join(ROOT, "index.json"), "w", encoding="utf-8"), indent=2)
    ok = sum(1 for a in index["agencies"].values() if a["status"] == "OK")
    print("=" * 70)
    print(f"DONE: {ok}/{len(index['agencies'])} agencies with AFR PDFs -> {os.path.normpath(ROOT)}")
    print("Missed agencies: their site moved - add 'AGENCYID = url' lines to")
    print("sourcedata/AFR/afr_links.txt (library page OR direct PDF) and re-run.")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--agency", help="one registry id, e.g. DOD")
    ap.add_argument("--years", type=int, default=10)
    ap.add_argument("--max-per-agency", type=int, default=12)
    a = ap.parse_args()
    harvest(a.agency.upper() if a.agency else None, a.years, a.max_per_agency)
