"use client"
// components/anyfed/PageProvenance.tsx — per-page, PER-AGENCY data lineage
// footer: exactly which folders, files, and live endpoints feed the page for
// the agency you have selected. DoD folder sources only appear for DoD; SEC's
// CBJ only for SEC; live-fallback agencies show their live + acquired sources.
import { useTheme, Badge } from "./ui"
import type { Agency } from "@/lib/agencies"

type Src = { icon: string; label: string; detail: string }
const P = (icon: string, label: string, detail: string): Src => ({ icon, label, detail })

/* ── DoD-only folder sources ── */
const JBOOKS = P("📁", "sourcedata/Department of Defense/dod_1/", "FY2026 + FY2027 J-book xlsx (m1 o1 p1 r1 rf1 c1) → lib/data/dod_budget.json")
const AWARDS = P("📁", "sourcedata/Department of Defense/USASPENDING/", "contract + assistance prime-transaction CSVs → lib/data/dod_awards.json")
const AUDIT  = P("📁", "sourcedata/Department of Defense/audit/", "FY2025 AFR + DODIG-2026-032 PDFs → lib/fm-content + lib/audit-solutions")
const LAKE   = P("🦆", "sourcedata/USAspending/", "bulk archives + DuckDB warehouse + processed gold reports (DoD extract built; other agencies via duck build)")
/* ── SEC-only ── */
const SECCBJ = P("📁", "sourcedata/Security Exchange Commission/", "FY2027 CBJ → lib/sec-data")
/* ── every agency ── */
const LIVE   = P("🌐", "api.usaspending.gov (live)", "budgetary_resources · federal_account · object_class · budget_function · sub_agency")
const FISCAL = P("🏛️", "sourcedata/FiscalData/ + api.fiscaldata.treasury.gov", "audited FR Statements of Net Cost by agency · MTS Table 5 monthly outlays · gov-wide balance sheets")
const KB     = P("🧠", "lib/analyst-context.ts", "agency-specific knowledge base → system prompt (switches with the selector)")
const CHAIN  = P("🤖", "AI chain", "Gemini → Groq → Claude · compare + judge modes (server-side keys)")
const FMREF  = (what: string) => P("📚", "lib/fm-content.ts", what)
const AFR    = (a: Agency) => P("📄", `sourcedata/AFR/${a.id}/`, `${a.abbrev} complete audited AFR/PAR PDFs (harvested by scripts/afr_harvester.py — where available)`)
const ACQ    = (a: Agency) => P("⬇️", "sourcedata/<dept>/USASPENDING/auto/", `live ${a.abbrev} pulls saved by the Acquire panel (Data Explorer), foldered by FY`)
const DOCLIB = P("📑", "/api/documents", "sourcedata library scan — AFR PDFs, Fiscal Data statements, archives, gold reports")

/** agency's default folder sources (empty = live-fallback agency) */
function folder(a: Agency): Src[] {
  if (a.id === "DOD") return [JBOOKS, AWARDS, AUDIT]
  if (a.id === "SEC") return [SECCBJ]
  return []
}

function srcsFor(page: string, a: Agency): Src[] | null {
  const F = folder(a)
  const dod = a.id === "DOD"
  switch (page) {
    case "overview":    return [...F, LIVE, FISCAL]
    case "intel":       return [LIVE, ...(dod ? [JBOOKS] : []), ...(a.id === "SEC" ? [SECCBJ] : [])]
    case "data":        return [...F, LIVE, LAKE, ACQ(a)]
    case "budget":      return [...F, LIVE, ...(dod ? [] : [ACQ(a)])]
    case "accounting":  return [FMREF("USSGL sample accounts, posting doctrine"), LIVE, FISCAL, AFR(a)]
    case "audit":       return dod ? [AUDIT, AWARDS, JBOOKS] : [AFR(a), LIVE, FMREF("A-123 / FIAR audit framework reference")]
    case "finops":      return [FMREF("DTS/GTC/GPC program reference"), LIVE]
    case "controls":    return [FMREF("A-123 control catalog"), ...(dod ? [AUDIT] : [AFR(a)])]
    case "acquisition": return [...(dod ? [AWARDS] : []), LIVE, ACQ(a)]
    case "ml":          return [...F, LIVE]
    case "analyst":     return [KB, ...F, FISCAL, CHAIN]
    case "docs":        return [DOCLIB, AFR(a), FISCAL, LAKE, CHAIN]
    case "brief":       return [
      P("🛢", "Neon DB · sec_news", "agency-tagged, impact-scored FM intelligence items"),
      P("⚙️", ".github/workflows/intelligence-update.yml", "daily ~6 AM ET: GAO · CBO · OMB/EOP · per-agency Federal Register · GovExec · FedScoop → Gemini scoring → DB"),
      CHAIN]
    case "kb":          return [
      P("🛢", "Neon DB · kb_items", "every AI output saved + Gemini text-embedding-004 vectors · hash-deduped"),
      P("🧬", "/api/knowledge", "save · semantic search · looping agent (digest written back each cycle)"),
      P("⚙️", ".github/workflows/intelligence-update.yml", "agent runs daily after the news fetch"),
      CHAIN]
    case "about":       return [P("📖", "this repository", "the job aid documents the codebase, scripts, and data flows themselves")]
    default:            return null
  }
}

export default function PageProvenance({ page, agency }: { page: string; agency: Agency }) {
  const C = useTheme()
  const srcs = srcsFor(page, agency)
  if (!srcs) return null
  return (
    <div style={{ marginTop:22, padding:"11px 14px", background:C.sidebar, border:`1px solid ${C.border}`, borderRadius:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:7 }}>
        <Badge color={C.purple}>DATA PROVENANCE</Badge>
        <Badge color={agency.hasLocalData ? C.green : C.cyan}>
          {agency.abbrev} · {agency.hasLocalData ? "📁 folder data default" : "🌐 live USAspending fallback"}</Badge>
        <span style={{ fontSize:13, color:C.muted }}>files, folders & endpoints feeding this page for {agency.abbrev}</span>
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
      {!agency.hasLocalData && (
        <div style={{ fontSize:12.5, color:C.muted, marginTop:7 }}>
          {agency.abbrev} has no sourcedata/ folder yet — pages render from live pulls. Use ⬇️ Acquire (Data Explorer) to
          save {agency.abbrev} datasets locally, and scripts/afr_harvester.py for its audited AFR PDFs.
        </div>
      )}
    </div>
  )
}
