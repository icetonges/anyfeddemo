"use client"
// components/anyfed/DataExplorer.tsx — deep, interactive federal budget data layer.
// • Drag data-source cards onto the Analysis Canvas to load them and unlock actions
// • Vintage/lifecycle: request → enacted → actual with execution variance
// • 5-level drill-down (org → account → budget activity → sub-activity → line item)
// • Mouse-follow AI agent: hover any figure/row/bar for live, contextual analysis
// • Pivot + compare, deterministic AI analysis (optional LLM), and a cleaning agent
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useTheme, Card, Row, SectionTitle, Badge, KPI, Spinner, Tip, fmtMoney } from "./ui"
import { useAgencyData, DodBudget, BudgetExhibit, BudgetRecord } from "./useAgencyData"
import type { Agency } from "@/lib/agencies"
import {
  FYS, FY, PHASE_META, profileExhibit, pivot, movers, qualityReport, usageAdvice, compactForLLM,
  lifecycleFindings, drillChildren, hoverInsight, HoverCtx,
} from "@/lib/data-insights"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"

const PALETTE = ["#0ea5e9","#10b981","#f59e0b","#a78bfa","#f97316","#22d3ee","#ef4444","#6366f1"]
const DIM_LABEL: Record<string,string> = {
  org:"Organization", account:"Appropriation Account", budgetActivity:"Budget Activity",
  bsa:"Budget Sub-Activity", bli:"Line Item / Program Element",
  stateCountry:"State / Country", project:"Construction Project",
}
const PHASE_COLOR = (p?: string, C?: ReturnType<typeof useTheme>) =>
  !C ? "#888" : p==="actuals"?C.green : p==="enacted"?C.gold : p==="request"?C.blue : C.muted

// ── mouse-follow agent context ───────────────────────────────────────────────
const AgentCtx = createContext<(c: HoverCtx | null) => void>(() => {})
const useAgent = () => useContext(AgentCtx)
/** spread onto any element to make it explain itself when hovered */
function insightProps(setAgent: (c: HoverCtx | null) => void, ctx: HoverCtx) {
  return {
    onMouseEnter: () => setAgent(ctx),
    onMouseMove:  () => setAgent(ctx),
    onMouseLeave: () => setAgent(null),
  }
}

// ════════════════════════════════════════════════════════════════ main shell
export default function DataExplorer({ agency }: { agency: Agency }) {
  const C = useTheme()
  const { data, loading, error } = useAgencyData<DodBudget>("DOD", "budget")
  const [active, setActive] = useState<string[]>(["p1"])
  const [tab, setTab] = useState("Lifecycle & Vintage")
  const [agentCtx, setAgentCtx] = useState<HoverCtx | null>(null)
  const pos = useRef({ x: 0, y: 0 })
  const [, force] = useState(0)

  useEffect(() => {
    let raf = 0
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; force(n => n + 1) })
    }
    window.addEventListener("mousemove", onMove)
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf) }
  }, [])

  if (agency.id !== "DOD") return <AvailabilityView agency={agency} />
  if (loading) return <Spinner label="Loading enriched DoD exhibit data (both PB vintages) from sourcedata/…" />
  if (error || !data) return <Card title="Data error"><span style={{ color:C.red, fontSize:13 }}>{error}</span></Card>

  const exKeys = Object.keys(data.exhibits)
  const primary = active[0] ?? exKeys[0]
  const ex = data.exhibits[primary] ?? data.exhibits[exKeys[0]]
  const TABS = ["Lifecycle & Vintage","Deep Drill-down","Pivot & Compare","AI Analysis","Data Prep"]

  return (
    <AgentCtx.Provider value={setAgentCtx}>
      <SectionTitle title="Data Explorer"
        sub="Drag a data source onto the canvas, then drill, pivot, compare vintages, and let the agents analyze — every number is computed live from sourcedata/" />

      {/* palette + canvas */}
      <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"stretch", marginBottom:16 }}>
        <SourcePalette data={data} active={active} />
        <AnalysisCanvas data={data} active={active} setActive={setActive} setTab={setTab} tab={tab} tabs={TABS} />
      </div>

      {active.length > 0 && (
        <>
          {tab === "Lifecycle & Vintage" && <LifecycleTab data={data} ex={ex} exKey={primary} />}
          {tab === "Deep Drill-down"     && <DrillTab ex={ex} exKey={primary} />}
          {tab === "Pivot & Compare"     && <PivotTab ex={ex} exKey={primary} />}
          {tab === "AI Analysis"         && <AnalysisTab data={data} ex={ex} exKey={primary} agency={agency} />}
          {tab === "Data Prep"           && <PrepTab ex={ex} exKey={primary} />}
        </>
      )}

      <HoverAgent ctx={agentCtx} x={pos.current.x} y={pos.current.y} />
    </AgentCtx.Provider>
  )
}

// ── the mouse-follow AI agent overlay ────────────────────────────────────────
function HoverAgent({ ctx, x, y }: { ctx: HoverCtx | null; x: number; y: number }) {
  const C = useTheme()
  const info = hoverInsight(ctx ?? {})
  const active = !!ctx
  // position: offset from cursor, flip if near right/bottom edge
  const W = 290, H = 150
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200
  const vh = typeof window !== "undefined" ? window.innerHeight : 800
  const left = Math.min(x + 18, vw - W - 12)
  const top  = Math.min(y + 18, vh - H - 12)
  return (
    <div style={{ position:"fixed", left, top, width:W, zIndex:9999, pointerEvents:"none",
                  opacity: active ? 1 : 0, transform:`translateY(${active?0:6}px)`, transition:"opacity .12s, transform .12s" }}>
      <div style={{ background:C.surface, border:`1px solid ${C.borderAccent}`, borderRadius:12,
                    padding:"11px 13px", boxShadow:"0 10px 30px rgba(0,0,0,0.45)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ width:22, height:22, borderRadius:7, background:`linear-gradient(135deg,${C.blue},${C.indigo})`,
                         display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🤖</span>
          <span style={{ fontSize:11.5, fontWeight:700, color:C.text }}>{info.title}</span>
        </div>
        {info.lines.map((l, i) => (
          <div key={i} style={{ fontSize:11.5, color: i===0?C.cyan:C.textSub, lineHeight:1.5,
                                fontFamily: i===0?"var(--font-mono)":"inherit", marginBottom:3 }}>{l}</div>
        ))}
      </div>
    </div>
  )
}

// ── draggable data-source palette ────────────────────────────────────────────
function SourcePalette({ data, active }: { data: DodBudget; active: string[] }) {
  const C = useTheme()
  const setAgent = useAgent()
  const exKeys = Object.keys(data.exhibits)
  return (
    <div style={{ width:230, flexShrink:0, background:C.sidebar, border:`1px solid ${C.border}`,
                  borderRadius:12, padding:"14px 12px" }}>
      <div style={{ fontSize:11, color:C.muted, letterSpacing:"0.1em", marginBottom:4 }}>DATA SOURCES</div>
      <div style={{ fontSize:10.5, color:C.muted, marginBottom:10 }}>drag a card → canvas</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {exKeys.map(k => {
          const e = data.exhibits[k]; const on = active.includes(k)
          const recs = e.records?.length ?? 0
          return (
            <div key={k} draggable
              onDragStart={ev => ev.dataTransfer.setData("text/plain", k)}
              {...insightProps(setAgent, { exhibitTitle: e.title,
                note: `${e.appn} · ${recs} line groups · ${(e.hierarchy?.length ?? 0)} drill levels · vintages ${Object.keys(e.vintages ?? {}).join(" + ")}. Drag onto the canvas to analyze.` })}
              style={{ cursor:"grab", userSelect:"none", background: on?`${C.blue}1c`:C.card,
                       border:`1px solid ${on?C.borderAccent:C.border}`, borderRadius:10, padding:"9px 11px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:on?C.blue:C.text }}>⠿ {e.appn}</span>
                <Badge color={e.isMilcon?C.orange:C.purple}>{k.toUpperCase()}</Badge>
              </div>
              <div style={{ fontSize:10.5, color:C.muted, marginTop:3 }}>{recs} groups · {(e.hierarchy?.length ?? 0)}-level drill</div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}`, fontSize:10.5, color:C.muted, lineHeight:1.6 }}>
        Sources parsed from <b style={{ color:C.textSub }}>PB2026 + PB2027</b> J-books in <code>sourcedata/</code>.
      </div>
    </div>
  )
}

// ── analysis canvas (drop zone) ──────────────────────────────────────────────
function AnalysisCanvas({ data, active, setActive, setTab, tab, tabs }:
  { data: DodBudget; active: string[]; setActive: (a:string[])=>void; setTab:(t:string)=>void; tab:string; tabs:string[] }) {
  const C = useTheme()
  const [over, setOver] = useState(false)
  const drop = (ev: React.DragEvent) => {
    ev.preventDefault(); setOver(false)
    const k = ev.dataTransfer.getData("text/plain")
    if (k && data.exhibits[k] && !active.includes(k)) setActive([...active, k])
  }
  return (
    <div style={{ flex:1, minWidth:320, display:"flex", flexDirection:"column", gap:10 }}>
      <div onDragOver={e=>{e.preventDefault(); setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={drop}
        style={{ border:`2px dashed ${over?C.blue:C.border}`, borderRadius:12, padding:"14px 16px",
                 background: over?`${C.blue}10`:C.surface, transition:"all .12s", minHeight:74 }}>
        {active.length === 0 ? (
          <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"14px 0" }}>
            ⤵ Drag a data source here to load it and unlock analysis
          </div>
        ) : (
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>ACTIVE DATASETS · first is primary</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {active.map((k,i) => {
                const e = data.exhibits[k]
                return (
                  <div key={k} onClick={()=> setActive([k, ...active.filter(x=>x!==k)]) }
                    style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer",
                             background:i===0?`${C.blue}22`:C.card, border:`1px solid ${i===0?C.borderAccent:C.border}`,
                             borderRadius:9, padding:"6px 10px" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:i===0?C.blue:C.text }}>{e.appn}</span>
                    {i===0 && <span style={{ fontSize:9.5, color:C.muted }}>PRIMARY</span>}
                    <span onClick={(ev)=>{ev.stopPropagation(); setActive(active.filter(x=>x!==k))}}
                      style={{ color:C.muted, fontSize:13, marginLeft:2 }}>✕</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {active.length > 0 && (
        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
          {tabs.map(t => (
            <button key={t} onClick={()=>setTab(t)}
              style={{ padding:"7px 13px", borderRadius:8, fontSize:12.5, fontWeight:tab===t?700:500, cursor:"pointer",
                       border:`1px solid ${tab===t?C.borderAccent:C.border}`, background:tab===t?`${C.blue}1f`:C.card,
                       color:tab===t?C.blue:C.muted }}>{t}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════ Lifecycle & Vintage tab
function LifecycleTab({ data, ex, exKey }: { data: DodBudget; ex: BudgetExhibit; exKey: string }) {
  const C = useTheme()
  const setAgent = useAgent()
  const findings = useMemo(() => lifecycleFindings(ex), [ex])
  const lc = ex.lifecycle ?? {}
  // chart: per FY, request/enacted/actual ($B)
  const chart = FYS.map(fy => {
    const y = lc[fy] ?? {}
    return { fy: fy.replace("FY20","FY"),
      Request: y.request!=null ? y.request/1e6 : null,
      Enacted: y.enacted!=null ? y.enacted/1e6 : null,
      Actual:  y.actuals!=null ? y.actuals/1e6 : null }
  })
  const f25 = lc.FY2025 ?? {}; const f26 = lc.FY2026 ?? {}

  return (
    <div>
      <Card title="Budget lifecycle — request → enacted → actual"
            sub={`${ex.title}: the same fiscal year carries different values across PB vintages. ${ex.isMilcon?"⚠ MILCON is multi-year — prior columns are program, not execution.":"This is how you separate plan from execution."}`}>
        <Row>
          <div {...insightProps(setAgent, { exhibitTitle:ex.title, fy:"FY2025", lifecycle:f25, note:"FY2025 was ENACTED in PB2026 and shows ACTUAL execution in PB2027." })} style={{ flex:1, minWidth:170 }}>
            <KPI icon="⚙️" label="FY2025 execution variance" value={f25.execVarPct!=null?`${f25.execVarPct>=0?"+":""}${f25.execVarPct}%`:"—"}
                 accent={Math.abs(f25.execVarPct??0)>4?C.orange:C.green}
                 sub={f25.enacted!=null&&f25.actuals!=null?`${fmtMoney(f25.enacted,"K")} → ${fmtMoney(f25.actuals,"K")}`:"actual vs enacted"} />
          </div>
          <div {...insightProps(setAgent, { exhibitTitle:ex.title, fy:"FY2026", lifecycle:f26, note:"FY2026 was the REQUEST in PB2026 and the ENACTED level in PB2027." })} style={{ flex:1, minWidth:170 }}>
            <KPI icon="🏛️" label="FY2026 congressional action" value={f26.reqToEnactedPct!=null?`${f26.reqToEnactedPct>=0?"+":""}${f26.reqToEnactedPct}%`:"—"}
                 accent={Math.abs(f26.reqToEnactedPct??0)>4?C.gold:C.cyan}
                 sub={f26.request!=null&&f26.enacted!=null?`${fmtMoney(f26.request,"K")} → ${fmtMoney(f26.enacted,"K")}`:"enacted vs request"} />
          </div>
          <div {...insightProps(setAgent, { exhibitTitle:ex.title, fy:"FY2027", phase:"request", note:"FY2027 is a request only — no enacted/actual exists yet." })} style={{ flex:1, minWidth:170 }}>
            <KPI icon="📨" label="FY2027 request" value={ex.years.FY2027!=null?fmtMoney(ex.years.FY2027,"K"):"—"} accent={C.blue} sub="President's Budget proposal" />
          </div>
        </Row>
        <div style={{ height:14 }} />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chart}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="fy" stroke={C.muted} fontSize={12} />
            <YAxis stroke={C.muted} fontSize={11} tickFormatter={(v:number)=>`$${v.toFixed(0)}B`} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            <Bar dataKey="Request" fill={C.blue} />
            <Bar dataKey="Enacted" fill={C.gold} />
            <Bar dataKey="Actual"  fill={C.green} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ height:14 }} />
      <Row>
        <Card title="Vintage matrix" sub="What each PB book reported for each fiscal year ($K)" style={{ flex:1.2, minWidth:360 }}>
          <VintageMatrix data={data} ex={ex} />
        </Card>
        <Card title="Lifecycle findings" sub="Auto-generated from the variance between vintages" style={{ flex:1, minWidth:320 }}>
          {findings.length===0 ? <div style={{ fontSize:12.5, color:C.muted }}>No multi-vintage overlap for this exhibit.</div> :
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {findings.map((f,i) => (
                <div key={i} {...insightProps(setAgent, { exhibitTitle:ex.title, fy:f.fy, note:f.text })}
                  style={{ padding:"9px 11px", background:C.card, border:`1px solid ${C.border}`, borderRadius:9 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                    <Badge color={f.kind==="execution"?C.green:C.gold}>{f.fy} · {f.kind}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:C.textSub, lineHeight:1.5 }}>{f.text}</div>
                </div>
              ))}
            </div>}
        </Card>
      </Row>
    </div>
  )
}

function VintageMatrix({ data, ex }: { data: DodBudget; ex: BudgetExhibit }) {
  const C = useTheme()
  const setAgent = useAgent()
  const vints = Object.keys(ex.vintages ?? {})
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:440 }}>
        <thead><tr style={{ color:C.muted, textAlign:"left" }}>
          <th style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>Fiscal Year</th>
          {vints.map(v => <th key={v} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{v}<div style={{ fontSize:9.5, color:C.muted, fontWeight:400 }}>{data.books?.[v]?.label}</div></th>)}
          <th style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right" }}>Δ</th>
        </tr></thead>
        <tbody>
          {FYS.map(fy => {
            const cells = vints.map(v => ex.vintages?.[v]?.[fy])
            const lc = ex.lifecycle?.[fy]
            const delta = lc?.execVarPct ?? lc?.reqToEnactedPct
            if (!cells.some(Boolean)) return null
            return (
              <tr key={fy} {...insightProps(setAgent, { exhibitTitle:ex.title, fy, lifecycle:lc })}>
                <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, fontWeight:700, color:C.text }}>{fy}</td>
                {cells.map((c,i) => (
                  <td key={i} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>
                    {c ? <><div style={{ fontFamily:"var(--font-mono)", color:C.text }}>{fmtMoney(c.total,"K")}</div>
                          <Badge color={PHASE_COLOR(c.phase,C)}>{c.phase}</Badge></> : <span style={{ color:C.muted }}>—</span>}
                  </td>
                ))}
                <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)",
                             color: delta==null?C.muted : delta>=0?C.green:C.red }}>
                  {delta!=null?`${delta>=0?"+":""}${delta}%`:"—"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════ Deep drill-down tab
function DrillTab({ ex, exKey }: { ex: BudgetExhibit; exKey: string }) {
  const C = useTheme()
  const hierarchy = ex.hierarchy ?? []
  const records = ex.records ?? []
  const present = FYS.filter(f => ex.years[f] != null)
  const [fy, setFy] = useState<FY>((present.includes("FY2027")?"FY2027":present[present.length-1]) as FY)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (k: string) => setExpanded(p => { const n = new Set(p); n.has(k)?n.delete(k):n.add(k); return n })
  const rootTotal = useMemo(() => records.reduce((s,r)=>s+(Number(r[fy])||0),0), [records, fy])

  return (
    <div>
      <Card title="Deep drill-down" sub={`Expand ${hierarchy.map(h=>DIM_LABEL[h]??h).join(" → ")} · click any row · hover for live analysis`}>
        <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:11.5, color:C.muted }}>Fiscal year</span>
          <select value={fy} onChange={e=>{setFy(e.target.value as FY); setExpanded(new Set())}}
            style={{ background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", fontSize:12 }}>
            {present.map(f => <option key={f} value={f}>{f} · {PHASE_META[f]?.phase}</option>)}
          </select>
          <Badge color={C.blue}>{records.length} line groups</Badge>
          <Badge color={C.cyan}>{hierarchy.length} levels</Badge>
          <span style={{ marginLeft:"auto", fontSize:12, color:C.muted, fontFamily:"var(--font-mono)" }}>Σ {fmtMoney(rootTotal,"K")}</span>
        </div>
        <div style={{ maxHeight:540, overflowY:"auto", border:`1px solid ${C.border}`, borderRadius:10 }}>
          <DrillLevel records={records} hierarchy={hierarchy} path={[]} fy={fy} depth={0}
                      parentTotal={rootTotal} expanded={expanded} toggle={toggle} exTitle={ex.title} />
        </div>
      </Card>
    </div>
  )
}

function DrillLevel({ records, hierarchy, path, fy, depth, parentTotal, expanded, toggle, exTitle }:
  { records: BudgetRecord[]; hierarchy: string[]; path: string[]; fy: FY; depth: number;
    parentTotal: number; expanded: Set<string>; toggle: (k:string)=>void; exTitle: string }) {
  const C = useTheme()
  const setAgent = useAgent()
  const kids = useMemo(() => drillChildren(records, hierarchy, path, fy), [records, hierarchy, path, fy])
  const max = Math.max(...kids.map(k=>Math.abs(k.value)), 1)
  return (
    <div>
      {kids.slice(0, depth===0?40:25).map(k => {
        const pkey = [...path, k.name].join("›")
        const open = expanded.has(pkey)
        const share = parentTotal ? Math.round((k.value/parentTotal)*1000)/10 : 0
        return (
          <div key={pkey}>
            <div onClick={() => !k.leaf && toggle(pkey)}
              {...insightProps(setAgent, { exhibitTitle:exTitle, fy, dim:DIM_LABEL[hierarchy[depth]]??hierarchy[depth], name:k.name, value:k.value, share })}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", paddingLeft:12+depth*18,
                       cursor:k.leaf?"default":"pointer", borderBottom:`1px solid ${C.border}`,
                       background: depth===0?"transparent":`${C.blue}06` }}>
              <span style={{ width:12, color:C.muted, fontSize:11 }}>{k.leaf?"·":(open?"▾":"▸")}</span>
              <span style={{ flex:1, fontSize:12, color: depth===0?C.text:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{k.name}</span>
              <div style={{ width:90, height:7, background:C.dim, borderRadius:4, overflow:"hidden", flexShrink:0 }}>
                <div style={{ width:`${Math.abs(k.value)/max*100}%`, height:"100%", background:PALETTE[depth%PALETTE.length] }} />
              </div>
              <span style={{ width:78, textAlign:"right", fontFamily:"var(--font-mono)", fontSize:11.5, color:k.value<0?C.red:C.cyan, flexShrink:0 }}>{fmtMoney(k.value,"K")}</span>
              <span style={{ width:46, textAlign:"right", fontSize:11, color:C.muted, flexShrink:0 }}>{share}%</span>
            </div>
            {open && !k.leaf && (
              <DrillLevel records={records} hierarchy={hierarchy} path={[...path, k.name]} fy={fy}
                          depth={depth+1} parentTotal={k.value} expanded={expanded} toggle={toggle} exTitle={exTitle} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════ Pivot & Compare
function PivotTab({ ex, exKey }: { ex: BudgetExhibit; exKey: string }) {
  const C = useTheme()
  const setAgent = useAgent()
  const records = ex.records ?? []
  const fields = (ex.hierarchy ?? []) as (keyof BudgetRecord)[]
  const [dims, setDims] = useState<(keyof BudgetRecord)[]>(fields)
  const [fy, setFy] = useState<FY>("FY2027")
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const present = FYS.filter(f => ex.years[f] != null)
  const activeDims = dims.filter(d => fields.includes(d))
  const dim1 = activeDims[0] ?? fields[0]
  const rows = useMemo(() => pivot(records, dim1, fy), [records, dim1, fy])
  const total = rows.reduce((s,r)=>s+r.value,0)
  const top = rows.slice(0,12).map(r => ({ name: r.name.length>20?r.name.slice(0,18)+"…":r.name, value: r.value/1e3, full:r.name }))

  const reorder = (to:number) => { if(dragIdx===null||dragIdx===to) return
    const n=[...activeDims]; const [m]=n.splice(dragIdx,1); n.splice(to,0,m); setDims(n); setDragIdx(null) }
  const exportCsv = () => {
    const csv = `${DIM_LABEL[String(dim1)]??String(dim1)},${fy} ($K)\n` + rows.map(r=>`"${r.name.replace(/"/g,'""')}",${r.value}`).join("\n")
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}))
    a.download=`${exKey}_${String(dim1)}_${fy}.csv`; a.click()
  }
  return (
    <div>
      <Card title="Pivot configuration" sub="Drag dimension chips to choose the grouping · pick a fiscal year · export to CSV">
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:11.5, color:C.muted }}>Group by →</span>
          {activeDims.map((d,i) => (
            <div key={String(d)} draggable onDragStart={()=>setDragIdx(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>reorder(i)}
              style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"grab", userSelect:"none",
                       border:`1px solid ${i===0?C.borderAccent:C.border}`, background:i===0?`${C.blue}22`:C.card, color:i===0?C.blue:C.textSub }}>
              ⠿ {DIM_LABEL[String(d)]??String(d)}{i===0&&<span style={{ opacity:0.6 }}> (active)</span>}
            </div>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <select value={fy} onChange={e=>setFy(e.target.value as FY)}
              style={{ background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", fontSize:12 }}>
              {present.map(f => <option key={f} value={f}>{f} · {PHASE_META[f]?.phase}</option>)}
            </select>
            <button onClick={exportCsv} style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${C.border}`, background:C.card, color:C.blue }}>⤓ CSV</button>
          </div>
        </div>
      </Card>
      <div style={{ height:14 }} />
      <Row>
        <Card title={`By ${DIM_LABEL[String(dim1)]??String(dim1)} — ${fy}`} sub={`${rows.length} groups · ${fmtMoney(total,"K")} total`} style={{ flex:1.1, minWidth:340 }}>
          <div style={{ overflowX:"auto", maxHeight:420, overflowY:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ color:C.muted, textAlign:"left", position:"sticky", top:0, background:C.surface }}>
                <th style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{DIM_LABEL[String(dim1)]??String(dim1)}</th>
                <th style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right" }}>{fy} ($K)</th>
                <th style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right" }}>Share</th>
              </tr></thead>
              <tbody>
                {rows.map(r => { const sh = total?Math.round((r.value/total)*1000)/10:0
                  return (
                    <tr key={r.name} {...insightProps(setAgent, { exhibitTitle:ex.title, fy, dim:DIM_LABEL[String(dim1)], name:r.name, value:r.value, share:sh })}>
                      <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.text }}>{r.name}</td>
                      <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:r.value<0?C.red:C.cyan }}>{fmtMoney(r.value,"K")}</td>
                      <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", color:C.muted }}>{sh}%</td>
                    </tr>) })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Top groups ($B)" sub={`${fy}`} style={{ flex:1, minWidth:320 }}>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={top} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
              <XAxis type="number" stroke={C.muted} fontSize={10} tickFormatter={(v:number)=>`$${v.toFixed(0)}B`} />
              <YAxis type="category" dataKey="name" stroke={C.muted} fontSize={10} width={130} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value">{top.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Row>
      <div style={{ height:14 }} />
      <CompareBlock ex={ex} />
    </div>
  )
}

function CompareBlock({ ex }: { ex: BudgetExhibit }) {
  const C = useTheme(); const setAgent = useAgent()
  const records = ex.records ?? []
  const present = FYS.filter(f => ex.years[f] != null)
  const [a, setA] = useState<FY>(present[Math.max(0,present.length-2)] as FY)
  const [b, setB] = useState<FY>(present[present.length-1] as FY)
  const mv = useMemo(() => movers(records, a, b, 12), [records, a, b])
  const Sel = ({v,set}:{v:FY;set:(f:FY)=>void}) => (
    <select value={v} onChange={e=>set(e.target.value as FY)} style={{ background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", fontSize:12 }}>
      {present.map(o=><option key={o} value={o}>{o}</option>)}</select>)
  return (
    <Card title="Year-over-year movers" sub="Biggest line-item changes between two fiscal years — what drove the delta">
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
        <Sel v={a} set={setA} /> <span style={{ color:C.muted }}>vs</span> <Sel v={b} set={setB} />
        <span style={{ fontSize:11.5, color:C.muted, marginLeft:8 }}>Δ total <b style={{ color:(ex.years[b]-ex.years[a])>=0?C.green:C.red, fontFamily:"var(--font-mono)" }}>{(ex.years[b]-ex.years[a])>=0?"+":""}{fmtMoney(ex.years[b]-ex.years[a],"K")}</b></span>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:560 }}>
          <thead><tr style={{ color:C.muted, textAlign:"left" }}>{["Line item","Org",a,b,"Δ"].map(h=><th key={h} style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
          <tbody>{mv.map((m,i)=>(
            <tr key={i} {...insightProps(setAgent, { exhibitTitle:ex.title, name:m.label, value:m.delta, note:`${m.org} · ${a} ${fmtMoney(m.from,"K")} → ${b} ${fmtMoney(m.to,"K")}` })}>
              <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.text }}>{m.label}</td>
              <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.muted, fontSize:11 }}>{m.org}</td>
              <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:C.muted }}>{fmtMoney(m.from,"K")}</td>
              <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:C.text }}>{fmtMoney(m.to,"K")}</td>
              <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", fontWeight:700, color:m.delta>=0?C.green:C.red }}>{m.delta>=0?"+":""}{fmtMoney(m.delta,"K")}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════ AI Analysis
function AnalysisTab({ data, ex, exKey, agency }: { data: DodBudget; ex: BudgetExhibit; exKey: string; agency: Agency }) {
  const C = useTheme(); const setAgent = useAgent()
  const prof = useMemo(() => profileExhibit(exKey, ex), [exKey, ex])
  const advice = useMemo(() => usageAdvice(ex), [ex])
  const lcf = useMemo(() => lifecycleFindings(ex), [ex])
  const [llm, setLlm] = useState<{ loading:boolean; text?:string; model?:string; unavailable?:boolean }>({ loading:false })
  const narrate = async () => {
    setLlm({ loading:true })
    try {
      const r = await fetch("/api/data-insight", { method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ agency: agency.id, profile: { ...compactForLLM(data, exKey), lifecycle: ex.lifecycle } }) })
      const j = await r.json()
      if (j.available) setLlm({ loading:false, text:j.text, model:j.modelUsed }); else setLlm({ loading:false, unavailable:true })
    } catch { setLlm({ loading:false, unavailable:true }) }
  }
  return (
    <div>
      <Row>
        <KPI icon="📈" label={`${prof.appn} CAGR`} value={prof.cagr!=null?`${prof.cagr}%`:"—"} accent={C.blue} sub="loaded-year compound growth" />
        <KPI icon="🏛️" label="Top org share" value={prof.topOrgShare?`${prof.topOrgShare.share}%`:"—"} accent={C.cyan} sub={prof.topOrgShare?.org??"—"} />
        <KPI icon="🎯" label="Org HHI" value={prof.hhi!=null?String(prof.hhi):"—"} accent={prof.hhi&&prof.hhi>2500?C.orange:C.green} sub={prof.hhi&&prof.hhi>2500?"concentrated":"diversified"} />
        <KPI icon="🧾" label="Line groups" value={String(prof.recordCount)} accent={C.purple} sub={`${(ex.hierarchy?.length??0)}-level drill`} />
      </Row>
      <div style={{ height:16 }} />
      <Row>
        <Card title="Deterministic findings" sub="Computed live — execution variance, growth, mandatory distortion" style={{ flex:1, minWidth:340 }}>
          <ul style={{ margin:0, paddingLeft:18, fontSize:12.5, color:C.textSub, lineHeight:1.7 }}>
            {lcf.map((f,i)=><li key={"l"+i} style={{ marginBottom:5 }}>{f.text}</li>)}
            {Object.entries(prof.discMandatory).filter(([,v])=>v.mandatory>0).map(([fy,v])=>(
              <li key={fy} style={{ marginBottom:5 }}>{fy}: PL 119-21 mandatory is <b style={{ color:C.orange }}>{v.mandatoryShare}%</b> of authority ({fmtMoney(v.mandatory,"K")}) — strip before trending.</li>))}
          </ul>
        </Card>
        <Card title="Usage advice" sub="How to use each year correctly" style={{ flex:1, minWidth:340 }}>
          <ul style={{ margin:0, paddingLeft:18, fontSize:12.5, color:C.textSub, lineHeight:1.7 }}>
            {advice.map((a,i)=><li key={i} style={{ marginBottom:5 }}>{a}</li>)}
          </ul>
        </Card>
      </Row>
      <div style={{ height:16 }} />
      <Card title="AI narrative briefing" sub="Optional — narrates the deterministic profile via the Gemini→Claude→Groq chain">
        {!llm.text && !llm.unavailable && (
          <button onClick={narrate} disabled={llm.loading} style={{ padding:"9px 16px", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", border:`1px solid ${C.borderAccent}`, background:`${C.blue}26`, color:C.blue }}>
            {llm.loading?"Analyzing…":"🤖 Generate AI briefing"}</button>)}
        {llm.text && (<div><div style={{ fontSize:13, color:C.text, lineHeight:1.75, whiteSpace:"pre-wrap" }}>{llm.text}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:10 }}>Model: {llm.model} · narration of the deterministic profile</div></div>)}
        {llm.unavailable && (<div style={{ fontSize:12.5, color:C.muted, lineHeight:1.7 }}>
          LLM narration is offline (no API keys in this environment). The deterministic findings above need no model — set GOOGLE_AI_API_KEY / ANTHROPIC_API_KEY / GROQ_API_KEY to enable narration.</div>)}
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════ Data Prep
function PrepTab({ ex, exKey }: { ex: BudgetExhibit; exKey: string }) {
  const C = useTheme()
  const findings = useMemo(() => qualityReport(exKey, ex), [exKey, ex])
  const records = ex.records ?? []
  const [clean, setClean] = useState(true)
  const cleaned = useMemo(() => clean ? records.filter(r=>FYS.some(f=>Math.abs(Number(r[f])||0)>0)) : records, [records, clean])
  const dropped = records.length - cleaned.length
  const col = (l:string)=> l==="warn"?C.orange : l==="info"?C.cyan : C.green
  return (
    <div>
      <Row>
        <KPI icon="🧮" label="Parsed rows" value={String(ex.quality?.totalRows??"—")} accent={C.blue} sub="across both vintages" />
        <KPI icon="🚫" label="Non-add filtered" value={String(ex.quality?.nonAddFiltered??0)} accent={C.gold} sub="excluded from TOA" />
        <KPI icon="␀" label="Null amounts" value={String(ex.quality?.nullAmounts??0)} accent={(ex.quality?.nullAmounts??0)>0?C.orange:C.green} sub="coerced to 0" />
        <KPI icon="📦" label="Line groups" value={String(records.length)} accent={C.purple} sub={`${(ex.hierarchy?.length??0)}-level hierarchy`} />
      </Row>
      <div style={{ height:16 }} />
      <Card title="Data-quality findings" sub="Automated checks to clear before using this exhibit">
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {findings.map((f,i)=>(
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 12px", background:C.card, border:`1px solid ${C.border}`, borderRadius:9 }}>
              <Badge color={col(f.level)}>{f.level.toUpperCase()}</Badge>
              <div><div style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{f.title}</div>
                <div style={{ fontSize:11.5, color:C.textSub, marginTop:2, lineHeight:1.5 }}>{f.detail}</div></div>
            </div>))}
        </div>
      </Card>
      <div style={{ height:14 }} />
      <Card title="Cleaning agent" sub="Transparent, reversible prep → analysis-ready set for the ML Workbench">
        <label style={{ display:"flex", gap:10, alignItems:"center", fontSize:12.5, color:C.textSub, cursor:"pointer", marginBottom:10 }}>
          <input type="checkbox" checked={clean} onChange={e=>setClean(e.target.checked)} /> Drop all-zero line groups (no obligations in any loaded year)
        </label>
        <Row>
          <KPI icon="📥" label="Input rows" value={String(records.length)} accent={C.muted} />
          <KPI icon="🧹" label="Dropped" value={String(dropped)} accent={dropped>0?C.orange:C.green} sub="all-zero rows" />
          <KPI icon="✅" label="Analysis-ready" value={String(cleaned.length)} accent={C.green} sub="for ML Workbench" />
        </Row>
        <div style={{ fontSize:11.5, color:C.muted, marginTop:12, lineHeight:1.7 }}>
          Cleaning is non-destructive — raw files in <code>sourcedata/</code> are never modified. The cleaned population is
          what the <b style={{ color:C.text }}>AI / ML Workbench</b> pools for Benford and anomaly screens.
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════ non-DoD availability fallback
function AvailabilityView({ agency }: { agency: Agency }) {
  const C = useTheme()
  return (
    <div>
      <SectionTitle title="Data Explorer" sub={`Data availability for ${agency.name}`} />
      <Card title={`${agency.abbrev} — data layer`} accent={C.gold}>
        <div style={{ fontSize:13, color:C.textSub, lineHeight:1.8 }}>
          The deep explorer (vintage lifecycle, 5-level drill-down, pivot, agents) is powered by the bundled
          <b style={{ color:C.text }}> DoD PB2026 + PB2027 exhibit books</b> in <code>sourcedata/</code>.
          {agency.id==="SEC"
            ? " SEC data comes from the FY2027 Congressional Budget Justification — see Executive Overview and the ML Workbench."
            : ` Drop an ${agency.abbrev} exhibit/CBJ folder into sourcedata/ and re-run scripts/etl_sourcedata.py to light up the full explorer.`}
          <div style={{ marginTop:12 }}>Switch the agency selector to <b style={{ color:C.blue }}>Department of Defense</b> for the full experience.</div>
        </div>
      </Card>
    </div>
  )
}
