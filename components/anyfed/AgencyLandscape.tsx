"use client"
// components/anyfed/AgencyLandscape.tsx — "who is this agency" section for the
// Executive Overview: mission, operating footprint, uniqueness, and the
// financial-management landscape across budget / accounting / internal
// control / audit / fin ops, with jump links into the matching modules.
import { useTheme, Card, Row, Badge } from "./ui"
import { getProfile } from "@/lib/agency-profiles"
import type { Agency } from "@/lib/agencies"

const FM_DOMAINS: { key: "budget" | "accounting" | "controls" | "audit" | "finops"; icon: string; label: string; page: string }[] = [
  { key: "budget",     icon: "📊", label: "Budget",            page: "budget" },
  { key: "accounting", icon: "📒", label: "Accounting",        page: "accounting" },
  { key: "controls",   icon: "🛡️", label: "Internal Control",  page: "controls" },
  { key: "audit",      icon: "🔍", label: "Audit",             page: "audit" },
  { key: "finops",     icon: "💳", label: "Finance Operations", page: "finops" },
]

export default function AgencyLandscape({ agency, onNavigate }: { agency: Agency; onNavigate?: (page: string) => void }) {
  const C = useTheme()
  const p = getProfile(agency)
  return (
    <Card title={`${agency.seal} ${agency.name} — Agency & FM Landscape`}
          sub="Mission, footprint, what makes this agency different, and how its financial management actually works">
      <Row>
        {([["🎯", "Mission", p.mission, C.blue],
           ["🌐", "Operating footprint", p.footprint, C.cyan],
           ["⭐", "What makes it different", p.uniqueness, C.gold]] as const).map(([icon, t, body, col]) => (
          <div key={t} style={{ flex:1, minWidth:280, background:C.card, border:`1px solid ${C.border}`,
                                borderTop:`3px solid ${col}`, borderRadius:10, padding:"13px 15px" }}>
            <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:7 }}>{icon} {t}</div>
            <div style={{ fontSize:16, color:C.textSub, lineHeight:1.65 }}>{body}</div>
          </div>
        ))}
      </Row>
      <div style={{ height:14 }} />
      <div style={{ fontSize:15, color:C.muted, letterSpacing:"0.08em", marginBottom:10 }}>
        FINANCIAL MANAGEMENT LANDSCAPE — CLICK A DOMAIN TO OPEN ITS MODULE
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:10 }}>
        {FM_DOMAINS.map(d => (
          <div key={d.key} onClick={() => onNavigate?.(d.page)}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"11px 13px",
                     cursor: onNavigate ? "pointer" : "default" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:17, fontWeight:700, color:C.text }}>{d.icon} {d.label}</span>
              {onNavigate && <Badge color={C.blue}>open →</Badge>}
            </div>
            <div style={{ fontSize:15.5, color:C.textSub, lineHeight:1.6 }}>{p.fm[d.key]}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
