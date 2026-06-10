"use client"
// components/anyfed/StatementBuilder.tsx — builds the federal financial
// statements that USAspending's USSGL-derived (GTAS/DATA Act) data CAN
// produce, live, with SF-133/USSGL line references — and documents precisely
// which statements it CANNOT, what additional information each needs, and
// where that information is found.
import { useMemo } from "react"
import { useTheme, Card, Badge, Spinner } from "./ui"
import { useAgencyData, LiveDetail } from "./useAgencyData"
import { fmt } from "@/lib/live-insights"
import type { Agency } from "@/lib/agencies"

const CANNOT: { stmt: string; why: string; needs: string; where: string }[] = [
  { stmt: "Balance Sheet",
    why: "Requires proprietary USSGL 1000/2000-series BALANCES (FBwT 101000, AR 131000, PP&E 17xxxx, AP 211000, actuarial liabilities) on an accrual basis — USAspending carries budgetary execution flows, not proprietary balances.",
    needs: "Agency proprietary trial balance by USSGL account (adjusted, period-end)",
    where: "Agency AFR (audited statements + notes) · GTAS proprietary submission (agency-internal, not public) · DDRS for DoD · Fiscal Service Combined Statement" },
  { stmt: "Statement of Net Cost",
    why: "Needs accrual-basis program costs (USSGL 610000) and earned revenue (520000) by responsibility segment, including depreciation, actuarial expense, and imputed costs — none are in budgetary/award data. Gross outlays approximate cash cost only.",
    needs: "Proprietary cost accounts by program/segment; depreciation schedules; actuarial valuations (pension/ORB)",
    where: "Agency AFR SNC + notes · agency cost accounting (CFO shop) · OPM/Treasury actuarial reports for imputed costs" },
  { stmt: "Statement of Changes in Net Position",
    why: "Driven by USSGL 3000-series (310x unexpended appropriations, 331000 cumulative results) plus appropriations used and transfer activity — proprietary equity accounts that GTAS publishes only inside the agency's own books.",
    needs: "USSGL 3xxxxx balances and activity (appropriations received/used, transfers, donations)",
    where: "Agency AFR SCNP · agency GL (DDRS/GFEBS/Momentum) · Treasury Central Accounting (appropriation warrants)" },
  { stmt: "Custodial / Fiduciary statements",
    why: "Custodial collections (taxes, fees for others) and fiduciary balances never enter the agency's budgetary execution data at all.",
    needs: "Custodial collection detail (e.g., 580xxx custodial revenue) and fiduciary fund records",
    where: "Agency AFR custodial statement · Fiscal Service collections systems (CARS) · program systems (e.g., IRS Master File)" },
]

export default function StatementBuilder({ agency }: { agency: Agency }) {
  const C = useTheme()
  const now = new Date()
  const curFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  const { data, loading } = useAgencyData<LiveDetail>(agency.id, "detail", `fy=${curFY}`)

  const sbr = useMemo(() => {
    const y = data?.years.find(x => x.fy === `FY${curFY}`) ?? data?.years[data.years.length - 1]
    if (!y) return null
    const acct = data!.dims.federalAccount.nodes
    const grossOutlays = acct.reduce((s, n) => s + Math.max(n.outlays ?? 0, 0), 0)
    return {
      fy: y.fy,
      lines: [
        ["1910", "Total budgetary resources", y.resources, "appropriations + unobligated carryover + spending authority — File A / GTAS"],
        ["2190", "New obligations and upward adjustments (total)", y.obligated, "obligations incurred against those resources"],
        ["2490", "Unobligated balance, end of year", y.resources - y.obligated, "resources minus obligations (apportioned + unapportioned together — split needs SF-132/SF-133 detail)"],
        ["4190", "Outlays, gross", grossOutlays, "sum of gross_outlay_amount across the agency's federal accounts (account-level coverage)"],
      ] as [string, string, number, string][],
      accounts: acct.length,
    }
  }, [data, curFY])

  if (loading) return <Spinner label="Building the SBR from live USSGL-derived (GTAS) data…" />

  return (
    <Card title="📊 Statement Builder — what USAspending's USSGL data CAN and CANNOT produce"
          sub={`USAspending publishes USSGL-crosswalked BUDGETARY execution (File A/B, GTAS lineage). That is enough for the SBR family — and structurally insufficient for the proprietary statements. Both halves shown, specifically.`}>

      {/* ── CAN: live SBR ── */}
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:8 }}>
        <Badge color={C.green}>✓ CAN BUILD — live now</Badge>
        <span style={{ fontSize:15.5, fontWeight:700, color:C.text }}>Statement of Budgetary Resources (condensed) — {agency.abbrev}, {sbr?.fy ?? `FY${curFY}`}</span>
        <Badge color={C.cyan}>source: File A / GTAS via api.usaspending.gov · SF-133 line basis</Badge>
      </div>
      {sbr ? (
        <div style={{ overflowX:"auto", marginBottom:8 }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14.5, minWidth:680 }}>
            <thead><tr style={{ color:C.muted, textAlign:"left" }}>
              {["SF-133 line", "Statement line", "Amount", "Basis / specificity"].map(h =>
                <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {sbr.lines.map(([ln, label, amt, basis]) => (
                <tr key={ln}>
                  <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.gold }}>{ln}</td>
                  <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:600 }}>{label}</td>
                  <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", fontWeight:700, color:C.cyan, whiteSpace:"nowrap" }}>{fmt(amt)}</td>
                  <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, lineHeight:1.5, fontSize:13.5 }}>{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div style={{ fontSize:14.5, color:C.muted, marginBottom:8 }}>No live GTAS year available for {agency.abbrev} — pick an earlier FY on Data Intelligence.</div>}
      <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.65, marginBottom:14 }}>
        Also buildable: <b style={{ color:C.text }}>SF-133-style status per Treasury Account</b> ({sbr?.accounts ?? "—"} federal accounts
        with obligations + gross outlays — drill on Data Intelligence) and <b style={{ color:C.text }}>obligations by object class / program
        activity</b> (File B basis). Caveats stated honestly: in-progress FY = partial periods; line 2490 here is the simple residual
        (the apportionment split needs full SF-133 detail); recoveries/de-obligations (lines 1021/1033) need File A column detail.
      </div>

      {/* ── CANNOT: with what's needed and where ── */}
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
        <Badge color={C.red}>✗ CANNOT BUILD from USAspending</Badge>
        <span style={{ fontSize:15.5, fontWeight:700, color:C.text }}>Proprietary statements — what each needs and where it lives</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {CANNOT.map(c => (
          <div key={c.stmt} style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`4px solid ${C.red}`, borderRadius:9, padding:"11px 14px" }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:5 }}>{c.stmt}</div>
            <div style={{ fontSize:13.5, color:C.textSub, lineHeight:1.6, marginBottom:6 }}>{c.why}</div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", fontSize:13.5, lineHeight:1.55 }}>
              <span><b style={{ color:C.gold }}>Needs:</b> <span style={{ color:C.textSub }}>{c.needs}</span></span>
              <span><b style={{ color:C.green }}>Where found:</b> <span style={{ color:C.textSub }}>{c.where}</span></span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.65, marginTop:10 }}>
        The structural reason in one sentence: GTAS collects BOTH budgetary and proprietary USSGL series from agencies,
        but USAspending publishes only the budgetary/award side (DATA Act scope) — the proprietary trial balance stays
        inside the agency and surfaces publicly only in the audited AFR.
      </div>
    </Card>
  )
}
