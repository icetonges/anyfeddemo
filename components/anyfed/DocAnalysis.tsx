"use client"
// components/anyfed/DocAnalysis.tsx — guided document-analysis workbench.
// Puts the ingested sourcedata/ library to work: pick a document (or paste /
// upload), compose a CHAIN OF ACTIONS (summary → figures → fiscal-law scan →
// variance read → leadership memo), and run it through the agency-primed AI
// chain — with a stepper so you always know where you are in the process.
import { useEffect, useMemo, useState } from "react"
import { useTheme, Card, SectionTitle, Badge } from "./ui"
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models"
import type { Agency } from "@/lib/agencies"
import { saveKnowledge } from "@/lib/knowledge"

interface Doc { path: string; name: string; ext: string; bytes: number; mtime: string; bucket: string; agency: string; analyzable: boolean }
interface LibState { count: number; buckets: string[]; agencies: string[]; docs: Doc[]; note?: string; truncated?: boolean }
type SourceMode = "library" | "paste" | "upload"

interface ActionDef { id: string; icon: string; label: string; desc: string; prompt: string }
const ACTIONS: ActionDef[] = [
  { id: "summary", icon: "📝", label: "Executive summary", desc: "What it is, period covered, the 5 decision-relevant points.",
    prompt: "Produce a tight executive summary (≤180 words) of the document: what it is, the period it covers, and the five most decision-relevant points — each with its $ figure where available." },
  { id: "figures", icon: "🔢", label: "Extract key figures", desc: "Every material $ amount with measure, unit, and time basis.",
    prompt: "Extract every material figure into a labelled list: amount (with unit $K/$M/$B), what it measures (TOA / BA / obligations / outlays / net cost / FTE), the period and TIME BASIS (action-date FY vs appropriation year vs statement year), and where in the document it appears. Flag any figure whose basis is ambiguous." },
  { id: "compliance", icon: "⚖️", label: "Fiscal-law & compliance scan", desc: "ADA, purpose, bona fide need, A-11/A-123, PIIA hooks.",
    prompt: "Scan the document for fiscal-law and compliance hooks: Anti-Deficiency exposure (31 U.S.C. §1341/§1517), purpose statute (§1301), bona fide need (§1502), A-11 apportionment issues, A-123 internal-control implications, and PIIA payment-integrity angles. Cite the authority for each finding. Where the document is clean, say NONE FOUND for that category." },
  { id: "anomaly", icon: "📈", label: "Variance & anomaly read", desc: "Swings, outliers, off-pattern ratios — quantified.",
    prompt: "Identify the variances, trends, and anomalies a senior FM analyst would flag: year-over-year swings, outliers, ratios off-pattern, unexplained balances. Quantify each, and state which additional portal dataset (File A/B/C, Fiscal Data SNC, MTS Table 5, AFR) would confirm or clear it." },
  { id: "memo", icon: "✉️", label: "Leadership memo", desc: "BLUF memo with findings and owned actions — uses prior results.",
    prompt: "Draft a one-page leadership memo: TO/FROM/SUBJECT/BLUF, three numbered findings, three recommended actions each with an owner role and a target date. Build on the document AND the prior analysis results provided." },
]

const fmtKB = (b: number) => b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

export default function DocAnalysis({ agency }: { agency: Agency }) {
  const C = useTheme()
  const [srcMode, setSrcMode] = useState<SourceMode>("library")
  const [lib, setLib] = useState<LibState | null>(null)
  const [libErr, setLibErr] = useState<string | null>(null)
  const [bucket, setBucket] = useState<string>("ALL")
  const [onlyAgency, setOnlyAgency] = useState(true)
  const [search, setSearch] = useState("")
  const [selDoc, setSelDoc] = useState<Doc | null>(null)
  const [docText, setDocText] = useState<string>("")          // the analyzable excerpt
  const [docLabel, setDocLabel] = useState<string>("")        // human name of the content
  const [docNote, setDocNote] = useState<string | null>(null)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [pasted, setPasted] = useState("")
  const [acts, setActs] = useState<string[]>(["summary", "figures"])
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<{ id: string; status: "pending" | "running" | "done" | "failed"; text?: string; ms?: number; modelUsed?: string }[]>([])

  useEffect(() => {
    fetch("/api/documents?op=list").then(r => r.json())
      .then(j => j.error ? setLibErr(j.error) : setLib(j))
      .catch(e => setLibErr(String(e)))
  }, [])
  useEffect(() => { setSelDoc(null); setDocText(""); setDocLabel(""); setResults([]) }, [agency.id])

  const ready = docText.trim().length > 50
  const stage = running ? 4 : results.length ? 4 : ready ? 3 : (srcMode === "library" && !lib) ? 1 : 2

  const filtered = useMemo(() => {
    if (!lib) return []
    return lib.docs.filter(d =>
      (bucket === "ALL" || d.bucket === bucket) &&
      (!onlyAgency || d.agency === "ALL" || d.agency === agency.id) &&
      (!search || d.path.toLowerCase().includes(search.toLowerCase())))
  }, [lib, bucket, onlyAgency, search, agency.id])

  const pickDoc = async (d: Doc) => {
    setSelDoc(d); setDocNote(null); setResults([])
    if (!d.analyzable) {
      setDocText(""); setDocLabel(d.name)
      setDocNote(`${d.name} (${d.ext}, ${fmtKB(d.bytes)}) exceeds the extraction size cap — split it or paste the content you need.`)
      return
    }
    setLoadingDoc(true)
    try {
      const r = await fetch(`/api/documents?op=read&p=${encodeURIComponent(d.path)}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
      setDocText(j.excerpt); setDocLabel(d.path); setDocNote(j.note ?? null)
    } catch (e) {
      setDocText(""); setDocNote(`⚠️ ${e instanceof Error ? e.message : e}`)
    } finally { setLoadingDoc(false) }
  }

  const onUpload = (f: File | undefined) => {
    if (!f) return
    setResults([])
    const rd = new FileReader()
    rd.onload = () => {
      const t = String(rd.result ?? "").slice(0, 20000)
      setDocText(t); setDocLabel(f.name); setSelDoc(null)
      setDocNote(f.size > 20000 ? `Loaded the first 20,000 characters of ${fmtKB(f.size)}.` : null)
    }
    rd.readAsText(f)
  }

  const usePaste = () => {
    setResults([])
    setDocText(pasted.slice(0, 20000)); setDocLabel("pasted text"); setSelDoc(null)
    setDocNote(pasted.length > 20000 ? "Truncated to 20,000 characters." : null)
  }

  const toggleAct = (id: string) =>
    setActs(a => a.includes(id) ? a.filter(x => x !== id) : [...ACTIONS.filter(d => a.includes(d.id) || d.id === id).map(d => d.id)])

  const run = async () => {
    if (!ready || !acts.length || running) return
    const ordered = ACTIONS.filter(a => acts.includes(a.id))
    setRunning(true)
    setResults(ordered.map(a => ({ id: a.id, status: "pending" as const })))
    const prior: string[] = []
    for (const a of ordered) {
      setResults(rs => rs.map(r => r.id === a.id ? { ...r, status: "running" } : r))
      const t0 = Date.now()
      try {
        const content = `You are analyzing a document for ${agency.name} financial management.\n\nDOCUMENT: ${docLabel}\n--- DOCUMENT CONTENT (excerpt) ---\n${docText}\n--- END DOCUMENT ---\n${a.id === "memo" && prior.length ? `\nPRIOR ANALYSIS RESULTS:\n${prior.join("\n\n")}\n` : ""}\nACTION: ${a.prompt}`
        const res = await fetch("/api/ai-chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content }], modelId, agency: agency.id, task: "value" }),
        })
        const j = await res.json()
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
        prior.push(`[${a.label}]\n${j.text}`)
        setResults(rs => rs.map(r => r.id === a.id ? { ...r, status: "done", text: j.text, ms: Date.now() - t0, modelUsed: j.modelUsed } : r))
      } catch (e) {
        setResults(rs => rs.map(r => r.id === a.id ? { ...r, status: "failed", text: `⚠️ ${e instanceof Error ? e.message : e}`, ms: Date.now() - t0 } : r))
      }
    }
    setRunning(false)
    if (prior.length) saveKnowledge("doc-analysis", agency.id, `Doc analysis — ${docLabel.slice(0, 160)}`,
      `DOCUMENT: ${docLabel}\nACTIONS: ${ordered.map(a2 => a2.label).join(" → ")}\n\n${prior.join("\n\n")}`, modelId)
  }

  const copyAll = () => {
    const txt = results.filter(r => r.text).map(r => `## ${ACTIONS.find(a => a.id === r.id)?.label}\n${r.text}`).join("\n\n")
    navigator.clipboard?.writeText(`Document analysis — ${docLabel} (${agency.abbrev})\n\n${txt}`)
  }

  const STEPS = [
    { n: 1, icon: "🗂", t: "Source", d: "library · paste · upload" },
    { n: 2, icon: "📄", t: "Document", d: "pick & preview content" },
    { n: 3, icon: "🧪", t: "Action chain", d: "compose the analyses" },
    { n: 4, icon: "🤖", t: "Run & review", d: "sequential AI results" },
  ]
  const srcBtn = (m: SourceMode): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: 9, fontSize: 15.5, fontWeight: 700, cursor: "pointer",
    border: `1px solid ${srcMode === m ? C.borderAccent : C.border}`,
    background: srcMode === m ? `${C.blue}1f` : C.card, color: srcMode === m ? C.blue : C.textSub })

  return (
    <div>
      <SectionTitle title="Document Analysis"
        sub={`Put the ingested library to work for ${agency.abbrev}: choose a document, compose a chain of actions, and the agency-primed AI chain runs them in sequence — every result grounded in the document text`} />

      <Card>
        {/* stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
          {STEPS.map((st, i) => {
            const active = st.n === stage, done = st.n < stage
            return (
              <div key={st.n} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ textAlign: "center", width: 150, padding: "9px 8px", borderRadius: 10,
                              background: active ? `${C.blue}1f` : "transparent",
                              border: `2px solid ${active ? C.blue : done ? C.green : C.border}` }}>
                  <div style={{ fontSize: 19 }}>{done ? "✅" : st.icon}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: active ? C.blue : done ? C.green : C.text }}>{st.n} · {st.t}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.3, marginTop: 2 }}>{st.d}</div>
                </div>
                {i < STEPS.length - 1 && <span style={{ color: st.n < stage ? C.green : C.muted, padding: "0 6px", fontSize: 16 }}>→</span>}
              </div>
            )
          })}
          <Badge color={running ? C.gold : results.length ? C.green : C.cyan}>
            {running ? "RUNNING CHAIN…" : results.length ? "CHAIN COMPLETE" : ready ? "READY — compose actions" : "PICK A DOCUMENT"}</Badge>
        </div>

        {/* 1 · source */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <button style={srcBtn("library")} onClick={() => setSrcMode("library")}>📁 Portal library ({lib?.count ?? "…"} items)</button>
          <button style={srcBtn("paste")} onClick={() => setSrcMode("paste")}>📋 Paste text</button>
          <button style={srcBtn("upload")} onClick={() => setSrcMode("upload")}>⬆️ Upload file</button>
        </div>

        {/* 2 · document */}
        {srcMode === "library" && (
          <div style={{ marginBottom: 14 }}>
            {libErr && <div style={{ fontSize: 15, color: C.red }}>⚠️ {libErr}</div>}
            {lib?.note && <div style={{ fontSize: 14.5, color: C.gold, marginBottom: 8 }}>{lib.note}</div>}
            {lib && lib.count > 0 && (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                  <select value={bucket} onChange={e => setBucket(e.target.value)}
                    style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 14.5 }}>
                    <option value="ALL">All buckets</option>
                    {lib.buckets.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <label style={{ fontSize: 14.5, color: C.textSub, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                    <input type="checkbox" checked={onlyAgency} onChange={e => setOnlyAgency(e.target.checked)} />
                    {agency.abbrev}-relevant only
                  </label>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="search path…"
                    style={{ flex: 1, minWidth: 150, background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 14.5 }} />
                  <Badge color={C.cyan}>{filtered.length} shown</Badge>
                </div>
                <div style={{ maxHeight: 240, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 10 }}>
                  {filtered.slice(0, 400).map(d => (
                    <div key={d.path} onClick={() => pickDoc(d)}
                      style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 12px", cursor: "pointer", flexWrap: "wrap",
                               background: selDoc?.path === d.path ? `${C.blue}1a` : "transparent",
                               borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 15 }}>{d.ext === ".pdf" ? "📕" : d.ext === ".csv" ? "📊" : d.ext === ".json" ? "🧾" : "📄"}</span>
                      <code style={{ fontSize: 13.5, color: selDoc?.path === d.path ? C.blue : C.cyan, wordBreak: "break-all", flex: 1, minWidth: 200 }}>{d.path}</code>
                      <Badge color={d.agency === agency.id ? C.green : C.muted}>{d.agency}</Badge>
                      <span style={{ fontSize: 12.5, color: C.muted, fontFamily: "var(--font-mono)" }}>{fmtKB(d.bytes)}</span>
                      {!d.analyzable && <Badge color={C.gold}>view-only</Badge>}
                    </div>
                  ))}
                  {!filtered.length && <div style={{ padding: 14, fontSize: 14.5, color: C.muted }}>No documents match — clear the filters or acquire data first (Data Explorer → Acquire).</div>}
                </div>
              </>
            )}
          </div>
        )}
        {srcMode === "paste" && (
          <div style={{ marginBottom: 14 }}>
            <textarea value={pasted} onChange={e => setPasted(e.target.value)} rows={7}
              placeholder="Paste budget exhibit rows, contract text, GTAS extracts — or just pick a PDF/Excel/JSON/CSV from the library above…"
              style={{ width: "100%", background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 13px", fontSize: 15, fontFamily: "var(--font-mono)" }} />
            <button onClick={usePaste} disabled={pasted.trim().length < 50}
              style={{ marginTop: 8, padding: "8px 18px", borderRadius: 9, fontSize: 15.5, fontWeight: 700, cursor: "pointer",
                       border: `1px solid ${C.borderAccent}`, background: `${C.blue}1f`, color: C.blue }}>
              Use this text →
            </button>
          </div>
        )}
        {srcMode === "upload" && (
          <div style={{ marginBottom: 14 }}>
            <input type="file" accept=".txt,.csv,.json,.md" onChange={e => onUpload(e.target.files?.[0])}
              style={{ fontSize: 15, color: C.textSub }} />
            <div style={{ fontSize: 13.5, color: C.muted, marginTop: 6 }}>.txt · .csv · .json · .md — read in your browser, first 20,000 characters analyzed. Nothing is uploaded to a server until you run the chain.</div>
          </div>
        )}

        {/* selected document preview */}
        {(docLabel || docNote) && (
          <div style={{ background: C.card, border: `1px solid ${ready ? C.green : C.gold}55`, borderLeft: `4px solid ${ready ? C.green : C.gold}`,
                        borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Badge color={ready ? C.green : C.gold}>{ready ? "DOCUMENT LOADED" : "NOT ANALYZABLE YET"}</Badge>
              <code style={{ fontSize: 14, color: C.cyan }}>{docLabel || selDoc?.name}</code>
              {loadingDoc && <span style={{ fontSize: 14, color: C.muted }}>loading…</span>}
              {ready && <span style={{ fontSize: 13.5, color: C.muted, fontFamily: "var(--font-mono)" }}>{docText.length.toLocaleString()} chars in scope</span>}
            </div>
            {docNote && <div style={{ fontSize: 14.5, color: C.textSub, marginTop: 6, lineHeight: 1.6 }}>{docNote}</div>}
            {ready && (
              <pre style={{ margin: "8px 0 0", fontSize: 12.5, color: C.muted, fontFamily: "var(--font-mono)",
                            maxHeight: 90, overflow: "hidden", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                {docText.slice(0, 420)}…</pre>
            )}
          </div>
        )}

        {/* 3 · action chain */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            🧪 Compose the action chain <span style={{ fontWeight: 400, color: C.muted, fontSize: 13.5 }}>(runs top-to-bottom; memo uses the prior results)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 8 }}>
            {ACTIONS.map(a => {
              const on = acts.includes(a.id)
              return (
                <div key={a.id} onClick={() => toggleAct(a.id)}
                  style={{ cursor: "pointer", padding: "9px 12px", borderRadius: 10,
                           border: `2px solid ${on ? C.blue : C.border}`, background: on ? `${C.blue}14` : C.card }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: on ? C.blue : C.text }}>
                    {on ? "☑" : "☐"} {a.icon} {a.label}
                  </div>
                  <div style={{ fontSize: 13.5, color: C.muted, marginTop: 3, lineHeight: 1.45 }}>{a.desc}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
            <select value={modelId} onChange={e => setModelId(e.target.value)}
              style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 14.5 }}>
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.providerLabel ?? m.provider}</option>)}
            </select>
            <button onClick={run} disabled={!ready || !acts.length || running}
              style={{ padding: "9px 22px", borderRadius: 10, fontWeight: 800, fontSize: 16, cursor: ready && acts.length && !running ? "pointer" : "not-allowed",
                       border: `1px solid ${C.borderAccent}`, background: ready && acts.length ? `${C.green}1f` : C.card,
                       color: ready && acts.length ? C.green : C.muted }}>
              {running ? "⏳ Running…" : `▶ Run ${acts.length} action${acts.length === 1 ? "" : "s"}`}
            </button>
            {results.some(r => r.text) && !running && (
              <button onClick={copyAll}
                style={{ padding: "9px 16px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer",
                         border: `1px solid ${C.border}`, background: C.card, color: C.textSub }}>
                ⧉ Copy all results
              </button>
            )}
          </div>
        </div>

        {/* 4 · results */}
        {results.map(r => {
          const a = ACTIONS.find(x => x.id === r.id)!
          const col = r.status === "done" ? C.green : r.status === "failed" ? C.red : r.status === "running" ? C.gold : C.muted
          return (
            <div key={r.id} style={{ background: C.card, border: `1px solid ${col}44`, borderLeft: `4px solid ${col}`,
                                     borderRadius: 10, padding: "11px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: r.text ? 7 : 0 }}>
                <Badge color={col}>{r.status.toUpperCase()}</Badge>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{a.icon} {a.label}</span>
                {r.ms != null && <span style={{ marginLeft: "auto", fontSize: 13, color: C.muted, fontFamily: "var(--font-mono)" }}>
                  {(r.ms / 1000).toFixed(1)}s{r.modelUsed ? ` · ${r.modelUsed}` : ""}</span>}
              </div>
              {r.status === "running" && <div style={{ fontSize: 15, color: C.muted }}>analyzing…</div>}
              {r.text && <div style={{ fontSize: 16, lineHeight: 1.65, color: C.text, whiteSpace: "pre-wrap" }}>{r.text}</div>}
            </div>
          )
        })}
      </Card>
    </div>
  )
}
