"use client"
// components/anyfed/FinancialStatements.tsx — replication of the four principal
// financial statements subject to audit (OMB A-136), per agency, from the data
// actually held: SBR built live from GTAS/File A+B, SNC from the GAO-audited
// Financial Report (by agency), Balance Sheet & SCNP rendered in statement
// structure with every line mapped to where its number lives (AFR PDFs local).
import { useEffect, useMemo, useState } from "react"
import { useTheme, Card, Badge, Spinner } from "./ui"
import { useAgencyData, LiveDetail } from "./useAgencyData"
import type { Agency } from "@/lib/agencies"

interface SncRow {
  stmt_fiscal_year: string; restmt_flag: string; agency_nm: string
  gross_cost_bil_amt: string; earned_revenue_bil_amt: string
  change_assumptions_bil_amt: string; net_cost_bil_amt: string
}
interface SncData { rows: SncRow[] }
interface AfrDoc { path: string; name: string; bytes: number; agency: string; bucket: string }
const f = (v: string) => { const n = parseFloat(v); return isFinite(n) ? n : 0 }
const $B = (n: number) => `$${(n / 1e9).toFixed(1)}B`
const fmtFull = (n: number) => `$${Math.round(n).toLocaleString()}`

function matchAgency(rows: SncRow[], agency: Agency): string | null {
  const names = Array.from(new Set(rows.map(r => r.agency_nm)))
  return names.find(n => n === agency.name)
      ?? names.find(n => n.toLowerCase().includes(agency.abbrev.toLowerCase()) || agency.name.toLowerCase().includes(n.toLowerCase()))
      ?? null
}

type Stmt = "sbr" | "snc" | "bs" | "scnp"
const TABS: { id: Stmt; icon: string; label: string; status: string; statusColor: "green" | "cyan" | "gold" }[] = [
  { id: "sbr",  icon: "📊", label: "Statement of Budgetary Resources", status: "BUILT FROM GTAS DATA", statusColor: "green" },
  { id: "snc",  icon: "📜", label: "Statement of Net Cost",            status: "AUDITED (FR)",         statusColor: "cyan" },
  { id: "bs",   icon: "🏦", label: "Balance Sheet",                    status: "STRUCTURE + AFR MAP",  statusColor: "gold" },
  { id: "scnp", icon: "🔁", label: "Changes in Net Position",          status: "PARTIAL + AFR MAP",    statusColor: "gold" },
]

export default function FinancialStatements({ agency }: { agency: Agency }) {
  const C = useTheme()
  const [tab, setTab] = useState<Stmt>("sbr")
  const now = new Date()
  const curFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  const [fy, setFy] = useState(curFY - 1)
  const cur = useAgencyData<LiveDetail>(agency.id, "detail", `fy=${fy}`)
  const pri = useAgencyData<LiveDetail>(agency.id, "detail", `fy=${fy - 1}`)
  const snc = useAgencyData<SncData>("ALL", "statements")
  const [afr, setAfr] = useState<AfrDoc[]>([])
  useEffect(() => {
    fetch("/api/documents?op=list").then(r => r.json())
      .then(j => setAfr(((j.docs ?? []) as AfrDoc[]).filter(d => d.bucket.startsWith("AFR") && d.agency === agency.id)))
      .catch(() => setAfr([]))
  }, [agency.id])

  const frName = useMemo(() => snc.data ? matchAgency(snc.data.rows, agency) : null, [snc.data, agency])
  const mySnc = useMemo(() => !snc.data || !frName ? [] :
    snc.data.rows.filter(r => r.agency_nm === frName).sort((a, b) => b.stmt_fiscal_year.localeCompare(a.stmt_fiscal_year)).slice(0, 5),
    [snc.data, frName])
  const colHL = (c: string) => ({ color: c, fontFamily: "var(--font-mono)" as const })

  /* ── SBR model (two comparative years from GTAS) ── */
  const sbr = useMemo(() => {
    const y = (d: LiveDetail | null | undefined, yy: number) => d?.years.find(x => x.fy === `FY${yy}`)
    const a = y(cur.data, fy), b = y(pri.data, fy - 1)
    const out = (d: LiveDetail | null | undefined) => d ? d.dims.federalAccount.nodes.reduce((s, n) => s + (n.outlays ?? 0), 0) : null
    if (!a && !b) return null
    return {
      rows: [
        { line: "1910", label: "Total budgetary resources", a: a?.resources ?? null, b: b?.resources ?? null, src: "File A / GTAS — agency-certified" },
        { line: "2190", label: "New obligations & upward adjustments (obligations incurred)", a: a?.obligated ?? null, b: b?.obligated ?? null, src: "File A / GTAS" },
        { line: "2490", label: "Unobligated balance, end of period", a: a ? a.resources - a.obligated : null, b: b ? b.resources - b.obligated : null, src: "derived: 1910 − 2190" },
        { line: "4190", label: "Outlays, gross", a: out(cur.data), b: out(pri.data), src: "Σ File B federal-account gross outlays (top-100 accounts)" },
      ],
      rateA: a?.rate ?? null, rateB: b?.rate ?? null,
    }
  }, [cur.data, pri.data, fy])

  /* ── Balance Sheet & SCNP structures (A-136) with source mapping ── */
  const afrSrc = afr.length ? `${agency.abbrev} AFR (local: ${afr.length} PDF${afr.length > 1 ? "s" : ""} in sourcedata/AFR/${agency.id}/)` : `${agency.abbrev} AFR/PAR — run scripts/afr_harvester.py to pull it locally`
  const BS_LINES = [
    { sec: "ASSETS", lines: [
      ["Fund Balance with Treasury", "AFR Note 2 · agency GL 1010 vs Treasury CARS (GTAS carries balances, API does not expose by-agency FBwT)"],
      ["Investments, net", "AFR — Treasury securities (trust/revolving funds)"],
      ["Accounts & loans receivable, net", "AFR — incl. allowance estimates"],
      ["Inventory & related property; General PP&E, net", "AFR Note — the big audit-risk lines for property-heavy agencies"],
      ["Other assets", "AFR"], ["TOTAL ASSETS", "AFR (audited)"]] },
    { sec: "LIABILITIES", lines: [
      ["Accounts payable", "AFR — accrual basis (not the same as unpaid obligations)"],
      ["Federal employee & veterans' benefits payable", "AFR — actuarial; the Δ-assumptions driver on the SNC"],
      ["Environmental & disposal liabilities", "AFR — dominant for DOE/DoD"],
      ["Debt & other liabilities", "AFR"], ["TOTAL LIABILITIES", "AFR (audited)"]] },
    { sec: "NET POSITION", lines: [
      ["Unexpended appropriations", "AFR — ties to budgetary world: cumulative appropriations not yet used"],
      ["Cumulative results of operations", "AFR"], ["TOTAL NET POSITION", "AFR (audited)"]] },
  ]
  const latestNet = mySnc[0] ? f(mySnc[0].net_cost_bil_amt) : null
  const SCNP_LINES: [string, string | null, string][] = [
    ["Net position, beginning of period", null, afrSrc],
    ["Appropriations received / used", null, "partially derivable from File A appropriations (acquire Custom Account Data File A)"],
    ["Non-exchange revenue & transfers", null, afrSrc],
    ["Imputed financing", null, afrSrc],
    ["Less: net cost of operations", latestNet != null ? `$${latestNet.toFixed(1)}B (FY${mySnc[0]?.stmt_fiscal_year}, audited)` : null, "FR Statement of Net Cost — populated from Fiscal Data"],
    ["Net position, end of period", null, afrSrc],
  ]

  const th = { padding: "6px 10px", borderBottom: `1px solid ${C.border}`, textAlign: "left" as const }
  const td = { padding: "6px 10px", borderBottom: `1px solid ${C.border}` }

  return (
    <Card title={`📑 ${agency.abbrev} Financial Statements — the four statements subject to audit`}
          sub="OMB Circular A-136 principal statements, replicated from the data this portal actually holds. Green = built from data · cyan = audited source rendered · gold = statement structure with every line mapped to where its audited number lives.">
      {/* tab strip with build status */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {TABS.map(t => {
          const on = tab === t.id
          const sc = t.statusColor === "green" ? C.green : t.statusColor === "cyan" ? C.cyan : C.gold
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 13px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                       border: `2px solid ${on ? sc : C.border}`, background: on ? `${sc}14` : C.card }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: on ? sc : C.text }}>{t.icon} {t.label}</div>
              <div style={{ fontSize: 11.5, color: sc, marginTop: 2, letterSpacing: "0.04em" }}>{t.status}</div>
            </button>
          )
        })}
      </div>

      {/* ── SBR ── */}
      {tab === "sbr" && (
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 14.5, color: C.muted }}>Period (appropriation-year GTAS view)</span>
            <select value={fy} onChange={e => setFy(Number(e.target.value))}
              style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 15, cursor: "pointer" }}>
              {[curFY, curFY - 1, curFY - 2, curFY - 3].map(y => <option key={y} value={y}>FY{y}{y === curFY ? " — in progress" : ""} vs FY{y - 1}</option>)}
            </select>
            <Badge color={C.green}>condensed SBR · $ whole · unaudited (GTAS-sourced)</Badge>
            {fy === curFY && <Badge color={C.gold}>FY{curFY} is year-to-date — comparative column is a full year</Badge>}
          </div>
          {(cur.loading || pri.loading) && <Spinner label="Building the SBR from GTAS account data…" />}
          {sbr && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 680 }}>
                <thead><tr style={{ color: C.muted }}>
                  <th style={th}>SF-133 line</th><th style={th}>Description</th>
                  <th style={{ ...th, textAlign: "right" }}>FY{fy}</th><th style={{ ...th, textAlign: "right" }}>FY{fy - 1}</th>
                  <th style={th}>Source</th>
                </tr></thead>
                <tbody>
                  {sbr.rows.map(r => (
                    <tr key={r.line}>
                      <td style={{ ...td, ...colHL(C.gold), fontWeight: 700 }}>{r.line}</td>
                      <td style={{ ...td, color: C.text, fontWeight: r.line === "1910" ? 700 : 500 }}>{r.label}</td>
                      <td style={{ ...td, textAlign: "right", ...colHL(C.cyan) }}>{r.a != null ? fmtFull(r.a) : "—"}</td>
                      <td style={{ ...td, textAlign: "right", ...colHL(C.textSub) }}>{r.b != null ? fmtFull(r.b) : "—"}</td>
                      <td style={{ ...td, color: C.muted, fontSize: 13 }}>{r.src}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 13.5, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
                Obligation rate {sbr.rateA != null ? `${sbr.rateA}%` : "—"} (FY{fy}) vs {sbr.rateB != null ? `${sbr.rateB}%` : "—"} (FY{fy - 1}).
                Full SF-133 line detail (1000 brought forward · 1160 appropriations · 1700/1800 spending authority · 2204 apportioned · 3000-series outlay detail)
                requires Custom Account Data <b style={{ color: C.text }}>File A</b> — acquire from USAspending and drop into <code>sourcedata/USAspending/account-data/file-a-account-balances/</code>.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SNC ── */}
      {tab === "snc" && (
        <div>
          {snc.loading && <Spinner label="Loading audited Statements of Net Cost…" />}
          {!snc.loading && frName && mySnc.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <Badge color={C.cyan}>GAO-audited Financial Report · accrual basis · $ billions</Badge>
                <Badge color={C.green}>{agency.abbrev} = FR entity “{frName}”</Badge>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 620 }}>
                <thead><tr style={{ color: C.muted }}>
                  <th style={th}>Statement line</th>
                  {mySnc.map(r => <th key={r.stmt_fiscal_year} style={{ ...th, textAlign: "right" }}>FY{r.stmt_fiscal_year}{r.restmt_flag === "Y" ? " ⚠" : ""}</th>)}
                </tr></thead>
                <tbody>
                  {([["Gross cost", (r: SncRow) => f(r.gross_cost_bil_amt), C.textSub],
                     ["Less: earned revenue", (r: SncRow) => -f(r.earned_revenue_bil_amt), C.textSub],
                     ["(Gain)/loss from changes in assumptions", (r: SncRow) => f(r.change_assumptions_bil_amt), C.orange],
                     ["NET COST OF OPERATIONS", (r: SncRow) => f(r.net_cost_bil_amt), C.cyan]] as [string, (r: SncRow) => number, string][])
                    .map(([label, get, color], i) => (
                    <tr key={label}>
                      <td style={{ ...td, color: C.text, fontWeight: i === 3 ? 800 : 500 }}>{label}</td>
                      {mySnc.map(r => (
                        <td key={r.stmt_fiscal_year} style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: i === 3 ? 700 : 400, color }}>
                          {get(r) < 0 ? `(${Math.abs(get(r)).toFixed(1)})` : get(r).toFixed(1)}
                        </td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 13.5, color: C.muted, marginTop: 8 }}>⚠ = restated year. This IS the audited statement, agency section, as published in the FR — gross cost − earned revenue ± assumption changes = net cost. Sub-program/responsibility-segment detail lives in the agency AFR ({afrSrc}).</div>
            </div>
          )}
          {!snc.loading && (!frName || !mySnc.length) && (
            <div style={{ fontSize: 15, color: C.textSub, lineHeight: 1.7 }}>
              {agency.abbrev} is not separately reported in the government-wide FR (rolled into “All other entities”).
              Its audited SNC exists only in its own AFR: <b style={{ color: C.gold }}>{afrSrc}</b>.
            </div>
          )}
        </div>
      )}

      {/* ── Balance Sheet ── */}
      {tab === "bs" && (
        <div>
          <div style={{ fontSize: 14.5, color: C.textSub, lineHeight: 1.65, marginBottom: 10 }}>
            Agency-level Balance Sheet values are <b style={{ color: C.gold }}>not exposed by any public API</b> — USAspending is budgetary-only and
            Fiscal Data's audited <code>balance_sheets</code> dataset is government-wide. The statement below is the A-136 structure with each
            line mapped to its authoritative source: <b style={{ color: C.text }}>{afrSrc}</b>{afr.length > 0 && <> — analyze it via 📑 Document Analysis</>}.
          </div>
          {BS_LINES.map(sec => (
            <div key={sec.sec} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.purple, letterSpacing: "0.06em", marginBottom: 4 }}>{sec.sec}</div>
              {sec.lines.map(([label, src]) => (
                <div key={label} style={{ display: "flex", gap: 10, padding: "5px 10px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                  <span style={{ flex: "1 1 260px", fontSize: 14.5, color: C.text, fontWeight: label.startsWith("TOTAL") ? 800 : 500 }}>{label}</span>
                  <span style={{ flex: "2 1 300px", fontSize: 13, color: C.muted }}>{src}</span>
                </div>
              ))}
            </div>
          ))}
          {afr.length > 0 && (
            <div style={{ fontSize: 13.5, color: C.green, marginTop: 6 }}>
              ✅ Local audited source present: {afr.slice(0, 4).map(d => d.name).join(" · ")}{afr.length > 4 ? ` · +${afr.length - 4} more` : ""}
            </div>
          )}
        </div>
      )}

      {/* ── SCNP ── */}
      {tab === "scnp" && (
        <div>
          <div style={{ fontSize: 14.5, color: C.textSub, lineHeight: 1.65, marginBottom: 10 }}>
            The Statement of Changes in Net Position reconciles the Balance Sheet's net position year over year — it is where the
            budgetary world (appropriations used) and the accrual world (net cost) meet. One line is already populated from audited data:
          </div>
          {SCNP_LINES.map(([label, val, src]) => (
            <div key={label} style={{ display: "flex", gap: 10, padding: "6px 10px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap",
                                       background: val ? `${C.cyan}0d` : "transparent" }}>
              <span style={{ flex: "1 1 260px", fontSize: 14.5, color: C.text, fontWeight: label.startsWith("Net position") ? 700 : 500 }}>{label}</span>
              <span style={{ flex: "0 1 180px", fontSize: 14.5, fontFamily: "var(--font-mono)", color: val ? C.cyan : C.muted, textAlign: "right" }}>{val ?? "—"}</span>
              <span style={{ flex: "2 1 280px", fontSize: 13, color: C.muted }}>{src}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 13.5, color: C.muted, marginTop: 12, lineHeight: 1.6, padding: "9px 12px", background: `${C.purple}0c`, border: `1px solid ${C.purple}33`, borderRadius: 9 }}>
        <b style={{ color: C.purple }}>Audit context:</b> these four statements (plus custodial/social-insurance where applicable) are what the
        agency's financial statement audit opines on. SBR assertions trace to GTAS/File A (this page builds them live); SNC/Balance Sheet/SCNP
        are accrual statements whose audited values are published in the AFR — {afr.length > 0 ? `${afr.length} ${agency.abbrev} AFR PDF${afr.length > 1 ? "s are" : " is"} in your local library` : "harvest the AFR locally for the full audited set"}.
      </div>
    </Card>
  )
}
