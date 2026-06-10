"use client"
// components/anyfed/Accounting.tsx — USSGL, journal entries, FBwT reconciliation
import { useTheme, Card, Row, SectionTitle, Badge, KPI, fmtMoney } from "./ui"
import { USSGL_SAMPLE } from "@/lib/fm-content"
import type { Agency } from "@/lib/agencies"

// Illustrative FBwT reconciliation — agency GL vs. Treasury (CARS/GWA). Values in $K.
// Pattern mirrors the monthly tie-out every CFO shop performs (TFM Vol 1 Part 2).
const FBWT_ITEMS = [
  { item: "Deposits in transit — not yet posted by Treasury",   amt: 9_240 },
  { item: "Outstanding disbursements — SF-1081 in process",     amt: -22_905 },
  { item: "Unmatched IPAC transactions (intragovernmental)",    amt: -3_010 },
  { item: "Suspense / default account clearing (F3875)",        amt: -1_865 },
]

export default function Accounting({ agency }: { agency: Agency }) {
  const C = useTheme()
  const isDod = agency.id === "DOD"
  const glBalance   = 4_812_440          // USSGL 1010 per agency GL ($K)
  const carsBalance = 4_829_115          // Treasury CARS/GWA statement ($K)
  const reconciling = FBWT_ITEMS.reduce((s, r) => s + r.amt, 0)
  const residual    = carsBalance + reconciling - glBalance  // unreconciled difference
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
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:17 }}>
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
                <div style={{ fontSize:17, fontWeight:600, color:C.text }}>{i + 1}. {step}</div>
                <div style={{ fontSize:15.5, color:C.cyan, fontFamily:"var(--font-mono)", marginTop:3 }}>{entry}</div>
              </div>
            ))}
          </Card>
          <Card title="JV Quality Gate" sub={isDod ? "Directly remediates MW #18 (Unsupported Adjustments) & MW #5 (SoD)" : "A-123 control: ACC-01"}>
            <div style={{ fontSize:17, color:C.textSub, lineHeight:1.8 }}>
              ✔ Key Supporting Documentation attached before posting<br />
              ✔ Preparer ≠ approver (segregation of duties)<br />
              ✔ USSGL debit/credit pairs validated against TFM posting models<br />
              ✔ Period-end JV log reviewed; high-dollar JVs sampled for audit
            </div>
          </Card>
        </div>
      </Row>

      <div style={{ height:18 }} />
      <Card title="Fund Balance with Treasury (FBwT) Reconciliation"
            sub={isDod
              ? "Monthly GL ↔ Treasury CARS/GWA tie-out — the control behind MW #8 (illustrative figures, $K)"
              : "Monthly GL ↔ Treasury CARS/GWA tie-out (illustrative figures, $K)"}>
        <Row>
          <div style={{ flex:1.4, minWidth:340, overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:17, minWidth:420 }}>
              <tbody>
                <tr>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:600 }}>
                    Treasury CARS/GWA account statement
                  </td>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:C.cyan }}>{fmtMoney(carsBalance, "K")}</td>
                </tr>
                {FBWT_ITEMS.map(r => (
                  <tr key={r.item}>
                    <td style={{ padding:"7px 10px 7px 22px", borderBottom:`1px solid ${C.border}`, color:C.textSub }}>
                      {r.amt >= 0 ? "＋ " : "－ "}{r.item}
                    </td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color: r.amt >= 0 ? C.green : C.orange }}>
                      {fmtMoney(Math.abs(r.amt), "K")}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:600 }}>
                    Agency GL — FBwT (USSGL 1010)
                  </td>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, textAlign:"right", fontFamily:"var(--font-mono)", color:C.text }}>{fmtMoney(glBalance, "K")}</td>
                </tr>
                <tr>
                  <td style={{ padding:"9px 10px", color:C.text, fontWeight:700 }}>Unreconciled residual</td>
                  <td style={{ padding:"9px 10px", textAlign:"right", fontFamily:"var(--font-mono)", fontWeight:700, color: Math.abs(residual) < 5_000 ? C.green : C.red }}>
                    {fmtMoney(residual, "K")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ flex:1, minWidth:280, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:120 }}>
                <KPI icon="🏦" label="Variance vs. CARS"
                     value={`${(((carsBalance - glBalance) / glBalance) * 100).toFixed(2)}%`}
                     accent={C.gold} sub="Before reconciling items" />
              </div>
              <div style={{ flex:1, minWidth:120 }}>
                <KPI icon={Math.abs(residual) < 5_000 ? "✅" : "🔴"} label="Tie-out Status"
                     value={Math.abs(residual) < 5_000 ? "Cleared" : "Open"}
                     accent={Math.abs(residual) < 5_000 ? C.green : C.red}
                     sub={`${fmtMoney(Math.abs(residual), "K")} residual`} />
              </div>
            </div>
            <div style={{ fontSize:17, color:C.textSub, lineHeight:1.8 }}>
              Reconciling items are aged and cleared within 60 days under control <b style={{ color:C.text }}>ACC-02</b>.
              Items beyond threshold route to the suspense-clearance queue.
              {isDod && <> Unresolved differences at scale are the heart of <Badge color={C.orange}>MW #8 — Fund Balance with Treasury</Badge>.</>}
              <br /><br />
              <b style={{ color:C.text }}>AI hook:</b> the Workbench&apos;s anomaly detector flags abnormal IPAC and
              suspense spikes before they age into audit findings.
            </div>
          </div>
        </Row>
      </Card>
    </div>
  )
}
