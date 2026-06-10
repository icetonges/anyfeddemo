"use client"
// components/anyfed/BudgetIntel.tsx — Budget Management intelligence: links the
// budget-book world (J-book exhibits), the account world (live GTAS), and the
// award world (transaction extracts) for the same fiscal year, cross-checks
// them with an expert read on why the bases differ, and exports the combined
// briefing as JSON, Excel-ready CSV, or print/PDF.
import { useMemo } from "react"
import { useTheme, Card, Row, KPI, Badge, Spinner, fmtMoney } from "./ui"
import { useAgencyData, DodBudget, DodAwards, LiveDetail } from "./useAgencyData"
import { fmt as fmtLive } from "@/lib/live-insights"
import type { Agency } from "@/lib/agencies"

export default function BudgetIntel({ agency }: { agency: Agency }) {
  const C = useTheme()
  const isDod = agency.id === "DOD"
  const budget = useAgencyData<DodBudget>("DOD", "budget")
  const awards = useAgencyData<DodAwards>("DOD", "awards")
  const now = new Date()
  const curFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  const detail = useAgencyData<LiveDetail>(agency.id, "detail", `fy=${curFY}`)

  const x = useMemo(() => {
    const gtasYear = detail.data?.years.find(y => y.fy === `FY${curFY}`) ?? detail.data?.years[detail.data.years.length - 1]
    const jbook = isDod && budget.data ? (budget.data.totalsByFY[`FY${Math.min(curFY, 2026)}`] ?? 0) * 1000 : null
    const awardNet = isDod && awards.data ? awards.data.monthly.reduce((s, m) => s + m.total, 0) : null
    return { gtasYear, jbook, awardNet }
  }, [detail.data, budget.data, awards.data, isDod, curFY])

  if (detail.loading || (isDod && (budget.loading || awards.loading)))
    return <Spinner label="Linking budget-book, account, and award datasets…" />

  const g = x.gtasYear
  const rows: [string, string, string, string][] = [
    ...(x.jbook ? [["J-book exhibits (PB books, sourcedata/)", "appropriation TOA — enacted + spend plan", fmtMoney(x.jbook), "what Congress provided (budget world)"] as [string,string,string,string]] : []),
    ...(g ? [
      ["GTAS account view (live)", "total budgetary resources", fmtLive(g.resources), "TOA + carryover + collections (account world)"],
      ["GTAS account view (live)", "obligations incurred", fmtLive(g.obligated), `${g.rate ?? "—"}% of resources executed`],
    ] as [string,string,string,string][] : []),
    ...(x.awardNet ? [["Award transactions (extract window)", "net award obligations", fmtMoney(x.awardNet), "contracts/assistance only — excludes payroll & intragov (award world)"] as [string,string,string,string]] : []),
  ]

  const exportJson = () => {
    const payload = { generated: new Date().toISOString(), agency: agency.name, fiscalYear: `FY${curFY}`,
      basis: "cross-source reconciliation: J-book TOA vs GTAS resources/obligations vs award-transaction net",
      figures: rows.map(r => ({ source: r[0], measure: r[1], value: r[2], reading: r[3] })),
      gtasYears: detail.data?.years ?? [] }
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }))
    a.download = `${agency.id}_budget_briefing_FY${curFY}.json`; a.click(); URL.revokeObjectURL(a.href)
  }
  const exportCsv = () => {
    const head = "source,measure,value,reading\n"
    const body = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")
    const yrs = "\n\nfy,resources,obligated,rate_pct\n" + (detail.data?.years ?? []).map(y => `${y.fy},${y.resources},${y.obligated},${y.rate ?? ""}`).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob(["﻿" + head + body + yrs], { type: "text/csv;charset=utf-8" }))
    a.download = `${agency.id}_budget_briefing_FY${curFY}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <Card title="🔗 Budget Intelligence — three worlds, one fiscal year, cross-checked"
          sub={`FY${curFY}: the budget-book number, the account (GTAS) number, and the award number are DIFFERENT BY DESIGN — knowing why is the analyst's edge. Export the briefing below.`}>
      {rows.length === 0 ? (
        <div style={{ fontSize:15, color:C.muted }}>No linked sources available yet for {agency.abbrev} FY{curFY} — try the Acquire panel on Data Explorer.</div>
      ) : (
        <>
          <div style={{ overflowX:"auto", marginBottom:12 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14.5, minWidth:640 }}>
              <thead><tr style={{ color:C.muted, textAlign:"left" }}>
                {["Dataset (world)", "Measure", "FY" + curFY + " value", "How to read it"].map(h =>
                  <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:600 }}>{r[0]}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub }}>{r[1]}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", fontWeight:700, color:C.cyan, whiteSpace:"nowrap" }}>{r[2]}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, lineHeight:1.5 }}>{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:"10px 13px", background:`${C.gold}0c`, border:`1px solid ${C.gold}44`, borderRadius:9, fontSize:14, color:C.textSub, lineHeight:1.7, marginBottom:12 }}>
            <b style={{ color:C.gold }}>Why they never match (and shouldn't):</b> GTAS resources exceed the J-book TOA because
            carryover from prior multi-year appropriations and offsetting collections sit on top of new authority. Award
            obligations sit far below GTAS obligations because payroll, PCS, intragovernmental orders and non-award spending
            never appear in award files. A briefing that presents one number without naming its world invites a wrong
            decision — this table is the inoculation. The full lineage from statement line to source document is the
            UoT thread on the Data Intelligence page.
          </div>
        </>
      )}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <button onClick={exportJson} style={{ padding:"9px 16px", borderRadius:8, fontSize:14.5, fontWeight:700, cursor:"pointer", border:`1px solid ${C.borderAccent}`, background:`${C.blue}1f`, color:C.blue }}>⬇ JSON briefing</button>
        <button onClick={exportCsv} style={{ padding:"9px 16px", borderRadius:8, fontSize:14.5, fontWeight:700, cursor:"pointer", border:`1px solid ${C.border}`, background:C.card, color:C.text }}>⬇ Excel (CSV) — figures + GTAS history</button>
        <button onClick={() => window.print()} style={{ padding:"9px 16px", borderRadius:8, fontSize:14.5, fontWeight:700, cursor:"pointer", border:`1px solid ${C.border}`, background:C.card, color:C.text }}>🖨 PDF — print this page</button>
        <Badge color={C.cyan}>cross-checked: {rows.length} figures · {detail.data?.years.length ?? 0}-yr GTAS history attached</Badge>
      </div>
    </Card>
  )
}
