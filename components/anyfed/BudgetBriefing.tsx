"use client"
// components/anyfed/BudgetBriefing.tsx — senior-budget-professional briefing
// at the top of the Budget Lifecycle page: budget overview, funding structure,
// appropriations process, recent enacted levels (computed from loaded data
// where available), uniqueness, and practitioner insights.
import { useTheme, Card, Row, Badge, fmtMoney } from "./ui"
import { getProfile } from "@/lib/agency-profiles"
import { useAgencyData, DodBudget } from "./useAgencyData"
import { BUDGET_HISTORY } from "@/lib/sec-data"
import type { Agency } from "@/lib/agencies"
import type { EnactedYear } from "@/lib/agency-profiles"

export default function BudgetBriefing({ agency }: { agency: Agency }) {
  const C = useTheme()
  const p = getProfile(agency)
  const b = p.budget
  // computed enacted chips where the data is loaded (overrides profile text)
  const dod = useAgencyData<DodBudget>("DOD", "budget")
  let enacted: EnactedYear[] = b.enacted
  if (agency.id === "DOD" && dod.data) {
    const t = dod.data.totalsByFY
    enacted = [
      { fy: "FY2024", amount: fmtMoney(t.FY2024 ?? 0, "K"), note: "actuals — loaded exhibits (sourcedata/)" },
      { fy: "FY2025", amount: fmtMoney(t.FY2025 ?? 0, "K"), note: "actuals + reconciliation — loaded exhibits" },
      { fy: "FY2026", amount: fmtMoney(t.FY2026 ?? 0, "K"), note: "disc. enacted + P.L. 119-21 spend plan — loaded exhibits" },
    ]
  } else if (agency.id === "SEC") {
    enacted = BUDGET_HISTORY.filter(h => h.enacted != null).slice(-3)
      .map(h => ({ fy: h.fy, amount: `$${(h.enacted as number / 1000).toFixed(2)}B`, note: "CBJ budget history (sourcedata/)" }))
  }

  return (
    <Card title={`${agency.seal} ${agency.abbrev} Budget Briefing — senior analyst view`}
          sub="Read this before the charts: how this agency's money actually works">
      <div style={{ fontSize:12.5, color:C.textSub, lineHeight:1.7, marginBottom:14 }}>{b.overview}</div>

      <Row>
        <div style={{ flex:1, minWidth:280, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.text, marginBottom:6 }}>🧱 Funding structure</div>
          <div style={{ fontSize:12, color:C.textSub, lineHeight:1.65 }}>{b.fundingStructure}</div>
        </div>
        <div style={{ flex:1, minWidth:280, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.text, marginBottom:6 }}>🏛️ Appropriations process</div>
          <div style={{ fontSize:12, color:C.textSub, lineHeight:1.65 }}>{b.appropriations}</div>
        </div>
      </Row>

      {enacted.length > 0 && (
        <>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:"0.08em", margin:"14px 0 8px" }}>
            RECENT ENACTED LEVELS {agency.id === "DOD" || agency.id === "SEC" ? "(computed from loaded source data)" : "(≈ approximate, for orientation — verify against the act/CBJ)"}
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {enacted.map(e => (
              <div key={e.fy} style={{ flex:1, minWidth:200, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"11px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <Badge color={C.gold}>{e.fy}</Badge>
                  <span style={{ fontSize:17, fontWeight:800, fontFamily:"var(--font-mono)", color:C.cyan }}>{e.amount}</span>
                </div>
                {e.note && <div style={{ fontSize:11, color:C.muted, marginTop:5, lineHeight:1.5 }}>{e.note}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop:14, padding:"11px 13px", background:`${C.gold}0f`, border:`1px solid ${C.gold}44`, borderRadius:10 }}>
        <div style={{ fontSize:12.5, fontWeight:700, color:C.gold, marginBottom:5 }}>⭐ What's unique here</div>
        <div style={{ fontSize:12, color:C.textSub, lineHeight:1.65 }}>{b.uniqueness}</div>
      </div>

      <div style={{ marginTop:14 }}>
        <div style={{ fontSize:11, color:C.muted, letterSpacing:"0.08em", marginBottom:8 }}>SENIOR BUDGET PROFESSIONAL — WHAT I'D TELL YOU OVER COFFEE</div>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {b.insights.map((ins, i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 12px",
                                  background:C.card, border:`1px solid ${C.border}`, borderRadius:9 }}>
              <span style={{ fontSize:12, fontWeight:800, color:C.blue, fontFamily:"var(--font-mono)", flexShrink:0 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize:12, color:C.textSub, lineHeight:1.6 }}>{ins}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
