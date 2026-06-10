"use client"
// components/anyfed/FinOps.tsx — Finance operations: DTS travel, GTC, GPC
import { useTheme, Card, Row, SectionTitle, Badge, KPI, Tip } from "./ui"
import { FINOPS_PROGRAMS } from "@/lib/fm-content"
import type { Agency } from "@/lib/agencies"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

// Illustrative operating metrics modeled on published DoD/GSA SmartPay benchmark ranges.
const GTC_DELINQ = [
  { month:"Oct", "30+ days": 2.1, "60+ days": 0.9 }, { month:"Nov", "30+ days": 2.4, "60+ days": 1.0 },
  { month:"Dec", "30+ days": 2.9, "60+ days": 1.3 }, { month:"Jan", "30+ days": 2.6, "60+ days": 1.2 },
  { month:"Feb", "30+ days": 2.2, "60+ days": 0.9 }, { month:"Mar", "30+ days": 2.0, "60+ days": 0.8 },
]
const DTS_CYCLE = [
  { month:"Oct", days: 7.2 }, { month:"Nov", days: 6.8 }, { month:"Dec", days: 8.1 },
  { month:"Jan", days: 6.4 }, { month:"Feb", days: 5.9 }, { month:"Mar", days: 5.6 },
]

export default function FinOps({ agency }: { agency: Agency }) {
  const C = useTheme()
  return (
    <div>
      <SectionTitle title="Finance Operations"
        sub="Travel (DTS/E2/ConcurGov), Government Travel Charge Card, and Government Purchase Card programs" />
      <div style={{ fontSize:15.5, color:C.muted, marginBottom:14 }}>
        Metrics below are illustrative, modeled on published SmartPay / DTMO benchmark ranges — wire your agency&apos;s
        card-issuer and travel-system feeds to make them live.
      </div>

      <Row>
        {FINOPS_PROGRAMS.map(p => (
          <Card key={p.id} title={`${p.icon} ${p.name}`} style={{ flex:1, minWidth:280 }}>
            <div style={{ fontSize:17, color:C.textSub, lineHeight:1.6, marginBottom:10 }}>{p.desc}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {p.kpis.map(k => <Badge key={k} color={C.cyan}>{k}</Badge>)}
            </div>
          </Card>
        ))}
      </Row>

      <div style={{ height:18 }} />
      <Row>
        <KPI icon="✈️" label="DTS Voucher Cycle Time" value="5.6 days" accent={C.green} sub="↓ from 7.2 in Oct — target ≤ 8" />
        <KPI icon="💳" label="GTC 30+ Day Delinquency" value="2.0%" accent={C.gold} sub="DoD goal < 2.25% · salary offset active" />
        <KPI icon="🛒" label="GPC Data-Mining Flag Rate" value="1.3%" accent={C.cyan} sub="Flags adjudicated in 30 days (A-123 App B)" />
        <KPI icon="🔁" label="Split Disbursement" value="Enabled" accent={C.purple} sub="Card balance paid direct from voucher" />
      </Row>

      <div style={{ height:18 }} />
      <Row>
        <Card title="GTC Delinquency Trend (%)" sub="Individually billed accounts — 30/60 day buckets" style={{ flex:1, minWidth:320 }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={GTC_DELINQ}>
              <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke={C.muted} fontSize={15} />
              <YAxis stroke={C.muted} fontSize={15} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:16 }} />
              <Bar dataKey="30+ days" fill={C.gold} />
              <Bar dataKey="60+ days" fill={C.red} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="DTS Voucher Cycle Time (days)" sub="Submission → payment, monthly average" style={{ flex:1, minWidth:320 }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={DTS_CYCLE}>
              <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke={C.muted} fontSize={15} />
              <YAxis stroke={C.muted} fontSize={15} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="days" name="Cycle days" fill={C.blue} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Row>

      <div style={{ height:16 }} />
      <Card title="Program Integrity Hooks" sub="Where the AI/ML Workbench plugs into finance operations">
        <div style={{ fontSize:17, color:C.textSub, lineHeight:1.9 }}>
          • <b style={{ color:C.text }}>Transaction Risk Scorer</b> → GPC/DTS post-payment review sampling (replaces random sampling with risk-ranked)<br />
          • <b style={{ color:C.text }}>Benford first-digit test</b> → screen monthly disbursement populations for fabricated amounts<br />
          • <b style={{ color:C.text }}>Robust-Z anomaly detector</b> → catch card-spend spikes per cardholder/merchant-category<br />
          • <b style={{ color:C.text }}>Holt forecaster</b> → project travel obligation burn vs. budget authority by quarter
        </div>
      </Card>
    </div>
  )
}
