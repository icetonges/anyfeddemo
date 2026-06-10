"use client"
// components/anyfed/DataExplorer.tsx — interactive data layer for federal FM data.
// Tabs: Catalog & Semantics · Pivot & Compare (drag dimensions, drill down) ·
// AI Analysis agent · Data Prep agent. All analysis is computed live by
// lib/data-insights.ts on the loaded sourcedata; the LLM only narrates.
import { Fragment, useMemo, useState } from "react"
import { useTheme, Card, Row, SectionTitle, Badge, KPI, Spinner, Tip, fmtMoney } from "./ui"
import { useAgencyData, DodBudget, BudgetExhibit, BudgetRecord } from "./useAgencyData"
import type { Agency } from "@/lib/agencies"
import {
  FYS, FY, PHASE_META, profileExhibit, pivot, movers, qualityReport, usageAdvice, compactForLLM,
} from "@/lib/data-insights"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"

const PALETTE = ["#0ea5e9","#10b981","#f59e0b","#a78bfa","#f97316","#22d3ee","#ef4444","#6366f1"]
const DIM_LABEL: Record<string,string> = {
  org:"Organization", budgetActivity:"Budget Activity", account:"Account",
  project:"Construction Project", stateCountry:"State / Country",
}
const TABS = ["Catalog & Semantics","Pivot & Compare","AI Analysis","Data Prep"] as const
type Tab = typeof TABS[number]

export default function DataExplorer({ agency }: { agency: Agency }) {
  const C = useTheme()
  const { data, loading, error } = useAgencyData<DodBudget>("DOD", "budget")
  const [tab, setTab] = useState<Tab>("Catalog & Semantics")
  const [exKey, setExKey] = useState("p1")

  if (agency.id !== "DOD")
    return <AvailabilityView agency={agency} />
  if (loading) return <Spinner label="Loading enriched DoD exhibit data from sourcedata/…" />
  if (error || !data) return <Card title="Data error"><span style={{ color:C.red, fontSize:13 }}>{error}</span></Card>

  const exKeys = Object.keys(data.exhibits)
  const ex = data.exhibits[exKey] ?? data.exhibits[exKeys[0]]

  return (
    <div>
      <SectionTitle title="Data Explorer"
        sub="Inspect, pivot, compare, and quality-check the federal budget data layer — with embedded analysis & cleaning agents" />

      {/* exhibit selector */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
        {exKeys.map(k => {
          const e = data.exhibits[k]; const on = k === exKey
          return (
            <button key={k} onClick={() => setExKey(k)}
              style={{ padding:"7px 13px", borderRadius:9, fontSize:12.5, fontWeight:on?700:600, cursor:"pointer",
                       border:`1px solid ${on?C.borderAccent:C.border}`, background:on?`${C.blue}22`:C.card,
                       color:on?C.blue:C.textSub }}>
              {e.appn} <span style={{ opacity:0.6 }}>{k.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* tab strip */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, borderBottom:`1px solid ${C.border}`, paddingBottom:10 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:"7px 14px", borderRadius:8, fontSize:12.5, fontWeight:tab===t?700:500, cursor:"pointer",
                     border:`1px solid ${tab===t?C.borderAccent:"transparent"}`,
                     background:tab===t?`${C.blue}1f`:"transparent", color:tab===t?C.blue:C.muted }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Catalog & Semantics" && <CatalogTab data={data} exKey={exKey} />}
      {tab === "Pivot & Compare"     && <PivotTab ex={ex} exKey={exKey} />}
      {tab === "AI Analysis"         && <AnalysisTab data={data} exKey={exKey} agency={agency} />}
      {tab === "Data Prep"           && <PrepTab ex={ex} exKey={exKey} />}
    </div>
  )
}

// ════════════════════════════════════════════════════════ Catalog & Semantics
function CatalogTab({ data, exKey }: { data: DodBudget; exKey: string }) {
  const C = useTheme()
  const ex = data.exhibits[exKey]
  const phaseColor = (p?: string) => p==="actuals"?C.green : p==="enacted"?C.gold : p==="request"?C.blue : C.muted
  return (
    <div>
      {/* year-phase semantics — the heart of the request */}
      <Card title="Budget-Phase Semantics" sub="What each fiscal-year column actually means in the source exhibits — read before analyzing">
        <Row>
          {FYS.map(fy => {
            const meta = data.yearPhase?.[fy] ?? PHASE_META[fy] as unknown as { phase:string; label:string }
            const present = ex.years[fy] != null
            return (
              <div key={fy} style={{ flex:1, minWidth:210, background:C.card, border:`1px solid ${C.border}`,
                     borderRadius:10, padding:"12px 14px", opacity:present?1:0.5 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <b style={{ color:C.text, fontSize:13 }}>{fy}</b>
                  <Badge color={phaseColor((meta as {phase?:string}).phase)}>{(meta as {phase?:string}).phase ?? "—"}</Badge>
                </div>
                <div style={{ fontSize:11.5, color:C.textSub, lineHeight:1.5 }}>{(meta as {label?:string}).label}</div>
                <div style={{ fontSize:12.5, color:C.cyan, fontFamily:"var(--font-mono)", marginTop:7 }}>
                  {present ? fmtMoney(ex.years[fy], "K") : "— not in source —"}
                </div>
              </div>
            )
          })}
        </Row>
      </Card>

      <div style={{ height:14 }} />
      <Row>
        <Card title={`${ex.title} — Component Decomposition`} sub="Discretionary vs PL 119-21 mandatory vs actuals, by year ($K)" style={{ flex:1.3, minWidth:360 }}>
          <ComponentTable ex={ex} />
        </Card>
        <Card title="Discretionary vs Mandatory — Department-wide" sub="Across all standard exhibits ($B)" style={{ flex:1, minWidth:320 }}>
          <DiscMandChart data={data} />
        </Card>
      </Row>

      <div style={{ height:14 }} />
      <Card title="Source Lineage & Coverage" sub="Every number traces to a specific exhibit book, sheet, and fiscal year in sourcedata/">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:620 }}>
            <thead><tr style={{ color:C.muted, textAlign:"left" }}>
              {["Exhibit","Source file","Book","Years","Sheets parsed"].map(h =>
                <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {(data.catalog ?? []).map((c,i) => (
                <tr key={i} style={{ background: c.exhibit.toLowerCase()===exKey ? `${C.blue}11`:"transparent" }}>
                  <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}><Badge color={C.purple}>{c.exhibit}</Badge></td>
                  <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.cyan, fontSize:11 }}>{c.file}</td>
                  <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub }}>{c.book}</td>
                  <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.text }}>{c.years.join(", ")}</td>
                  <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.muted, fontSize:11 }}>{c.sheets.length} sheets</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function ComponentTable({ ex }: { ex: BudgetExhibit }) {
  const C = useTheme()
  const COMP_LABEL: Record<string,string> = {
    actuals:"Actuals", reconciliation:"Reconciliation", total:"Total (TOA)",
    discretionaryEnacted:"Discretionary Enacted", mandatorySpendPlan:"PL 119-21 Mandatory",
    discretionaryRequest:"Discretionary Request", mandatoryRequest:"Mandatory Request",
    toa:"Total Obligation Authority", appropriation:"Appropriation", authorization:"Authorization",
  }
  const order = ["actuals","reconciliation","discretionaryEnacted","mandatorySpendPlan","discretionaryRequest","mandatoryRequest","authorization","appropriation","toa","total"]
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:380 }}>
        <thead><tr style={{ color:C.muted, textAlign:"left" }}>
          <th style={{ padding:"6px 8px", borderBottom:`1px solid ${C.border}` }}>FY</th>
          <th style={{ padding:"6px 8px", borderBottom:`1px solid ${C.border}` }}>Component</th>
          <th style={{ padding:"6px 8px", borderBottom:`1px solid ${C.border}`, textAlign:"right" }}>Amount</th>
        </tr></thead>
        <tbody>
          {FYS.flatMap(fy => {
            const c = ex.components?.[fy]; if (!c) return []
            const keys = order.filter(k => c[k] != null)
            return keys.map((k,j) => (
              <tr key={fy+k}>
                <td style={{ padding:"6px 8px", borderBottom:`1px solid ${C.border}`, color:j===0?C.text:C.muted, fontWeight:j===0?700:400 }}>{j===0?fy:""}</td>
                <td style={{ padding:"6px 8px", borderBottom:`1px solid ${C.border}`, color:C.textSub }}>
                  {k==="total"||k==="toa" ? <b style={{ color:C.text }}>{COMP_LABEL[k]}</b> : COMP_LABEL[k] ?? k}
                </td>
                <td style={{ padding:"6px 8px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)",
                             color: k.startsWith("mandatory")||k==="mandatorySpendPlan"?C.orange : (k==="total"||k==="toa")?C.text:C.cyan }}>
                  {fmtMoney(c[k], "K")}
                </td>
              </tr>
            ))
          })}
        </tbody>
      </table>
    </div>
  )
}

function DiscMandChart({ data }: { data: DodBudget }) {
  const C = useTheme()
  const rows = FYS.filter(fy => data.discMandatoryByFY?.[fy]).map(fy => ({
    fy: fy.replace("FY20","FY"),
    Discretionary: (data.discMandatoryByFY![fy].discretionary)/1e6,
    "PL 119-21 Mandatory": (data.discMandatoryByFY![fy].mandatory)/1e6,
  }))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows}>
        <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
        <XAxis dataKey="fy" stroke={C.muted} fontSize={11} />
        <YAxis stroke={C.muted} fontSize={11} tickFormatter={(v:number)=>`$${v.toFixed(0)}B`} />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize:11 }} />
        <Bar dataKey="Discretionary" stackId="a" fill={C.blue} />
        <Bar dataKey="PL 119-21 Mandatory" stackId="a" fill={C.orange} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ════════════════════════════════════════════════════════════ Pivot & Compare
function PivotTab({ ex, exKey }: { ex: BudgetExhibit; exKey: string }) {
  const C = useTheme()
  const records = ex.records ?? []
  // pivot fields = record keys that aren't FY amounts
  const fields = useMemo(() => {
    const sample = records[0] ?? {}
    return Object.keys(sample).filter(k => !FYS.includes(k as FY)) as (keyof BudgetRecord)[]
  }, [records])
  const [dims, setDims] = useState<(keyof BudgetRecord)[]>(fields)
  const [fy, setFy] = useState<FY>("FY2027")
  const [drill, setDrill] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  // keep dims in sync if exhibit changes
  const activeDims = dims.filter(d => fields.includes(d))
  const dim1 = activeDims[0] ?? fields[0]
  const dim2 = activeDims[1]

  const rows = useMemo(() => pivot(records, dim1, fy), [records, dim1, fy])
  const drillRows = useMemo(() => {
    if (!drill || !dim2) return []
    return pivot(records.filter(r => String(r[dim1]) === drill), dim2, fy)
  }, [records, drill, dim1, dim2, fy])

  const reorder = (to: number) => {
    if (dragIdx === null || dragIdx === to) return
    const next = [...activeDims]; const [m] = next.splice(dragIdx,1); next.splice(to,0,m)
    setDims(next); setDragIdx(null); setDrill(null)
  }
  const exportCsv = () => {
    const head = `${DIM_LABEL[String(dim1)] ?? String(dim1)},${fy} ($K)\n`
    const body = rows.map(r => `"${r.name.replace(/"/g,'""')}",${r.value}`).join("\n")
    const blob = new Blob([head+body], { type:"text/csv" })
    const url = URL.createObjectURL(blob); const a = document.createElement("a")
    a.href = url; a.download = `${exKey}_${String(dim1)}_${fy}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const top = rows.slice(0, 10).map(r => ({ name: r.name.length>22?r.name.slice(0,20)+"…":r.name, value: r.value/1e3 }))
  const total = rows.reduce((s,r)=>s+r.value,0)

  return (
    <div>
      <Card title="Pivot configuration" sub="Drag the dimension chips to set grouping order · pick a fiscal year · click a row to drill down">
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:11.5, color:C.muted }}>Group by →</span>
          {activeDims.map((d,i) => (
            <div key={String(d)} draggable
              onDragStart={()=>setDragIdx(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>reorder(i)}
              style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"grab",
                       border:`1px solid ${i===0?C.borderAccent:C.border}`, background:i===0?`${C.blue}22`:C.card,
                       color:i===0?C.blue:C.textSub, userSelect:"none" }}
              title="Drag to reorder">
              ⠿ {DIM_LABEL[String(d)] ?? String(d)}{i===0 && <span style={{ opacity:0.6 }}> (primary)</span>}
            </div>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            <select value={fy} onChange={e=>{setFy(e.target.value as FY); setDrill(null)}}
              style={{ background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", fontSize:12 }}>
              {FYS.filter(f=>ex.years[f]!=null).map(f => <option key={f} value={f}>{f} · {PHASE_META[f]?.phase}</option>)}
            </select>
            <button onClick={exportCsv}
              style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                       border:`1px solid ${C.border}`, background:C.card, color:C.blue }}>⤓ CSV</button>
          </div>
        </div>
      </Card>

      <div style={{ height:14 }} />
      <Row>
        <Card title={`By ${DIM_LABEL[String(dim1)] ?? String(dim1)} — ${fy}`}
              sub={`${rows.length} groups · ${fmtMoney(total,"K")} total${dim2?` · click a row to drill into ${DIM_LABEL[String(dim2)]}`:""}`}
              style={{ flex:1.2, minWidth:360 }}>
          <div style={{ overflowX:"auto", maxHeight:420, overflowY:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ color:C.muted, textAlign:"left", position:"sticky", top:0, background:C.surface }}>
                <th style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{DIM_LABEL[String(dim1)] ?? String(dim1)}</th>
                <th style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right" }}>{fy} ($K)</th>
                <th style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right" }}>Share</th>
              </tr></thead>
              <tbody>
                {rows.map(r => {
                  const open = drill === r.name
                  return (
                    <Fragment key={r.name}>
                      <tr onClick={()=>dim2 && setDrill(open?null:r.name)}
                        style={{ cursor:dim2?"pointer":"default", background: open?`${C.blue}14`:"transparent" }}>
                        <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.text }}>
                          {dim2 && <span style={{ color:C.muted, marginRight:6 }}>{open?"▾":"▸"}</span>}{r.name}
                        </td>
                        <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:r.value<0?C.red:C.cyan }}>{fmtMoney(r.value,"K")}</td>
                        <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", color:C.muted }}>{total?((r.value/total)*100).toFixed(1):0}%</td>
                      </tr>
                      {open && drillRows.map(d => (
                        <tr key={r.name+d.name} style={{ background:`${C.blue}08` }}>
                          <td style={{ padding:"5px 10px 5px 28px", borderBottom:`1px solid ${C.border}`, color:C.textSub, fontSize:11.5 }}>{d.name}</td>
                          <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:C.muted, fontSize:11.5 }}>{fmtMoney(d.value,"K")}</td>
                          <td style={{ borderBottom:`1px solid ${C.border}` }} />
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Top groups ($B)" sub={`${DIM_LABEL[String(dim1)] ?? String(dim1)} · ${fy}`} style={{ flex:1, minWidth:320 }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
              <XAxis type="number" stroke={C.muted} fontSize={10} tickFormatter={(v:number)=>`$${v.toFixed(0)}B`} />
              <YAxis type="category" dataKey="name" stroke={C.muted} fontSize={10} width={130} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name={`${fy} ($B)`}>
                {top.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
              </Bar>
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
  const C = useTheme()
  const records = ex.records ?? []
  const present = FYS.filter(f => ex.years[f] != null)
  const [a, setA] = useState<FY>(present[Math.max(0,present.length-2)] ?? "FY2026")
  const [b, setB] = useState<FY>(present[present.length-1] ?? "FY2027")
  const mv = useMemo(() => movers(records, a, b, 10), [records, a, b])
  return (
    <Card title="Year-over-year comparison" sub="Biggest line-item movers between two fiscal years — drivers of the change">
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
        <Sel value={a} set={setA} opts={present} /> <span style={{ color:C.muted }}>vs</span> <Sel value={b} set={setB} opts={present} />
        <span style={{ fontSize:11.5, color:C.muted, marginLeft:8 }}>
          Δ total: <b style={{ color:(ex.years[b]-ex.years[a])>=0?C.green:C.red, fontFamily:"var(--font-mono)" }}>
            {(ex.years[b]-ex.years[a])>=0?"+":""}{fmtMoney(ex.years[b]-ex.years[a],"K")}</b>
        </span>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:560 }}>
          <thead><tr style={{ color:C.muted, textAlign:"left" }}>
            {["Line item","Org",a,b,"Δ"].map(h => <th key={h} style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {mv.map((m,i) => (
              <tr key={i}>
                <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.text }}>{m.label}</td>
                <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.muted, fontSize:11 }}>{m.org}</td>
                <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:C.muted }}>{fmtMoney(m.from,"K")}</td>
                <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:C.text }}>{fmtMoney(m.to,"K")}</td>
                <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", fontWeight:700, color:m.delta>=0?C.green:C.red }}>{m.delta>=0?"+":""}{fmtMoney(m.delta,"K")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
function Sel({ value, set, opts }: { value:FY; set:(f:FY)=>void; opts:FY[] }) {
  const C = useTheme()
  return (
    <select value={value} onChange={e=>set(e.target.value as FY)}
      style={{ background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", fontSize:12 }}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ═══════════════════════════════════════════════════════════════ AI Analysis
function AnalysisTab({ data, exKey, agency }: { data: DodBudget; exKey: string; agency: Agency }) {
  const C = useTheme()
  const ex = data.exhibits[exKey]
  const prof = useMemo(() => profileExhibit(exKey, ex), [exKey, ex])
  const advice = useMemo(() => usageAdvice(ex), [ex])
  const [llm, setLlm] = useState<{ loading:boolean; text?:string; model?:string; unavailable?:boolean }>({ loading:false })

  const narrate = async () => {
    setLlm({ loading:true })
    try {
      const res = await fetch("/api/data-insight", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ agency: agency.id, profile: compactForLLM(data, exKey) }),
      })
      const j = await res.json()
      if (j.available) setLlm({ loading:false, text:j.text, model:j.modelUsed })
      else setLlm({ loading:false, unavailable:true })
    } catch { setLlm({ loading:false, unavailable:true }) }
  }

  return (
    <div>
      <Row>
        <KPI icon="📈" label={`${prof.appn} CAGR (loaded yrs)`} value={prof.cagr!=null?`${prof.cagr}%`:"—"} accent={C.blue} sub="Compound annual growth, total TOA" />
        <KPI icon="🏛️" label="Top org concentration" value={prof.topOrgShare?`${prof.topOrgShare.share}%`:"—"} accent={C.cyan} sub={prof.topOrgShare?.org ?? "—"} />
        <KPI icon="🎯" label="Org HHI" value={prof.hhi!=null?String(prof.hhi):"—"} accent={prof.hhi&&prof.hhi>2500?C.orange:C.green} sub={prof.hhi&&prof.hhi>2500?"concentrated":"diversified"} />
        <KPI icon="🧾" label="Line groups" value={String(prof.recordCount)} accent={C.purple} sub="retained for drill-down" />
      </Row>

      <div style={{ height:16 }} />
      <Row>
        <Card title="Deterministic findings" sub="Computed live from the loaded exhibit — no model required" style={{ flex:1, minWidth:340 }}>
          <ul style={{ margin:0, paddingLeft:18, fontSize:12.5, color:C.textSub, lineHeight:1.8 }}>
            {prof.yoy.map((y,i) => (
              <li key={i}>{y.fy}: <b style={{ color:y.deltaPct>=0?C.green:C.red, fontFamily:"var(--font-mono)" }}>{y.deltaPct>=0?"+":""}{y.deltaPct}%</b> ({fmtMoney(y.from,"K")} → {fmtMoney(y.to,"K")})</li>
            ))}
            {Object.entries(prof.discMandatory).filter(([,v])=>v.mandatory>0).map(([fy,v]) => (
              <li key={fy}>{fy}: PL 119-21 mandatory is <b style={{ color:C.orange }}>{v.mandatoryShare}%</b> of authority ({fmtMoney(v.mandatory,"K")} of {fmtMoney(v.discretionary+v.mandatory,"K")}) — exclude before trending.</li>
            ))}
          </ul>
        </Card>
        <Card title="Usage advice" sub="How to use each year correctly" style={{ flex:1, minWidth:340 }}>
          <ul style={{ margin:0, paddingLeft:18, fontSize:12.5, color:C.textSub, lineHeight:1.7 }}>
            {advice.map((a,i) => <li key={i} style={{ marginBottom:5 }}>{a}</li>)}
          </ul>
        </Card>
      </Row>

      <div style={{ height:16 }} />
      <Card title="AI narrative briefing" sub="Optional — narrates the deterministic profile via the Gemini→Claude→Groq chain">
        {!llm.text && !llm.unavailable && (
          <button onClick={narrate} disabled={llm.loading}
            style={{ padding:"9px 16px", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer",
                     border:`1px solid ${C.borderAccent}`, background:`${C.blue}26`, color:C.blue }}>
            {llm.loading ? "Analyzing…" : "🤖 Generate AI briefing"}
          </button>
        )}
        {llm.text && (
          <div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.75, whiteSpace:"pre-wrap" }}>{llm.text}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:10 }}>Model: {llm.model} · narration of the deterministic profile above</div>
          </div>
        )}
        {llm.unavailable && (
          <div style={{ fontSize:12.5, color:C.muted, lineHeight:1.7 }}>
            LLM narration is offline (no API keys configured in this environment). The deterministic findings and
            advice above are fully computed and require no model — set GOOGLE_AI_API_KEY / ANTHROPIC_API_KEY /
            GROQ_API_KEY to enable the narrative layer.
          </div>
        )}
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
  // a simple, transparent cleaning pass for analysis-readiness
  const cleaned = useMemo(() => {
    let rows = records
    if (clean) rows = rows.filter(r => FYS.some(f => Math.abs(Number(r[f])||0) > 0))   // drop all-zero rows
    return rows
  }, [records, clean])
  const dropped = records.length - cleaned.length
  const lvlColor = (l:string) => l==="warn"?C.orange : l==="info"?C.cyan : C.green

  return (
    <div>
      <Row>
        <KPI icon="🧮" label="Parsed rows" value={String(ex.quality?.totalRows ?? "—")} accent={C.blue} sub="from source sheets" />
        <KPI icon="🚫" label="Non-add filtered" value={String(ex.quality?.nonAddFiltered ?? 0)} accent={C.gold} sub="excluded from TOA" />
        <KPI icon="␀" label="Null amounts" value={String(ex.quality?.nullAmounts ?? 0)} accent={(ex.quality?.nullAmounts ?? 0)>0?C.orange:C.green} sub="coerced to 0" />
        <KPI icon="📦" label="Line groups" value={String(records.length)} accent={C.purple} sub="aggregated & retained" />
      </Row>

      <div style={{ height:16 }} />
      <Card title="Data-quality findings" sub="Automated checks an analyst should clear before using this exhibit">
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {findings.map((f,i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 12px",
                   background:C.card, border:`1px solid ${C.border}`, borderRadius:9 }}>
              <Badge color={lvlColor(f.level)}>{f.level.toUpperCase()}</Badge>
              <div>
                <div style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{f.title}</div>
                <div style={{ fontSize:11.5, color:C.textSub, marginTop:2, lineHeight:1.5 }}>{f.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ height:14 }} />
      <Card title="Cleaning agent" sub="A transparent, reversible prep pass — produces an analysis-ready set for the ML Workbench">
        <label style={{ display:"flex", gap:10, alignItems:"center", fontSize:12.5, color:C.textSub, cursor:"pointer", marginBottom:10 }}>
          <input type="checkbox" checked={clean} onChange={e=>setClean(e.target.checked)} />
          Drop all-zero line groups (no obligations in any loaded year)
        </label>
        <div style={{ display:"flex", gap:14, flexWrap:"wrap", fontSize:12.5 }}>
          <div style={{ flex:1, minWidth:150 }}><KPI icon="📥" label="Input rows" value={String(records.length)} accent={C.muted} /></div>
          <div style={{ flex:1, minWidth:150 }}><KPI icon="🧹" label="Dropped" value={String(dropped)} accent={dropped>0?C.orange:C.green} sub="all-zero rows" /></div>
          <div style={{ flex:1, minWidth:150 }}><KPI icon="✅" label="Analysis-ready" value={String(cleaned.length)} accent={C.green} sub="for ML Workbench" /></div>
        </div>
        <div style={{ fontSize:11.5, color:C.muted, marginTop:12, lineHeight:1.7 }}>
          The cleaned population is what the <b style={{ color:C.text }}>AI / ML Workbench</b> pools when you select this
          exhibit&apos;s datasets — Benford and anomaly screens run cleaner once all-zero administrative rows are removed.
          Cleaning is non-destructive: the raw source files in <code>sourcedata/</code> are never modified.
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
      <SectionTitle title="Data Explorer"
        sub={`Data availability for ${agency.name}`} />
      <Card title={`${agency.abbrev} — data layer`} accent={C.gold}>
        <div style={{ fontSize:13, color:C.textSub, lineHeight:1.8 }}>
          The deep exhibit explorer (component decomposition, pivot, drill-down, quality agents) is currently
          powered by the <b style={{ color:C.text }}>DoD PB exhibit books</b> bundled in <code>sourcedata/</code>.
          {agency.id==="SEC"
            ? " SEC budget data is bundled from the FY2027 Congressional Budget Justification — explore it in the Executive Overview and ML Workbench."
            : ` ${agency.abbrev} currently resolves to live USAspending.gov budgetary-resources data. Drop an ${agency.abbrev} exhibit/CBJ folder into sourcedata/ and re-run the ETL (scripts/etl_sourcedata.py) to light up the full explorer for this agency.`}
          <div style={{ marginTop:12 }}>
            Switch the agency selector to <b style={{ color:C.blue }}>Department of Defense</b> to see the full
            interactive data layer: budget-phase semantics, discretionary vs PL 119-21 mandatory decomposition,
            draggable pivots, year-over-year movers, and the analysis & cleaning agents.
          </div>
        </div>
      </Card>
    </div>
  )
}
