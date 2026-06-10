"use client"
// components/anyfed/UsaCatalog.tsx — the full-scope USAspending data model,
// correctly structured: account data (File A/B/C), award data (D1/D2, E/F),
// bulk archives (full + delta), custom downloads, raw submissions, database
// snapshot, and the API — plus what is organized in the local sourcedata/
// USAspending/ tree and how the Python backend pipeline processes it.
import { useState } from "react"
import { useTheme, Card, Badge } from "./ui"

const PRODUCTS: { tag: string; name: string; grain: string; desc: string; color: "blue" | "green" | "gold" | "purple" | "cyan" }[] = [
  { tag: "File A", name: "Account Balances", grain: "TAS × period", color: "blue",
    desc: "Budgetary resources, obligations, and unobligated balance per Treasury Account Symbol — SF-133/GTAS lineage, agency-certified. The authoritative 'how much money, how much used' view." },
  { tag: "File B", name: "Program Activity & Object Class", grain: "TAS × PA × OC × period", color: "blue",
    desc: "Account obligations/outlays split by program activity and OMB A-11 §83 object class — the cost-structure view behind the Data Intelligence object-class dimension." },
  { tag: "File C", name: "Account Breakdown by Award", grain: "TAS × award × period", color: "blue",
    desc: "Links appropriation accounts to individual awards — the bridge between the budget world (A/B) and the award world (D). This is where appropriation-year attribution for awards lives." },
  { tag: "D1", name: "Contract Awards & Transactions", grain: "transaction", color: "green",
    desc: "Every contract action from FPDS-NG (297 columns in the archives: amounts, recipients, NAICS/PSC, funding vs awarding office, TAS list, period of performance)." },
  { tag: "D2", name: "Financial Assistance", grain: "transaction", color: "green",
    desc: "Grants, loans, direct payments, and insurance from FABS — the assistance half of the award universe." },
  { tag: "E / F", name: "Sub-awards & Exec Comp", grain: "sub-award", color: "green",
    desc: "FFATA sub-award detail and executive compensation from FSRS — the tier below prime awards." },
  { tag: "Archive", name: "Award Data Archive (Full + Delta)", grain: "bulk CSV", color: "gold",
    desc: "Full = complete D1/D2 population per FY, snapshot dated in the filename. Delta = changes since the prior full (correction_delete_ind: C replaces by transaction key, D deletes). Apply deltas after the full for a current population." },
  { tag: "Custom", name: "Custom Award / Account Data", grain: "GUI extract", color: "gold",
    desc: "GUI-built extracts — award level (prime/sub) with filters, or account level (File A/B/C selections by agency, TAS, and period)." },
  { tag: "DABS/FABS", name: "Agency Raw Submissions", grain: "as submitted", color: "purple",
    desc: "The original files agencies certified to the DATA Act broker, by year and agency — audit-grade lineage to what the agency actually submitted." },
  { tag: "Database", name: "Full PostgreSQL Snapshot", grain: "everything", color: "purple",
    desc: "The entire USAspending database (FY2001–present) as a PostgreSQL archive — for warehouse-scale work." },
  { tag: "API", name: "api.usaspending.gov", grain: "live JSON", color: "cyan",
    desc: "Live endpoints this portal already uses: agency resources, budget functions, federal accounts, object classes, sub-agencies, and transaction search (the Acquire panel above)." },
]

export default function UsaCatalog() {
  const C = useTheme()
  const [open, setOpen] = useState(false)
  const col = (c: string) => c === "blue" ? C.blue : c === "green" ? C.green : c === "gold" ? C.gold : c === "purple" ? C.purple : C.cyan
  return (
    <Card title="🗃 USAspending Data Model — full scope & local holdings"
          sub="What each official product is, which ones are organized in your sourcedata/USAspending/ folder, and how the Python pipeline processes them">
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
        <Badge color={C.green}>LOCAL: FY2026 All-Contracts Full archive (3 files, ~4.6 GB)</Badge>
        <Badge color={C.green}>LOCAL: FY(All) Delta archive (2 files, ~3.5 GB)</Badge>
        <Badge color={C.green}>LOCAL: DCAT-US data catalog</Badge>
        <Badge color={C.cyan}>PROCESSED: DoD FY2026 extract + analysis report</Badge>
        <button onClick={() => setOpen(o => !o)}
          style={{ marginLeft:"auto", padding:"6px 14px", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer",
                   border:`1px solid ${C.borderAccent}`, background:`${C.blue}14`, color:C.blue }}>
          {open ? "Hide the data model ▴" : "Show the full data model ▾"}
        </button>
      </div>

      {open && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(330px, 1fr))", gap:10, marginBottom:14 }}>
            {PRODUCTS.map(p => (
              <div key={p.tag} style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${col(p.color)}`, borderRadius:9, padding:"10px 13px" }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                  <Badge color={col(p.color)}>{p.tag}</Badge>
                  <span style={{ fontSize:15, fontWeight:700, color:C.text }}>{p.name}</span>
                  <span style={{ fontSize:12.5, color:C.muted, fontFamily:"var(--font-mono)" }}>{p.grain}</span>
                </div>
                <div style={{ fontSize:14, color:C.textSub, lineHeight:1.6 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"11px 14px", marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:"0.05em", marginBottom:6 }}>📂 YOUR FOLDER (organized)</div>
            <pre style={{ margin:0, fontSize:13, lineHeight:1.7, color:C.textSub, fontFamily:"var(--font-mono)", overflowX:"auto" }}>{`sourcedata/USAspending/
  catalog/                       USAspending-data-catalog.json (DCAT-US, all 7 products)
  award-data-archive/contracts/
    full/FY2026/                 FY2026_All_Contracts_Full_20260506_{1,2,3}.csv
    delta/2026-05-08/            FY(All)_All_Contracts_Delta_20260508_{1,2}.csv
  account-data/
    file-a-account-balances/     ← drop Custom Account Data File A extracts here
    file-b-program-activity-object-class/
    file-c-account-breakdown-by-award/
  custom-award-data/             ← drop Custom Award Data extracts here
  warehouse/silver/contracts/    DuckDB lakehouse: agency=<code>/fy=<year>/*.parquet (zstd)
  processed/<agency>/FY<yy>/     gold outputs: analysis_report.json (app-readable)
  catalog/coverage_manifest.json held-vs-missing matrix (usaspending_coverage.py scan)
  README.md                      the full data-model documentation`}</pre>
          </div>

          <div style={{ background:`${C.purple}0d`, border:`1px solid ${C.purple}44`, borderRadius:9, padding:"11px 14px" }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.purple, letterSpacing:"0.05em", marginBottom:6 }}>🐍 PYTHON BACKEND PIPELINE</div>
            <div style={{ fontSize:14, color:C.textSub, lineHeight:1.7 }}>
              <code>scripts/usaspending_duck.py</code> — DuckDB + Parquet local lakehouse (bronze CSV → silver hive-partitioned zstd Parquet with dedupe &amp; delta-merge → gold JSON; ~10x compression, scales to all-federal volumes; <code>usaspending_pipeline.py</code> is the stdlib fallback):
              cleansing (dedupe on transaction key, delta application, type coercion, null quarantine) → per-agency
              transform (TAS / object-class / program-activity parsing) → analysis (monthly obligations, top
              recipients / sub-agencies / NAICS / PSC / TAS, cross-servicing share) → ML screens (Benford χ²+MAD,
              robust-z outliers, k-means value strata) → <code>processed/&lt;agency&gt;/FY&lt;yy&gt;/</code>.
              <div style={{ marginTop:6, fontFamily:"var(--font-mono)", fontSize:12.5, color:C.cyan }}>
                python scripts/usaspending_duck.py build && python scripts/usaspending_duck.py gold --agency 097 --fy 2026
              </div>
              <div style={{ marginTop:5, fontSize:13, color:C.muted }}>
                Validated on your archive: a bounded run extracted 5,224 DoD transactions, Benford-conformant
                (χ² 11.2 &lt; 15.51, MAD 0.4%), with TAS evidence of FY2022–FY2024 money funding FY2026 actions —
                the appropriation-year vs action-year distinction, visible in your own data.
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
