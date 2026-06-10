"use client"
// components/anyfed/DataIntelligence.tsx — agency-aware data intelligence hub.
// Sits directly below Executive Overview. Works for EVERY agency in the
// selector (live GTAS/USAspending detail), and surfaces the bundled folder
// datasets for DoD/SEC. Features: data inventory with draggable cards and
// structural profiling, A/B comparison workspace, 2-level drill-down across
// four dimensions, obligation-cadence analytics, an expert findings feed,
// a transparent prep pipeline, and the mouse-follow FM agent everywhere.
import { useMemo, useState } from "react"
import { useTheme, Card, Row, SectionTitle, Badge, KPI, Spinner, Tip, SourceTag } from "./ui"
import { AgentProvider, useAgentSet, agentProps } from "./agent"
import LinkageThread from "./LinkageThread"
import { useAgencyData, LiveDetail, DetailDim, DetailNode, DodBudget } from "./useAgencyData"
import type { Agency } from "@/lib/agencies"
import {
  fmt, DimKey, DIM_KEYS, DIM_DOCTRINE, dimProfile, cadence, outlayLag, objectClassMix,
  resourceTrend, liveQuality, prepPipeline, compareNodes, liveHover, expertFindings,
} from "@/lib/live-insights"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ComposedChart, Line, Legend,
} from "recharts"

const PALETTE = ["#0ea5e9","#10b981","#f59e0b","#a78bfa","#f97316","#22d3ee","#ef4444","#6366f1"]
const DIM_ICON: Record<DimKey, string> = { subAgency:"🏢", budgetFunction:"🎯", federalAccount:"🏦", objectClass:"🧾" }

function fyOptions(): number[] {
  const now = new Date()
  const currentFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  // CURRENT in-progress FY first (what people care about most), then history
  return [0, 1, 2, 3, 4].map(i => currentFY - i)
}
export function isInProgressFY(fy: number): boolean {
  const now = new Date()
  return fy === (now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear())
}

export default function DataIntelligence({ agency }: { agency: Agency }) {
  return (
    <AgentProvider>
      <Inner agency={agency} />
    </AgentProvider>
  )
}

function Inner({ agency }: { agency: Agency }) {
  const C = useTheme()
  const setAgent = useAgentSet()
  const fys = fyOptions()
  const [fy, setFy] = useState(fys[0])
  const { data, loading, error } = useAgencyData<LiveDetail>(agency.id, "detail", `fy=${fy}`)
  const [selDim, setSelDim] = useState<DimKey>("federalAccount")
  const [cmp, setCmp] = useState<{ dim: DimKey; fyA: number; fyB: number }>({ dim: "federalAccount", fyA: fys[1], fyB: fys[0] })

  const trend = useMemo(() => data ? resourceTrend(data.years) : null, [data])
  const findings = useMemo(() => data ? expertFindings(data) : [], [data])
  const quality = useMemo(() => data ? liveQuality(data) : null, [data])

  if (loading) return <Spinner label={`Building the ${agency.abbrev} data-intelligence bundle — 5 live GTAS/USAspending endpoints…`} />
  if (error || !data) return (
    <Card title="Data Intelligence" accent={C.red}>
      <div style={{ fontSize:17.5, color:C.textSub, lineHeight:1.7 }}>
        Could not assemble the live bundle for {agency.name}: <span style={{ color:C.red }}>{error}</span><br />
        USAspending may not publish FY{fy} detail for this agency yet — try an earlier fiscal year.
        <div style={{ marginTop:10 }}>
          <FySelect value={fy} onChange={setFy} options={fys} />
        </div>
      </div>
    </Card>
  )

  return (
    <div>
      <SectionTitle title="Data Intelligence"
        sub={`${agency.name} — every dataset profiled, scored, and explained. Drag cards to compare, click to profile, expand to drill, hover anything for the FM agent.`} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        <SourceTag source={data.source} />
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:15.5, color:C.muted }}>Analysis fiscal year</span>
          <FySelect value={fy} onChange={setFy} options={fys} />
        </div>
      </div>

      {/* ── KPI posture strip ── */}
      {trend && (
        <Row>
          <div style={{ flex:1, minWidth:160 }} {...agentProps(setAgent, { title:"Total budgetary resources", lines:[fmt(trend.latest.resources), `All authority available to ${agency.abbrev} in ${trend.latest.fy}: new appropriations + carryover + offsetting collections (SF-133 line 1910 equivalent).`, trend.yoyResources != null ? `${trend.yoyResources >= 0 ? "+" : ""}${trend.yoyResources}% vs prior year.` : ""] })}>
            <KPI icon="💰" label={`${trend.latest.fy} resources`} value={fmt(trend.latest.resources)} accent={C.blue}
                 sub={`total budgetary resources (SF-133 1910)${trend.yoyResources != null ? ` · ${trend.yoyResources >= 0 ? "+" : ""}${trend.yoyResources}% YoY` : ""}`} />
          </div>
          <div style={{ flex:1, minWidth:160 }} {...agentProps(setAgent, { title:"Obligations", lines:[fmt(trend.latest.obligated), `Legally binding commitments incurred — the execution KPI. ${trend.yoyObligated != null ? `Moving ${trend.yoyObligated >= 0 ? "+" : ""}${trend.yoyObligated}% YoY.` : ""}`] })}>
            <KPI icon="✍️" label="Obligated" value={fmt(trend.latest.obligated)} accent={C.cyan}
                 sub={`obligations incurred (SF-133 2190) · ${trend.latest.rate ?? "—"}% of resources`} />
          </div>
          <div style={{ flex:1, minWidth:160 }} {...agentProps(setAgent, { title:"Unobligated balance", lines:[fmt(trend.carryover), `${trend.carryoverShare}% of resources not yet obligated. ${trend.carryoverShare > 35 ? "Large carryover — likely multi-year/no-year authority; obligation-rate KPIs mislead here." : trend.carryoverShare < 8 ? "Very tight — little buffer for in-year requirements." : "Within the normal band."}`] })}>
            <KPI icon="🏦" label="Unobligated" value={fmt(trend.carryover)} accent={trend.carryoverShare > 35 ? C.orange : C.green}
                 sub={`unobligated balance (SF-133 2490) · ${trend.carryoverShare}% of resources`} />
          </div>
          <div style={{ flex:1, minWidth:160 }} {...agentProps(setAgent, { title:"Obligation-rate trend", lines:[`${trend.latest.rate ?? "—"}% latest`, `Across ${data.years.length} years the rate is ${trend.rateTrend}. A falling rate with rising resources usually means new multi-year money landing faster than execution capacity.`] })}>
            <KPI icon="📈" label="Rate trend" value={trend.rateTrend} accent={trend.rateTrend === "falling" ? C.orange : C.green}
                 sub={`${data.years.length}-year GTAS history`} />
          </div>
        </Row>
      )}

      <div style={{ height:16 }} />

      {/* ── 1 · Data inventory (drag → compare, click → profile) ── */}
      <Card title="1 · Data Inventory" sub="Every dimension available for this agency, structurally profiled. Click a card to open its full profile · drag it onto a Compare slot below.">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(250px, 1fr))", gap:10 }}>
          {DIM_KEYS.map(k => {
            const dim = data.dims[k]; const p = dimProfile(dim)
            const on = selDim === k
            return (
              <div key={k} draggable
                onDragStart={ev => ev.dataTransfer.setData("text/plain", k)}
                onClick={() => setSelDim(k)}
                {...agentProps(setAgent, { title: dim.label, lines: p ? [
                  `${p.n} rows · ${p.childCount} child rows · ${fmt(p.total)}`,
                  p.reading,
                  `Drag onto a Compare slot, or click to profile.`] : [`No ${dim.label.toLowerCase()} rows for FY${fy}.`] })}
                style={{ cursor:"pointer", userSelect:"none", background: on ? `${C.blue}1c` : C.card,
                         border:`1px solid ${on ? C.borderAccent : C.border}`, borderRadius:10, padding:"11px 13px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:17, fontWeight:700, color: on ? C.blue : C.text }}>⠿ {DIM_ICON[k]} {dim.label}</span>
                  {p && <Badge color={p.hhi > 2500 ? C.orange : C.green}>{p.hhi > 2500 ? "concentrated" : "diversified"}</Badge>}
                </div>
                {p ? (
                  <>
                    <div style={{ fontSize:15, color:C.muted, marginTop:4 }}>
                      {p.n} rows{p.childCount ? ` → ${p.childCount} ${dim.childLabel.toLowerCase() || "children"}` : ""} · {dim.measure}
                    </div>
                    <div style={{ display:"flex", gap:10, marginTop:7, fontSize:14, fontFamily:"var(--font-mono)" }}>
                      <span style={{ color:C.cyan }}>{fmt(p.total)}</span>
                      <span style={{ color:C.muted }}>HHI {p.hhi}</span>
                      <span style={{ color:C.muted }}>top {p.topShare}%</span>
                    </div>
                  </>
                ) : <div style={{ fontSize:15, color:C.muted, marginTop:4 }}>no rows in FY{fy}</div>}
              </div>
            )
          })}
        </div>
        {(agency.id === "DOD" || agency.id === "SEC") && <FolderInventory agency={agency} />}
      </Card>

      <div style={{ height:16 }} />

      {/* ── 2 · Profile of selected dimension ── */}
      <DimensionProfile data={data} dimKey={selDim} fy={fy} />

      <div style={{ height:16 }} />

      {/* ── 3 · Compare workspace ── */}
      <CompareWorkspace agency={agency} cmp={cmp} setCmp={setCmp} fys={fys} />

      <div style={{ height:16 }} />

      {/* ── 4 · Drill-down ── */}
      <DrillPanel data={data} fy={fy} />

      <div style={{ height:16 }} />

      {/* ── 5 · Obligation cadence ── */}
      <CadencePanel data={data} />

      <div style={{ height:16 }} />

      {/* ── 6 · Cross-dataset linkage (UoT thread) ── */}
      <LinkageThread />

      <div style={{ height:16 }} />

      {/* ── 7 · Expert findings + data ops ── */}
      <Row>
        <Card title="Expert findings" sub="Deterministic — computed from this bundle, ranked by severity" style={{ flex:1.2, minWidth:360 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {findings.map((f, i) => (
              <div key={i} {...agentProps(setAgent, { title: f.title, lines: [f.text] })}
                style={{ padding:"10px 12px", background:C.card, border:`1px solid ${C.border}`, borderRadius:9 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <Badge color={f.severity === "high" ? C.red : f.severity === "medium" ? C.orange : C.green}>{f.severity.toUpperCase()}</Badge>
                  <span style={{ fontSize:15, color:C.muted }}>{f.area}</span>
                  <span style={{ fontSize:16, fontWeight:700, color:C.text }}>{f.title}</span>
                </div>
                <div style={{ fontSize:16, color:C.textSub, lineHeight:1.55 }}>{f.text}</div>
              </div>
            ))}
          </div>
        </Card>
        <DataOps data={data} quality={quality} dimKey={selDim} />
      </Row>
    </div>
  )
}

// ── FY select ────────────────────────────────────────────────────────────────
function FySelect({ value, onChange, options }: { value: number; onChange: (v: number) => void; options: number[] }) {
  const C = useTheme()
  return (
    <select value={value} onChange={e => onChange(Number(e.target.value))}
      style={{ background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", fontSize:16, cursor:"pointer" }}>
      {options.map(f => <option key={f} value={f}>FY{f}{isInProgressFY(f) ? " — in progress (most current)" : ""}</option>)}
    </select>
  )
}

// ── folder datasets strip (DoD / SEC) ────────────────────────────────────────
function FolderInventory({ agency }: { agency: Agency }) {
  const C = useTheme()
  const setAgent = useAgentSet()
  const { data } = useAgencyData<DodBudget>("DOD", "budget")
  if (agency.id === "SEC") return (
    <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}`, fontSize:15.5, color:C.muted, lineHeight:1.6 }}>
      📁 Folder data: <b style={{ color:C.text }}>SEC FY2027 CBJ</b> (budget history, object class, fee offsets) — explored in Executive Overview and pooled in the ML Workbench.
    </div>
  )
  if (!data) return null
  return (
    <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
      <div style={{ fontSize:15, color:C.muted, letterSpacing:"0.08em", marginBottom:8 }}>📁 FOLDER DATASETS (sourcedata/ · PB2026 + PB2027 J-books)</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {Object.entries(data.exhibits).map(([k, e]) => (
          <div key={k} {...agentProps(setAgent, { title: e.title, lines: [
              `${e.appn} · ${(e.records?.length ?? 0)} line groups · ${(e.hierarchy?.length ?? 0)}-level drill`,
              `Full vintage/lifecycle + 5-level drill-down lives in the Data Explorer page. This live page adds the GTAS execution view the J-books don't carry.`] })}
            style={{ fontSize:15.5, padding:"7px 11px", borderRadius:8, background:C.card, border:`1px solid ${C.border}`, color:C.textSub }}>
            <b style={{ color:C.text }}>{e.appn}</b> · {e.records?.length ?? 0} groups · {(e.hierarchy?.length ?? 0)}-lvl
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 2 · dimension profile panel ──────────────────────────────────────────────
function DimensionProfile({ data, dimKey, fy }: { data: LiveDetail; dimKey: DimKey; fy: number }) {
  const C = useTheme()
  const setAgent = useAgentSet()
  const dim = data.dims[dimKey]
  const p = useMemo(() => dimProfile(dim), [dim])
  const ol = useMemo(() => outlayLag(dim), [dim])
  const mix = dimKey === "objectClass" ? objectClassMix(dim) : null
  const doctrine = DIM_DOCTRINE[dimKey]
  if (!p) return <Card title={`2 · Profile — ${dim.label}`}><div style={{ fontSize:17, color:C.muted }}>No rows for FY{fy}.</div></Card>
  const top = [...dim.nodes].sort((a, b) => b.value - a.value).slice(0, 10)
    .map(n => ({ name: n.name.length > 22 ? n.name.slice(0, 20) + "…" : n.name, value: n.value / 1e6, full: n.name }))
  return (
    <Card title={`2 · Profile — ${DIM_ICON[dimKey]} ${dim.label} (FY${fy})`}
          sub={`${p.n} categories · ${fmt(p.total)} ${dim.measure} · structure, distribution, and usage doctrine`}>
      <Row>
        <div style={{ flex:1.1, minWidth:330 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
              <XAxis type="number" stroke={C.muted} fontSize={13.5} tickFormatter={(v: number) => `$${v >= 1000 ? (v/1000).toFixed(0) + "B" : v.toFixed(0) + "M"}`} />
              <YAxis type="category" dataKey="name" stroke={C.muted} fontSize={13.5} width={140} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value">{top.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:10 }}>
          <Row>
            <div style={{ flex:1, minWidth:120 }} {...agentProps(setAgent, { title:"HHI", lines:[String(p.hhi), p.reading] })}>
              <KPI icon="🎯" label="Concentration HHI" value={String(p.hhi)} accent={p.hhi > 2500 ? C.orange : C.green} sub={p.hhi > 2500 ? ">2,500 = concentrated" : "diversified"} />
            </div>
            <div style={{ flex:1, minWidth:120 }} {...agentProps(setAgent, { title:"Effective categories", lines:[String(p.effectiveN), `1/Σshare² — only ~${p.effectiveN} of ${p.n} categories carry real weight. Build charts as top-${Math.min(5, p.n)} + remainder.`] })}>
              <KPI icon="∑" label="Effective categories" value={String(p.effectiveN)} accent={C.cyan} sub={`of ${p.n} total · Gini ${p.gini}`} />
            </div>
          </Row>
          <div {...agentProps(setAgent, { title:"Top-3 share", lines:[`${p.top3Share}%`, `"${p.topName}" alone holds ${p.topShare}%.`] })}
            style={{ fontSize:16, color:C.textSub, background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"9px 12px", lineHeight:1.6 }}>
            <b style={{ color:C.text }}>Distribution:</b> top category <b style={{ color:C.cyan }}>{p.topName}</b> = {p.topShare}%, top-3 = {p.top3Share}%. {p.reading}
          </div>
          {ol && <div {...agentProps(setAgent, { title:"Liquidation", lines:[`${ol.ratio}% outlay ratio`, ol.text] })}
            style={{ fontSize:16, color:C.textSub, background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"9px 12px", lineHeight:1.6 }}>
            <b style={{ color:C.text }}>Liquidation:</b> {ol.text}
            {ol.laggards.length > 0 && <span> Slowest: {ol.laggards.slice(0, 2).map(l => `${l.name} (${l.ratio}%)`).join(", ")}.</span>}
          </div>}
          {mix && <div style={{ fontSize:16, color:C.textSub, background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"9px 12px", lineHeight:1.6 }}>
            <b style={{ color:C.text }}>Cost structure:</b> {mix.text}
          </div>}
        </div>
      </Row>
      <div style={{ height:12 }} />
      <Row>
        {([["What it's for", doctrine.use, C.green], ["Pitfall", doctrine.pitfall, C.orange], ["Audit hook", doctrine.auditHook, C.purple]] as const).map(([t, body, col]) => (
          <div key={t} style={{ flex:1, minWidth:240, background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"10px 12px" }}>
            <Badge color={col}>{t}</Badge>
            <div style={{ fontSize:15.5, color:C.textSub, lineHeight:1.6, marginTop:6 }}>{body}</div>
          </div>
        ))}
      </Row>
    </Card>
  )
}

// ── 3 · compare workspace (drag-enabled, cross-FY) ───────────────────────────
function CompareWorkspace({ agency, cmp, setCmp, fys }:
  { agency: Agency; cmp: { dim: DimKey; fyA: number; fyB: number }; setCmp: (c: { dim: DimKey; fyA: number; fyB: number }) => void; fys: number[] }) {
  const C = useTheme()
  const setAgent = useAgentSet()
  const a = useAgencyData<LiveDetail>(agency.id, "detail", `fy=${cmp.fyA}`)
  const b = useAgencyData<LiveDetail>(agency.id, "detail", `fy=${cmp.fyB}`)
  const [over, setOver] = useState(false)
  const onDrop = (ev: React.DragEvent) => {
    ev.preventDefault(); setOver(false)
    const k = ev.dataTransfer.getData("text/plain") as DimKey
    if (DIM_KEYS.includes(k)) setCmp({ ...cmp, dim: k })
  }
  const res = useMemo(() => {
    if (!a.data || !b.data) return null
    return compareNodes(a.data.dims[cmp.dim].nodes, b.data.dims[cmp.dim].nodes)
  }, [a.data, b.data, cmp.dim])
  const dimLabel = a.data?.dims[cmp.dim].label ?? cmp.dim
  const totDelta = res ? res.totalB - res.totalA : 0
  return (
    <Card title="3 · Compare Workspace"
          sub="Drop an inventory card here (or pick a dimension), choose two fiscal years, and decompose the delta line by line.">
      <div onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={onDrop}
        style={{ border:`2px dashed ${over ? C.blue : C.border}`, borderRadius:10, padding:"12px 14px",
                 background: over ? `${C.blue}10` : "transparent", marginBottom:12,
                 display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:16, color:C.muted }}>⤵ Comparing</span>
        <select value={cmp.dim} onChange={e => setCmp({ ...cmp, dim: e.target.value as DimKey })}
          style={{ background:C.card, color:C.blue, fontWeight:700, border:`1px solid ${C.borderAccent}`, borderRadius:8, padding:"6px 10px", fontSize:17, cursor:"pointer" }}>
          {DIM_KEYS.map(k => <option key={k} value={k}>{DIM_ICON[k]} {a.data?.dims[k].label ?? k}</option>)}
        </select>
        <FySelect value={cmp.fyA} onChange={v => setCmp({ ...cmp, fyA: v })} options={fys} />
        <span style={{ color:C.muted, fontSize:16 }}>vs</span>
        <FySelect value={cmp.fyB} onChange={v => setCmp({ ...cmp, fyB: v })} options={fys} />
        {res && (
          <span style={{ marginLeft:"auto", fontSize:16, color:C.muted }}>
            Δ total <b style={{ fontFamily:"var(--font-mono)", color: totDelta >= 0 ? C.green : C.red }}>{totDelta >= 0 ? "+" : ""}{fmt(totDelta)}</b>
            <span style={{ marginLeft:8 }}>({fmt(res.totalA)} → {fmt(res.totalB)})</span>
          </span>
        )}
      </div>
      {(a.loading || b.loading) && <Spinner label={`Fetching FY${cmp.fyA} and FY${cmp.fyB} ${dimLabel.toLowerCase()} detail…`} />}
      {res && !a.loading && !b.loading && (
        <>
          <div style={{ overflowX:"auto", maxHeight:380, overflowY:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:16, minWidth:560 }}>
              <thead><tr style={{ color:C.muted, textAlign:"left", position:"sticky", top:0, background:C.surface }}>
                {[dimLabel, `FY${cmp.fyA}`, `FY${cmp.fyB}`, "Δ", "Δ%"].map(h => <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {res.rows.map((r, i) => (
                  <tr key={i} {...agentProps(setAgent, () => liveHover({ dimLabel, name:r.name, value:r.delta,
                      note: r.a == null ? `New in FY${cmp.fyB} — did not exist in FY${cmp.fyA}. New-start or reclassification; verify before calling it growth.`
                          : r.b == null ? `Disappeared after FY${cmp.fyA} — completion, transfer, or reclassification.`
                          : `${fmt(r.a)} → ${fmt(r.b)} (${r.deltaPct != null ? `${r.deltaPct >= 0 ? "+" : ""}${r.deltaPct}%` : "n/a"}).` }))}>
                    <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.text }}>{r.name}</td>
                    <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color: r.a == null ? C.muted : C.textSub }}>{r.a == null ? "—" : fmt(r.a)}</td>
                    <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color: r.b == null ? C.muted : C.textSub }}>{r.b == null ? "—" : fmt(r.b)}</td>
                    <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", fontWeight:700, color: r.delta >= 0 ? C.green : C.red }}>{r.delta >= 0 ? "+" : ""}{fmt(r.delta)}</td>
                    <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:C.muted }}>{r.deltaPct != null ? `${r.deltaPct >= 0 ? "+" : ""}${r.deltaPct}%` : "new"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:15.5, color:C.muted, marginTop:10, lineHeight:1.6 }}>
            {res.onlyB > 0 && <>⚠ {res.onlyB} categor{res.onlyB === 1 ? "y" : "ies"} new in FY{cmp.fyB} and </>}
            {res.onlyA > 0 && <>{res.onlyA} only in FY{cmp.fyA} — </>}
            name-matched comparison; renames across years will show as a disappear/appear pair, not a delta.
          </div>
        </>
      )}
    </Card>
  )
}

// ── 4 · drill-down (dimension tabs, parent → child) ──────────────────────────
export function DrillPanel({ data, fy }: { data: LiveDetail; fy: number }) {
  const C = useTheme()
  const setAgent = useAgentSet()
  const [tab, setTab] = useState<DimKey>("subAgency")
  const [open, setOpen] = useState<Set<string>>(new Set())
  const dim = data.dims[tab]
  const nodes = useMemo(() => [...dim.nodes].sort((x, y) => Math.abs(y.value) - Math.abs(x.value)), [dim])
  const total = nodes.reduce((s, n) => s + Math.max(n.value, 0), 0)
  const max = Math.max(...nodes.map(n => Math.abs(n.value)), 1)
  const toggle = (k: string) => setOpen(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <Card title={`4 · Drill-down (FY${fy})`}
          sub={`${dim.label}${dim.childLabel ? ` → ${dim.childLabel}` : ""} · click a row to expand · hover for the agent's read`}>
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:12 }}>
        {DIM_KEYS.map(k => (
          <button key={k} onClick={() => { setTab(k); setOpen(new Set()) }}
            style={{ padding:"7px 13px", borderRadius:8, fontSize:17, fontWeight: tab === k ? 700 : 500, cursor:"pointer",
                     border:`1px solid ${tab === k ? C.borderAccent : C.border}`, background: tab === k ? `${C.blue}1f` : C.card,
                     color: tab === k ? C.blue : C.muted }}>
            {DIM_ICON[k]} {data.dims[k].label} <span style={{ opacity:0.65 }}>({data.dims[k].nodes.length})</span>
          </button>
        ))}
      </div>
      {!nodes.length ? <div style={{ fontSize:17, color:C.muted }}>No {dim.label.toLowerCase()} rows for FY{fy}.</div> : (
        <div style={{ maxHeight:480, overflowY:"auto", border:`1px solid ${C.border}`, borderRadius:10 }}>
          {nodes.slice(0, 60).map(n => {
            const share = total ? Math.round(Math.max(n.value, 0) / total * 1000) / 10 : 0
            const has = n.children.length > 0
            const isOpen = open.has(n.name)
            const kidMax = Math.max(...n.children.map(c => Math.abs(c.value)), 1)
            return (
              <div key={n.name}>
                <div onClick={() => has && toggle(n.name)}
                  {...agentProps(setAgent, () => liveHover({ dimLabel: dim.label, name: n.name, value: n.value, share, outlays: n.outlays, count: n.count,
                    note: has ? `${n.children.length} ${dim.childLabel.toLowerCase() || "children"} beneath — click to expand.` : undefined }))}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", cursor: has ? "pointer" : "default",
                           borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ width:12, color:C.muted, fontSize:15 }}>{has ? (isOpen ? "▾" : "▸") : "·"}</span>
                  <span style={{ flex:1, fontSize:16, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.name}</span>
                  <div style={{ width:100, height:7, background:C.dim, borderRadius:4, overflow:"hidden", flexShrink:0 }}>
                    <div style={{ width:`${Math.abs(n.value) / max * 100}%`, height:"100%", background: n.value < 0 ? C.red : C.blue }} />
                  </div>
                  <span style={{ width:84, textAlign:"right", fontFamily:"var(--font-mono)", fontSize:15.5, color: n.value < 0 ? C.red : C.cyan, flexShrink:0 }}>{fmt(n.value)}</span>
                  <span style={{ width:46, textAlign:"right", fontSize:15, color:C.muted, flexShrink:0 }}>{share}%</span>
                </div>
                {isOpen && n.children.sort((x, y) => Math.abs(y.value) - Math.abs(x.value)).map(c => {
                  const cShare = n.value ? Math.round(Math.abs(c.value) / Math.abs(n.value) * 1000) / 10 : 0
                  return (
                    <div key={c.name + (c.code ?? "")}
                      {...agentProps(setAgent, () => liveHover({ dimLabel: dim.childLabel || dim.label, name: c.name, value: c.value, share: cShare, outlays: c.outlays, count: c.count, depth: 1 }))}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px 6px 34px",
                               borderBottom:`1px solid ${C.border}`, background:`${C.blue}06` }}>
                      <span style={{ flex:1, fontSize:15.5, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {c.code ? <span style={{ fontFamily:"var(--font-mono)", color:C.muted, marginRight:6 }}>{c.code}</span> : null}{c.name}
                      </span>
                      <div style={{ width:80, height:6, background:C.dim, borderRadius:4, overflow:"hidden", flexShrink:0 }}>
                        <div style={{ width:`${Math.abs(c.value) / kidMax * 100}%`, height:"100%", background:C.purple }} />
                      </div>
                      <span style={{ width:84, textAlign:"right", fontFamily:"var(--font-mono)", fontSize:15, color: c.value < 0 ? C.red : C.textSub, flexShrink:0 }}>{fmt(c.value)}</span>
                      <span style={{ width:46, textAlign:"right", fontSize:14, color:C.muted, flexShrink:0 }}>{cShare}%</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ── 5 · obligation cadence ───────────────────────────────────────────────────
export function CadencePanel({ data }: { data: LiveDetail }) {
  const C = useTheme()
  const setAgent = useAgentSet()
  const withPeriods = data.years.filter(y => y.byPeriod.length >= 6)
  const [fySel, setFySel] = useState(withPeriods.length ? withPeriods[withPeriods.length - 1].fy : "")
  const year = withPeriods.find(y => y.fy === fySel) ?? withPeriods[withPeriods.length - 1]
  const ins = useMemo(() => cadence(year), [year])
  if (!year || !ins) return null
  const chart = year.byPeriod.map(p => ({ period: `P${p.period}`, value: p.obligated / 1e9, q4: p.period >= 10 }))
  const trendChart = data.years.map(y => ({ fy: y.fy.replace("FY20", "FY"), Resources: y.resources / 1e9, Obligated: y.obligated / 1e9 }))
  return (
    <Card title="5 · Obligation Cadence & Trajectory"
          sub="Intra-year burn by GTAS reporting period (left) and the multi-year resources-vs-obligations track (right)">
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10, flexWrap:"wrap" }}>
        <select value={year.fy} onChange={e => setFySel(e.target.value)}
          style={{ background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", fontSize:16, cursor:"pointer" }}>
          {withPeriods.map(y => <option key={y.fy} value={y.fy}>{y.fy}</option>)}
        </select>
        <Badge color={ins.surge === "severe" ? C.red : ins.surge === "elevated" ? C.orange : C.green}>Q4 {ins.q4Share}% · {ins.surge}</Badge>
        <Badge color={C.cyan}>Sep {ins.sepShare}%</Badge>
      </div>
      <Row>
        <div style={{ flex:1.1, minWidth:330 }} {...agentProps(setAgent, { title:`${year.fy} cadence`, lines:[`Q4 ${ins.q4Share}% · Sep ${ins.sepShare}% · Q1 ${ins.q1Share}%`, ins.text] })}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chart}>
              <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
              <XAxis dataKey="period" stroke={C.muted} fontSize={15} />
              <YAxis stroke={C.muted} fontSize={13.5} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name="Obligated">{chart.map((p, i) => <Cell key={i} fill={p.q4 ? C.orange : C.blue} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:15.5, color:C.textSub, lineHeight:1.6, marginTop:8 }}>{ins.text}</div>
        </div>
        <div style={{ flex:1, minWidth:330 }}>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={trendChart}>
              <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
              <XAxis dataKey="fy" stroke={C.muted} fontSize={15} />
              <YAxis stroke={C.muted} fontSize={13.5} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:16 }} />
              <Bar dataKey="Obligated" fill={C.cyan} />
              <Line dataKey="Resources" stroke={C.gold} strokeWidth={2} dot />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ fontSize:15.5, color:C.muted, lineHeight:1.6, marginTop:8 }}>
            Gap between the gold line and the bars = unobligated balance each year. A widening gap with flat obligations = authority arriving faster than execution capacity.
          </div>
        </div>
      </Row>
    </Card>
  )
}

// ── 6b · data ops: quality scorecard + prep pipeline ─────────────────────────
function DataOps({ data, quality, dimKey }: { data: LiveDetail; quality: { score: number; findings: { level: string; title: string; detail: string }[] } | null; dimKey: DimKey }) {
  const C = useTheme()
  const setAgent = useAgentSet()
  const prep = useMemo(() => prepPipeline(data.dims[dimKey]), [data, dimKey])
  const col = (l: string) => l === "warn" ? C.orange : l === "info" ? C.cyan : C.green
  if (!quality) return null
  return (
    <Card title="Data ops — quality & prep" sub={`Scorecard for the live bundle + transparent cleaning of ${data.dims[dimKey].label}`} style={{ flex:1, minWidth:340 }}>
      <div {...agentProps(setAgent, { title:"Quality score", lines:[`${quality.score}/100`, "Composite of dimension coverage, parent/child tie-outs, sign anomalies, and series availability. Deterministic — re-scores on every load."] })}
        style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
        <div style={{ fontSize:40.5, fontWeight:800, fontFamily:"var(--font-mono)", color: quality.score >= 80 ? C.green : quality.score >= 60 ? C.gold : C.red }}>{quality.score}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, color:C.muted, marginBottom:4 }}>BUNDLE QUALITY SCORE / 100</div>
          <div style={{ height:8, background:C.dim, borderRadius:4, overflow:"hidden" }}>
            <div style={{ width:`${quality.score}%`, height:"100%", background: quality.score >= 80 ? C.green : quality.score >= 60 ? C.gold : C.red }} />
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14, maxHeight:230, overflowY:"auto" }}>
        {quality.findings.map((f, i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"7px 10px", background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }}>
            <Badge color={col(f.level)}>{f.level.toUpperCase()}</Badge>
            <div><div style={{ fontSize:15.5, fontWeight:600, color:C.text }}>{f.title}</div>
              <div style={{ fontSize:15, color:C.textSub, marginTop:2, lineHeight:1.5 }}>{f.detail}</div></div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:15, color:C.muted, letterSpacing:"0.08em", marginBottom:8 }}>PREP PIPELINE — {data.dims[dimKey].label.toUpperCase()}</div>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:15.5 }}>
        <thead><tr style={{ color:C.muted, textAlign:"left" }}>
          {["Step", "Rule", "In", "Out"].map(h => <th key={h} style={{ padding:"5px 8px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {prep.steps.map((s, i) => (
            <tr key={i}>
              <td style={{ padding:"5px 8px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:600 }}>{s.name}</td>
              <td style={{ padding:"5px 8px", borderBottom:`1px solid ${C.border}`, color:C.textSub }}>{s.action}</td>
              <td style={{ padding:"5px 8px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.muted }}>{s.before}</td>
              <td style={{ padding:"5px 8px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color: s.after < s.before ? C.orange : C.green }}>{s.after}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize:15, color:C.muted, marginTop:10, lineHeight:1.6 }}>
        Non-destructive — the cleaned set ({prep.clean.length} rows) is what the <b style={{ color:C.text }}>AI/ML Workbench</b> should pool for screens; raw API responses are never modified.
      </div>
    </Card>
  )
}
