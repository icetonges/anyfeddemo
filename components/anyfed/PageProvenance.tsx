"use client"
// components/anyfed/PageProvenance.tsx — per-page data lineage footer: exactly
// which folders, files, and live endpoints feed the page you are looking at.
import { useTheme, Badge } from "./ui"

type Src = { icon: string; label: string; detail: string }
const P = (icon: string, label: string, detail: string): Src => ({ icon, label, detail })

const JBOOKS = P("📁", "sourcedata/Department of Defense/dod_1/", "FY2026 + FY2027 J-book xlsx (m1 o1 p1 r1 rf1 c1) → lib/data/dod_budget.json")
const AWARDS = P("📁", "sourcedata/Department of Defense/USASPENDING/", "contract + assistance prime-transaction CSVs → lib/data/dod_awards.json")
const LIVE   = P("🌐", "api.usaspending.gov (live)", "budgetary_resources · federal_account · object_class · budget_function · sub_agency")
const AUDIT  = P("📁", "sourcedata/Department of Defense/audit/", "FY2025 AFR + DODIG-2026-032 PDFs → lib/fm-content + lib/audit-solutions")
const SECCBJ = P("📁", "sourcedata/Security Exchange Commission/", "FY2027 CBJ → lib/sec-data")
const LAKE   = P("🦆", "sourcedata/USAspending/", "bulk archives + DuckDB warehouse + processed gold reports")

const MAP: Record<string, Src[]> = {
  overview:    [JBOOKS, AWARDS, AUDIT, LIVE, SECCBJ],
  intel:       [LIVE, JBOOKS],
  data:        [JBOOKS, LIVE, LAKE],
  budget:      [JBOOKS, AWARDS, LIVE, SECCBJ],
  accounting:  [P("📚", "lib/fm-content.ts", "USSGL sample accounts, posting doctrine"), LIVE, P("🏛️", "sourcedata/FiscalData/", "audited Financial Report statements (SNC by agency, Balance Sheet) via api.fiscaldata.treasury.gov")],
  audit:       [AUDIT, AWARDS, JBOOKS],
  finops:      [P("📚", "lib/fm-content.ts", "DTS/GTC/GPC program reference"), LIVE],
  controls:    [P("📚", "lib/fm-content.ts", "A-123 control catalog"), AUDIT],
  acquisition: [AWARDS, LIVE],
  ml:          [AWARDS, JBOOKS, SECCBJ, LIVE],
  analyst:     [JBOOKS, AWARDS, AUDIT, P("🤖", "AI chain", "Gemini → Groq → Claude (server-side keys)")],
  about:       [P("📖", "this repository", "the job aid documents the codebase, scripts, and data flows themselves")],
}

export default function PageProvenance({ page }: { page: string }) {
  const C = useTheme()
  const srcs = MAP[page]
  if (!srcs) return null
  return (
    <div style={{ marginTop:22, padding:"11px 14px", background:C.sidebar, border:`1px solid ${C.border}`, borderRadius:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:7 }}>
        <Badge color={C.purple}>DATA PROVENANCE</Badge>
        <span style={{ fontSize:13, color:C.muted }}>files, folders & endpoints feeding this page</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {srcs.map((s, i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"baseline", fontSize:13, flexWrap:"wrap" }}>
            <span>{s.icon}</span>
            <code style={{ color:C.cyan, fontSize:12.5 }}>{s.label}</code>
            <span style={{ color:C.muted, lineHeight:1.5 }}>{s.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
