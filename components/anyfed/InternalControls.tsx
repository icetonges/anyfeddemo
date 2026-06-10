"use client"
// components/anyfed/InternalControls.tsx — OMB A-123 control matrix
import { useTheme, Card, Row, SectionTitle, Badge, KPI } from "./ui"
import { A123_CONTROLS } from "@/lib/fm-content"
import type { Agency } from "@/lib/agencies"

export default function InternalControls({ agency }: { agency: Agency }) {
  const C = useTheme()
  const isDod = agency.id === "DOD"
  return (
    <div>
      <SectionTitle title="Internal Controls (OMB A-123)"
        sub="Management's responsibility for enterprise risk management and internal control over financial reporting" />
      <Row>
        <KPI icon="🛡️" label="Framework" value="A-123" accent={C.blue} sub="+ FMFIA annual assurance statement" />
        <KPI icon="🧪" label="Testing Cadence" value="Quarterly" accent={C.cyan} sub="Design + operating effectiveness" />
        <KPI icon="📝" label="Assurance Statement" value="FY due Nov" accent={C.gold} sub="Signed by agency head in AFR" />
        {isDod && <KPI icon="🎯" label="Audit Linkage" value="26 MWs" accent={C.red} sub="Each control maps to a weakness" />}
      </Row>

      <div style={{ height:18 }} />
      <Card title="Key Control Matrix" sub="Representative ICOFR controls across the FM domains in this portal">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5, minWidth:680 }}>
            <thead>
              <tr style={{ color:C.muted, textAlign:"left" }}>
                {["ID", "Area", "Control Activity", "Frequency", "Assertion"].map(h => (
                  <th key={h} style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {A123_CONTROLS.map(c => (
                <tr key={c.id}>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, fontFamily:"var(--font-mono)", color:C.cyan, whiteSpace:"nowrap" }}>{c.id}</td>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>
                    <Badge color={C.purple}>{c.area}</Badge>
                  </td>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, lineHeight:1.5 }}>{c.ctrl}</td>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, whiteSpace:"nowrap" }}>{c.freq}</td>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.gold, whiteSpace:"nowrap" }}>{c.assertion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ height:16 }} />
      <Row>
        <Card title="Deficiency Escalation Ladder" style={{ flex:1, minWidth:300 }}>
          <div style={{ fontSize:12.5, color:C.textSub, lineHeight:2 }}>
            <Badge color={C.green}>Control Deficiency</Badge> → documented, remediated locally<br />
            <Badge color={C.gold}>Significant Deficiency</Badge> → reported to governance council & auditors<br />
            <Badge color={C.red}>Material Weakness</Badge> → disclosed in AFR; Corrective Action Plan with milestones
          </div>
        </Card>
        <Card title="Continuous Monitoring with AI" style={{ flex:1, minWidth:300 }}>
          <div style={{ fontSize:12.5, color:C.textSub, lineHeight:1.8 }}>
            The Workbench&apos;s anomaly and risk models convert periodic control testing into continuous monitoring:
            score 100% of transactions every cycle, route only high-risk items to humans, and keep an immutable
            evidence log — the A-123 testing model auditors increasingly expect.
          </div>
        </Card>
      </Row>
    </div>
  )
}
