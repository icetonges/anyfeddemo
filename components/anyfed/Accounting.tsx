"use client"
// components/anyfed/Accounting.tsx — USSGL, journal entries, FBwT reconciliation
import { useTheme, Card, Row, SectionTitle, Badge, KPI } from "./ui"
import { USSGL_SAMPLE } from "@/lib/fm-content"
import type { Agency } from "@/lib/agencies"

export default function Accounting({ agency }: { agency: Agency }) {
  const C = useTheme()
  const isDod = agency.id === "DOD"
  return (
    <div>
      <SectionTitle title="Accounting Operations"
        sub="USSGL posting logic, journal entry workflow, and Fund Balance with Treasury reconciliation" />
      <Row>
        <KPI icon="📒" label="Chart of Accounts" value="USSGL" accent={C.blue} sub="Treasury TFM Supplement 2 — transaction-level (FFMIA)" />
        <KPI icon="🏦" label="FBwT Reconciliation" value="Monthly" accent={C.cyan} sub="Agency GL ↔ Treasury CARS/GWA" />
        <KPI icon="📤" label="Treasury Reporting" value="GTAS" accent={C.gold} sub="Bulk file by USSGL/attribute monthly" />
        {isDod && <KPI icon="⚠️" label="JV Discipline" value="MW #18" accent={C.red} sub="Unsupported adjustments — KSD mandatory" />}
      </Row>

      <div style={{ height:18 }} />
      <Row>
        <Card title="USSGL Core Accounts" sub="Budgetary (4xxx) and proprietary series used daily by FM shops" style={{ flex:1.3, minWidth:340 }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5 }}>
              <thead>
                <tr style={{ color:C.muted, textAlign:"left" }}>
                  {["Acct", "Title", "Normal", "Statement"].map(h => (
                    <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USSGL_SAMPLE.map(r => (
                  <tr key={r.acct}>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.cyan }}>{r.acct}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.text }}>{r.title}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>
                      <Badge color={r.normal === "Debit" ? C.green : C.orange}>{r.normal}</Badge>
                    </td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub }}>{r.stmt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:14 }}>
          <Card title="Sample Posting — Obligation → Disbursement" sub="Budgetary + proprietary pairs move together">
            {[
              ["Obligate (contract award)", "DR 4610 Allotments → CR 4801 UDO-Unpaid"],
              ["Accrue (goods received)", "DR 4801 → CR 4901 · DR 6100 Expense → CR 2110 A/P"],
              ["Disburse (invoice paid)", "DR 4901 → CR 4902 · DR 2110 → CR 1010 FBwT"],
            ].map(([step, entry], i) => (
              <div key={step} style={{ padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{i + 1}. {step}</div>
                <div style={{ fontSize:11.5, color:C.cyan, fontFamily:"var(--font-mono)", marginTop:3 }}>{entry}</div>
              </div>
            ))}
          </Card>
          <Card title="JV Quality Gate" sub={isDod ? "Directly remediates MW #18 (Unsupported Adjustments) & MW #5 (SoD)" : "A-123 control: ACC-01"}>
            <div style={{ fontSize:12.5, color:C.textSub, lineHeight:1.8 }}>
              ✔ Key Supporting Documentation attached before posting<br />
              ✔ Preparer ≠ approver (segregation of duties)<br />
              ✔ USSGL debit/credit pairs validated against TFM posting models<br />
              ✔ Period-end JV log reviewed; high-dollar JVs sampled for audit
            </div>
          </Card>
        </div>
      </Row>
    </div>
  )
}
