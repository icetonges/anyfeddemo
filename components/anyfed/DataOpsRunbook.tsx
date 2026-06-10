"use client"
// components/anyfed/DataOpsRunbook.tsx — operations runbook for the USAspending
// data estate: coverage gaps (held vs missing, all-federal), the step-by-step
// flow, what is manual vs automated, refresh cadence, and how the local DB works.
import { useState } from "react"
import { useTheme, Card, Badge } from "./ui"

const COVERAGE = [
  { p: "Contracts FULL archive (D1)",  held: ["FY2026"],            missing: ["FY2024", "FY2025"],          how: "manual" },
  { p: "Contracts DELTA archive",      held: ["2026-05-08"],        missing: ["(apply monthly)"],            how: "manual" },
  { p: "Assistance FULL archive (D2)", held: [],                    missing: ["FY2024", "FY2025", "FY2026"], how: "manual" },
  { p: "Assistance DELTA archive",     held: [],                    missing: ["(monthly)"],                  how: "manual" },
  { p: "File A — Account Balances",    held: [],                    missing: ["FY2024–26"],                  how: "manual" },
  { p: "File B — PA & Object Class",   held: [],                    missing: ["FY2024–26"],                  how: "manual" },
  { p: "File C — Account ↔ Award",     held: [],                    missing: ["FY2024–26"],                  how: "manual" },
  { p: "API GTAS view (28 agencies)",  held: [],                    missing: ["FY2024–26"],                  how: "auto" },
]

const STEPS = [
  ["1 · Acquire", "API pulls land via this panel (auto-foldered or local download). Bulk archives and File A/B/C come from the Download Center GUI — drop them into the matching sourcedata/USAspending/ folder. The coverage scanner tells you exactly what's missing."],
  ["2 · Land (Bronze)", "Raw files stay as landed, git-ignored (GitHub's 100 MB limit). Filename dates = snapshot 'as of'. Nothing is ever edited in place."],
  ["3 · Build (Silver)", "python scripts/usaspending_duck.py build — DuckDB types, dedupes (transaction key), applies deltas (C replaces / D deletes), and writes zstd Parquet partitioned by agency=/fy= (~10× smaller; queries scan only the partition they need)."],
  ["4 · Analyze (Gold)", "python scripts/usaspending_duck.py gold --agency 097 --fy 2026 — aggregates + ML screens (Benford, outliers, strata) → compact analysis_report.json, committed and app-readable."],
  ["5 · Use", "The portal reads gold JSON + live API; ad-hoc SQL anytime: usaspending_duck.py sql \"SELECT ... FROM contracts\"."],
]

const CADENCE = [
  ["Live API (this panel)", "USAspending refreshes nightly (FPDS/FABS feeds); GTAS account data monthly", "automated — on demand or scheduled"],
  ["Full archives (D1/D2)", "regenerated monthly by USAspending (snapshot date in filename)", "manual GUI · ~5 min/month"],
  ["Delta archives", "published monthly — apply after the matching full", "manual download · script applies automatically"],
  ["File A/B/C account data", "agency submissions per monthly reporting period, published ~3 weeks after period close", "manual GUI (Custom Account Data)"],
  ["Coverage scan + API fill", "run after any download; fill pulls all 28 agencies' GTAS views", "automated — one command"],
]

export default function DataOpsRunbook() {
  const C = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <Card title="📋 Data Operations Runbook — coverage, procedure, cadence, database"
          sub="What's held vs missing for all-federal coverage, the end-to-end flow, which actions are manual vs automated, and how the local DuckDB lakehouse works">
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom: open ? 14 : 0 }}>
        <Badge color={C.green}>HELD: 2 product-years</Badge>
        <Badge color={C.orange}>MISSING: 18 product-years (scan of FY2024–26 × all products)</Badge>
        <Badge color={C.cyan}>manifest: catalog/coverage_manifest.json</Badge>
        <button onClick={() => setOpen(o => !o)}
          style={{ marginLeft:"auto", padding:"6px 14px", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer",
                   border:`1px solid ${C.borderAccent}`, background:`${C.blue}14`, color:C.blue }}>
          {open ? "Hide runbook ▴" : "Open runbook ▾"}
        </button>
      </div>

      {open && (
        <>
          {/* coverage matrix */}
          <div style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:"0.05em", margin:"4px 0 8px" }}>① COVERAGE — HELD vs MISSING (all-federal)</div>
          <div style={{ overflowX:"auto", marginBottom:6 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14, minWidth:620 }}>
              <thead><tr style={{ color:C.muted, textAlign:"left" }}>
                {["Product", "Held", "Missing", "Acquisition"].map(h => <th key={h} style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {COVERAGE.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:600 }}>{r.p}</td>
                    <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}` }}>
                      {r.held.length ? r.held.map(h => <Badge key={h} color={C.green}>{h}</Badge>) : <span style={{ color:C.muted }}>—</span>}</td>
                    <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.orange }}>{r.missing.join(" · ")}</td>
                    <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}` }}>
                      <Badge color={r.how === "auto" ? C.green : C.gold}>{r.how === "auto" ? "AUTOMATED" : "manual GUI"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.6, marginBottom:14 }}>
            Re-scan after any download: <code style={{ color:C.cyan }}>python scripts/usaspending_coverage.py scan</code> ·
            auto-fill every API-fillable gap (GTAS views, all 28 agencies): <code style={{ color:C.cyan }}>python scripts/usaspending_coverage.py fill</code>
          </div>

          {/* step-by-step */}
          <div style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:"0.05em", marginBottom:8 }}>② HOW IT WORKS — END TO END</div>
          <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
            {STEPS.map(([t, d]) => (
              <div key={t} style={{ display:"flex", gap:12, padding:"9px 12px", background:C.card, border:`1px solid ${C.border}`, borderRadius:9 }}>
                <span style={{ fontSize:14, fontWeight:800, color:C.blue, whiteSpace:"nowrap", flexShrink:0 }}>{t}</span>
                <span style={{ fontSize:14, color:C.textSub, lineHeight:1.6 }}>{d}</span>
              </div>
            ))}
          </div>

          {/* cadence */}
          <div style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:"0.05em", marginBottom:8 }}>③ REFRESH CADENCE — AUTOMATED-FIRST</div>
          <div style={{ overflowX:"auto", marginBottom:8 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14, minWidth:620 }}>
              <thead><tr style={{ color:C.muted, textAlign:"left" }}>
                {["Source", "Upstream refresh", "Your action"].map(h => <th key={h} style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {CADENCE.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => <td key={j} style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color: j === 0 ? C.text : C.textSub, fontWeight: j === 0 ? 600 : 400, lineHeight:1.5 }}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:`${C.green}0d`, border:`1px solid ${C.green}44`, borderRadius:9, padding:"10px 13px", marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.green, marginBottom:4 }}>⚙ ONE-LINE MONTHLY AUTOMATION (Windows Task Scheduler — runs the 15th)</div>
            <code style={{ fontSize:12.5, color:C.textSub, lineHeight:1.6, display:"block", overflowX:"auto", whiteSpace:"pre" }}>
{`schtasks /Create /SC MONTHLY /D 15 /TN USAspendingRefresh /TR "cmd /c cd C:\\Users\\Peter-HP\\git\\anyfeddemo && python scripts\\usaspending_coverage.py fill && python scripts\\usaspending_duck.py build && python scripts\\usaspending_duck.py gold --agency 097 --fy 2026"`}</code>
            <div style={{ fontSize:13, color:C.muted, marginTop:5 }}>Only the bulk-archive GUI downloads remain manual (~10 min/month) — no stable public bulk URL exists to script them reliably.</div>
          </div>

          {/* DB internals */}
          <div style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:"0.05em", marginBottom:8 }}>④ HOW THE DATABASE WORKS (DuckDB local lakehouse)</div>
          <div style={{ fontSize:14, color:C.textSub, lineHeight:1.75, background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"11px 14px" }}>
            <b style={{ color:C.text }}>Engine:</b> DuckDB — free, embedded (a single file, no server), columnar and vectorized, built for exactly this OLAP workload; spills to disk for larger-than-memory queries.
            <b style={{ color:C.text }}> Storage:</b> Parquet with zstd (~10× smaller than CSV), <b style={{ color:C.text }}>hive-partitioned</b> as <code>agency=&lt;code&gt;/fy=&lt;year&gt;</code> — a DoD-FY2026 query opens only DoD-FY2026 files (partition pruning), which is why all-federal scale stays laptop-fast.
            <b style={{ color:C.text }}> Writes:</b> rebuilds are idempotent (dedupe by transaction key + QUALIFY latest); deltas merge as replace/delete, never append-blind.
            <b style={{ color:C.text }}> Reads:</b> the portal consumes small gold JSON; analysts query silver directly with SQL. Raw CSVs become archival once silver exists — Parquet is the working copy.
          </div>
        </>
      )}
    </Card>
  )
}
