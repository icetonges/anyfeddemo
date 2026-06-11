"use client"
// components/anyfed/AIAnalyst.tsx — agency-aware chain-of-LLMs FM analyst.
// Major capabilities: (1) per-agency knowledge base (same sections that prime
// the system prompt are inspectable in the grounding panel), (2) model arena —
// run TWO models on the same question side-by-side with latency stats and an
// impartial AI judge, (3) agency-specific starter questions for every profile.
import { useEffect, useRef, useState } from "react"
import { useTheme, Card, SectionTitle, Badge } from "./ui"
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models"
import { knowledgeBase } from "@/lib/analyst-context"
import { saveKnowledge } from "@/lib/knowledge"
import type { Agency } from "@/lib/agencies"

interface CompareResult { modelId: string; ok: boolean; text?: string; error?: string; ms: number }
type Turn =
  | { kind: "user"; content: string }
  | { kind: "assistant"; content: string; modelUsed?: string }
  | { kind: "compare"; question: string; results: CompareResult[]; verdict?: string; judgeModel?: string; judging?: boolean }

const SUGGESTIONS: Record<string, string[]> = {
  DOD: [
    "Explain how the FY2027 R-1 request differs from FY2026 and what's driving RDT&E growth.",
    "Which of the 26 material weaknesses block a clean opinion the most, and what would I remediate first before the Dec 2028 deadline?",
    "Draft a FBwT reconciliation procedure aligned to MW #8 across GFEBS, Navy ERP, and DEAMS.",
  ],
  SEC: [
    "Why is the FY2027 request 11% below FY2026 while FTE grows — and what does it do to exam capacity?",
    "Explain the Section 31 fee-offset model and how the fee rate trues up to the enacted ceiling.",
    "What are the open OIG findings, their due dates, and the remediation owner for each?",
  ],
  FDIC: [
    "Why doesn't the FDIC face a fiscal-year appropriation cliff, and what disciplines spending instead?",
    "Walk me through how the DIF reserve ratio drives assessment rates — the FDIC's real fiscal policy.",
    "What would a 2023-style systemic-risk resolution do to the operating budget and special assessments?",
  ],
  TREAS: [
    "How do CARS, GTAS, and the TGA fit together for Fund Balance with Treasury government-wide?",
    "Which Treasury bureaus drive net cost, and what does the fiscal-agent role add to the statements?",
    "What are the recurring audit emphasis areas in Treasury's own AFR?",
  ],
  VA: [
    "Why does the actuarial veterans benefit liability swing VA's net cost so hard year to year?",
    "Explain VA's mandatory vs discretionary split and why Community Care strains the medical accounts.",
    "Build an obligation-pacing check for VA medical care money approaching year-end.",
  ],
  SSA: [
    "How do the OASI/DI trust funds interact with SSA's LAE administrative appropriation?",
    "SSA outlays are huge but its admin budget is tiny — what ratios actually matter for FM oversight?",
    "Which PIIA payment-integrity measures matter most for SSA's benefit programs?",
  ],
  HHS: [
    "How do mandatory Medicare/Medicaid flows differ from discretionary NIH/CDC money in execution analysis?",
    "Where does grant accounting risk concentrate in HHS's audit, and what controls address it?",
    "Draft an improper-payment risk profile for the largest HHS programs under PIIA.",
  ],
  DHS: [
    "What did it take for DHS to reach a clean opinion, and which areas remain fragile?",
    "Explain Disaster Relief Fund no-year funding mechanics during a surge.",
    "Which DHS components carry the FM system-modernization risk today?",
  ],
  DOE: [
    "Why does environmental cleanup liability dominate DOE's balance sheet, and how is it estimated?",
    "How do M&O contractor costs flow into DOE's financial statements?",
    "What execution measure best separates NNSA from Office of Science money in the live data?",
  ],
  NASA: [
    "How do multi-year R&D appropriations shape NASA's unobligated balance profile?",
    "What does a CR do to a new-start mission? Cite the fiscal law.",
    "Trend Artemis-era procurement obligations using the live USAspending dimensions.",
  ],
  DEFAULT: [
    "Walk me through the A-11 budget lifecycle for this agency and where it is in the cycle today.",
    "What obligation-rate pattern would worry you in this agency's live execution data?",
    "Draft an Anti-Deficiency Act risk checklist for this agency's year-end execution.",
  ],
}

const mInfo = (id: string) => MODELS.find(m => m.id === id)
const words = (t?: string) => (t ? t.trim().split(/\s+/).length : 0)

export default function AIAnalyst({ agency }: { agency: Agency }) {
  const C = useTheme()
  const [msgs, setMsgs] = useState<Turn[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<"single" | "compare">("single")
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID)
  const [modelA, setModelA] = useState<string>(DEFAULT_MODEL_ID)
  const [modelB, setModelB] = useState<string>("claude-sonnet-4-6")
  const [kbOpen, setKbOpen] = useState(false)
  const [kbSec, setKbSec] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs])
  useEffect(() => { setMsgs([]); setKbSec(0) }, [agency.id])

  const kb = knowledgeBase(agency.id)

  /** flatten turn history into {role,content} pairs the API understands */
  const apiHistory = (turns: Turn[]) => turns.map(t =>
    t.kind === "user" ? { role: "user" as const, content: t.content } :
    t.kind === "assistant" ? { role: "assistant" as const, content: t.content } :
    { role: "assistant" as const, content: t.results.find(r => r.ok)?.text ?? "(both models failed)" })

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || busy) return
    const next: Turn[] = [...msgs, { kind: "user", content }]
    setMsgs(next); setInput(""); setBusy(true)
    try {
      if (mode === "compare") {
        const res = await fetch("/api/ai-chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "compare", messages: apiHistory(next), modelA, modelB, agency: agency.id }),
        })
        const j = await res.json()
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
        const rs = j.results as CompareResult[]
        setMsgs([...next, { kind: "compare", question: content, results: rs }])
        if (rs.some(r => r.ok)) saveKnowledge("compare", agency.id, `Arena: ${content.slice(0, 120)}`,
          `QUESTION:\n${content}\n\n${rs.map(r => `=== ${r.modelId} (${(r.ms / 1000).toFixed(1)}s) ===\n${r.ok ? r.text : `failed: ${r.error}`}`).join("\n\n")}`)
      } else {
        const res = await fetch("/api/ai-chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiHistory(next), modelId, agency: agency.id }),
        })
        const j = await res.json()
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
        setMsgs([...next, { kind: "assistant", content: j.text, modelUsed: j.modelUsed }])
        saveKnowledge("analyst", agency.id, `Q: ${content.slice(0, 140)}`, `QUESTION:\n${content}\n\nANSWER (${j.modelUsed}):\n${j.text}`, j.modelUsed)
      }
    } catch (e) {
      setMsgs([...next, { kind: "assistant", content: `⚠️ ${e instanceof Error ? e.message : e}` }])
    } finally { setBusy(false) }
  }

  const judge = async (idx: number) => {
    const t = msgs[idx]
    if (t.kind !== "compare" || t.judging || t.verdict) return
    const [ra, rb] = t.results
    if (!ra?.ok || !rb?.ok) return
    setMsgs(m => m.map((x, i) => i === idx && x.kind === "compare" ? { ...x, judging: true } : x))
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "judge", agency: agency.id, question: t.question,
          answers: [{ modelId: ra.modelId, text: ra.text }, { modelId: rb.modelId, text: rb.text }] }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      setMsgs(m => m.map((x, i) => i === idx && x.kind === "compare"
        ? { ...x, judging: false, verdict: j.text, judgeModel: j.modelUsed } : x))
      saveKnowledge("judge", agency.id, `Verdict: ${t.question.slice(0, 120)}`,
        `QUESTION:\n${t.question}\n\nVERDICT (judged by ${j.modelUsed}):\n${j.text}`, j.modelUsed)
    } catch (e) {
      setMsgs(m => m.map((x, i) => i === idx && x.kind === "compare"
        ? { ...x, judging: false, verdict: `⚠️ Judge failed: ${e instanceof Error ? e.message : e}` } : x))
    }
  }

  const sugg = SUGGESTIONS[agency.id] ?? SUGGESTIONS.DEFAULT
  const sel: React.CSSProperties = { background: C.card, color: C.text, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: "6px 10px", fontSize: 15.5, cursor: "pointer", maxWidth: "100%" }
  const modeBtn = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px", borderRadius: 9, fontSize: 15.5, fontWeight: 700, cursor: "pointer",
    border: `1px solid ${active ? C.borderAccent : C.border}`,
    background: active ? `${C.blue}1f` : "transparent", color: active ? C.blue : C.textSub })

  const modelOptions = MODELS.map(m => (
    <option key={m.id} value={m.id}>{m.name} — {m.providerLabel ?? m.provider}{m.isFree ? " (free)" : ""}</option>
  ))

  const resultCard = (r: CompareResult, label: string) => {
    const m = mInfo(r.modelId)
    const pc = m?.providerColor ?? C.blue
    return (
      <div key={label} style={{ background: C.card, border: `1px solid ${pc}55`, borderTop: `3px solid ${pc}`,
                                borderRadius: 12, padding: "11px 14px", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <Badge color={pc}>{label}</Badge>
          <span style={{ fontSize: 15.5, fontWeight: 800, color: C.text }}>{m?.name ?? r.modelId}</span>
          <span style={{ marginLeft: "auto", fontSize: 13.5, color: C.muted, fontFamily: "var(--font-mono)" }}>
            {(r.ms / 1000).toFixed(1)}s{r.ok ? ` · ${words(r.text)} words` : ""}
          </span>
        </div>
        {r.ok
          ? <div style={{ fontSize: 16.5, lineHeight: 1.65, color: C.text, whiteSpace: "pre-wrap" }}>{r.text}</div>
          : <div style={{ fontSize: 15.5, color: C.red ?? "#f87171" }}>⚠️ {r.error}</div>}
      </div>
    )
  }

  return (
    <div>
      <SectionTitle title="AI FM Analyst"
        sub={`Chain-of-LLMs (Gemini → Groq → Claude fallback) primed with the ${agency.abbrev}-specific knowledge base below — profile, FM landscape, budget brief, fiscal-law framework, and your loaded data holdings`} />

      {/* ── grounding panel: what the analyst knows ── */}
      <Card style={{ marginBottom: 14 }}>
        <button onClick={() => setKbOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
                   background: "transparent", border: "none", color: C.text, padding: 0 }}>
          <span style={{ fontSize: 20 }}>📚</span>
          <span style={{ fontSize: 17, fontWeight: 800 }}>Knowledge base — what this analyst knows about {agency.abbrev}</span>
          <Badge color={C.cyan}>{kb.reduce((n, s) => n + s.items.length, 0)} grounded facts · {kb.length} sections</Badge>
          <span style={{ marginLeft: "auto", color: C.muted, fontSize: 16 }}>{kbOpen ? "▴ hide" : "▾ inspect"}</span>
        </button>
        {kbOpen && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {kb.map((s, i) => (
                <button key={s.title} onClick={() => setKbSec(i)}
                  style={{ padding: "6px 12px", borderRadius: 8, fontSize: 14.5, fontWeight: 600, cursor: "pointer",
                           border: `1px solid ${kbSec === i ? C.borderAccent : C.border}`,
                           background: kbSec === i ? `${C.blue}1f` : C.card,
                           color: kbSec === i ? C.blue : C.textSub }}>
                  {s.icon} {s.title}
                </button>
              ))}
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                          padding: "11px 14px", maxHeight: 300, overflowY: "auto" }}>
              {kb[kbSec]?.items.map((it, i) => (
                <div key={i} style={{ fontSize: 15.5, color: C.textSub, lineHeight: 1.65, marginBottom: 7,
                                      paddingLeft: 14, textIndent: -14 }}>• {it}</div>
              ))}
            </div>
            <div style={{ fontSize: 13.5, color: C.muted, marginTop: 8 }}>
              This exact content is rendered into the system prompt server-side (lib/analyst-context.ts) — switch agency and the knowledge base switches with it.
            </div>
          </div>
        )}
      </Card>

      <Card style={{ padding: 0 }}>
        {/* ── header: mode + model controls ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                      borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          <Badge color={C.green}>● CHAIN ACTIVE</Badge>
          <button style={modeBtn(mode === "single")} onClick={() => setMode("single")}>💬 Single model</button>
          <button style={modeBtn(mode === "compare")} onClick={() => setMode("compare")}>⚖ Compare two models</button>
          {mode === "single" ? (
            <select value={modelId} onChange={e => setModelId(e.target.value)} style={{ ...sel, marginLeft: "auto" }}>
              {modelOptions}
            </select>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
              <select value={modelA} onChange={e => setModelA(e.target.value)} style={sel}>{modelOptions}</select>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: C.gold }}>VS</span>
              <select value={modelB} onChange={e => setModelB(e.target.value)} style={sel}>{modelOptions}</select>
            </div>
          )}
        </div>
        {mode === "compare" && (
          <div style={{ padding: "8px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 14.5, color: C.muted }}>
            Both models receive the identical {agency.abbrev} system prompt and conversation — same grounding, same question.
            After both answer, use <b style={{ color: C.gold }}>⚖ Judge</b> for an impartial adjudication (accuracy · specificity · actionability).
            {modelA === modelB && <b style={{ color: C.gold }}> Tip: pick two different models for a meaningful comparison.</b>}
          </div>
        )}

        {/* ── transcript ── */}
        <div style={{ height: 460, overflowY: "auto", padding: 16 }}>
          {!msgs.length && (
            <div>
              <div style={{ fontSize: 17.5, color: C.muted, marginBottom: 12 }}>
                Ask anything about {agency.name} financial management{mode === "compare" ? " — both models will answer side by side" : ""}. Try:
              </div>
              {sugg.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 8, padding: "10px 14px",
                           background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSub,
                           fontSize: 17, cursor: "pointer" }}>
                  💬 {s}
                </button>
              ))}
            </div>
          )}
          {msgs.map((m, i) => {
            if (m.kind === "user") return (
              <div key={i} style={{ marginBottom: 14, display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: 12, fontSize: 17.5, lineHeight: 1.65,
                              whiteSpace: "pre-wrap", background: `${C.blue}26`, border: `1px solid ${C.borderAccent}`, color: C.text }}>
                  {m.content}
                </div>
              </div>
            )
            if (m.kind === "assistant") return (
              <div key={i} style={{ marginBottom: 14, display: "flex", justifyContent: "flex-start" }}>
                <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: 12, fontSize: 17.5, lineHeight: 1.65,
                              whiteSpace: "pre-wrap", background: C.card, border: `1px solid ${C.border}`, color: C.text }}>
                  {m.content}
                  {m.modelUsed && <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>answered by {m.modelUsed}</div>}
                </div>
              </div>
            )
            // compare turn
            const [ra, rb] = m.results
            return (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 10 }}>
                  {ra && resultCard(ra, "MODEL A")}
                  {rb && resultCard(rb, "MODEL B")}
                </div>
                <div style={{ marginTop: 8 }}>
                  {!m.verdict && ra?.ok && rb?.ok && (
                    <button onClick={() => judge(i)} disabled={m.judging}
                      style={{ padding: "8px 16px", borderRadius: 9, fontSize: 15.5, fontWeight: 700, cursor: "pointer",
                               border: `1px solid ${C.gold}66`, background: `${C.gold}14`, color: C.gold }}>
                      {m.judging ? "⚖ Judging…" : "⚖ Judge — impartial AI adjudication"}
                    </button>
                  )}
                  {m.verdict && (
                    <div style={{ background: `${C.gold}0c`, border: `1px solid ${C.gold}44`, borderRadius: 10,
                                  padding: "10px 14px", fontSize: 16, lineHeight: 1.65, color: C.text, whiteSpace: "pre-wrap" }}>
                      <b style={{ color: C.gold }}>⚖ Verdict{m.judgeModel ? ` (judged by ${m.judgeModel})` : ""}:</b>{"\n"}{m.verdict}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {busy && (
            <div style={{ fontSize: 17, color: C.muted }}>
              {mode === "compare" ? `Running ${mInfo(modelA)?.name ?? modelA} and ${mInfo(modelB)?.name ?? modelB} in parallel…` : "Analyst is thinking…"}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* ── composer ── */}
        <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder={mode === "compare" ? `Ask both models about ${agency.abbrev} FM…` : `Ask the ${agency.abbrev} FM analyst…`}
            style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                     padding: "10px 14px", fontSize: 17.5, color: C.text, outline: "none" }} />
          <button onClick={() => send()} disabled={busy}
            style={{ padding: "10px 22px", borderRadius: 10, fontWeight: 700, fontSize: 17.5, cursor: "pointer",
                     border: `1px solid ${C.borderAccent}`, background: `${C.blue}26`, color: C.blue }}>
            {mode === "compare" ? "Ask both" : "Send"}
          </button>
        </div>
      </Card>
    </div>
  )
}
