"use client"
// components/anyfed/LinkageThread.tsx — interactive cross-dataset linkage:
// how the datasets at different grains chain together, statement line down to
// source document — the Universe-of-Transactions thread. Click each stage to
// walk the thread; the worked example uses real values from the local archive.
import { useState } from "react"
import { useTheme, Card, Badge } from "./ui"

interface Stage {
  icon: string; name: string; dataset: string; grain: string
  measure: string                  // the SPECIFIC dollar measure at this grain
  joinKey: string                  // the key that links DOWN to the next stage
  what: string
  example: string                  // real worked example value
  color: "blue" | "cyan" | "gold" | "green" | "purple"
}

const STAGES: Stage[] = [
  { icon: "📜", name: "Statement / SBR line", dataset: "File A — Account Balances (GTAS)", grain: "TAS × period",
    measure: "total_budgetary_resources · obligations_incurred · unobligated_balance (SF-133 lines 1910/2190/2490, $ whole)",
    joinKey: "TAS (Treasury Account Symbol)",
    what: "The certified top: total budgetary resources, obligations, and unobligated balance per appropriation account. This is the number on the Statement of Budgetary Resources — everything below must roll up to it.",
    example: "TAS 097-2026/2026-1205 (Navy MILCON FY2026) — account-level obligations from the GTAS view on this page", color: "blue" },
  { icon: "🧾", name: "Cost structure split", dataset: "File B — Program Activity & Object Class", grain: "TAS × PA × OC × period",
    measure: "obligated_amount + gross_outlay_amount per TAS×PA×OC (USSGL 480x/490x-sourced, $ whole)",
    joinKey: "TAS + program activity + object class",
    what: "The same account dollars split by what they bought (object class) and which program bought them — the bridge between account balances and cost analysis. Must tie to File A per TAS.",
    example: "Within the MILCON TAS: OC 32.0 (land & structures) carries the construction obligations", color: "cyan" },
  { icon: "🔗", name: "Account ↔ Award bridge", dataset: "File C — Account Breakdown by Award", grain: "TAS × award × period",
    measure: "transaction_obligated_amount per TAS×award×period ($ whole — sums to the TAS obligations above)",
    joinKey: "award_unique_key (PIID/FAIN)",
    what: "THE critical hop: which awards each account funded, period by period. This is where appropriation-year attribution lives — and the hop most agencies cannot complete cleanly, which is exactly DoD's MW #7.",
    example: "TAS 097-2026/2026-1205 → award W912PP-26-C-#### (Navy shipyard infrastructure MACC)", color: "gold" },
  { icon: "💸", name: "Award transaction", dataset: "D1 archive — 297-column contract transactions", grain: "transaction (obligation event)",
    measure: "federal_action_obligation per action ($ whole; net of de-obligations) + total_dollars_obligated cumulative per award",
    joinKey: "contract_transaction_unique_key",
    what: "The individual obligation event with everything attached: amount, action date, recipient, NAICS/PSC, funding vs awarding office, and the TAS LIST funding it (treasury_accounts_funding_this_award closes the loop back up to File A).",
    example: "Real row from your archive: $152.0M · KIEWIT-ALBERICI SIOP MACC AJV · 2025-11-06 · Dept of the Navy — flagged top outlier by the pipeline", color: "green" },
  { icon: "📄", name: "Source document (KSD)", dataset: "EDA / PIEE / WAWF — outside USAspending", grain: "document",
    measure: "contract ceiling (base_and_all_options_value) · invoice/acceptance amounts on the documents themselves",
    joinKey: "PIID + modification number",
    what: "The audit terminus: the contract, modification, receiving report, and invoice that evidence the transaction. USAspending carries the keys (PIID, mod); the documents live in the contracting systems — this last hop is what KSD retrieval automates.",
    example: "PIID + mod → EDA contract PDF + WAWF DD-250 acceptance — the evidence package an auditor samples", color: "purple" },
]

export default function LinkageThread() {
  const C = useTheme()
  const [sel, setSel] = useState(3)
  const col = (c: string) => c === "blue" ? C.blue : c === "cyan" ? C.cyan : c === "gold" ? C.gold : c === "green" ? C.green : C.purple
  const s = STAGES[sel]
  return (
    <Card title="6 · Cross-Dataset Linkage — the UoT thread"
          sub="How datasets at five different grains chain from a statement line down to the source document. Click a stage to inspect it — this is the workflow that answers 'can you prove this number?'">
      {/* the thread */}
      <div style={{ display:"flex", alignItems:"stretch", gap:0, overflowX:"auto", paddingBottom:6, marginBottom:14 }}>
        {STAGES.map((st, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
            <div onClick={() => setSel(i)}
              style={{ cursor:"pointer", width:158, padding:"10px 10px", borderRadius:10, textAlign:"center",
                       background: sel === i ? `${col(st.color)}1f` : C.card,
                       border:`2px solid ${sel === i ? col(st.color) : C.border}`, transition:"all .15s" }}>
              <div style={{ fontSize:22 }}>{st.icon}</div>
              <div style={{ fontSize:13.5, fontWeight:700, color: sel === i ? col(st.color) : C.text, lineHeight:1.3, marginTop:3 }}>{st.name}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:3, fontFamily:"var(--font-mono)" }}>{st.grain}</div>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"0 6px", flexShrink:0 }}>
                <span style={{ fontSize:16, color:C.muted }}>→</span>
                <span style={{ fontSize:9.5, color:C.muted, fontFamily:"var(--font-mono)", maxWidth:86, textAlign:"center", lineHeight:1.3 }}>{STAGES[i].joinKey}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* selected stage detail */}
      <div style={{ background:C.card, border:`1px solid ${col(s.color)}55`, borderLeft:`4px solid ${col(s.color)}`, borderRadius:10, padding:"13px 16px" }}>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:7 }}>
          <Badge color={col(s.color)}>STAGE {sel + 1} OF 5</Badge>
          <span style={{ fontSize:16, fontWeight:800, color:C.text }}>{s.icon} {s.name}</span>
          <span style={{ fontSize:13, color:C.muted, fontFamily:"var(--font-mono)" }}>{s.dataset}</span>
        </div>
        <div style={{ fontSize:15, color:C.textSub, lineHeight:1.7, marginBottom:9 }}>{s.what}</div>
        <div style={{ fontSize:13.5, color:C.gold, fontFamily:"var(--font-mono)", lineHeight:1.55, marginBottom:8 }}>
          $ measure · {s.measure}
        </div>
        <div style={{ fontSize:14, color:C.cyan, fontFamily:"var(--font-mono)", lineHeight:1.6, padding:"8px 11px",
                      background:C.bg, borderRadius:8, border:`1px solid ${C.border}` }}>
          worked example · {s.example}
        </div>
        <div style={{ fontSize:13.5, color:C.muted, marginTop:8 }}>
          {sel < 4 ? <>joins down via <b style={{ color:C.text }}>{s.joinKey}</b> → {STAGES[sel + 1].name}</> : "thread terminus — the auditable evidence"}
        </div>
      </div>

      <div style={{ fontSize:14, color:C.textSub, lineHeight:1.7, marginTop:12, padding:"10px 13px",
                    background:`${C.gold}0c`, border:`1px solid ${C.gold}44`, borderRadius:9 }}>
        <b style={{ color:C.gold }}>Why this thread IS the UoT answer:</b> a certified Universe of Transactions is precisely
        the claim that every Stage-1 balance decomposes completely through Stages 2–4 with no orphans, and every Stage-4
        transaction reaches Stage 5 on demand. Your local archive already carries the Stage-4 ↔ Stage-1 closure key
        (<code>treasury_accounts_funding_this_award</code>) — the pipeline's TAS rollup proved FY2022–24 money funding
        FY2026 actions. The missing File C download (see the Runbook on Data Explorer) is the hop that makes Stage 3
        explicit instead of inferred.
      </div>
    </Card>
  )
}
