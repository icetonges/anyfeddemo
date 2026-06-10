"use client"
// components/anyfed/BudgetIntel.tsx — Budget Management intelligence that
// DEPLOYS every budget-relevant dataset in sourcedata/ and links them:
//   • J-book -1 exhibits (dod_1/FY2026 + FY2027 xlsx files, per-file lineage)
//   • USAspending award files (contract/assistance CSVs → award world)
//   • Live GTAS account view (api.usaspending.gov → execution world)
// Cross-checks them per APPROPRIATION FAMILY (M-1/O-1/P-1/R-1/C-1/RF-1),
// computes in-depth findings, and exports the whole briefing (JSON/Excel/PDF).
import { useMemo } from "react"
import { useTheme, Card, Badge, Spinner, fmtMoney } from "./ui"
import { useAgencyData, DodBudget, DodAwards, LiveDetail, DetailNode } from "./useAgencyData"
import { fmt as fmtLive } from "@/lib/live-insights"
import type { Agency } from "@/lib/agencies"

const FAMILY: [RegExp, string][] = [
  [/military personnel|pay, /i, "M-1 Military Personnel"],
  [/operation and maintenance|operations and maintenance/i, "O-1 Operation & Maintenance"],
  [/procurement|shipbuilding|missile procurement|aircraft procurement|weapons procurement/i, "P-1 Procurement"],
  [/research, development|rdt&e|research and development/i, "R-1 RDT&E"],
  [/military construction|family housing|base realignment/i, "C-1 MILCON & Housing"],
  [/revolving|working capital/i, "RF-1 Revolving Funds"],
]
const famOf = (name: string) => FAMILY.find(([re]) => re.test(name))?.[1] ?? "Other / Defense-wide"
const EX_TO_FAM: Record<string, string> = { m1:"M-1 Military Personnel", o1:"O-1 Operation & Maintenance", p1:"P-1 Procurement", r1:"R-1 RDT&E", c1:"C-1 MILCON & Housing", rf1:"RF-1 Revolving Funds" }

export default function BudgetIntel({ agency }: { agency: Agency }) {
  const C = useTheme()
  const isDod = agency.id === "DOD"
  const budget = useAgencyData<DodBudget>("DOD", "budget")
  const awards = useAgencyData<DodAwards>("DOD", "awards")
  const now = new Date()
  const curFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  const detail = useAgencyData<LiveDetail>(agency.id, "detail", `fy=${curFY}`)

  const model = useMemo(() => {
    if (!isDod || !budget.data) return null
    const b = budget.data
    // J-book exhibit rows with per-file lineage from the catalog
    const exRows = Object.entries(b.exhibits).map(([k, ex]) => ({
      key: k, appn: ex.appn, title: ex.title, fam: EX_TO_FAM[k] ?? "Other",
      fy26: (ex.years.FY2026 ?? 0) * 1000, fy27: (ex.years.FY2027 ?? 0) * 1000,
      files: (b.catalog ?? []).filter(c => c.exhibit.toLowerCase() === k.toLowerCase()).map(c => c.file),
    }))
    // GTAS federal accounts mapped into the same families
    const gtasFam = new Map<string, { obligated: number; outlays: number; n: number }>()
    const walk = (n: DetailNode) => {
      const f = famOf(n.name)
      const e = gtasFam.get(f) ?? { obligated: 0, outlays: 0, n: 0 }
      e.obligated += Math.max(n.value, 0); e.outlays += Math.max(n.outlays ?? 0, 0); e.n++
      gtasFam.set(f, e)
    }
    detail.data?.dims.federalAccount.nodes.forEach(walk)
    // cross-check per family
    const cross = exRows.map(r => {
      const g = gtasFam.get(r.fam)
      const cov = g && r.fy26 ? Math.round(g.obligated / r.fy26 * 1000) / 10 : null
      return { ...r, gtasObligated: g?.obligated ?? null, gtasAccounts: g?.n ?? 0, coverage: cov }
    })
    // award world
    const a = awards.data
    const awardNet = a ? a.monthly.reduce((s, m) => s + m.total, 0) : null
    const topSub = a?.bySubAgency?.[0]; const topRec = a?.topRecipients?.[0]
    // computed findings
    const withCov = cross.filter(c => c.coverage != null && c.fy26 > 0)
    const hi = withCov.length ? withCov.reduce((p, c) => (c.coverage! > p.coverage! ? c : p)) : null
    const lo = withCov.length ? withCov.reduce((p, c) => (c.coverage! < p.coverage! ? c : p)) : null
    const monthsIn = now.getMonth() >= 9 ? now.getMonth() - 8 : now.getMonth() + 4   // months into FY
    const bench = Math.round(monthsIn / 12 * 1000) / 10
    const findings: string[] = []
    if (hi && lo) findings.push(`Execution divergence across families: ${hi.fam} is at ${hi.coverage}% of J-book FY2026 enacted while ${lo.fam} sits at ${lo.coverage}% — against a ${bench}% straight-line benchmark ${monthsIn} months into FY${curFY}. ${lo.coverage! < bench - 15 ? `${lo.fam} is the reprogramming-source candidate; validate whether its ULOs are schedule or capacity.` : "All families within tolerance of plan."}`)
    const c1 = cross.find(c => c.key === "c1")
    if (c1?.coverage != null) findings.push(`${c1.fam}: ${c1.coverage}% in-year coverage looks ${c1.coverage < 30 ? "low but is NORMAL" : "notable"} — 5-year MILCON money executes against placement schedules, not annual benchmarks. Never brief MILCON burn next to O&M burn without this caveat.`)
    if (awardNet != null && detail.data) {
      const g = detail.data.years.find(y => y.fy === `FY${curFY}`)
      if (g?.obligated) findings.push(`Award transactions (contract/assistance files) cover ${fmtMoney(awardNet)} of activity vs ${fmtLive(g.obligated)} total GTAS obligations — the gap is payroll, PCS, and intragovernmental orders. Use award data for WHO/WHAT questions, GTAS for HOW MUCH questions.`)
    }
    const mand = b.discMandatoryByFY?.FY2026
    if (mand?.mandatory) findings.push(`P.L. 119-21 mandatory tranche inside FY2026: ${fmtMoney(mand.mandatory * 1000)} (${Math.round(mand.mandatory / (mand.mandatory + mand.discretionary) * 1000) / 10}% of topline). Strip it before any family-level trend — it distorts O-1 and P-1 most.`)
    return { exRows, cross, awardNet, topSub, topRec, findings, books: b.books, awardCounts: a?.counts }
  }, [budget.data, awards.data, detail.data, isDod, curFY, now])

  if ((isDod && (budget.loading || awards.loading)) || detail.loading)
    return <Spinner label="Linking J-book exhibits, award files, and live GTAS accounts…" />

  // ── exports ────────────────────────────────────────────────────────────────
  const exportJson = () => {
    const payload = { generated: new Date().toISOString(), agency: agency.name, fiscalYear: `FY${curFY}`,
      sources: { jbooks: model?.exRows.flatMap(r => r.files) ?? [], awards: "sourcedata/Department of Defense/USASPENDING/*.csv", live: "api.usaspending.gov detail slice" },
      exhibits: model?.exRows, crossCheck: model?.cross, findings: model?.findings, gtasYears: detail.data?.years }
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }))
    a.download = `${agency.id}_budget_intelligence_FY${curFY}.json`; a.click(); URL.revokeObjectURL(a.href)
  }
  const exportCsv = () => {
    let csv = "exhibit,appropriation,family,fy2026_enacted_usd,fy2027_request_usd,gtas_inyear_obligations_usd,coverage_pct,source_files\n"
    model?.cross.forEach(r => { csv += `${r.key.toUpperCase()},"${r.appn}","${r.fam}",${r.fy26},${r.fy27},${r.gtasObligated ?? ""},${r.coverage ?? ""},"${r.files.join("; ")}"\n` })
    csv += "\nfy,gtas_resources,gtas_obligated,rate_pct\n"
    detail.data?.years.forEach(y => { csv += `${y.fy},${y.resources},${y.obligated},${y.rate ?? ""}\n` })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }))
    a.download = `${agency.id}_budget_intelligence_FY${curFY}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }

  if (!isDod || !model) {
    const g = detail.data?.years.find(y => y.fy === `FY${curFY}`) ?? detail.data?.years.slice(-1)[0]
    return (
      <Card title="🔗 Budget Intelligence — linked-source analysis" sub={`${agency.abbrev}: live GTAS execution view (drop the agency's CBJ exhibits into sourcedata/ to light up the J-book cross-check shown for DoD)`}>
        {g ? <div style={{ fontSize:15, color:C.textSub, lineHeight:1.7 }}>
          FY{curFY}: <b style={{ color:C.cyan }}>{fmtLive(g.resources)}</b> resources · <b style={{ color:C.cyan }}>{fmtLive(g.obligated)}</b> obligated ({g.rate ?? "—"}%).
          Full account drill-down on Data Intelligence; budget-book linkage requires the agency's exhibit files.
        </div> : <div style={{ fontSize:15, color:C.muted }}>No live GTAS data for FY{curFY}.</div>}
      </Card>
    )
  }

  return (
    <Card title="🔗 Budget Intelligence — every budget dataset, deployed and cross-checked"
          sub={`J-book -1 exhibits (xlsx) × live GTAS accounts × USAspending award files — one fiscal year, three worlds, reconciled per appropriation family`}>

      {/* sources deployed */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        <Badge color={C.blue}>📁 dod_1/FY2026 + FY2027 — {model.exRows.reduce((s, r) => s + r.files.length, 0)} J-book xlsx files (PB2026+PB2027)</Badge>
        <Badge color={C.green}>📁 USASPENDING CSVs — {model.awardCounts ? `${(model.awardCounts.contracts + model.awardCounts.assistance).toLocaleString()} award txns` : "award files"}</Badge>
        <Badge color={C.cyan}>🌐 live GTAS — {detail.data?.dims.federalAccount.nodes.length ?? 0} federal accounts, FY{curFY}</Badge>
      </div>

      {/* ① J-book × GTAS cross-check per family */}
      <div style={{ fontSize:14.5, fontWeight:700, color:C.text, letterSpacing:"0.04em", marginBottom:7 }}>
        ① APPROPRIATION-FAMILY CROSS-CHECK — J-book plan (FY2026 enacted) vs live GTAS execution (FY{curFY} obligations)
      </div>
      <div style={{ overflowX:"auto", marginBottom:6 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14, minWidth:760 }}>
          <thead><tr style={{ color:C.muted, textAlign:"left" }}>
            {["Family (exhibit)", "FY2026 enacted TOA (J-book)", "FY2027 request TOA", `GTAS FY${curFY} obligations incurred`, "Coverage", "Source xlsx"].map(h =>
              <th key={h} style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {model.cross.map(r => (
              <tr key={r.key}>
                <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:600 }}>{r.fam}</td>
                <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.gold }}>{fmtMoney(r.fy26)}</td>
                <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.blue }}>{fmtMoney(r.fy27)}</td>
                <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.cyan }}>
                  {r.gtasObligated != null ? `${fmtMoney(r.gtasObligated)} · ${r.gtasAccounts} accts` : "—"}</td>
                <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}` }}>
                  {r.coverage != null ? <Badge color={r.coverage > 70 ? C.green : r.coverage > 35 ? C.gold : C.orange}>{r.coverage}%</Badge> : <span style={{ color:C.muted }}>n/a</span>}</td>
                <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.muted, fontFamily:"var(--font-mono)" }}>{r.files.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.6, marginBottom:14 }}>
        Coverage = live in-year GTAS obligations ÷ J-book enacted. Families map via account-name classification of the {detail.data?.dims.federalAccount.nodes.length ?? 0} live federal accounts — File C (account↔award) would make this exact instead of classified; see the Runbook.
      </div>

      {/* ② award world */}
      <div style={{ fontSize:14.5, fontWeight:700, color:C.text, letterSpacing:"0.04em", marginBottom:7 }}>
        ② AWARD WORLD — who the money reaches (USAspending contract/assistance files)
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))", gap:8, marginBottom:14 }}>
        {([["Net award obligations", model.awardNet != null ? fmtMoney(model.awardNet) : "—", "Σ federal_action_obligation, extract window"],
           ["Top sub-agency", model.topSub?.name ?? "—", model.topSub ? fmtMoney(model.topSub.total) : ""],
           ["Top recipient", model.topRec?.name ?? "—", model.topRec ? fmtMoney(model.topRec.total) : ""],
           ["Transactions", model.awardCounts ? (model.awardCounts.contracts + model.awardCounts.assistance).toLocaleString() : "—", model.awardCounts ? `${model.awardCounts.contracts.toLocaleString()} contract · ${model.awardCounts.assistance.toLocaleString()} assistance` : ""]] as const)
          .map(([t, v, s]) => (
          <div key={t} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"9px 12px" }}>
            <div style={{ fontSize:12.5, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em" }}>{t}</div>
            <div style={{ fontSize:17, fontWeight:800, color:C.cyan, fontFamily:"var(--font-mono)", margin:"3px 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</div>
            <div style={{ fontSize:12.5, color:C.textSub }}>{s}</div>
          </div>
        ))}
      </div>

      {/* ③ in-depth findings */}
      <div style={{ fontSize:14.5, fontWeight:700, color:C.text, letterSpacing:"0.04em", marginBottom:7 }}>
        ③ CROSS-SOURCE FINDINGS — computed from the linked datasets above
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
        {model.findings.map((f, i) => (
          <div key={i} style={{ display:"flex", gap:10, padding:"9px 12px", background:C.card, border:`1px solid ${C.border}`, borderRadius:9 }}>
            <span style={{ fontSize:14, fontWeight:800, color:C.blue, fontFamily:"var(--font-mono)", flexShrink:0 }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ fontSize:14, color:C.textSub, lineHeight:1.65 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* exports */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <button onClick={exportJson} style={{ padding:"9px 16px", borderRadius:8, fontSize:14.5, fontWeight:700, cursor:"pointer", border:`1px solid ${C.borderAccent}`, background:`${C.blue}1f`, color:C.blue }}>⬇ JSON — full linked briefing</button>
        <button onClick={exportCsv} style={{ padding:"9px 16px", borderRadius:8, fontSize:14.5, fontWeight:700, cursor:"pointer", border:`1px solid ${C.border}`, background:C.card, color:C.text }}>⬇ Excel (CSV) — cross-check + GTAS history</button>
        <button onClick={() => window.print()} style={{ padding:"9px 16px", borderRadius:8, fontSize:14.5, fontWeight:700, cursor:"pointer", border:`1px solid ${C.border}`, background:C.card, color:C.text }}>🖨 PDF — print briefing</button>
        <Badge color={C.cyan}>{model.cross.length} families × 3 worlds · {model.findings.length} findings</Badge>
      </div>
    </Card>
  )
}
