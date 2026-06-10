"use client"
// components/anyfed/Overview.tsx — Executive overview per selected agency.
import { useTheme, KPI, Card, Row, SectionTitle, SourceTag, Spinner, Tip, fmtMoney, Badge } from "./ui"
import { useAgencyData, DodBudget, LiveBudget } from "./useAgencyData"
import type { Agency } from "@/lib/agencies"
import { BUDGET_HISTORY, BUDGET_SUMMARY } from "@/lib/sec-data"
import { DOD_AUDIT_FACTS } from "@/lib/fm-content"
import {
  ComposedChart, Bar, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, BarChart,
} from "recharts"

const EXHIBIT_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#a78bfa", "#f97316"]

export default function Overview({ agency }: { agency: Agency }) {
  if (agency.id === "DOD") return <DodOverview agency={agency} />
  if (agency.id === "SEC") return <SecOverview agency={agency} />
  return <LiveOverview agency={agency} />
}

// ── DoD: bundled exhibit books ─────────────────────────────────────────────
function DodOverview({ agency }: { agency: Agency }) {
  const C = useTheme()
  const { data, loading, error } = useAgencyData<DodBudget>("DOD", "budget")
  if (loading) return <Spinner label="Loading DoD exhibit books from sourcedata/…" />
  if (error || !data) return <Card title="Data error"><span style={{ color:C.red, fontSize:13 }}>{error}</span></Card>

  const fys = ["FY2024", "FY2025", "FY2026", "FY2027"]
  const trend = fys.map(fy => ({
    fy: fy.replace("FY20", "FY"),
    ...Object.fromEntries(Object.entries(data.exhibits).map(([k, ex]) => [ex.appn, (ex.years[fy] ?? 0) / 1e6])),
    total: (data.totalsByFY[fy] ?? 0) / 1e6,
  }))
  const latest = data.totalsByFY["FY2027"] ?? 0
  const prior  = data.totalsByFY["FY2026"] ?? 0
  const delta  = prior ? ((latest - prior) / prior) * 100 : 0
  const appns = Object.values(data.exhibits).map(e => e.appn)

  return (
    <div>
      <SectionTitle title={`${agency.name} — Executive Overview`}
        sub="PB exhibit books M-1 · O-1 · P-1 · R-1 · RF-1, parsed from the source-data folder" />
      <div style={{ marginBottom:12 }}><SourceTag source={data.source} /></div>
      <Row>
        <KPI icon="💰" label="FY2027 Request (loaded exhibits)" value={fmtMoney(latest, "K")} accent={C.blue}
             sub={`${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs FY2026`} />
        <KPI icon="📊" label="FY2026 Enacted + Spend Plan" value={fmtMoney(prior, "K")} accent={C.cyan}
             sub="Disc. enacted + P.L. 119-21" />
        <KPI icon="🔍" label="Audit Opinion" value="Disclaimer" accent={C.red}
             sub={`${DOD_AUDIT_FACTS.materialWeaknesses} material weaknesses · clean by Dec 2028`} />
        <KPI icon="🏛️" label="Funding Model" value="Appropriated" accent={C.gold}
             sub="Annual + multi-year appropriations" />
      </Row>

      <div style={{ height:18 }} />
      <Card title="Topline by Appropriation Title ($B)" sub="FY2024 actuals → FY2027 request, stacked by exhibit">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={trend}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="fy" stroke={C.muted} fontSize={12} />
            <YAxis stroke={C.muted} fontSize={12} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            {appns.map((ap, i) => (
              <Bar key={ap} dataKey={ap} stackId="a" fill={EXHIBIT_COLORS[i % EXHIBIT_COLORS.length]} />
            ))}
            <Line dataKey="total" name="Total" stroke={C.text} strokeWidth={2} dot />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ height:18 }} />
      <Row>
        <Card title="FY2027 Mix by Military Department" sub="Organization split across loaded exhibits ($B)" style={{ flex:1, minWidth:300 }}>
          <OrgMix data={data} />
        </Card>
        <Card title="Audit & Compliance Posture" sub={DOD_AUDIT_FACTS.report} style={{ flex:1, minWidth:300 }}>
          <div style={{ fontSize:13, color:C.textSub, lineHeight:1.7 }}>
            <div><Badge color={C.red}>Disclaimer of Opinion</Badge> &nbsp;{DOD_AUDIT_FACTS.opinionYears}</div>
            <div style={{ marginTop:10 }}>{DOD_AUDIT_FACTS.cleanGoal}</div>
            <div style={{ marginTop:10 }}>
              <b style={{ color:C.green }}>{DOD_AUDIT_FACTS.cleanEntities.length} entities</b> already hold unmodified
              opinions — including DFAS WCF, Military Retirement Fund, and USACE Civil Works. Their playbooks anchor
              the Department-wide remediation path. Full detail in the <b>Audit</b> module.
            </div>
          </div>
        </Card>
      </Row>
    </div>
  )
}

function OrgMix({ data }: { data: DodBudget }) {
  const C = useTheme()
  const agg: Record<string, number> = {}
  Object.values(data.exhibits).forEach(ex => {
    const orgs = ex.byOrg["FY2027"] ?? {}
    Object.entries(orgs).forEach(([o, v]) => { agg[o] = (agg[o] ?? 0) + v })
  })
  const rows = Object.entries(agg).map(([name, v]) => ({ name, value: v / 1e6 }))
    .sort((a, b) => b.value - a.value)
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} layout="vertical" margin={{ left: 40 }}>
        <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
        <XAxis type="number" stroke={C.muted} fontSize={11} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
        <YAxis type="category" dataKey="name" stroke={C.muted} fontSize={11} width={150} />
        <Tooltip content={<Tip />} />
        <Bar dataKey="value" name="FY2027 ($B)">
          {rows.map((_, i) => <Cell key={i} fill={EXHIBIT_COLORS[i % EXHIBIT_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── SEC: bundled CBJ constants ─────────────────────────────────────────────
function SecOverview({ agency }: { agency: Agency }) {
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
      <Card title="Budget Trajectory ($M) & FTE" sub="Enacted vs. requested, FY2023–FY2027">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={hist}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="fy" stroke={C.muted} fontSize={12} />
            <YAxis yAxisId="m" stroke={C.muted} fontSize={12} />
            <YAxis yAxisId="f" orientation="right" stroke={C.muted} fontSize={12} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            <Bar yAxisId="m" dataKey="requested" name="Requested ($M)" fill={C.dim} />
            <Bar yAxisId="m" dataKey="enacted" name="Enacted ($M)" fill={C.blue} />
            <Line yAxisId="f" dataKey="fte" name="FTE" stroke={C.gold} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ height:14 }} />
      <div style={{ fontSize:12.5, color:C.muted }}>
        Full SEC deep-dive (program analysis, OIG, Section 31 fees, interview prep) remains available in the
        legacy portal: <a href="/sec-cfo" style={{ color:C.blue }}>/sec-cfo</a>
      </div>
    </div>
  )
}

// ── Any other agency: live USAspending fallback ────────────────────────────
function LiveOverview({ agency }: { agency: Agency }) {
  const C = useTheme()
  const { data, loading, error } = useAgencyData<LiveBudget>(agency.id, "budget")
  if (loading) return <Spinner label={`Fetching ${agency.abbrev} budgetary resources from USAspending.gov…`} />
  if (error || !data) return (
    <Card title={`${agency.name}`}>
      <span style={{ color:C.red, fontSize:13 }}>Live fetch failed: {error}. Add an agency folder under
      sourcedata/ to load it as a default source.</span>
    </Card>
  )
  const rows = data.fiscalYears.slice(-8).map(y => ({
    fy: y.fy.replace("FY20", "FY"),
    resources: y.budgetaryResources / 1e9,
    obligated: y.obligated / 1e9,
    rate: y.obligationRate,
  }))
  const last = data.fiscalYears[data.fiscalYears.length - 1]
  return (
    <div>
      <SectionTitle title={`${agency.name} — Executive Overview`}
        sub={`Live budgetary resources & obligations · USAspending toptier ${agency.toptier}`} />
      <div style={{ marginBottom:12 }}><SourceTag source={data.source} /></div>
      <Row>
        <KPI icon="💰" label={`${last?.fy} Budgetary Resources`} value={fmtMoney(last?.budgetaryResources ?? 0)} accent={C.blue} />
        <KPI icon="📊" label={`${last?.fy} Obligated`} value={fmtMoney(last?.obligated ?? 0)} accent={C.cyan}
             sub={last?.obligationRate != null ? `${last.obligationRate}% obligation rate` : undefined} />
        <KPI icon="🏛️" label="Funding Model" value={agency.funding === "fee-funded" ? "Fee-funded" : agency.funding === "mixed" ? "Mixed" : "Appropriated"} accent={C.gold}
             sub={agency.cfoAct ? "CFO Act agency" : "Non-CFO Act agency"} />
      </Row>
      <div style={{ height:18 }} />
      <Card title="Budgetary Resources vs. Obligations ($B)" sub="USAspending GTAS-derived totals by fiscal year">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={rows}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="fy" stroke={C.muted} fontSize={12} />
            <YAxis stroke={C.muted} fontSize={12} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            <Area dataKey="resources" name="Resources ($B)" stroke={C.blue} fill={`${C.blue}33`} strokeWidth={2} />
            <Area dataKey="obligated" name="Obligated ($B)" stroke={C.green} fill={`${C.green}26`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
