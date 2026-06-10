"use client"
// components/anyfed/MLWorkbench.tsx — DataRobot-style AI/ML workbench.
// Select data sources (default: the sourcedata/ folder bundles) → pick a model
// blueprint → Run. Every result is computed in-browser by lib/ml/engine.ts.
import { useMemo, useState } from "react"
import { useTheme, Card, Row, SectionTitle, Badge, Spinner, Tip, fmtMoney } from "./ui"
import { useAgencyData, DodAwards, DodBudget, Txn } from "./useAgencyData"
import { MODEL_BLUEPRINTS, ModelBlueprint } from "@/lib/ml/registry"
import {
  holtForecast, linearForecast, detectAnomalies, benfordTest, kmeans1d, riskScore,
  ForecastResult, AnomalyRow, BenfordResult, ClusterResult, RiskRow, SeriesPoint,
} from "@/lib/ml/engine"
import { BUDGET_HISTORY, OBJECT_CLASS } from "@/lib/sec-data"
import type { Agency } from "@/lib/agencies"
import {
  ComposedChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts"

interface DatasetDef {
  id: string; label: string; agency: string; source: string
  series?: SeriesPoint[]; amounts?: number[]; labels?: string[]; txns?: Txn[]
}

interface RunRecord {
  runId: number; model: ModelBlueprint; datasets: string[]; n: number
  metric: string
  result: { forecast?: ForecastResult; anomalies?: AnomalyRow[]; benford?: BenfordResult; clusters?: ClusterResult; risk?: RiskRow[] }
}

export default function MLWorkbench({ agency }: { agency: Agency }) {
  const C = useTheme()
  const awards = useAgencyData<DodAwards>("DOD", "awards")
  const budget = useAgencyData<DodBudget>("DOD", "budget")
  const [selected, setSelected] = useState<string[]>(["dod_awards_contracts"])
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [activeRun, setActiveRun] = useState<number | null>(null)
  const [running, setRunning] = useState<string | null>(null)

  // ── Build dataset catalog from loaded folder data ────────────────────────
  const datasets: DatasetDef[] = useMemo(() => {
    const out: DatasetDef[] = []
    if (awards.data) {
      const con = awards.data.transactions.filter(t => t.kind === "contract")
      const asst = awards.data.transactions.filter(t => t.kind === "assistance")
      out.push({
        id:"dod_awards_contracts", label:"DoD Contract Prime Transactions", agency:"DOD",
        source:"sourcedata/ · USASPENDING CSVs",
        amounts: con.map(t => t.amount), labels: con.map(t => `${t.recipient} · ${t.date}`), txns: con,
      })
      out.push({
        id:"dod_awards_assistance", label:"DoD Assistance Prime Transactions", agency:"DOD",
        source:"sourcedata/ · USASPENDING CSVs",
        amounts: asst.map(t => t.amount), labels: asst.map(t => `${t.recipient} · ${t.date}`), txns: asst,
      })
      out.push({
        id:"dod_monthly_obligations", label:"DoD Monthly Obligation Series", agency:"DOD",
        source:"sourcedata/ · action-date rollup",
        series: awards.data.monthly.map(m => ({ label: m.month, value: m.total })),
      })
    }
    if (budget.data) {
      const vals: number[] = []; const labs: string[] = []
      Object.values(budget.data.exhibits).forEach(ex => {
        Object.entries(ex.topAccounts).forEach(([fy, accts]) => {
          Object.entries(accts).forEach(([name, v]) => { vals.push(v); labs.push(`${ex.appn} ${fy} — ${name}`) })
        })
      })
      out.push({
        id:"dod_budget_exhibits", label:"DoD Budget Exhibit Accounts (M-1…RF-1)", agency:"DOD",
        source:"sourcedata/ · J-book xlsx", amounts: vals, labels: labs,
        series: Object.entries(budget.data.totalsByFY).map(([fy, v]) => ({ label: fy, value: v })),
      })
    }
    out.push({
      id:"sec_budget_history", label:"SEC Budget History (CBJ)", agency:"SEC",
      source:"sourcedata/ · FY2027 CBJ",
      series: BUDGET_HISTORY.filter(h => h.enacted != null).map(h => ({ label: h.fy, value: h.enacted as number })),
      amounts: BUDGET_HISTORY.flatMap(h => [h.requested, h.enacted ?? 0]).filter(v => v > 0),
      labels: BUDGET_HISTORY.flatMap(h => [`${h.fy} requested`, `${h.fy} enacted`]),
    })
    out.push({
      id:"sec_object_class", label:"SEC Object Class Obligations", agency:"SEC",
      source:"sourcedata/ · FY2027 CBJ",
      amounts: OBJECT_CLASS.flatMap(o => [o.fy25, o.fy26, o.fy27]),
      labels: OBJECT_CLASS.flatMap(o => [`${o.code} ${o.name} FY25`, `${o.code} ${o.name} FY26`, `${o.code} ${o.name} FY27`]),
    })
    return out
  }, [awards.data, budget.data])

  const sel = datasets.filter(d => selected.includes(d.id))
  const pooledAmounts = sel.flatMap(d => d.amounts ?? [])
  const pooledLabels  = sel.flatMap(d => d.labels ?? [])
  const pooledTxns    = sel.flatMap(d => d.txns ?? [])
  const firstSeries   = sel.find(d => d.series && d.series.length >= 3)?.series

  const canRun = (m: ModelBlueprint): boolean => {
    if (m.needs === "series") return !!firstSeries
    if (m.needs === "amounts") return pooledAmounts.length >= 20
    return pooledTxns.length >= 20
  }

  const run = (m: ModelBlueprint) => {
    setRunning(m.id)
    // defer so the spinner paints
    setTimeout(() => {
      try {
        const rec: RunRecord = { runId: Date.now(), model: m, datasets: sel.map(d => d.label), n: 0, metric: "", result: {} }
        if (m.task === "forecasting" && firstSeries) {
          const f = m.id === "holt-es" ? holtForecast(firstSeries, 4) : linearForecast(firstSeries, 4)
          rec.result.forecast = f; rec.n = firstSeries.length
          rec.metric = m.id === "holt-es" ? `MAPE ${f.metrics.mape}%` : `R² ${f.metrics.r2}`
        } else if (m.task === "anomaly") {
          const a = detectAnomalies(pooledAmounts, pooledLabels)
          rec.result.anomalies = a; rec.n = pooledAmounts.length; rec.metric = `${a.length} flags`
        } else if (m.task === "fraud-screen") {
          const b = benfordTest(pooledAmounts)
          rec.result.benford = b; rec.n = b.n; rec.metric = `χ² ${b.chi2} ${b.conforms ? "✓ conforms" : "✗ deviates"}`
        } else if (m.task === "clustering") {
          const k = kmeans1d(pooledAmounts, 4)
          rec.result.clusters = k; rec.n = pooledAmounts.length; rec.metric = `inertia ${k.inertia}`
        } else if (m.task === "risk-scoring") {
          const counts = new Map<string, number>()
          pooledTxns.forEach(t => counts.set(t.recipient, (counts.get(t.recipient) ?? 0) + 1))
          const r = riskScore(pooledTxns.map(t => ({
            label: `${t.recipient} · ${t.date} · ${fmtMoney(t.amount)}`,
            amount: t.amount, date: t.date, counterpartyCount: counts.get(t.recipient),
          }))).slice(0, 25)
          rec.result.risk = r; rec.n = pooledTxns.length
          rec.metric = `${r.filter(x => x.score >= 50).length} high-risk`
        }
        setRuns(prev => [rec, ...prev])
        setActiveRun(rec.runId)
      } catch (e) {
        alert(`Model failed: ${e instanceof Error ? e.message : e}`)
      } finally {
        setRunning(null)
      }
    }, 50)
  }

  const active = runs.find(r => r.runId === activeRun) ?? runs[0]

  if (awards.loading || budget.loading) return <Spinner label="Staging folder datasets for the workbench…" />

  return (
    <div>
      <SectionTitle title="AI / ML Workbench"
        sub="Blueprint-driven models computed live on your selected data sources — DataRobot-style leaderboard, real numbers" />

      {/* 1 ── data sources */}
      <Card title="1 · Data Sources" sub="Default: datasets parsed from the sourcedata/ folder. Multi-select to pool populations.">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:10 }}>
          {datasets.map(d => {
            const on = selected.includes(d.id)
            return (
              <label key={d.id} style={{ display:"flex", gap:10, alignItems:"flex-start", cursor:"pointer",
                       background: on ? `${C.blue}14` : C.card, border:`1px solid ${on ? C.borderAccent : C.border}`,
                       borderRadius:10, padding:"10px 12px" }}>
                <input type="checkbox" checked={on} style={{ marginTop:3 }}
                  onChange={() => setSelected(p => on ? p.filter(x => x !== d.id) : [...p, d.id])} />
                <div>
                  <div style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{d.label}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{d.source}</div>
                  <div style={{ fontSize:11, color:C.cyan, marginTop:3 }}>
                    {d.txns ? `${d.txns.length} txns` : d.amounts ? `${d.amounts.length} values` : ""}
                    {d.series ? `${d.txns || d.amounts ? " · " : ""}${d.series.length}-pt series` : ""}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
        <div style={{ fontSize:11.5, color:C.muted, marginTop:10 }}>
          Pooled: <b style={{ color:C.text }}>{pooledAmounts.length}</b> values · <b style={{ color:C.text }}>{pooledTxns.length}</b> transactions
          {firstSeries ? <> · series ready (<b style={{ color:C.text }}>{firstSeries.length}</b> pts)</> : " · no time series selected"}
        </div>
      </Card>

      <div style={{ height:16 }} />

      {/* 2 ── blueprints */}
      <Card title="2 · Model Blueprints" sub="Each card is a full pipeline. Run executes genuinely — no canned outputs.">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:12 }}>
          {MODEL_BLUEPRINTS.map(m => {
            const ok = canRun(m)
            return (
              <div key={m.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"13px 15px",
                       opacity: ok ? 1 : 0.55 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{m.name}</div>
                  <Badge color={C.purple}>{m.family}</Badge>
                </div>
                <div style={{ fontSize:11.5, color:C.textSub, margin:"7px 0", lineHeight:1.5 }}>{m.useCase}</div>
                <div style={{ fontSize:10.5, color:C.muted, fontFamily:"var(--font-mono)", lineHeight:1.7 }}>
                  {m.blueprint.map((s, i) => <div key={i}>{i + 1}· {s}</div>)}
                </div>
                <button onClick={() => ok && run(m)} disabled={!ok || running === m.id}
                  style={{ marginTop:10, width:"100%", padding:"7px 0", borderRadius:8, fontSize:12.5, fontWeight:700,
                           cursor: ok ? "pointer" : "not-allowed", border:`1px solid ${C.borderAccent}`,
                           background: running === m.id ? C.dim : `${C.blue}26`, color:C.blue }}>
                  {running === m.id ? "Computing…" : ok ? "▶ Run model" : m.needs === "series" ? "Needs a time series" : "Needs ≥20 rows"}
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      <div style={{ height:16 }} />

      {/* 3 ── leaderboard */}
      <Card title="3 · Leaderboard" sub="Every run is logged with its data, population size, and headline metric">
        {!runs.length ? (
          <div style={{ fontSize:12.5, color:C.muted, padding:"12px 0" }}>No runs yet — select data and run a blueprint above.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5, minWidth:640 }}>
              <thead>
                <tr style={{ color:C.muted, textAlign:"left" }}>
                  {["Model", "Task", "Data", "N", "Headline metric", ""].map(h => (
                    <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.runId} style={{ background: active?.runId === r.runId ? `${C.blue}11` : "transparent" }}>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, fontWeight:600, color:C.text }}>{r.model.name}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}><Badge color={C.cyan}>{r.model.task}</Badge></td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, fontSize:11.5 }}>{r.datasets.join(" + ")}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.text }}>{r.n}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.gold, fontFamily:"var(--font-mono)" }}>{r.metric}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>
                      <button onClick={() => setActiveRun(r.runId)}
                        style={{ fontSize:11.5, padding:"4px 10px", borderRadius:6, cursor:"pointer",
                                 border:`1px solid ${C.border}`, background:C.card, color:C.blue }}>view</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {active && (
        <>
          <div style={{ height:16 }} />
          <ResultPanel rec={active} />
        </>
      )}

      <div style={{ height:14 }} />
      <div style={{ fontSize:11.5, color:C.muted }}>
        Decision support only — model outputs inform, humans decide. Pipeline pattern follows AutoML blueprint
        conventions (DataRobot-style); all computation runs locally in lib/ml/engine.ts on the data you selected.
      </div>
    </div>
  )
}

// ── result visualizations ───────────────────────────────────────────────────
function ResultPanel({ rec }: { rec: RunRecord }) {
  const C = useTheme()
  const { forecast, anomalies, benford, clusters, risk } = rec.result

  if (forecast) {
    const hist = forecast.history.map(p => ({ label: p.label, actual: p.value }))
    const last = forecast.history[forecast.history.length - 1]
    const fc = [{ label: last.label, fc: last.value, lo: last.value, hi: last.value },
                ...forecast.forecast.map(f => ({ label: f.label, fc: f.value, lo: f.lo, hi: f.hi }))]
    const data = [...hist, ...fc.slice(1).map(f => ({ ...f }))]
    return (
      <Card title={`Result — ${rec.model.name}`} sub={`${forecast.metrics.method} · MAE ${fmtMoney(forecast.metrics.mae)} · MAPE ${forecast.metrics.mape}% · R² ${forecast.metrics.r2}`}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke={C.muted} fontSize={11} />
            <YAxis stroke={C.muted} fontSize={11} tickFormatter={(v: number) => fmtMoney(v)} />
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

  if (anomalies) {
    return (
      <Card title={`Result — ${rec.model.name}`} sub={`${anomalies.length} anomalies flagged from ${rec.n} values (robust z > 3.5 or beyond IQR×3)`}>
        <ResultTable
          head={["Severity", "Item", "Value", "Method"]}
          rows={anomalies.slice(0, 15).map(a => [
            <Badge key="b" color={a.score > 8 ? C.red : a.score > 5 ? C.orange : C.gold}>{a.score.toFixed(1)}</Badge>,
            a.label, fmtMoney(a.value), a.method,
          ])}
        />
      </Card>
    )
  }

  if (benford) {
    return (
      <Card title={`Result — ${rec.model.name}`}
            sub={`n=${benford.n} · χ²=${benford.chi2} vs critical 15.51 (α=0.05, 8 df) · MAD ${benford.mad}% — ${benford.conforms ? "population CONFORMS to Benford" : "population DEVIATES — investigate"}`}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={benford.digits}>
            <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
            <XAxis dataKey="digit" stroke={C.muted} fontSize={11} />
            <YAxis stroke={C.muted} fontSize={11} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            <Bar dataKey="expected" name="Benford expected %" fill={C.dim} />
            <Bar dataKey="observed" name="Observed %" fill={benford.conforms ? C.green : C.red} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    )
  }

  if (clusters) {
    return (
      <Card title={`Result — ${rec.model.name}`} sub={`k=4 on log₁₀ |amount| · converged in ${clusters.iterations} iterations`}>
        <ResultTable
          head={["Tier", "Center", "Range", "Population", "Share"]}
          rows={clusters.clusters.map((c, i) => [
            <Badge key="b" color={[ "#22d3ee", "#10b981", "#f59e0b", "#ef4444" ][i]}>{["Micro", "Small", "Medium", "Major"][i] ?? `C${i + 1}`}</Badge>,
            fmtMoney(c.center), `${fmtMoney(c.min)} – ${fmtMoney(c.max)}`, String(c.size), `${c.share}%`,
          ])}
        />
      </Card>
    )
  }

  if (risk) {
    return (
      <Card title={`Result — ${rec.model.name}`} sub={`Top ${risk.length} of ${rec.n} transactions, ranked for post-payment review`}>
        <ResultTable
          head={["Score", "Transaction", "Risk drivers"]}
          rows={risk.slice(0, 15).map(r => [
            <Badge key="b" color={r.score >= 60 ? C.red : r.score >= 35 ? C.orange : C.gold}>{r.score}</Badge>,
            r.label,
            r.drivers.join(" · ") || "—",
          ])}
        />
      </Card>
    )
  }
  return null
}

function ResultTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  const C = useTheme()
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:560 }}>
        <thead>
          <tr style={{ color:C.muted, textAlign:"left" }}>
            {head.map(h => <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, lineHeight:1.5 }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
