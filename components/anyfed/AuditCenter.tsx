"use client"
// components/anyfed/AuditCenter.tsx — audit posture, material weaknesses, FIAR,
// and per-MW deep dives: analysis → Component positions → data & systems →
// Advana solution (AI embedded) → execution plan → LIVE demonstration that
// runs the actual lib/ml/engine models on the bundled sourcedata/ datasets.
import { useMemo, useState } from "react"
import { useTheme, Card, Row, SectionTitle, Badge, KPI, Spinner, Tip, fmtMoney } from "./ui"
import { DOD_MATERIAL_WEAKNESSES, DOD_AUDIT_FACTS, FIAR_PHASES, GUIDANCE_LIBRARY } from "@/lib/fm-content"
import { MW_DEEP_NUMS, getDeep, MWDeep, COMP_STATUS_META, ADVANA_PATTERN, DemoConfig } from "@/lib/audit-solutions"
import { useAgencyData, DodAwards, DodBudget } from "./useAgencyData"
import { benfordTest, detectAnomalies, riskScore, kmeans1d, holtForecast } from "@/lib/ml/engine"
import type { BenfordResult, AnomalyRow, RiskRow, ClusterResult, ForecastResult, SeriesPoint } from "@/lib/ml/engine"
import type { Agency } from "@/lib/agencies"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line, Area,
} from "recharts"

const CATS = ["All", "IT & Systems", "Transactions & Balances", "Reporting & Oversight"] as const

export default function AuditCenter({ agency, onNavigate }: { agency: Agency; onNavigate?: (page: string) => void }) {
  const C = useTheme()
  const [cat, setCat] = useState<typeof CATS[number]>("All")
  const [selected, setSelected] = useState<number | null>(7)
  const isDod = agency.id === "DOD"
  const mws = cat === "All" ? DOD_MATERIAL_WEAKNESSES : DOD_MATERIAL_WEAKNESSES.filter(m => m.category === cat)
  const deep = selected != null ? getDeep(selected) : undefined
  const selMeta = selected != null ? DOD_MATERIAL_WEAKNESSES.find(m => m.num === selected) : undefined

  return (
    <div>
      <SectionTitle title="Audit & Remediation Center"
        sub={isDod
          ? `${DOD_AUDIT_FACTS.report} — FY2025 agency-wide audit. Click a weakness with the 🔬 badge for the full drill-down: analysis → Component positions → systems → Advana solution → plan → live demo.`
          : `Financial statement audit posture — ${agency.abbrev}`} />

      {isDod ? (
        <>
          <Row>
            <KPI icon="📋" label="Opinion" value="Disclaimer" accent={C.red} sub={DOD_AUDIT_FACTS.opinionYears} />
            <KPI icon="🔴" label="Material Weaknesses" value={String(DOD_AUDIT_FACTS.materialWeaknesses)} accent={C.orange}
                 sub={`${DOD_AUDIT_FACTS.significantDeficiencies} significant deficiencies`} />
            <KPI icon="🎯" label="Clean Opinion Deadline" value="Dec 2028" accent={C.gold} sub={`${monthsToDeadline()} months remaining · P.L. 118-31`} />
            <KPI icon="✅" label="Clean Entities Today" value={String(DOD_AUDIT_FACTS.cleanEntities.length)} accent={C.green}
                 sub="incl. USMC pattern, DFAS WCF, USACE-CW" />
          </Row>

          <div style={{ display:"flex", gap:8, margin:"18px 0 12px", flexWrap:"wrap" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                         border:`1px solid ${cat === c ? C.borderAccent : C.border}`,
                         background: cat === c ? `${C.blue}22` : C.card, color: cat === c ? C.blue : C.muted }}>
                {c} {c === "All" ? `(${DOD_MATERIAL_WEAKNESSES.length})` : `(${DOD_MATERIAL_WEAKNESSES.filter(m => m.category === c).length})`}
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:12 }}>
            {mws.map(mw => {
              const hasDeep = MW_DEEP_NUMS.includes(mw.num)
              const on = selected === mw.num
              return (
                <div key={mw.num} onClick={() => hasDeep && setSelected(on ? null : mw.num)}
                  style={{ background: on ? `${C.blue}14` : C.card, border:`1px solid ${on ? C.borderAccent : C.border}`,
                           borderRadius:10, padding:"13px 15px", cursor: hasDeep ? "pointer" : "default",
                           opacity: hasDeep ? 1 : 0.78 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: on ? C.blue : C.text }}>MW #{mw.num} — {mw.title}</div>
                    <Badge color={mw.category === "IT & Systems" ? C.purple : mw.category === "Transactions & Balances" ? C.orange : C.cyan}>
                      {mw.category.split(" ")[0]}
                    </Badge>
                  </div>
                  <div style={{ fontSize:12, color:C.textSub, marginTop:6, lineHeight:1.55 }}>{mw.issue}</div>
                  {hasDeep && <div style={{ fontSize:11, color: on ? C.blue : C.gold, marginTop:8, fontWeight:600 }}>
                    🔬 {on ? "Deep dive open below ▾" : "Click for deep dive: analysis · components · Advana solution · live demo"}</div>}
                </div>
              )
            })}
          </div>

          {deep && selMeta && (
            <>
              <div style={{ height:18 }} />
              <MWDrill deep={deep} title={selMeta.title} issue={selMeta.issue} onNavigate={onNavigate} onClose={() => setSelected(null)} />
            </>
          )}

          <div style={{ height:20 }} />
          <Card title="FIAR Methodology — Path to a Clean Opinion" sub="Assess → Correct → Assert → Sustain · every execution plan above is phased on this framework">
            <Row>
              {FIAR_PHASES.map((p, i) => (
                <div key={p.phase} style={{ flex:1, minWidth:210 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:[C.blue, C.gold, C.green, C.purple][i], marginBottom:6 }}>
                    {i + 1}. {p.phase}
                  </div>
                  <div style={{ fontSize:12, color:C.textSub, lineHeight:1.55 }}>{p.desc}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>📦 {p.deliverables}</div>
                </div>
              ))}
            </Row>
          </Card>
        </>
      ) : (
        <Card title={`${agency.abbrev} Audit Snapshot`}>
          <div style={{ fontSize:13, color:C.textSub, lineHeight:1.8 }}>
            {agency.id === "SEC"
              ? "The SEC has sustained unmodified (clean) opinions on its financial statements; GAO performs the audit. Active OIG engagement areas (T&M contract management, FISMA controls, CAT data) are tracked in the legacy portal's OIG module."
              : `Most CFO Act agencies receive annual financial statement audits under the CFO Act and OMB Bulletin 24-02. Drop ${agency.abbrev} AFR/OIG source documents into sourcedata/ to power a finding-level tracker here. The DoD selection demonstrates the full finding → solution → demo experience.`}
          </div>
        </Card>
      )}

      <div style={{ height:20 }} />
      <Card title="Authoritative Guidance Library" sub="The FM canon — every domain in this portal traces to these authorities">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(270px, 1fr))", gap:12 }}>
          {GUIDANCE_LIBRARY.map(g => (
            <div key={g.title} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.blue }}>{g.title}
                <span style={{ fontSize:11, color:C.muted, fontWeight:400 }}> · {g.cite}</span>
              </div>
              <div style={{ fontSize:11.5, color:C.textSub, marginTop:5, lineHeight:1.5 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function monthsToDeadline(): number {
  const d = new Date(2028, 11, 31)
  const now = new Date()
  return Math.max(0, Math.round((d.getTime() - now.getTime()) / (30.44 * 24 * 3600 * 1000)))
}

// ════════════════════════════════════════════════════════ MW deep-dive panel
const DRILL_TABS = ["Analysis", "Component Positions", "Data & Systems", "Advana Solution", "Execution Plan", "Live Demo"] as const

function MWDrill({ deep, title, issue, onNavigate, onClose }:
  { deep: MWDeep; title: string; issue: string; onNavigate?: (p: string) => void; onClose: () => void }) {
  const C = useTheme()
  const [tab, setTab] = useState<typeof DRILL_TABS[number]>("Analysis")
  return (
    <Card title={`🔬 MW #${deep.num} — ${title}`} sub={issue} accent={C.gold}>
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:14, alignItems:"center" }}>
        {DRILL_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:"7px 13px", borderRadius:8, fontSize:12.5, fontWeight: tab === t ? 700 : 500, cursor:"pointer",
                     border:`1px solid ${tab === t ? C.borderAccent : C.border}`, background: tab === t ? `${C.blue}1f` : C.card,
                     color: tab === t ? C.blue : C.muted }}>{t}</button>
        ))}
        <button onClick={onClose} style={{ marginLeft:"auto", padding:"6px 12px", borderRadius:8, fontSize:12, cursor:"pointer",
                 border:`1px solid ${C.border}`, background:C.card, color:C.muted }}>✕ close</button>
      </div>

      {tab === "Analysis" && (
        <div>
          <div style={{ padding:"10px 13px", background:`${C.red}10`, border:`1px solid ${C.red}44`, borderRadius:9, marginBottom:12, fontSize:12.5, color:C.text }}>
            <b style={{ color:C.red }}>Exposure:</b> {deep.exposure}
          </div>
          <Row>
            {([["Root cause", deep.rootCause, C.orange], ["Criteria not met", deep.criteria, C.cyan], ["Effect", deep.effect, C.purple]] as const).map(([t, body, col]) => (
              <div key={t} style={{ flex:1, minWidth:260, background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"11px 13px" }}>
                <Badge color={col}>{t}</Badge>
                <div style={{ fontSize:12.5, color:C.textSub, lineHeight:1.65, marginTop:7 }}>{body}</div>
              </div>
            ))}
          </Row>
        </div>
      )}

      {tab === "Component Positions" && (
        <div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>
            How each reporting entity stands on this finding in the FY2025 audit cycle — remediation leaders are the playbook for the rest.
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(330px, 1fr))", gap:10 }}>
            {deep.positions.map(p => {
              const meta = COMP_STATUS_META[p.status]
              const col = meta.tone === "red" ? C.red : meta.tone === "orange" ? C.orange : meta.tone === "gold" ? C.gold : meta.tone === "green" ? C.green : C.muted
              return (
                <div key={p.component} style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${col}`, borderRadius:9, padding:"10px 13px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{p.component}</span>
                    <Badge color={col}>{meta.label}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:C.textSub, lineHeight:1.55, marginTop:6 }}>{p.note}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === "Data & Systems" && (
        <div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>
            The system landscape this weakness lives in — feeders on the left must reconcile through the canonical layer to the ledgers and reporting on the right.
          </div>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            {(["feeder", "gl", "treasury", "reporting"] as const).map(kind => {
              const nodes = deep.systems.filter(s => s.kind === kind)
              if (!nodes.length) return null
              const label = kind === "feeder" ? "FEEDER SYSTEMS" : kind === "gl" ? "GENERAL LEDGERS (ERPs)" : kind === "treasury" ? "TREASURY" : "REPORTING / PLATFORM"
              const col = kind === "feeder" ? C.cyan : kind === "gl" ? C.green : kind === "treasury" ? C.gold : C.purple
              return (
                <div key={kind} style={{ flex:1, minWidth:220 }}>
                  <div style={{ fontSize:10.5, color:col, letterSpacing:"0.1em", marginBottom:8, fontWeight:700 }}>{label} {kind === "feeder" ? "→" : kind === "gl" ? "⇄" : ""}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {nodes.map(s => (
                      <div key={s.name} style={{ background:C.card, border:`1px solid ${col}44`, borderRadius:8, padding:"8px 11px" }}>
                        <div style={{ fontSize:12.5, fontWeight:700, color:C.text, fontFamily:"var(--font-mono)" }}>{s.name}</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === "Advana Solution" && (
        <div>
          <div style={{ padding:"10px 13px", background:`${C.blue}10`, border:`1px solid ${C.borderAccent}`, borderRadius:9, marginBottom:14 }}>
            <div style={{ fontSize:11, color:C.muted, letterSpacing:"0.08em", marginBottom:6 }}>THE ADVANA MEDALLION PATTERN</div>
            {ADVANA_PATTERN.map((p, i) => (
              <div key={i} style={{ fontSize:11.5, color:C.textSub, lineHeight:1.7 }}><b style={{ color:C.cyan }}>{i + 1}.</b> {p}</div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {deep.solution.map((s, i) => (
              <div key={i} style={{ display:"flex", gap:12, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
                <div style={{ width:64, flexShrink:0 }}>
                  <Badge color={[C.cyan, C.blue, C.gold, C.green][i % 4]}>{s.layer}</Badge>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>{i + 1}. {s.title}</div>
                  <div style={{ fontSize:12, color:C.textSub, lineHeight:1.6 }}>{s.tech}</div>
                  {s.ai && <div style={{ fontSize:12, color:C.purple, lineHeight:1.6, marginTop:6 }}>
                    🤖 <b>AI embedded:</b> <span style={{ color:C.textSub }}>{s.ai}</span></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Execution Plan" && (
        <div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>
            FIAR-phased to the statutory Dec 31, 2028 clean-opinion deadline ({monthsToDeadline()} months out).
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:10 }}>
            {deep.plan.map((p, i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${[C.blue, C.gold, C.green, C.purple][i % 4]}`, borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{p.phase}</div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>{p.window}</div>
                <ul style={{ margin:0, paddingLeft:16, fontSize:11.5, color:C.textSub, lineHeight:1.7 }}>
                  {p.milestones.map((m, j) => <li key={j} style={{ marginBottom:4 }}>{m}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Live Demo" && <DemoPanel demo={deep.demo} onNavigate={onNavigate} />}
    </Card>
  )
}

// ════════════════════════════════════════════════════ live model demonstration
type DemoResult =
  | { kind: "benford"; r: BenfordResult }
  | { kind: "anomaly"; r: AnomalyRow[]; n: number }
  | { kind: "risk"; r: RiskRow[]; n: number }
  | { kind: "cluster"; r: ClusterResult; n: number }
  | { kind: "forecast"; r: ForecastResult }

function DemoPanel({ demo, onNavigate }: { demo: DemoConfig; onNavigate?: (p: string) => void }) {
  const C = useTheme()
  const awards = useAgencyData<DodAwards>("DOD", "awards")
  const budget = useAgencyData<DodBudget>("DOD", "budget")
  const [result, setResult] = useState<DemoResult | null>(null)
  const [running, setRunning] = useState(false)

  const pools = useMemo(() => {
    const txns = awards.data?.transactions ?? []
    const con = txns.filter(t => t.kind === "contract")
    const asst = txns.filter(t => t.kind === "assistance")
    const exVals: number[] = []; const exLabs: string[] = []
    if (budget.data) Object.values(budget.data.exhibits).forEach(ex => {
      Object.entries(ex.topAccounts).forEach(([fy, accts]) =>
        Object.entries(accts).forEach(([name, v]) => { exVals.push(Math.abs(v)); exLabs.push(`${ex.appn} ${fy} — ${name}`) }))
    })
    const series: SeriesPoint[] = (awards.data?.monthly ?? []).map(m => ({ label: m.month, value: m.total }))
    return { con, asst, all: txns, exVals, exLabs, series }
  }, [awards.data, budget.data])

  const sizes: Record<DemoConfig["dataset"], string> = {
    "txn-contracts": `${pools.con.length} contract transactions`,
    "txn-assistance": `${pools.asst.length} assistance transactions`,
    "txn-all": `${pools.all.length} award transactions`,
    "exhibit-accounts": `${pools.exVals.length} exhibit account-year values`,
    "monthly-series": `${pools.series.length}-point monthly obligation series`,
  }

  const run = () => {
    setRunning(true)
    setTimeout(() => {
      try {
        if (demo.model === "benford") {
          const amounts = demo.dataset === "exhibit-accounts" ? pools.exVals : pools.all.map(t => Math.abs(t.amount))
          setResult({ kind: "benford", r: benfordTest(amounts) })
        } else if (demo.model === "anomaly") {
          const src = demo.dataset === "txn-assistance" ? pools.asst : pools.con
          const amounts = src.map(t => t.amount); const labels = src.map(t => `${t.recipient} · ${t.date}`)
          setResult({ kind: "anomaly", r: detectAnomalies(amounts, labels), n: amounts.length })
        } else if (demo.model === "risk") {
          const counts = new Map<string, number>()
          pools.con.forEach(t => counts.set(t.recipient, (counts.get(t.recipient) ?? 0) + 1))
          const r = riskScore(pools.con.map(t => ({ label:`${t.recipient} · ${t.date} · ${fmtMoney(t.amount)}`, amount:t.amount, date:t.date, counterpartyCount:counts.get(t.recipient) }))).slice(0, 12)
          setResult({ kind: "risk", r, n: pools.con.length })
        } else if (demo.model === "cluster") {
          const amounts = demo.dataset === "exhibit-accounts" ? pools.exVals : pools.all.map(t => Math.abs(t.amount))
          setResult({ kind: "cluster", r: kmeans1d(amounts, 4), n: amounts.length })
        } else if (demo.model === "forecast") {
          setResult({ kind: "forecast", r: holtForecast(pools.series, 4) })
        }
      } finally { setRunning(false) }
    }, 60)
  }

  if (awards.loading || budget.loading) return <Spinner label="Staging bundled sourcedata/ datasets for the demonstration…" />

  return (
    <div>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", flexWrap:"wrap", marginBottom:14 }}>
        <div style={{ flex:1, minWidth:300 }}>
          <div style={{ fontSize:13.5, fontWeight:700, color:C.text, marginBottom:6 }}>▶ {demo.title}</div>
          <div style={{ fontSize:12.5, color:C.textSub, lineHeight:1.65 }}>{demo.rationale}</div>
          <div style={{ fontSize:11.5, color:C.cyan, marginTop:8, fontFamily:"var(--font-mono)" }}>
            dataset: {sizes[demo.dataset]} · computed in-browser by lib/ml/engine — live, not canned
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <button onClick={run} disabled={running}
            style={{ padding:"10px 20px", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer",
                     border:`1px solid ${C.borderAccent}`, background:`${C.blue}26`, color:C.blue }}>
            {running ? "Computing…" : "▶ Run demonstration"}
          </button>
          {onNavigate && (
            <button onClick={() => onNavigate("ml")}
              style={{ padding:"8px 14px", borderRadius:8, fontSize:11.5, cursor:"pointer",
                       border:`1px solid ${C.border}`, background:C.card, color:C.muted }}>
              Open full AI/ML Workbench →
            </button>
          )}
        </div>
      </div>
      {result && <DemoResultView res={result} />}
    </div>
  )
}

function DemoResultView({ res }: { res: DemoResult }) {
  const C = useTheme()
  if (res.kind === "benford") {
    const b = res.r
    return (
      <Card title={`Result — Benford first-digit test`}
            sub={`n=${b.n} · χ²=${b.chi2} vs critical 15.51 (α=0.05) · MAD ${b.mad}% — ${b.conforms ? "population CONFORMS — supports the integrity assertion" : "population DEVIATES — localize and investigate before certifying"}`}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={b.digits}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="digit" stroke={C.muted} fontSize={11} />
            <YAxis stroke={C.muted} fontSize={11} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            <Bar dataKey="expected" name="Benford expected %" fill={C.dim} />
            <Bar dataKey="observed" name="Observed %" fill={b.conforms ? C.green : C.red} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    )
  }
  if (res.kind === "anomaly") {
    return (
      <Card title="Result — outlier flags" sub={`${res.r.length} flags from ${res.n} values (robust z > 3.5 or beyond IQR×3) — in production these are the recon residuals worked first`}>
        <MiniTable head={["Severity", "Item", "Value", "Method"]}
          rows={res.r.slice(0, 10).map(a => [
            <Badge key="b" color={a.score > 8 ? C.red : a.score > 5 ? C.orange : C.gold}>{a.score.toFixed(1)}</Badge>,
            a.label, fmtMoney(a.value), a.method])} />
      </Card>
    )
  }
  if (res.kind === "risk") {
    return (
      <Card title="Result — post-payment review queue" sub={`Top ${res.r.length} of ${res.n} transactions by composite risk — the PIIA sampling frame`}>
        <MiniTable head={["Score", "Transaction", "Risk drivers"]}
          rows={res.r.map(r => [
            <Badge key="b" color={r.score >= 60 ? C.red : r.score >= 35 ? C.orange : C.gold}>{r.score}</Badge>,
            r.label, r.drivers.join(" · ") || "—"])} />
      </Card>
    )
  }
  if (res.kind === "cluster") {
    const k = res.r
    return (
      <Card title="Result — value strata" sub={`k=4 on log₁₀ |amount| over ${res.n} values · converged in ${k.iterations} iterations — count/test effort concentrates in the top strata`}>
        <MiniTable head={["Stratum", "Center", "Range", "Population", "Share"]}
          rows={k.clusters.map((c, i) => [
            <Badge key="b" color={["#22d3ee", "#10b981", "#f59e0b", "#ef4444"][i]}>{["Micro", "Small", "Medium", "Major"][i] ?? `C${i + 1}`}</Badge>,
            fmtMoney(c.center), `${fmtMoney(c.min)} – ${fmtMoney(c.max)}`, String(c.size), `${c.share}%`])} />
      </Card>
    )
  }
  const f = res.r
  const hist = f.history.map(p => ({ label: p.label, actual: p.value }))
  const last = f.history[f.history.length - 1]
  const fc = [{ label: last.label, fc: last.value, lo: last.value, hi: last.value },
              ...f.forecast.map(x => ({ label: x.label, fc: x.value, lo: x.lo, hi: x.hi }))]
  const data = [...hist, ...fc.slice(1)]
  return (
    <Card title="Result — feed-volume forecast" sub={`${f.metrics.method} · MAPE ${f.metrics.mape}% — an actual feed below the lower band triggers the interface alarm`}>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data}>
          <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={C.muted} fontSize={10} />
          <YAxis stroke={C.muted} fontSize={10} tickFormatter={(v: number) => fmtMoney(v)} />
          <Tooltip content={<Tip />} />
          <Legend wrapperStyle={{ fontSize:12 }} />
          <Area dataKey="hi" name="80% hi" stroke="none" fill={`${C.gold}22`} />
          <Area dataKey="lo" name="80% lo" stroke="none" fill={C.bg} />
          <Line dataKey="actual" name="Actual" stroke={C.blue} strokeWidth={2} dot />
          <Line dataKey="fc" name="Forecast" stroke={C.gold} strokeWidth={2} strokeDasharray="6 4" dot />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  )
}

function MiniTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  const C = useTheme()
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:540 }}>
        <thead><tr style={{ color:C.muted, textAlign:"left" }}>
          {head.map(h => <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => (
              <td key={j} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, lineHeight:1.5 }}>{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
