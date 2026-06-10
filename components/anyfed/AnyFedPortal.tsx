"use client"
// components/anyfed/AnyFedPortal.tsx — shell: agency selector, nav, theming, mobile
import { useState } from "react"
import { ThemeContext, DARK, LIGHT, useIsMobile } from "./ui"
import { AGENCIES, DEFAULT_AGENCY_ID, getAgency } from "@/lib/agencies"
import Overview from "./Overview"
import DataIntelligence from "./DataIntelligence"
import DataExplorer from "./DataExplorer"
import BudgetLifecycle from "./BudgetLifecycle"
import Accounting from "./Accounting"
import AuditCenter from "./AuditCenter"
import FinOps from "./FinOps"
import InternalControls from "./InternalControls"
import Acquisition from "./Acquisition"
import MLWorkbench from "./MLWorkbench"
import AIAnalyst from "./AIAnalyst"

const NAV = [
  { id:"overview",  label:"Executive Overview", icon:"🏛️" },
  { id:"intel",     label:"Data Intelligence",  icon:"🧠" },
  { id:"data",      label:"Data Explorer",      icon:"🗂️" },
  { id:"budget",    label:"Budget Lifecycle",   icon:"📊" },
  { id:"accounting",label:"Accounting",         icon:"📒" },
  { id:"audit",     label:"Audit",              icon:"🔍" },
  { id:"finops",    label:"Finance Operations", icon:"💳" },
  { id:"controls",  label:"Internal Controls",  icon:"🛡️" },
  { id:"acquisition",label:"Contracts & Acquisition", icon:"📄" },
  { id:"ml",        label:"AI / ML Workbench",  icon:"🤖" },
  { id:"analyst",   label:"AI FM Analyst",      icon:"💬" },
] as const
type NavId = typeof NAV[number]["id"]

export default function AnyFedPortal() {
  const [dark, setDark] = useState(true)
  const [agencyId, setAgencyId] = useState(DEFAULT_AGENCY_ID)
  const [page, setPage] = useState<NavId>("overview")
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  const C = dark ? DARK : LIGHT
  const agency = getAgency(agencyId)

  const content = (
    <>
      {page === "overview"    && <Overview agency={agency} onNavigate={p => setPage(p as NavId)} />}
      {page === "intel"       && <DataIntelligence agency={agency} />}
      {page === "data"        && <DataExplorer agency={agency} />}
      {page === "budget"      && <BudgetLifecycle agency={agency} />}
      {page === "accounting"  && <Accounting agency={agency} />}
      {page === "audit"       && <AuditCenter agency={agency} onNavigate={p => setPage(p as NavId)} />}
      {page === "finops"      && <FinOps agency={agency} />}
      {page === "controls"    && <InternalControls agency={agency} />}
      {page === "acquisition" && <Acquisition agency={agency} />}
      {page === "ml"          && <MLWorkbench agency={agency} />}
      {page === "analyst"     && <AIAnalyst agency={agency} />}
    </>
  )

  const agencySelect = (
    <select value={agencyId}
      onChange={e => { setAgencyId(e.target.value); setMenuOpen(false) }}
      style={{ width:"100%", background:C.card, color:C.text, border:`1px solid ${C.borderAccent}`,
               borderRadius:10, padding:"9px 11px", fontSize:13.5, fontWeight:600, cursor:"pointer" }}>
      <optgroup label="📁 Folder data loaded (default source)">
        {AGENCIES.filter(a => a.hasLocalData).map(a => (
          <option key={a.id} value={a.id}>{a.seal} {a.name}</option>
        ))}
      </optgroup>
      <optgroup label="🌐 Live USAspending fallback">
        {AGENCIES.filter(a => !a.hasLocalData).map(a => (
          <option key={a.id} value={a.id}>{a.seal} {a.name}</option>
        ))}
      </optgroup>
    </select>
  )

  const navButtons = NAV.map(n => (
    <button key={n.id} onClick={() => { setPage(n.id); setMenuOpen(false) }}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%", textAlign:"left",
               padding:"9px 13px", borderRadius:10, fontSize:13.5, cursor:"pointer",
               fontWeight: page === n.id ? 700 : 500,
               border:`1px solid ${page === n.id ? C.borderAccent : "transparent"}`,
               background: page === n.id ? `${C.blue}1f` : "transparent",
               color: page === n.id ? C.blue : C.textSub }}>
      <span>{n.icon}</span>{n.label}
    </button>
  ))

  const brand = (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg, ${C.blue}, ${C.indigo})`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:900, fontSize:13.5, color:"#fff", letterSpacing:"-0.5px" }}>AF</div>
      <div>
        <div style={{ fontSize:15.5, fontWeight:800, color:C.text, letterSpacing:"0.02em" }}>ANY FED</div>
        <div style={{ fontSize:10.5, color:C.muted, letterSpacing:"0.12em" }}>FEDERAL FM PORTAL</div>
      </div>
    </div>
  )

  return (
    <ThemeContext.Provider value={C}>
      <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"var(--font-sans)" }}>
        {/* top bar (mobile) */}
        {isMobile && (
          <div style={{ position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center",
                        justifyContent:"space-between", padding:"12px 16px", background:C.sidebar,
                        borderBottom:`1px solid ${C.border}` }}>
            {brand}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setDark(d => !d)} style={iconBtn(C)}>{dark ? "☀️" : "🌙"}</button>
              <button onClick={() => setMenuOpen(o => !o)} style={iconBtn(C)}>{menuOpen ? "✕" : "☰"}</button>
            </div>
          </div>
        )}
        {isMobile && menuOpen && (
          <div style={{ position:"fixed", inset:0, top:58, zIndex:49, background:C.sidebar, padding:16, overflowY:"auto" }}>
            <div style={{ marginBottom:14 }}>{agencySelect}</div>
            {navButtons}
            <div style={{ marginTop:14, fontSize:12, color:C.muted }}>
              Legacy SEC portal: <a href="/sec-cfo" style={{ color:C.blue }}>/sec-cfo</a>
            </div>
          </div>
        )}

        <div style={{ display:"flex" }}>
          {/* sidebar (desktop) */}
          {!isMobile && (
            <aside style={{ width:264, flexShrink:0, minHeight:"100vh", background:C.sidebar,
                            borderRight:`1px solid ${C.border}`, padding:"20px 14px",
                            position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
              <div style={{ marginBottom:20, paddingLeft:4 }}>{brand}</div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:C.muted, letterSpacing:"0.1em", marginBottom:6, paddingLeft:4 }}>
                  DEPARTMENT / AGENCY
                </div>
                {agencySelect}
              </div>
              <nav style={{ display:"flex", flexDirection:"column", gap:2 }}>{navButtons}</nav>
              <div style={{ marginTop:18, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                <button onClick={() => setDark(d => !d)}
                  style={{ ...iconBtn(C), width:"100%", fontSize:12.5 }}>
                  {dark ? "☀️ Light mode" : "🌙 Dark mode"}
                </button>
                <div style={{ marginTop:12, fontSize:11.5, color:C.muted, lineHeight:1.7, paddingLeft:4 }}>
                  Data: sourcedata/ (default) · USAspending API (live) · DuckDB lakehouse (bulk)<br />
                  Legacy SEC portal: <a href="/sec-cfo" style={{ color:C.blue }}>/sec-cfo</a>
                </div>
              </div>
            </aside>
          )}

          {/* main */}
          <main style={{ flex:1, padding: isMobile ? "18px 14px 60px" : "26px 30px 60px", minWidth:0 }}>
            {!isMobile && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontSize:16, color:C.muted }}>
                  {agency.seal} <b style={{ color:C.text }}>{agency.name}</b>
                  &nbsp;· {agency.cfoAct ? "CFO Act agency" : "Non-CFO Act"} · {agency.funding}
                  {agency.hasLocalData ? " · 📁 folder data" : " · 🌐 live data"}
                </div>
                <div style={{ fontSize:15, color:C.muted }}>
                  AI chain: Gemini → Claude → Groq · models run locally on selected data
                </div>
              </div>
            )}
            {content}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  )
}

const iconBtn = (C: typeof DARK): React.CSSProperties => ({
  padding:"8px 12px", borderRadius:8, cursor:"pointer", fontSize:19,
  border:`1px solid ${C.border}`, background:C.card, color:C.text,
})
