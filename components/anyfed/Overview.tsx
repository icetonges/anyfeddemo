"use client"
// components/anyfed/Overview.tsx — Executive overview per selected agency.
// Decision-grade: clickable KPIs with drill-down panels, a CFO decision queue
// computed from the loaded data, and a prioritized action list that navigates
// straight to the page where the work happens.
import { useMemo, useState } from "react"
import { useTheme, KPI, Card, Row, SectionTitle, SourceTag, Spinner, Tip, fmtMoney, Badge } from "./ui"
import { useAgencyData, DodBudget, DodAwards, LiveDetail } from "./useAgencyData"
import type { Agency } from "@/lib/agencies"
import { BUDGET_HISTORY, BUDGET_SUMMARY } from "@/lib/sec-data"
import { DOD_AUDIT_FACTS, DOD_MATERIAL_WEAKNESSES } from "@/lib/fm-content"
import { deptLifecycle } from "@/lib/data-insights"
import AgencyLandscape from "./AgencyLandscape"
import { fmt as fmtLive, resourceTrend, cadence, expertFindings } from "@/lib/live-insights"
import {
  ComposedChart, Bar, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, BarChart,
} from "recharts"

const EXHIBIT_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#a78bfa", "#f97316"]
type Nav = ((page: string) => void) | undefined

export default function Overview({ agency, onNavigate }: { agency: Agency; onNavigate?: (page: string) => void }) {
  if (agency.id === "DOD") return <DodOverview agency={agency} onNavigate={onNavigate} />
  if (agency.id === "SEC") return <SecOverview agency={agency} onNavigate={onNavigate} />
  return <LiveOverview agency={agency} onNavigate={onNavigate} />
}

// ════════════════════════════════════════════ DoD: decision-grade overview
type KpiId = "req27" | "enact26" | "exec25" | "cong26" | "mandatory" | "audit" | "yearend" | "concentration"

function DodOverview({ agency, onNavigate }: { agency: Agency; onNavigate: Nav }) {
  const C = useTheme()
  const { data, loading, error } = useAgencyData<DodBudget>("DOD", "budget")
  const awards = useAgencyData<DodAwards>("DOD", "awards")
  const [drill, setDrill] = useState<KpiId | null>("exec25")

  const stats = useMemo(() => {
    if (!data) return null
    const latest = data.totalsByFY["FY2027"] ?? 0
    const prior  = data.totalsByFY["FY2026"] ?? 0
    const delta  = prior ? ((latest - prior) / prior) * 100 : 0
    const lc = data.lifecycleDept ?? {}
    const execVar25 = lc.FY2025?.execVarPct ?? null
    const cong26 = lc.FY2026?.reqToEnactedPct ?? null
    const dm26 = data.discMandatoryByFY?.FY2026
    const mandShare = dm26 && (dm26.discretionary + dm26.mandatory) > 0
      ? Math.round(dm26.mandatory / (dm26.discretionary + dm26.mandatory) * 1000) / 10 : null
    // FY-Q4 (Jul–Sep) share of monthly award obligations
    let q4Share: number | null = null
    const monthly = awards.data?.monthly ?? []
    if (monthly.length >= 9) {
      const tot = monthly.reduce((s, m) => s + Math.max(m.total, 0), 0)
      const q4 = monthly.filter(m => /-0?(7|8|9)$/.test(m.month)).reduce((s, m) => s + Math.max(m.total, 0), 0)
      if (tot > 0) q4Share = Math.round(q4 / tot * 1000) / 10
    }
    // top org concentration FY2027
    const agg: Record<string, number> = {}
    Object.values(data.exhibits).forEach(ex => Object.entries(ex.byOrg["FY2027"] ?? {}).forEach(([o, v]) => { agg[o] = (agg[o] ?? 0) + v }))
    const orgs = Object.entries(agg).sort((a, b) => b[1] - a[1])
    const orgTotal = orgs.reduce((s, [, v]) => s + v, 0)
    const topOrg = orgs[0] ? { name: orgs[0][0], share: Math.round(orgs[0][1] / orgTotal * 1000) / 10 } : null
    return { latest, prior, delta, execVar25, cong26, dm26, mandShare, q4Share, topOrg, lc }
  }, [data, awards.data])

  if (loading) return <Spinner label="Loading DoD exhibit books from sourcedata/…" />
  if (error || !data || !stats) return <Card title="Data error"><span style={{ color:C.red, fontSize:17.5 }}>{error}</span></Card>

  const mwByCat = ["IT & Systems", "Transactions & Balances", "Reporting & Oversight"].map(cat => ({
    cat, n: DOD_MATERIAL_WEAKNESSES.filter(m => m.category === cat).length }))
  const monthsLeft = Math.max(0, Math.round((new Date(2028, 11, 31).getTime() - Date.now()) / (30.44 * 24 * 3600 * 1000)))

  const kpis: { id: KpiId; icon: string; label: string; value: string; accent: string; sub: string }[] = [
    { id:"req27",   icon:"💰", label:"FY2027 Request", value: fmtMoney(stats.latest, "K"), accent:C.blue, sub:`${stats.delta >= 0 ? "+" : ""}${stats.delta.toFixed(1)}% vs FY2026 · click to decompose` },
    { id:"enact26", icon:"📊", label:"FY2026 Enacted + Spend Plan", value: fmtMoney(stats.prior, "K"), accent:C.cyan, sub:"disc. enacted + P.L. 119-21 mandatory" },
    { id:"exec25",  icon:"⚙️", label:"FY2025 Execution Variance", value: stats.execVar25 != null ? `${stats.execVar25 >= 0 ? "+" : ""}${stats.execVar25}%` : "—", accent: Math.abs(stats.execVar25 ?? 0) > 4 ? C.orange : C.green, sub:"actual vs enacted · the execution report card" },
    { id:"cong26",  icon:"🏛️", label:"FY2026 Congressional Action", value: stats.cong26 != null ? `${stats.cong26 >= 0 ? "+" : ""}${stats.cong26}%` : "—", accent:C.gold, sub:"enacted vs request · hearing posture input" },
    { id:"mandatory", icon:"⚠️", label:"FY2026 Mandatory Share", value: stats.mandShare != null ? `${stats.mandShare}%` : "—", accent:C.orange, sub:"one-time reconciliation money inside the topline" },
    { id:"audit",   icon:"🔍", label:"Audit Opinion", value:"Disclaimer", accent:C.red, sub:`${DOD_AUDIT_FACTS.materialWeaknesses} MWs · ${monthsLeft} months to mandate` },
    { id:"yearend", icon:"📅", label:"FY-Q4 Obligation Share", value: stats.q4Share != null ? `${stats.q4Share}%` : "—", accent: (stats.q4Share ?? 0) > 32 ? C.orange : C.green, sub:"Jul–Sep awards · use-it-or-lose-it signal" },
    { id:"concentration", icon:"🎯", label:"Top Org Share (FY27)", value: stats.topOrg ? `${stats.topOrg.share}%` : "—", accent:C.purple, sub: stats.topOrg?.name ?? "—" },
  ]

  return (
    <div>
      <SectionTitle title={`${agency.name} — Executive Overview`}
        sub="Decision-grade posture from PB2026 + PB2027 exhibit books and award files in sourcedata/. Click any KPI to drill; the decision queue and action list are computed from the same data." />
      <div style={{ marginBottom:12 }}><SourceTag source={data.source} /></div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(225px, 1fr))", gap:12 }}>
        {kpis.map(k => (
          <div key={k.id} onClick={() => setDrill(drill === k.id ? null : k.id)}
            style={{ cursor:"pointer", borderRadius:10, outline: drill === k.id ? `2px solid ${k.accent}` : "none" }}>
            <KPI icon={k.icon} label={k.label} value={k.value} accent={k.accent} sub={k.sub} />
          </div>
        ))}
      </div>

      {drill && <><div style={{ height:14 }} /><DrillPanel id={drill} data={data} stats={stats} mwByCat={mwByCat} onNavigate={onNavigate} /></>}

      <div style={{ height:18 }} />
      <AgencyLandscape agency={agency} onNavigate={onNavigate} />

      <div style={{ height:18 }} />
      <DecisionQueue stats={stats} monthsLeft={monthsLeft} onNavigate={onNavigate} />

      <div style={{ height:18 }} />
      <ActionItems onNavigate={onNavigate} q4Share={stats.q4Share} mandShare={stats.mandShare} execVar={stats.execVar25} />
    </div>
  )
}

// ── KPI drill-down panels ────────────────────────────────────────────────────
function DrillPanel({ id, data, stats, mwByCat, onNavigate }:
  { id: KpiId; data: DodBudget; stats: NonNullable<ReturnType<typeof useDodStatsType>>; mwByCat: { cat: string; n: number }[]; onNavigate: Nav }) {
  const C = useTheme()
  const fys = ["FY2024", "FY2025", "FY2026", "FY2027"]

  if (id === "req27" || id === "enact26") {
    const trend = fys.map(fy => ({
      fy: fy.replace("FY20", "FY"),
      ...Object.fromEntries(Object.entries(data.exhibits).map(([, ex]) => [ex.appn, (ex.years[fy] ?? 0) / 1e6])),
      total: (data.totalsByFY[fy] ?? 0) / 1e6,
    }))
    const appns = Object.values(data.exhibits).map(e => e.appn)
    return (
      <Card title="Drill — topline by appropriation title ($B)" sub="FY2024 actuals → FY2027 request, stacked by exhibit. Full line-item drill in Data Explorer.">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={trend}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="fy" stroke={C.muted} fontSize={16} />
            <YAxis stroke={C.muted} fontSize={16} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:16 }} />
            {appns.map((ap, i) => <Bar key={ap} dataKey={ap} stackId="a" fill={EXHIBIT_COLORS[i % EXHIBIT_COLORS.length]} />)}
            <Line dataKey="total" name="Total" stroke={C.text} strokeWidth={2} dot />
          </ComposedChart>
        </ResponsiveContainer>
        <DrillFoot onNavigate={onNavigate} page="data" label="Open Data Explorer for the 5-level line-item drill →" />
      </Card>
    )
  }

  if (id === "exec25" || id === "cong26") {
    const lc = data.lifecycleDept ?? {}
    const chart = fys.map(fy => ({ fy: fy.replace("FY20", "FY"),
      Request: lc[fy]?.request != null ? lc[fy]!.request! / 1e6 : null,
      Enacted: lc[fy]?.enacted != null ? lc[fy]!.enacted! / 1e6 : null,
      Actual:  lc[fy]?.actuals != null ? lc[fy]!.actuals! / 1e6 : null }))
    const findings = deptLifecycle(data)
    return (
      <Card title="Drill — department budget lifecycle" sub="Request → enacted → actual across vintages: the separation of plan from execution">
        <Row>
          <div style={{ flex:1.2, minWidth:340 }}>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={chart}>
                <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
                <XAxis dataKey="fy" stroke={C.muted} fontSize={16} />
                <YAxis stroke={C.muted} fontSize={15} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize:16 }} />
                <Bar dataKey="Request" fill={C.blue} />
                <Bar dataKey="Enacted" fill={C.gold} />
                <Bar dataKey="Actual" fill={C.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:8 }}>
            {findings.map((f, i) => (
              <div key={i} style={{ padding:"9px 11px", background:C.card, border:`1px solid ${C.border}`, borderRadius:9 }}>
                <Badge color={f.kind === "execution" ? C.green : C.gold}>{f.fy} · {f.kind}</Badge>
                <div style={{ fontSize:16, color:C.textSub, lineHeight:1.55, marginTop:5 }}>{f.text}</div>
              </div>
            ))}
            <div style={{ fontSize:15.5, color:C.muted, lineHeight:1.6 }}>
              Reading: over-execution above enacted implies supplementals/reprogramming; congressional adds above the request shift the FY27 hearing posture.
            </div>
          </div>
        </Row>
        <DrillFoot onNavigate={onNavigate} page="budget" label="Open Budget Lifecycle for formulation → enactment → execution →" />
      </Card>
    )
  }

  if (id === "mandatory") {
    const dm = data.discMandatoryByFY ?? {}
    const chart = Object.entries(dm).map(([fy, v]) => ({ fy: fy.replace("FY20", "FY"), Discretionary: v.discretionary / 1e6, Mandatory: v.mandatory / 1e6 }))
    return (
      <Card title="Drill — discretionary vs P.L. 119-21 mandatory" sub="The mandatory tranche is one-time reconciliation money: strip it before trending, and burn it before it lapses">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chart}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="fy" stroke={C.muted} fontSize={16} />
            <YAxis stroke={C.muted} fontSize={15} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:16 }} />
            <Bar dataKey="Discretionary" stackId="a" fill={C.blue} />
            <Bar dataKey="Mandatory" stackId="a" fill={C.orange} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize:16, color:C.textSub, lineHeight:1.65, marginTop:10 }}>
          Expert read: a {fmtShare(stats.mandShare)} mandatory share inside the FY2026 topline means raw FY25→FY26 growth
          overstates the program trajectory. Variance narratives, CAGR computations, and the FY2027 hearing book must
          present discretionary-only trend lines with the mandatory tranche footnoted separately.
        </div>
        <DrillFoot onNavigate={onNavigate} page="data" label="Open Data Explorer → AI Analysis for per-exhibit mandatory distortion →" />
      </Card>
    )
  }

  if (id === "audit") {
    return (
      <Card title="Drill — material weakness inventory" sub={`${DOD_AUDIT_FACTS.report} · disclaimer every full-scope year since FY2018`}>
        <Row>
          {mwByCat.map((m, i) => (
            <KPI key={m.cat} icon={["🖥️", "💵", "🏛️"][i]} label={m.cat} value={String(m.n)} accent={[C.purple, C.orange, C.cyan][i]} sub="material weaknesses" />
          ))}
          <KPI icon="✅" label="Clean entities" value={String(DOD_AUDIT_FACTS.cleanEntities.length)} accent={C.green} sub="USMC pattern proves the path" />
        </Row>
        <div style={{ fontSize:16, color:C.textSub, lineHeight:1.65, marginTop:12 }}>
          Highest-leverage levers: <b style={{ color:C.text }}>MW #7 Universe of Transactions</b> (unlocks valid sampling for every other balance)
          and <b style={{ color:C.text }}>MW #8 FBwT</b> (the checkbook). The Audit Center carries the full drill-down: Component positions,
          feeder→GL system maps, the Advana solution with embedded AI, the execution plan, and a live model demonstration per weakness.
        </div>
        <DrillFoot onNavigate={onNavigate} page="audit" label="Open the Audit Center deep dives →" />
      </Card>
    )
  }

  if (id === "yearend") {
    return (
      <Card title="Drill — year-end execution posture" sub="FY-Q4 (Jul–Sep) share of award obligations from the bundled USAspending transaction files">
        <div style={{ fontSize:17, color:C.textSub, lineHeight:1.7 }}>
          A Q4 share of <b style={{ color:C.text }}>{fmtShare(stats.q4Share)}</b> against a 25% uniform baseline
          {(stats.q4Share ?? 0) > 32
            ? " is an elevated use-it-or-lose-it signal: expect contract-rush quality risk, improper-payment exposure on September awards, and de-obligation sweep opportunities in Q1. Pre-position post-payment review sampling on September activity now."
            : " is within the disciplined band — spend-plan execution is holding; keep linear burn-rate monitoring."}
        </div>
        <DrillFoot onNavigate={onNavigate} page="intel" label="Open Data Intelligence for the per-period cadence chart →" />
      </Card>
    )
  }

  // concentration
  const agg: Record<string, number> = {}
  Object.values(data.exhibits).forEach(ex => Object.entries(ex.byOrg["FY2027"] ?? {}).forEach(([o, v]) => { agg[o] = (agg[o] ?? 0) + v }))
  const rows = Object.entries(agg).map(([name, v]) => ({ name, value: v / 1e6 })).sort((a, b) => b.value - a.value)
  return (
    <Card title="Drill — FY2027 mix by organization" sub="Where the request concentrates — materiality allocation for audit and review effort follows this">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={rows} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
          <XAxis type="number" stroke={C.muted} fontSize={15} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
          <YAxis type="category" dataKey="name" stroke={C.muted} fontSize={15} width={150} />
          <Tooltip content={<Tip />} />
          <Bar dataKey="value" name="FY2027 ($B)">
            {rows.map((_, i) => <Cell key={i} fill={EXHIBIT_COLORS[i % EXHIBIT_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <DrillFoot onNavigate={onNavigate} page="data" label="Pivot by org → account → budget activity in Data Explorer →" />
    </Card>
  )
}

function DrillFoot({ onNavigate, page, label }: { onNavigate: Nav; page: string; label: string }) {
  const C = useTheme()
  if (!onNavigate) return null
  return (
    <button onClick={() => onNavigate(page)}
      style={{ marginTop:12, padding:"8px 14px", borderRadius:8, fontSize:16, fontWeight:600, cursor:"pointer",
               border:`1px solid ${C.borderAccent}`, background:`${C.blue}14`, color:C.blue }}>{label}</button>
  )
}

// helper type for DrillPanel's stats prop
function useDodStatsType() {
  return null as null | {
    latest: number; prior: number; delta: number; execVar25: number | null; cong26: number | null
    dm26?: { discretionary: number; mandatory: number }; mandShare: number | null
    q4Share: number | null; topOrg: { name: string; share: number } | null
    lc: NonNullable<DodBudget["lifecycleDept"]>
  }
}
const fmtShare = (v: number | null) => (v != null ? `${v}%` : "—")

// ── CFO decision queue ───────────────────────────────────────────────────────
function DecisionQueue({ stats, monthsLeft, onNavigate }:
  { stats: NonNullable<ReturnType<typeof useDodStatsType>>; monthsLeft: number; onNavigate: Nav }) {
  const C = useTheme()
  const cards = [
    { icon:"⚠️", title:"P.L. 119-21 mandatory tranche", page:"budget",
      stat: stats.dm26 ? fmtMoney(stats.dm26.mandatory, "K") : "—",
      decision:"Approve a front-loaded obligation schedule for the one-time mandatory money — it cannot be banked. Monthly burn vs spend plan to the CFO dashboard; unexecutable lines identified by mid-year for reprogramming.",
    },
    { icon:"🏛️", title:"FY2027 request defense", page:"data",
      stat: stats.cong26 != null ? `${stats.cong26 >= 0 ? "+" : ""}${stats.cong26}% hist.` : "—",
      decision:`Congress moved the FY2026 request by ${fmtShare(stats.cong26)}. Build the FY2027 hearing book around the line items Congress historically adjusts — the movers table in Data Explorer is the source list.`,
    },
    { icon:"🔍", title:"Audit remediation portfolio", page:"audit",
      stat:`26 MWs · ${monthsLeft} mo`,
      decision:"Concentrate remediation investment on the two unlock weaknesses (UoT #7, FBwT #8) instead of spreading evenly across 26. The USMC playbook shows sequencing beats coverage. Fund the Advana telemetry layer first.",
    },
    { icon:"📅", title:"Year-end posture", page:"intel",
      stat: fmtShare(stats.q4Share) + " Q4",
      decision:(stats.q4Share ?? 0) > 32
        ? "Set September guardrails now: heightened review thresholds on new-start Q4 awards, pre-positioned PIIA sampling, and a Q1 de-obligation sweep target."
        : "Cadence is disciplined — hold the line; direct review capacity at aged ULOs instead of Q4 volume.",
    },
  ]
  return (
    <Card title="CFO Decision Queue" sub="What the data says is on the desk right now — each card states the decision, not just the number">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(310px, 1fr))", gap:12 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"13px 15px", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
              <span style={{ fontSize:17.5, fontWeight:700, color:C.text }}>{c.icon} {c.title}</span>
              <Badge color={C.cyan}>{c.stat}</Badge>
            </div>
            <div style={{ fontSize:16, color:C.textSub, lineHeight:1.6, flex:1 }}>{c.decision}</div>
            {onNavigate && <button onClick={() => onNavigate(c.page)}
              style={{ marginTop:10, alignSelf:"flex-start", padding:"5px 11px", borderRadius:7, fontSize:15.5, cursor:"pointer",
                       border:`1px solid ${C.border}`, background:"transparent", color:C.blue }}>work it →</button>}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── prioritized action items ─────────────────────────────────────────────────
function ActionItems({ onNavigate, q4Share, mandShare, execVar }:
  { onNavigate: Nav; q4Share: number | null; mandShare: number | null; execVar: number | null }) {
  const C = useTheme()
  const items = [
    { p:1, action:`Obligate the FY2026 mandatory tranche (${fmtShare(mandShare)} of topline) against the spend plan — monthly burn review, unexecutable lines flagged by mid-year`, owner:"OUSD(C) P&FC", due:"Sep 30, 2026", page:"budget" },
    { p:1, action:"Stand up the UoT certification pilot (Army GF + Navy GF): top-20 feed telemetry, canonical crosswalks, first system-generated population cert", owner:"FIAR Directorate / CDAO", due:"Q4 FY2026", page:"audit" },
    { p:2, action:`Pre-position September post-payment sampling${q4Share != null ? ` — Q4 carries ${q4Share}% of award obligations` : ""}; set Q1 de-obligation sweep targets`, owner:"Component FMs / DFAS", due:"Aug 2026", page:"ml" },
    { p:2, action:"Build the FY2027 hearing book from the PB2026→PB2027 movers table — decompose every major delta to line level before appropriators do", owner:"Budget & Approps Affairs", due:"Hearing cycle", page:"data" },
    { p:3, action:`Refresh A-123 RCMs for JV and FBwT controls to align Component CAPs with DODIG-2026-032 NFRs${execVar != null ? `; recalibrate execution-variance triggers off the ${execVar >= 0 ? "+" : ""}${execVar}% FY2025 result` : ""}`, owner:"Component ICOFR leads", due:"Mar 2027", page:"controls" },
    { p:3, action:"Run the Benford + anomaly screens over the FY2026 obligation population quarterly; route flags to the JV risk queue", owner:"Advana FM analytics", due:"Quarterly", page:"ml" },
  ]
  return (
    <Card title="Action Items" sub="Prioritized, owned, dated — click a row to open the page where the work happens">
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:17, minWidth:640 }}>
          <thead><tr style={{ color:C.muted, textAlign:"left" }}>
            {["Pri", "Action", "Owner", "Due", ""].map(h => <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} onClick={() => onNavigate?.(it.page)} style={{ cursor: onNavigate ? "pointer" : "default" }}>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}` }}>
                  <Badge color={it.p === 1 ? C.red : it.p === 2 ? C.orange : C.gold}>P{it.p}</Badge></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, lineHeight:1.55 }}>{it.action}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, whiteSpace:"nowrap" }}>{it.owner}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.muted, whiteSpace:"nowrap" }}>{it.due}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.blue, fontSize:15.5, whiteSpace:"nowrap" }}>{onNavigate ? "open →" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ════════════════════════════════════════════ SEC: bundled CBJ constants
function SecOverview({ agency, onNavigate }: { agency: Agency; onNavigate?: (page: string) => void }) {
  const C = useTheme()
  const hist = BUDGET_HISTORY.map(h => ({ ...h }))
  return (
    <div>
      <SectionTitle title={`${agency.name} — Executive Overview`}
        sub="FY2027 Congressional Budget Justification (April 2026) — from the source-data folder" />
      <div style={{ marginBottom:12 }}><SourceTag source="folder:sourcedata" /></div>
      <Row>
        <KPI icon="💰" label="FY2027 Request" value="$1,908M" accent={C.blue} sub="−11% vs FY2026 enacted" />
        <KPI icon="👥" label="FY2027 FTE" value={String(BUDGET_SUMMARY.fy27FTE)} accent={C.cyan} sub={`${BUDGET_SUMMARY.fy26FTE} in FY2026`} />
        <KPI icon="🔄" label="Carryover → FY27" value={fmtMoney(BUDGET_SUMMARY.fy27Carryover, "K")} accent={C.gold} sub="+$25M prior-year recoveries" />
        <KPI icon="🏛️" label="Funding Model" value="Fee-offset" accent={C.green} sub="Section 31 — $0 net to taxpayers" />
      </Row>
      <div style={{ height:18 }} />
      <AgencyLandscape agency={agency} onNavigate={onNavigate} />
      <div style={{ height:18 }} />
      <Card title="Budget Trajectory ($M) & FTE" sub="Enacted vs. requested, FY2023–FY2027">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={hist}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="fy" stroke={C.muted} fontSize={16} />
            <YAxis yAxisId="m" stroke={C.muted} fontSize={16} />
            <YAxis yAxisId="f" orientation="right" stroke={C.muted} fontSize={16} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:16 }} />
            <Bar yAxisId="m" dataKey="requested" name="Requested ($M)" fill={C.dim} />
            <Bar yAxisId="m" dataKey="enacted" name="Enacted ($M)" fill={C.blue} />
            <Line yAxisId="f" dataKey="fte" name="FTE" stroke={C.gold} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ height:14 }} />
      <div style={{ fontSize:17, color:C.muted }}>
        Full SEC deep-dive (program analysis, OIG, Section 31 fees, interview prep) remains available in the
        legacy portal: <a href="/sec-cfo" style={{ color:C.blue }}>/sec-cfo</a>
      </div>
    </div>
  )
}

// ════════════════════════════ Any other agency: live decision-grade overview
function LiveOverview({ agency, onNavigate }: { agency: Agency; onNavigate: Nav }) {
  const C = useTheme()
  const now = new Date()
  const lastFY = (now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()) - 1
  const { data, loading, error } = useAgencyData<LiveDetail>(agency.id, "detail", `fy=${lastFY}`)
  const trend = useMemo(() => data ? resourceTrend(data.years) : null, [data])
  const cad = useMemo(() => data ? cadence(data.years[data.years.length - 1]) : null, [data])
  const findings = useMemo(() => data ? expertFindings(data) : [], [data])

  if (loading) return <Spinner label={`Building the ${agency.abbrev} live posture from USAspending/GTAS…`} />
  if (error || !data) return (
    <Card title={`${agency.name}`}>
      <span style={{ color:C.red, fontSize:17.5 }}>Live fetch failed: {error}. Add an agency folder under
      sourcedata/ to load it as a default source.</span>
    </Card>
  )

  const rows = data.years.slice(-8).map(y => ({ fy: y.fy.replace("FY20", "FY"), resources: y.resources / 1e9, obligated: y.obligated / 1e9 }))

  return (
    <div>
      <SectionTitle title={`${agency.name} — Executive Overview`}
        sub={`Decision-grade live posture · USAspending toptier ${agency.toptier} · GTAS-derived`} />
      <div style={{ marginBottom:12 }}><SourceTag source={data.source} /></div>
      {trend && (
        <Row>
          <KPI icon="💰" label={`${trend.latest.fy} Resources`} value={fmtLive(trend.latest.resources)} accent={C.blue}
               sub={trend.yoyResources != null ? `${trend.yoyResources >= 0 ? "+" : ""}${trend.yoyResources}% YoY` : "budgetary resources"} />
          <KPI icon="✍️" label="Obligated" value={fmtLive(trend.latest.obligated)} accent={C.cyan} sub={`${trend.latest.rate ?? "—"}% of resources`} />
          <KPI icon="🏦" label="Unobligated" value={fmtLive(trend.carryover)} accent={trend.carryoverShare > 35 ? C.orange : C.green} sub={`${trend.carryoverShare}% carryover`} />
          <KPI icon="📅" label="Q4 Obligation Share" value={cad ? `${cad.q4Share}%` : "—"} accent={cad && cad.q4Share > 32 ? C.orange : C.green}
               sub={cad ? `${cad.surge} cadence` : "intra-year burn"} />
        </Row>
      )}
      <div style={{ height:18 }} />
      <AgencyLandscape agency={agency} onNavigate={onNavigate} />
      <div style={{ height:18 }} />
      <Row>
        <Card title="Resources vs. Obligations ($B)" sub="GTAS-derived totals by fiscal year" style={{ flex:1.2, minWidth:340 }}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={rows}>
              <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
              <XAxis dataKey="fy" stroke={C.muted} fontSize={16} />
              <YAxis stroke={C.muted} fontSize={16} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:16 }} />
              <Area dataKey="resources" name="Resources ($B)" stroke={C.blue} fill={`${C.blue}33`} strokeWidth={2} />
              <Area dataKey="obligated" name="Obligated ($B)" stroke={C.green} fill={`${C.green}26`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Decision support" sub="Expert findings computed from this agency's live bundle" style={{ flex:1, minWidth:320 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {findings.slice(0, 4).map((f, i) => (
              <div key={i} style={{ padding:"9px 11px", background:C.card, border:`1px solid ${C.border}`, borderRadius:9 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <Badge color={f.severity === "high" ? C.red : f.severity === "medium" ? C.orange : C.green}>{f.severity.toUpperCase()}</Badge>
                  <span style={{ fontSize:16, fontWeight:700, color:C.text }}>{f.title}</span>
                </div>
                <div style={{ fontSize:15.5, color:C.textSub, lineHeight:1.55 }}>{f.text}</div>
              </div>
            ))}
            {onNavigate && <button onClick={() => onNavigate("intel")}
              style={{ alignSelf:"flex-start", padding:"7px 13px", borderRadius:8, fontSize:16, fontWeight:600, cursor:"pointer",
                       border:`1px solid ${C.borderAccent}`, background:`${C.blue}14`, color:C.blue }}>
              Full profile, drill-down & comparison in Data Intelligence →</button>}
          </div>
        </Card>
      </Row>
      <div style={{ height:18 }} />
      <Card title="Action Items" sub="Generated from the live findings — owners per the standard CFO org model">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:17, minWidth:600 }}>
            <thead><tr style={{ color:C.muted, textAlign:"left" }}>
              {["Pri", "Action", "Owner", ""].map(h => <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {findings.slice(0, 5).map((f, i) => (
                <tr key={i} onClick={() => onNavigate?.("intel")} style={{ cursor: onNavigate ? "pointer" : "default" }}>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}` }}>
                    <Badge color={f.severity === "high" ? C.red : f.severity === "medium" ? C.orange : C.gold}>
                      {f.severity === "high" ? "P1" : f.severity === "medium" ? "P2" : "P3"}</Badge></td>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, lineHeight:1.55 }}>
                    {actionFor(f.area, agency.abbrev)}</td>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, whiteSpace:"nowrap" }}>{ownerFor(f.area)}</td>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.blue, fontSize:15.5 }}>{onNavigate ? "open →" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function actionFor(area: string, abbrev: string): string {
  switch (area) {
    case "Resources": return `Reconcile ${abbrev} unobligated balance composition (annual vs multi-year vs no-year) and set obligation-plan checkpoints for the carryover`
    case "Cadence": return `Review Q4 obligation concentration: pre-position post-payment sampling on September awards and set year-end review thresholds`
    case "Liquidation": return `Run an undelivered-orders (ULO) validation on the slowest-liquidating accounts — confirm obligations are still valid or de-obligate`
    case "Cost structure": return `Align spend-category management to the cost-driver mix: build the variance narrative per object-class group, not at the topline`
    case "Accounts": return `Decompose account concentration before the next variance cycle — aggregate moves are driven by the top accounts`
    case "Organization": return `Start component-level execution reviews with the dominant sub-organization; the rest are immaterial to the aggregate`
    default: return `Investigate: ${area}`
  }
}
function ownerFor(area: string): string {
  switch (area) {
    case "Resources": return "Budget Officer"
    case "Cadence": return "Exec. Office / FM Ops"
    case "Liquidation": return "Accounting / Funds Control"
    case "Cost structure": return "CFO Analytics"
    case "Accounts": return "Reporting & Analysis"
    case "Organization": return "Component CFOs"
    default: return "CFO"
  }
}
