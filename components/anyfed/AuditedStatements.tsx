"use client"
// components/anyfed/AuditedStatements.tsx — the ACTUAL audited Statements of
// Net Cost (Treasury Fiscal Data, GAO-audited Financial Report), rendered
// year by year with agency breakdown, 10-year trend, disconnect analysis vs
// the budgetary (GTAS) data, and the technical solution for working both.
// Exports AuditedHighlight for the Executive Overview.
import { useMemo, useState } from "react"
import { useTheme, Card, Row, KPI, Badge, Spinner, Tip } from "./ui"
import { useAgencyData, LiveDetail } from "./useAgencyData"
import type { Agency } from "@/lib/agencies"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface SncRow {
  record_date: string; stmt_fiscal_year: string; restmt_flag: string; agency_nm: string
  gross_cost_bil_amt: string; earned_revenue_bil_amt: string
  change_assumptions_bil_amt: string; net_cost_bil_amt: string
  record_fiscal_quarter: string
}
interface SncData { source: string; unit: string; rows: SncRow[] }
const f = (v: string) => { const n = parseFloat(v); return isFinite(n) ? n : 0 }
const B = 1e9

function matchAgency(rows: SncRow[], agency: Agency): string | null {
  const names = Array.from(new Set(rows.map(r => r.agency_nm)))
  return names.find(n => n === agency.name)
      ?? names.find(n => n.toLowerCase().includes(agency.abbrev.toLowerCase()) || agency.name.toLowerCase().includes(n.toLowerCase()))
      ?? null
}

export default function AuditedStatements({ agency }: { agency: Agency }) {
  const C = useTheme()
  const snc = useAgencyData<SncData>("ALL", "statements")
  const detail = useAgencyData<LiveDetail>(agency.id, "detail")
  const years = useMemo(() => Array.from(new Set((snc.data?.rows ?? []).map(r => r.stmt_fiscal_year))).sort().reverse(), [snc.data])
  const [fy, setFy] = useState<string>("")
  const year = fy || years[0]
  const frName = useMemo(() => snc.data ? matchAgency(snc.data.rows, agency) : null, [snc.data, agency])

  const model = useMemo(() => {
    if (!snc.data || !year) return null
    const yrRows = snc.data.rows.filter(r => r.stmt_fiscal_year === year && r.agency_nm && !/total/i.test(r.agency_nm))
      .sort((a, b) => f(b.net_cost_bil_amt) - f(a.net_cost_bil_amt))
    const govTotal = yrRows.reduce((s, r) => s + f(r.net_cost_bil_amt), 0)
    // 10-yr trend + disconnect for the selected agency
    const mine = frName ? snc.data.rows.filter(r => r.agency_nm === frName).sort((a, b) => a.stmt_fiscal_year.localeCompare(b.stmt_fiscal_year)) : []
    const trend = mine.slice(-10).map(r => {
      const g = detail.data?.years.find(y => y.fy === `FY${r.stmt_fiscal_year}`)
      const acctOutlays = undefined // account outlays only available for fetched FY; obligations cover all years
      return { fy: `FY${r.stmt_fiscal_year.slice(2)}`, netCost: f(r.net_cost_bil_amt),
               grossCost: f(r.gross_cost_bil_amt), earnedRev: f(r.earned_revenue_bil_amt),
               assumptions: f(r.change_assumptions_bil_amt), restated: r.restmt_flag === "Y",
               obligations: g ? g.obligated / B : null, _x: acctOutlays }
    })
    const disconnects = trend.filter(t => t.obligations != null).map(t => ({
      ...t, delta: t.obligations! - t.netCost,
      ratio: t.netCost ? Math.round(t.obligations! / t.netCost * 1000) / 10 : null,
    }))
    return { yrRows, govTotal, trend, disconnects }
  }, [snc.data, year, frName, detail.data])

  if (snc.loading) return <Spinner label="Loading audited Statements of Net Cost (Treasury Fiscal Data)…" />
  if (snc.error || !snc.data) return <Card title="Audited statements" accent={C.red}><div style={{ fontSize:15, color:C.red }}>Fiscal Data fetch failed: {snc.error}</div></Card>

  return (
    <Card title="📜 Audited Statements of Net Cost — the actual statement, by agency, by year"
          sub="GAO-audited Financial Report of the U.S. Government (accrual basis, $ billions). Statements are AUDITED ANNUALLY as of Sep 30 — no quarterly audited statements exist; the quarterly cash view is the Monthly Treasury Statement (proposed below).">
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:12 }}>
        <span style={{ fontSize:14.5, color:C.muted }}>Statement year (audited, as of Sep 30)</span>
        <select value={year} onChange={e => setFy(e.target.value)}
          style={{ background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 11px", fontSize:15, cursor:"pointer" }}>
          {years.map(y => <option key={y} value={y}>FY{y}{y === years[0] ? " — latest audited" : ""}</option>)}
        </select>
        <Badge color={C.purple}>source: fiscaldata v2 statement_net_cost · audited</Badge>
        {frName ? <Badge color={C.green}>{agency.abbrev} = FR entity “{frName}”</Badge>
                : <Badge color={C.gold}>{agency.abbrev} not separately reported in the FR (rolled into “All other entities”)</Badge>}
      </div>

      {/* the statement itself */}
      {model && (
        <div style={{ overflowX:"auto", maxHeight:380, overflowY:"auto", marginBottom:8 }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14, minWidth:720 }}>
            <thead><tr style={{ color:C.muted, textAlign:"left", position:"sticky", top:0, background:C.surface }}>
              {["FR entity (FY" + year + ")", "Gross cost ($B)", "Earned revenue ($B)", "Δ assumptions ($B)", "NET COST ($B)", "share"].map(h =>
                <th key={h} style={{ padding:"6px 9px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {model.yrRows.map((r, i) => {
                const me = r.agency_nm === frName
                return (
                  <tr key={i} style={{ background: me ? `${C.blue}14` : "transparent" }}>
                    <td style={{ padding:"5px 9px", borderBottom:`1px solid ${C.border}`, color: me ? C.blue : C.text, fontWeight: me ? 700 : 500 }}>
                      {r.agency_nm}{r.restmt_flag === "Y" && <Badge color={C.orange}> restated</Badge>}</td>
                    <td style={{ padding:"5px 9px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.textSub }}>{f(r.gross_cost_bil_amt).toFixed(1)}</td>
                    <td style={{ padding:"5px 9px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.textSub }}>({f(r.earned_revenue_bil_amt).toFixed(1)})</td>
                    <td style={{ padding:"5px 9px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color: f(r.change_assumptions_bil_amt) ? C.orange : C.muted }}>{f(r.change_assumptions_bil_amt).toFixed(1)}</td>
                    <td style={{ padding:"5px 9px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", fontWeight:700, color:C.cyan }}>{f(r.net_cost_bil_amt).toFixed(1)}</td>
                    <td style={{ padding:"5px 9px", borderBottom:`1px solid ${C.border}`, color:C.muted, fontSize:13 }}>{model.govTotal ? (f(r.net_cost_bil_amt) / model.govTotal * 100).toFixed(1) : "—"}%</td>
                  </tr>
                )})}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ fontSize:13.5, color:C.muted, marginBottom:14 }}>
        Government-wide net cost FY{year}: <b style={{ color:C.cyan, fontFamily:"var(--font-mono)" }}>${model?.govTotal.toFixed(1)}B</b> · columns are the statement's own measures: gross cost − earned revenue ± change in assumptions (actuarial) = net cost.
      </div>

      {/* trend + disconnect */}
      {frName && model && model.trend.length > 1 && (
        <Row>
          <Card title={`${agency.abbrev} — 10-year audited trend ($B)`} sub="net cost vs gross cost; orange dots mark actuarial assumption swings / restatements" style={{ flex:1.1, minWidth:340 }}>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={model.trend}>
                <CartesianGrid stroke={C.dim} strokeDasharray="3 3" />
                <XAxis dataKey="fy" stroke={C.muted} fontSize={12} />
                <YAxis stroke={C.muted} fontSize={11} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="grossCost" name="Gross cost" fill={C.dim} />
                <Line dataKey="netCost" name="Net cost (audited)" stroke={C.cyan} strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Card title="🔍 Disconnect analysis — audited net cost vs budgetary obligations" sub="accrual world vs budgetary world, same agency, same year" style={{ flex:1, minWidth:340 }}>
            {model.disconnects.length ? (
              <>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
                  <thead><tr style={{ color:C.muted, textAlign:"left" }}>
                    {["FY", "Net cost $B", "Obligations $B", "Δ $B", "oblig/cost"].map(h => <th key={h} style={{ padding:"5px 8px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{model.disconnects.slice(-6).map((d, i) => (
                    <tr key={i}>
                      <td style={{ padding:"4px 8px", borderBottom:`1px solid ${C.border}`, color:C.text }}>{d.fy}{d.restated ? " ⚠" : ""}</td>
                      <td style={{ padding:"4px 8px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.cyan }}>{d.netCost.toFixed(0)}</td>
                      <td style={{ padding:"4px 8px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.gold }}>{d.obligations!.toFixed(0)}</td>
                      <td style={{ padding:"4px 8px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color: Math.abs(d.delta) > d.netCost * 0.15 ? C.orange : C.textSub }}>{d.delta >= 0 ? "+" : ""}{d.delta.toFixed(0)}</td>
                      <td style={{ padding:"4px 8px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.muted }}>{d.ratio}%</td>
                    </tr>))}
                  </tbody>
                </table>
                <div style={{ fontSize:13, color:C.textSub, lineHeight:1.65, marginTop:8 }}>
                  Why they disconnect — by construction: obligations (budgetary, USSGL 480x/490x) book when commitments are made;
                  net cost (proprietary, 610000/520000) books when resources are CONSUMED — adding depreciation, actuarial expense
                  (watch the Δ-assumptions column), accrual timing, and capitalization (multi-year procurement obligates now, costs later).
                  A persistent ratio shift is the signal worth investigating; a one-year swing with a restatement flag is actuarial.
                </div>
              </>
            ) : <div style={{ fontSize:14, color:C.muted }}>GTAS obligations history loading or unavailable for overlap years.</div>}
          </Card>
        </Row>
      )}

      {/* technical solution */}
      <div style={{ marginTop:14, padding:"11px 14px", background:`${C.purple}0d`, border:`1px solid ${C.purple}44`, borderRadius:9 }}>
        <div style={{ fontSize:14.5, fontWeight:700, color:C.purple, marginBottom:6 }}>🛠 TECHNICAL SOLUTION — working the audited and budgetary worlds together</div>
        <div style={{ fontSize:14, color:C.textSub, lineHeight:1.75 }}>
          ① <b style={{ color:C.text }}>Canonical entity crosswalk</b> — FR <code>agency_nm</code> ↔ USAspending toptier code ↔ registry id (built into <code>scripts/fiscaldata_statements.py</code>); every analysis joins through it.
          ② <b style={{ color:C.text }}>One warehouse</b> — <code>fr_statement_net_cost</code> sits beside USAspending silver in the same DuckDB, so this disconnect table is one SQL join, reproducible.
          ③ <b style={{ color:C.text }}>Conformance monitor</b> — annual job recomputes obligations/net-cost ratios per agency; drift beyond an agency-specific band (capital-heavy agencies run high) opens a finding, restatement flags annotate automatically.
          ④ <b style={{ color:C.text }}>Quarterly gap</b> — audited statements are annual; for intra-year, bridge with the Monthly Treasury Statement outlays (fiscaldata MTS endpoints) as the cash proxy, clearly labeled unaudited.
          ⑤ <b style={{ color:C.text }}>Next dataset</b> — File B (object class) decomposes WHICH costs drive the accrual gap; balance_sheets adds the liability build-up (already pulled by the pipeline).
        </div>
      </div>
    </Card>
  )
}

// ── compact highlight for the Executive Overview ─────────────────────────────
export function AuditedHighlight({ agency, onNavigate }: { agency: Agency; onNavigate?: (p: string) => void }) {
  const C = useTheme()
  const snc = useAgencyData<SncData>("ALL", "statements")
  const m = useMemo(() => {
    if (!snc.data) return null
    const frName = matchAgency(snc.data.rows, agency)
    if (!frName) return null
    const mine = snc.data.rows.filter(r => r.agency_nm === frName).sort((a, b) => a.stmt_fiscal_year.localeCompare(b.stmt_fiscal_year))
    const last = mine[mine.length - 1]; const prev = mine[mine.length - 2]
    if (!last) return null
    const yoy = prev ? Math.round((f(last.net_cost_bil_amt) - f(prev.net_cost_bil_amt)) / Math.abs(f(prev.net_cost_bil_amt) || 1) * 1000) / 10 : null
    return { fy: last.stmt_fiscal_year, net: f(last.net_cost_bil_amt), yoy, restated: last.restmt_flag === "Y", assumptions: f(last.change_assumptions_bil_amt) }
  }, [snc.data, agency])
  if (!m) return null
  return (
    <div onClick={() => onNavigate?.("accounting")} style={{ cursor: onNavigate ? "pointer" : "default", flex:1, minWidth:225 }}>
      <KPI icon="📜" label={`FY${m.fy} Audited Net Cost`} value={`$${m.net.toFixed(0)}B`}
           accent={C.purple}
           sub={`GAO-audited SNC (accrual)${m.yoy != null ? ` · ${m.yoy >= 0 ? "+" : ""}${m.yoy}% YoY` : ""}${m.restated ? " · restated" : ""} · click for the statement`} />
    </div>
  )
}
