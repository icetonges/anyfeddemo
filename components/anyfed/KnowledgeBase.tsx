"use client"
// components/anyfed/KnowledgeBase.tsx — the self-evolving knowledge base.
// Everything the app's AI surfaces produce (daily briefs, analyst answers,
// model arenas + verdicts, document analyses, ML runs) lands here embedded
// and retrievable: application-wide executive summary (looping agent), daily
// view by item with retrieval links, and semantic search over the store.
import { useEffect, useMemo, useState } from "react"
import { useTheme, Card, SectionTitle, Badge, Spinner } from "./ui"
import type { Agency } from "@/lib/agencies"
import { plainText } from "@/lib/text"
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models"

interface KbItem {
  id: number; kind: string; agency: string; title: string; model: string
  preview: string; chars: number; day: string; time: string
}
interface Digest { id: number; title: string; content: string; at: string }
interface Hit { id: number; kind: string; agency: string; title: string; preview: string; day: string; score: number | null }

const KIND_META: Record<string, { icon: string; label: string; color: string }> = {
  "agent-digest": { icon: "🧬", label: "Agent digest", color: "purple" },
  "brief":        { icon: "📰", label: "Daily brief", color: "blue" },
  "analyst":      { icon: "💬", label: "Analyst answer", color: "cyan" },
  "compare":      { icon: "⚖️", label: "Model arena", color: "gold" },
  "judge":        { icon: "🏛", label: "Judge verdict", color: "gold" },
  "doc-analysis": { icon: "📑", label: "Document analysis", color: "green" },
  "ml":           { icon: "🤖", label: "ML run", color: "orange" },
}

export default function KnowledgeBase({ agency }: { agency: Agency }) {
  const C = useTheme()
  const kc = (c: string) => c === "purple" ? C.purple : c === "blue" ? C.blue : c === "cyan" ? C.cyan : c === "gold" ? C.gold : c === "green" ? C.green : C.orange
  const [items, setItems] = useState<KbItem[] | null>(null)
  const [digest, setDigest] = useState<Digest | null>(null)
  const [dbOk, setDbOk] = useState(true)
  const [note, setNote] = useState<string | null>(null)
  const [kind, setKind] = useState("ALL")
  const [onlyAgency, setOnlyAgency] = useState(false)
  const [open, setOpen] = useState<Record<number, string | "loading" | undefined>>({})
  const [agentBusy, setAgentBusy] = useState(false)
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID)
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [searching, setSearching] = useState(false)

  const load = () => fetch("/api/knowledge?op=list").then(r => r.json()).then(j => {
    setDbOk(j.db !== false); setNote(j.note ?? null); setItems(j.items ?? []); setDigest(j.digest ?? null)
  }).catch(e => { setDbOk(false); setNote(String(e)) })
  useEffect(() => { load() }, [])

  const runAgent = async () => {
    if (agentBusy) return
    setAgentBusy(true)
    try {
      const r = await fetch("/api/knowledge", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "agent", modelId }) })
      const j = await r.json()
      if (!r.ok || j.error) throw new Error(j.error ?? `HTTP ${r.status}`)
      await load()
    } catch (e) { setNote(`Agent run failed: ${e instanceof Error ? e.message : e}`) }
    finally { setAgentBusy(false) }
  }

  const search = async () => {
    const query = q.trim()
    if (!query || searching) return
    setSearching(true); setHits(null)
    try {
      const r = await fetch("/api/knowledge", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query }) })
      const j = await r.json()
      setHits(j.hits ?? [])
    } catch { setHits([]) }
    finally { setSearching(false) }
  }

  const fetchItem = async (id: number) => {
    if (open[id]) { setOpen(o => ({ ...o, [id]: undefined })); return }
    setOpen(o => ({ ...o, [id]: "loading" }))
    try {
      const r = await fetch(`/api/knowledge?op=item&id=${id}`)
      const j = await r.json()
      setOpen(o => ({ ...o, [id]: plainText(j.item?.content ?? "(not found)") }))
    } catch { setOpen(o => ({ ...o, [id]: "(fetch failed)" })) }
  }

  const filtered = useMemo(() => (items ?? []).filter(i =>
    (kind === "ALL" || i.kind === kind) && (!onlyAgency || i.agency === agency.id || i.agency === "ALL")),
    [items, kind, onlyAgency, agency.id])
  const byDay = useMemo(() => {
    const m = new Map<string, KbItem[]>()
    filtered.forEach(i => { const a = m.get(i.day) ?? []; a.push(i); m.set(i.day, a) })
    return Array.from(m.entries())
  }, [filtered])
  const latestBrief = useMemo(() => (items ?? []).find(i => i.kind === "brief" && (i.agency === agency.id || !onlyAgency)), [items, agency.id, onlyAgency])
  const counts = useMemo(() => {
    const c = new Map<string, number>()
    ;(items ?? []).forEach(i => c.set(i.kind, (c.get(i.kind) ?? 0) + 1))
    return c
  }, [items])
  const linkOf = (id: number) => `${typeof window !== "undefined" ? window.location.origin : ""}/api/knowledge?op=item&id=${id}`

  const meta = (k: string) => KIND_META[k] ?? { icon: "🗂", label: k, color: "blue" }

  return (
    <div>
      <SectionTitle title="Knowledge Base"
        sub={`Self-evolving store: every AI output across the portal is saved, embedded (Gemini ${"text-embedding-004"}), and retrievable — the looping agent digests it daily into an application-wide executive summary that feeds the next cycle`} />

      {!dbOk && <Card accent={C.gold}><div style={{ fontSize: 15.5, color: C.gold, lineHeight: 1.65 }}>⚠️ {note ?? "Database not configured — outputs are not being persisted in this environment."}</div></Card>}

      {/* ── application-wide executive summary (the loop's product) ── */}
      <Card title="🧬 Executive Summary — application-wide, up to date"
            sub="Produced by the knowledge-loop agent: previous digest + last 7 days of saved outputs + today's intelligence feed → new digest, saved back into the store. Runs automatically after the daily 6 AM ET Action; run it on demand here.">
        {digest ? (
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
              <Badge color={C.purple}>cycle of {digest.at}</Badge>
              <Badge color={C.green}>● LOOP ACTIVE — digest is itself item [#{digest.id}]</Badge>
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.7, color: C.text, whiteSpace: "pre-wrap" }}>{plainText(digest.content)}</div>
          </div>
        ) : (
          <div style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.65 }}>
            No digest yet — generate outputs around the portal (Daily Brief, AI Analyst, Document Analysis, ML Workbench), then run the agent.
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
          <button onClick={runAgent} disabled={agentBusy || !dbOk}
            style={{ padding: "9px 20px", borderRadius: 10, fontSize: 15.5, fontWeight: 800, cursor: "pointer",
                     border: `1px solid ${C.purple}66`, background: `${C.purple}14`, color: C.purple }}>
            {agentBusy ? "⏳ Agent digesting the knowledge base…" : "🧬 Run the looping agent now"}
          </button>
          <span style={{ fontSize: 14, color: C.muted }}>Model</span>
          <select value={modelId} onChange={e => setModelId(e.target.value)}
            style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 14.5, cursor: "pointer" }}>
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.providerLabel ?? m.provider}</option>)}
          </select>
        </div>
      </Card>
      <div style={{ height: 16 }} />

      {/* ── latest daily brief surfaced here too ── */}
      {latestBrief && (
        <>
          <Card title="📰 Latest saved daily brief" sub={`${latestBrief.title} · ${latestBrief.day} ${latestBrief.time}`}>
            <div style={{ fontSize: 14.5, color: C.textSub, lineHeight: 1.6 }}>{latestBrief.preview}…</div>
            <button onClick={() => fetchItem(latestBrief.id)}
              style={{ marginTop: 8, padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.border}`, background: C.card, color: C.blue }}>
              {open[latestBrief.id] && open[latestBrief.id] !== "loading" ? "▴ collapse" : "▾ open full brief"}
            </button>
            {open[latestBrief.id] && open[latestBrief.id] !== "loading" && (
              <div style={{ marginTop: 10, fontSize: 15.5, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{open[latestBrief.id]}</div>
            )}
          </Card>
          <div style={{ height: 16 }} />
        </>
      )}

      {/* ── semantic retrieval ── */}
      <Card title="🔎 Semantic search" sub="embedding-based retrieval across everything ever saved — ask in natural language">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
            placeholder={`e.g. "FBwT reconciliation findings" or "what did the Benford screen flag for ${agency.abbrev}?"`}
            style={{ flex: 1, minWidth: 240, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 13px", fontSize: 15.5, color: C.text, outline: "none" }} />
          <button onClick={search} disabled={searching}
            style={{ padding: "9px 20px", borderRadius: 10, fontWeight: 700, fontSize: 15.5, cursor: "pointer", border: `1px solid ${C.borderAccent}`, background: `${C.blue}1f`, color: C.blue }}>
            {searching ? "…" : "Search"}
          </button>
        </div>
        {hits && (
          <div style={{ marginTop: 12 }}>
            {!hits.length && <div style={{ fontSize: 14.5, color: C.muted }}>No matches.</div>}
            {hits.map(h => (
              <div key={h.id} onClick={() => fetchItem(h.id)}
                style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span>{meta(h.kind).icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{h.title}</span>
                  <Badge color={kc(meta(h.kind).color)}>{meta(h.kind).label}</Badge>
                  <Badge color={h.agency === agency.id ? C.green : C.muted}>{h.agency}</Badge>
                  <span style={{ marginLeft: "auto", fontSize: 12.5, color: C.muted, fontFamily: "var(--font-mono)" }}>
                    {h.day}{h.score != null ? ` · ${(h.score * 100).toFixed(1)}% match` : ""}</span>
                </div>
                {open[h.id] && open[h.id] !== "loading" && (
                  <div style={{ marginTop: 8, fontSize: 14.5, color: C.textSub, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{open[h.id]}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      <div style={{ height: 16 }} />

      {/* ── the archive: by day, by item, with retrieval links ── */}
      <Card title="🗄 Saved knowledge — by day, by item" sub="every output the portal's AI has produced, newest first · click an item to open it inline · ⧉ copies its permanent retrieval link">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => setKind("ALL")}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                     border: `1px solid ${kind === "ALL" ? C.borderAccent : C.border}`, background: kind === "ALL" ? `${C.blue}1a` : C.card, color: kind === "ALL" ? C.blue : C.textSub }}>
            ALL ({items?.length ?? 0})</button>
          {Object.entries(KIND_META).map(([k, m]) => (counts.get(k) ?? 0) > 0 && (
            <button key={k} onClick={() => setKind(k)}
              style={{ padding: "6px 12px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                       border: `1px solid ${kind === k ? kc(m.color) : C.border}`, background: kind === k ? `${kc(m.color)}1a` : C.card, color: kind === k ? kc(m.color) : C.textSub }}>
              {m.icon} {m.label} ({counts.get(k)})</button>
          ))}
          <label style={{ fontSize: 14, color: C.textSub, display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginLeft: "auto" }}>
            <input type="checkbox" checked={onlyAgency} onChange={e => setOnlyAgency(e.target.checked)} /> {agency.abbrev} + gov-wide only
          </label>
        </div>

        {!items && dbOk && <Spinner label="Loading the knowledge base…" />}
        {items && !filtered.length && <div style={{ fontSize: 15, color: C.muted }}>Nothing saved yet under this filter — outputs land here automatically the moment you generate them anywhere in the portal.</div>}

        {byDay.map(([day, dayItems]) => (
          <div key={day} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: C.purple, fontFamily: "var(--font-mono)" }}>{day}</span>
              <span style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: 12.5, color: C.muted }}>{dayItems.length} item{dayItems.length > 1 ? "s" : ""}</span>
            </div>
            {dayItems.map(i => {
              const m = meta(i.kind)
              const opened = open[i.id]
              return (
                <div key={i.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${kc(m.color)}`, borderRadius: 10, padding: "9px 13px", marginBottom: 7 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span onClick={() => fetchItem(i.id)} style={{ fontSize: 15.5, fontWeight: 700, color: C.text, cursor: "pointer", flex: "1 1 280px" }}>{i.title}</span>
                    <Badge color={kc(m.color)}>{m.label}</Badge>
                    <Badge color={i.agency === agency.id ? C.green : C.muted}>{i.agency}</Badge>
                    <span style={{ fontSize: 12.5, color: C.muted, fontFamily: "var(--font-mono)" }}>#{i.id} · {i.time} · {(i.chars / 1000).toFixed(1)}k chars{i.model ? ` · ${i.model}` : ""}</span>
                    <button onClick={() => navigator.clipboard?.writeText(linkOf(i.id))} title="copy retrieval link"
                      style={{ padding: "4px 10px", borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.border}`, background: C.bg, color: C.cyan }}>⧉ link</button>
                  </div>
                  {!opened && <div style={{ fontSize: 13.5, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{i.preview}…</div>}
                  {opened === "loading" && <div style={{ fontSize: 13.5, color: C.muted, marginTop: 6 }}>loading…</div>}
                  {opened && opened !== "loading" && (
                    <div style={{ marginTop: 8, fontSize: 15, color: C.textSub, lineHeight: 1.65, whiteSpace: "pre-wrap", maxHeight: 380, overflowY: "auto" }}>{opened}</div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </Card>
    </div>
  )
}
