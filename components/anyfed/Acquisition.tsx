"use client"
// components/anyfed/Acquisition.tsx — contracts & assistance analytics
import { useTheme, Card, Row, SectionTitle, SourceTag, Spinner, Tip, fmtMoney, KPI } from "./ui"
import { useAgencyData, DodAwards, LiveAwards } from "./useAgencyData"
import type { Agency } from "@/lib/agencies"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts"

const PIE = ["#0ea5e9","#10b981","#f59e0b","#a78bfa","#f97316","#22d3ee","#ef4444","#6366f1"]

export default function Acquisition({ agency }: { agency: Agency }) {
  if (agency.id === "DOD") return <DodAcquisition />
  return <LiveAcquisition agency={agency} />
}

function HBar({ rows, name }: { rows: { name: string; total: number }[]; name: string }) {
  const C = useTheme()
  const data = rows.slice(0, 10).map(r => ({ name: r.name.length > 28 ? r.name.slice(0, 26) + "…" : r.name, total: r.total }))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
        <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
        <XAxis type="number" stroke={C.muted} fontSize={10} tickFormatter={(v: number) => fmtMoney(v)} />
        <YAxis type="category" dataKey="name" stroke={C.muted} fontSize={10} width={160} />
        <Tooltip content={<Tip />} />
        <Bar dataKey="total" name={name}>
          {data.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function DodAcquisition() {
  const C = useTheme()
  const { data, loading, error } = useAgencyData<DodAwards>("DOD", "awards")
  if (loading) return <Spinner label="Loading USAspending award extracts from sourcedata/…" />
  if (error || !data) return <Card title="Data error"><span style={{ color:C.red, fontSize:13 }}>{error}</span></Card>
  const total = data.transactions.reduce((s, t) => s + t.amount, 0)
  return (
    <div>
      <SectionTitle title="Contracts & Acquisition"
        sub="Prime transaction extracts (contracts + assistance) from the source-data folder" />
      <div style={{ marginBottom:12 }}><SourceTag source={data.source} /></div>
      <Row>
        <KPI icon="📄" label="Contract Actions" value={String(data.counts.contracts)} accent={C.blue} />
        <KPI icon="🤝" label="Assistance Actions" value={String(data.counts.assistance)} accent={C.cyan} />
        <KPI icon="💵" label="Net Obligated (window)" value={fmtMoney(total)} accent={C.green} />
        <KPI icon="🏢" label="Unique Recipients" value={String(new Set(data.transactions.map(t => t.recipient)).size)} accent={C.purple} />
      </Row>
      <div style={{ height:18 }} />
      <Row>
        <Card title="Top Recipients by Obligation" style={{ flex:1, minWidth:340 }}>
          <HBar rows={data.topRecipients} name="Obligated" />
        </Card>
        <Card title="By Awarding Sub-Agency" style={{ flex:1, minWidth:340 }}>
          <HBar rows={data.bySubAgency} name="Obligated" />
        </Card>
      </Row>
      <div style={{ height:14 }} />
      <Row>
        <Card title="By Award / Assistance Type" style={{ flex:1, minWidth:340 }}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.byType.filter(t => t.total > 0).slice(0, 8)} dataKey="total" nameKey="name"
                   innerRadius={55} outerRadius={95} paddingAngle={2}>
                {data.byType.slice(0, 8).map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="By Industry / Program (NAICS · CFDA)" style={{ flex:1, minWidth:340 }}>
          <HBar rows={data.byNaics} name="Obligated" />
        </Card>
      </Row>
      <div style={{ height:14 }} />
      <div style={{ fontSize:12, color:C.muted }}>
        Acquisition-integrity angle: run <b>K-Means segmentation</b> and the <b>Risk Scorer</b> on this population in
        the AI/ML Workbench — category management tiers and post-award review candidates in one pass.
      </div>
    </div>
  )
}

function LiveAcquisition({ agency }: { agency: Agency }) {
  const C = useTheme()
  const { data, loading, error } = useAgencyData<LiveAwards>(agency.id, "awards")
  if (loading) return <Spinner label={`Fetching ${agency.abbrev} award obligations from USAspending.gov…`} />
  if (error || !data) return <Card title="Acquisition"><span style={{ color:C.red, fontSize:13 }}>Live fetch failed: {error}</span></Card>
  return (
    <div>
      <SectionTitle title="Contracts & Acquisition" sub={`${data.fiscalYear} obligations by award category — live`} />
      <div style={{ marginBottom:12 }}><SourceTag source={data.source} /></div>
      <Row>
        <KPI icon="💵" label={`${data.fiscalYear} Award Obligations`} value={fmtMoney(data.total)} accent={C.blue} />
        <KPI icon="🗂️" label="Award Categories" value={String(data.byCategory.length)} accent={C.cyan} />
      </Row>
      <div style={{ height:18 }} />
      <Row>
        <Card title="Obligations by Award Category" style={{ flex:1, minWidth:340 }}>
          <HBar rows={data.byCategory} name="Obligated" />
        </Card>
        {data.bySubAgency.length > 0 && (
          <Card title="Top Sub-Agencies" style={{ flex:1, minWidth:340 }}>
            <HBar rows={data.bySubAgency} name="Obligated" />
          </Card>
        )}
      </Row>
    </div>
  )
}
