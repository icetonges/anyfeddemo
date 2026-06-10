"use client"
// components/anyfed/AIAnalyst.tsx — agency-aware chain-of-LLMs FM analyst
import { useEffect, useRef, useState } from "react"
import { useTheme, Card, SectionTitle, Badge } from "./ui"
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models"
import type { Agency } from "@/lib/agencies"
import type { ChatMessage } from "@/types"

interface Msg extends ChatMessage { modelUsed?: string }

const SUGGESTIONS: Record<string, string[]> = {
  DOD: [
    "Explain how the FY2027 R-1 request differs from FY2026 and what's driving RDT&E growth.",
    "Which material weaknesses block a clean opinion the most, and what would I remediate first?",
    "Draft a FBwT reconciliation procedure aligned to MW #8.",
  ],
  SEC: [
    "Why is the FY2027 request 11% below FY2026 while FTE grows?",
    "Explain the Section 31 fee-offset model and the FY2025 $0 rate.",
    "What are the open OIG findings and their due dates?",
  ],
  DEFAULT: [
    "Walk me through the A-11 budget lifecycle for this agency.",
    "What obligation-rate pattern would worry you in the live data?",
    "Draft an ADA risk checklist for year-end execution.",
  ],
}

export default function AIAnalyst({ agency }: { agency: Agency }) {
  const C = useTheme()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }) }, [msgs])
  useEffect(() => { setMsgs([]) }, [agency.id])

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || busy) return
    const next: Msg[] = [...msgs, { role:"user", content }]
    setMsgs(next); setInput(""); setBusy(true)
    try {
      const res = await fetch("/api/ai-chat", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })), modelId, agency: agency.id }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      setMsgs([...next, { role:"assistant", content: j.text, modelUsed: j.modelUsed }])
    } catch (e) {
      setMsgs([...next, { role:"assistant", content:`⚠️ ${e instanceof Error ? e.message : e}` }])
    } finally { setBusy(false) }
  }

  const sugg = SUGGESTIONS[agency.id] ?? SUGGESTIONS.DEFAULT

  return (
    <div>
      <SectionTitle title="AI FM Analyst"
        sub={`Chain-of-LLMs (Gemini → Claude → Groq fallback) primed with ${agency.abbrev} budget, audit, and FM-framework context`} />
      <Card style={{ padding:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
          <Badge color={C.green}>● CHAIN ACTIVE</Badge>
          <select value={modelId} onChange={e => setModelId(e.target.value)}
            style={{ marginLeft:"auto", background:C.card, color:C.text, border:`1px solid ${C.border}`,
                     borderRadius:8, padding:"6px 10px", fontSize:16 }}>
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.providerLabel ?? m.provider}</option>)}
          </select>
        </div>

        <div style={{ height:420, overflowY:"auto", padding:16 }}>
          {!msgs.length && (
            <div>
              <div style={{ fontSize:17.5, color:C.muted, marginBottom:12 }}>
                Ask anything about {agency.name} financial management. Try:
              </div>
              {sugg.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ display:"block", width:"100%", textAlign:"left", marginBottom:8, padding:"10px 14px",
                           background:C.card, border:`1px solid ${C.border}`, borderRadius:10, color:C.textSub,
                           fontSize:17, cursor:"pointer" }}>
                  💬 {s}
                </button>
              ))}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{ marginBottom:14, display:"flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth:"82%", padding:"10px 14px", borderRadius:12, fontSize:17.5, lineHeight:1.65,
                            whiteSpace:"pre-wrap",
                            background: m.role === "user" ? `${C.blue}26` : C.card,
                            border:`1px solid ${m.role === "user" ? C.borderAccent : C.border}`,
                            color:C.text }}>
                {m.content}
                {m.modelUsed && (
                  <div style={{ fontSize:14, color:C.muted, marginTop:6 }}>answered by {m.modelUsed}</div>
                )}
              </div>
            </div>
          ))}
          {busy && <div style={{ fontSize:17, color:C.muted }}>Analyst is thinking…</div>}
          <div ref={endRef} />
        </div>

        <div style={{ display:"flex", gap:10, padding:"12px 16px", borderTop:`1px solid ${C.border}` }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder={`Ask the ${agency.abbrev} FM analyst…`}
            style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                     padding:"10px 14px", fontSize:17.5, color:C.text, outline:"none" }} />
          <button onClick={() => send()} disabled={busy}
            style={{ padding:"10px 22px", borderRadius:10, fontWeight:700, fontSize:17.5, cursor:"pointer",
                     border:`1px solid ${C.borderAccent}`, background:`${C.blue}26`, color:C.blue }}>
            Send
          </button>
        </div>
      </Card>
    </div>
  )
}
