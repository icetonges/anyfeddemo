"use client"
// components/anyfed/AuditCenter.tsx — audit posture, material weaknesses, FIAR
import { useState } from "react"
import { useTheme, Card, Row, SectionTitle, Badge, KPI } from "./ui"
import { DOD_MATERIAL_WEAKNESSES, DOD_AUDIT_FACTS, FIAR_PHASES, GUIDANCE_LIBRARY } from "@/lib/fm-content"
import type { Agency } from "@/lib/agencies"

const CATS = ["All", "IT & Systems", "Transactions & Balances", "Reporting & Oversight"] as const

export default function AuditCenter({ agency }: { agency: Agency }) {
  const C = useTheme()
  const [cat, setCat] = useState<typeof CATS[number]>("All")
  const isDod = agency.id === "DOD"
  const mws = cat === "All" ? DOD_MATERIAL_WEAKNESSES : DOD_MATERIAL_WEAKNESSES.filter(m => m.category === cat)

  return (
    <div>
      <SectionTitle title="Audit & Remediation Center"
        sub={isDod
          ? `${DOD_AUDIT_FACTS.report} — FY2025 agency-wide audit (source PDFs in sourcedata/)`
          : `Financial statement audit posture — ${agency.abbrev}`} />

      {isDod ? (
        <>
          <Row>
            <KPI icon="📋" label="Opinion" value="Disclaimer" accent={C.red} sub={DOD_AUDIT_FACTS.opinionYears} />
            <KPI icon="🔴" label="Material Weaknesses" value={String(DOD_AUDIT_FACTS.materialWeaknesses)} accent={C.orange}
                 sub={`${DOD_AUDIT_FACTS.significantDeficiencies} significant deficiencies`} />
            <KPI icon="🎯" label="Clean Opinion Deadline" value="Dec 2028" accent={C.gold} sub="NDAA FY2024 · P.L. 118-31" />
            <KPI icon="✅" label="Clean Entities Today" value={String(DOD_AUDIT_FACTS.cleanEntities.length)} accent={C.green}
                 sub="incl. DFAS WCF, MRF, USACE-CW" />
          </Row>

          <div style={{ display:"flex", gap:8, margin:"18px 0 12px", flexWrap:"wrap" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                         border:`1px solid ${cat === c ? C.borderAccent : C.border}`,
                         background: cat === c ? `${C.blue}22` : C.card, color: cat === c ? C.blue : C.muted }}>
                {c} {c === "All" ? `(${DOD_MATERIAL_WEAKNESSES.length})` : `(${DOD_MATERIAL_WEAKNESSES.filter(m => m.category === c).length})`}
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:12 }}>
            {mws.map(mw => (
              <div key={mw.num} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"13px 15px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text }}>MW #{mw.num} — {mw.title}</div>
                  <Badge color={mw.category === "IT & Systems" ? C.purple : mw.category === "Transactions & Balances" ? C.orange : C.cyan}>
                    {mw.category.split(" ")[0]}
                  </Badge>
                </div>
                <div style={{ fontSize:12, color:C.textSub, marginTop:6, lineHeight:1.55 }}>{mw.issue}</div>
              </div>
            ))}
          </div>

          <div style={{ height:20 }} />
          <Card title="FIAR Methodology — Path to a Clean Opinion" sub="Assess → Correct → Assert → Sustain">
            <Row>
              {FIAR_PHASES.map((p, i) => (
                <div key={p.phase} style={{ flex:1, minWidth:210 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:[C.blue, C.gold, C.green, C.purple][i], marginBottom:6 }}>
                    {i + 1}. {p.phase}
                  </div>
                  <div style={{ fontSize:12, color:C.textSub, lineHeight:1.55 }}>{p.desc}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>📦 {p.deliverables}</div>
                </div>
              ))}
            </Row>
          </Card>
        </>
      ) : (
        <Card title={`${agency.abbrev} Audit Snapshot`}>
          <div style={{ fontSize:13, color:C.textSub, lineHeight:1.8 }}>
            {agency.id === "SEC"
              ? "The SEC has sustained unmodified (clean) opinions on its financial statements; GAO performs the audit. Active OIG engagement areas (T&M contract management, FISMA controls, CAT data) are tracked in the legacy portal's OIG module."
              : `Most CFO Act agencies receive annual financial statement audits under the CFO Act and OMB Bulletin 24-02. Drop ${agency.abbrev} AFR/OIG source documents into sourcedata/ to power a finding-level tracker here.`}
          </div>
        </Card>
      )}

      <div style={{ height:20 }} />
      <Card title="Authoritative Guidance Library" sub="The FM canon — every domain in this portal traces to these authorities">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(270px, 1fr))", gap:12 }}>
          {GUIDANCE_LIBRARY.map(g => (
            <div key={g.title} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.blue }}>{g.title}
                <span style={{ fontSize:11, color:C.muted, fontWeight:400 }}> · {g.cite}</span>
              </div>
              <div style={{ fontSize:11.5, color:C.textSub, marginTop:5, lineHeight:1.5 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
