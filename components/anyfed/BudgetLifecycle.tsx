"use client"
// components/anyfed/BudgetLifecycle.tsx — Formulation · Enactment · Execution
import { useState } from "react"
import { useTheme, Card, Row, SectionTitle, SourceTag, Spinner, Tip, fmtMoney, Badge, KPI } from "./ui"
import { useAgencyData, DodBudget, DodAwards, LiveDetail } from "./useAgencyData"
import { A11_PHASES } from "@/lib/fm-content"
import BudgetBriefing from "./BudgetBriefing"
import type { Agency } from "@/lib/agencies"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend, ReferenceLine,
} from "recharts"

const TABS = ["Formulation", "Enactment", "Execution"] as const
type Tab = typeof TABS[number]

export default function BudgetLifecycle({ agency }: { agency: Agency }) {
  const C = useTheme()
  const [tab, setTab] = useState<Tab>("Execution")
  return (
    <div>
      <SectionTitle title="Budget Lifecycle"
        sub="OMB Circular A-11 — formulation, congressional enactment, and year-of-execution management" />

      <BudgetBriefing agency={agency} />
      <div style={{ height:18 }} />

      {/* A-11 phase strip */}
      <Row>
        {A11_PHASES.map((p, i) => (
          <div key={p.phase} style={{ flex:1, minWidth:200, background:C.card, borderRadius:10,
                border:`1px solid ${C.border}`, padding:"12px 14px" }}>
            <div style={{ fontSize:16, fontWeight:700, color:[C.blue, C.gold, C.green, C.purple][i] }}>
              {i + 1}. {p.phase} <span style={{ color:C.muted, fontWeight:400 }}>· {p.window}</span>
            </div>
            <div style={{ fontSize:15.5, color:C.textSub, marginTop:5, lineHeight:1.5 }}>{p.desc}</div>
          </div>
        ))}
      </Row>

      <div style={{ display:"flex", gap:8, margin:"20px 0 16px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:"8px 18px", borderRadius:8, fontSize:17.5, fontWeight:600, cursor:"pointer",
                     border:`1px solid ${tab === t ? C.borderAccent : C.border}`,
                     background: tab === t ? `${C.blue}22` : C.card,
                     color: tab === t ? C.blue : C.muted }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Formulation" && <Formulation agency={agency} />}
      {tab === "Enactment"   && <Enactment agency={agency} />}
      {tab === "Execution"   && <Execution agency={agency} />}
    </div>
  )
}

// ── Formulation ────────────────────────────────────────────────────────────
function Formulation({ agency }: { agency: Agency }) {
  const C = useTheme()
  const { data, loading } = useAgencyData<DodBudget>("DOD", "budget")
  const isDod = agency.id === "DOD"
  return (
    <div>
      <Row>
        <Card title="Formulation Calendar (FY2029 cycle)" sub="Key A-11 milestones" style={{ flex:1, minWidth:300 }}>
          {[
            ["Spring 2027", "OMB Spring guidance · agency planning targets"],
            ["Jun–Aug 2027", "Program/budget reviews (DoD: POM + BES under PPBE)"],
            ["Sep 2027", "Agency submission to OMB (A-11 §25)"],
            ["Nov–Dec 2027", "OMB passback → agency appeals"],
            ["Feb 2028", "President's Budget transmitted to Congress"],
          ].map(([when, what]) => (
            <div key={when} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ minWidth:110, fontSize:16, fontWeight:600, color:C.gold }}>{when}</div>
              <div style={{ fontSize:17, color:C.textSub }}>{what}</div>
            </div>
          ))}
        </Card>
        {isDod && (
          <Card title="Request Build — FY2027 Topline by Exhibit" sub="What the J-books in sourcedata/ request ($B)"
                style={{ flex:1, minWidth:320 }}>
            {loading || !data ? <Spinner /> : <ExhibitBars data={data} fy="FY2027" />}
          </Card>
        )}
        {!isDod && (
          <Card title={`${agency.abbrev} Formulation Notes`} style={{ flex:1, minWidth:320 }}>
            <div style={{ fontSize:17.5, color:C.textSub, lineHeight:1.7 }}>
              {agency.funding === "fee-funded"
                ? `${agency.abbrev} is fee-funded — formulation still follows A-11, but the request is offset by collections (deficit-neutral posture). Congressional approval sets the obligation ceiling.`
                : `${agency.abbrev} formulates under standard A-11 discretionary rules: current services baseline, program increases/decreases, and capped topline negotiated at passback.`}
              <div style={{ marginTop:10 }}>
                Drop a <b>{agency.abbrev}</b> folder into <code>sourcedata/</code> and re-run the ETL to power this
                view from actual CBJ exhibits.
              </div>
            </div>
          </Card>
        )}
      </Row>
    </div>
  )
}

function ExhibitBars({ data, fy }: { data: DodBudget; fy: string }) {
  const C = useTheme()
  const rows = Object.values(data.exhibits)
    .map(ex => ({ name: ex.appn, value: (ex.years[fy] ?? 0) / 1e6 }))
    .sort((a, b) => b.value - a.value)
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={rows} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
        <XAxis type="number" stroke={C.muted} fontSize={15} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
        <YAxis type="category" dataKey="name" stroke={C.muted} fontSize={15} width={90} />
        <Tooltip content={<Tip />} />
        <Bar dataKey="value" name={`${fy} ($B)`}>
          {rows.map((_, i) => <Cell key={i} fill={["#0ea5e9","#10b981","#f59e0b","#a78bfa","#f97316"][i % 5]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Enactment ──────────────────────────────────────────────────────────────
function Enactment({ agency }: { agency: Agency }) {
  const C = useTheme()
  const { data, loading } = useAgencyData<DodBudget>("DOD", "budget")
  const isDod = agency.id === "DOD"
  return (
    <Row>
      <Card title="Congressional Process Tracker" sub="FY2027 appropriations status (illustrative timeline)" style={{ flex:1.2, minWidth:320 }}>
        {[
          ["President's Budget", "Transmitted Apr 2026 (late cycle)", "done"],
          ["302(a)/302(b) Allocations", "Budget Committee → subcommittee caps", "done"],
          ["House Subcommittee Markup", "Defense bill reported out", "done"],
          ["Senate Subcommittee Markup", "Scheduled — June 2026", "active"],
          ["Conference / Final Passage", "Target before Oct 1; CR risk if slipped", "pending"],
          ["Enactment", "P.L. signed → OMB apportionment begins", "pending"],
        ].map(([step, note, st]) => (
          <div key={step} style={{ display:"flex", gap:12, alignItems:"center", padding:"9px 0",
                borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0,
                  background: st === "done" ? C.green : st === "active" ? C.gold : C.dim }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:17.5, fontWeight:600, color:C.text }}>{step}</div>
              <div style={{ fontSize:15.5, color:C.muted }}>{note}</div>
            </div>
            {st === "active" && <Badge color={C.gold}>IN PROGRESS</Badge>}
          </div>
        ))}
      </Card>
      <Card title={isDod ? "Enacted vs. Request by Exhibit ($B)" : "Enactment Watchpoints"} style={{ flex:1, minWidth:320 }}>
        {isDod ? (
          loading || !data ? <Spinner /> : <EnactedVsRequest data={data} />
        ) : (
          <div style={{ fontSize:17.5, color:C.textSub, lineHeight:1.8 }}>
            <div>• Continuing Resolution risk — obligation at prior-year rate, no new starts</div>
            <div>• Conference adds/cuts vs. request — model ±10% scenarios</div>
            <div>• Rescissions and transfers in general provisions</div>
            <div>• {agency.funding === "fee-funded" ? "Fee rate adjustments to match enacted ceiling" : "Apportionment timing once enacted (A-11 §120)"}</div>
          </div>
        )}
      </Card>
    </Row>
  )
}

function EnactedVsRequest({ data }: { data: DodBudget }) {
  const C = useTheme()
  const rows = Object.values(data.exhibits).map(ex => ({
    name: ex.appn,
    "FY2026 Enacted": (ex.years["FY2026"] ?? 0) / 1e6,
    "FY2027 Request": (ex.years["FY2027"] ?? 0) / 1e6,
  }))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows}>
        <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke={C.muted} fontSize={15} />
        <YAxis stroke={C.muted} fontSize={15} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize:16 }} />
        <Bar dataKey="FY2026 Enacted" fill={C.dim} />
        <Bar dataKey="FY2027 Request" fill={C.blue} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Execution ──────────────────────────────────────────────────────────────
function Execution({ agency }: { agency: Agency }) {
  const C = useTheme()
  const isDod = agency.id === "DOD"
  const awards = useAgencyData<DodAwards>("DOD", "awards")
  const live = useAgencyData<LiveDetail>(agency.id, "detail")

  if (isDod) {
    if (awards.loading || !awards.data) return <Spinner label="Loading obligation transactions…" />
    const m = awards.data.monthly.map(x => ({ month: x.month, obligations: x.total / 1e6 }))
    const total = awards.data.monthly.reduce((s, x) => s + x.total, 0)
    return (
      <div>
        <div style={{ marginBottom:12 }}><SourceTag source={awards.data.source} /></div>
        <Row>
          <KPI icon="🧾" label="Transactions Loaded" value={String(awards.data.counts.contracts + awards.data.counts.assistance)}
               accent={C.blue} sub={`${awards.data.counts.contracts} contract · ${awards.data.counts.assistance} assistance`} />
          <KPI icon="💸" label="Net Obligations (window)" value={fmtMoney(total)} accent={C.green}
               sub="USAspending prime transaction extract" />
          <KPI icon="⚠️" label="ADA Discipline" value="§1341" accent={C.red}
               sub="No obligation may exceed apportionment" />
        </Row>
        <div style={{ height:16 }} />
        <Card title="Monthly Obligation Flow ($M)" sub="Prime transaction federal action obligations by action month">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={m}>
              <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke={C.muted} fontSize={15} />
              <YAxis stroke={C.muted} fontSize={15} tickFormatter={(v: number) => `$${v.toFixed(0)}M`} />
              <Tooltip content={<Tip />} />
              <Line dataKey="obligations" name="Obligations ($M)" stroke={C.blue} strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <div style={{ height:14 }} />
        <div style={{ fontSize:16, color:C.muted }}>
          Run the <b>AI/ML Workbench → Holt forecast</b> on this series to project burn to year-end with prediction
          intervals — the live ADA early-warning pattern.
        </div>
      </div>
    )
  }

  // live agencies (incl. SEC): GTAS-derived obligation rate from the detail slice
  if (live.loading) return <Spinner label="Loading live execution data…" />
  const years = live.data?.years ?? []
  if (!years.length) return (
    <Card title="Execution data">
      <div style={{ fontSize:17.5, color:C.textSub, lineHeight:1.7 }}>
        No GTAS budgetary-resources series available for {agency.abbrev} yet — USAspending may not publish
        this agency&apos;s detail. The Data Intelligence page shows whatever live dimensions exist.
      </div>
    </Card>
  )
  const rows = years.slice(-8).map(y => ({ fy: y.fy.replace("FY20", "FY"), rate: y.rate ?? 0 }))
  return (
    <div>
      <div style={{ marginBottom:12 }}><SourceTag source={live.data?.source} /></div>
      <Card title="Obligation Rate by Fiscal Year (%)" sub="Obligations ÷ total budgetary resources — USAspending live">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rows}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="fy" stroke={C.muted} fontSize={15} />
            <YAxis stroke={C.muted} fontSize={15} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip content={<Tip />} />
            <ReferenceLine y={100} stroke={C.red} strokeDasharray="4 4" />
            <Bar dataKey="rate" name="Obligation rate (%)" fill={C.green} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
