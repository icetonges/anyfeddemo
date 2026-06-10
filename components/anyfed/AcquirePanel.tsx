"use client"
// components/anyfed/AcquirePanel.tsx — guided data acquisition from the live
// USAspending API. Visual pipeline stepper (you always know what stage you're
// at), WHAT/WHY/HOW explainers, a session pull log with end-state outcomes,
// and a dataset inventory by category. FY selector = ACTION-DATE fiscal year.
import { useState } from "react"
import { useTheme, Card, Badge } from "./ui"
import type { Agency } from "@/lib/agencies"

type Dataset = "transactions-all" | "transactions" | "detail" | "bundle"
interface SaveResult {
  ok: boolean; path?: string; bytes?: number; records?: number | null
  contractRecords?: number | null; assistanceRecords?: number | null
  fyLabel?: string; ephemeral?: boolean; note?: string; error?: string
}
interface PullLog {
  id: number; ts: string; label: string; mode: "sourcedata" | "local"
  status: "pending" | "done" | "failed"; outcome?: string
}

const DATASETS: { id: Dataset; label: string; desc: string }[] = [
  { id: "transactions-all", label: "Contract + assistance transactions (up to 2,000)",
    desc: "Newest obligation events first: contracts (A–D) and grants/loans/direct payments (02–11) — award, recipient, sub-agency, type, mod." },
  { id: "bundle", label: "Complete bundle — transactions + GTAS detail (richest)",
    desc: "Up to 2,000 transactions PLUS the GTAS account view (resources, federal accounts, budget functions, object classes) in one self-documenting file." },
  { id: "transactions", label: "Contract transactions only (up to 1,000)",
    desc: "Procurement-only population — contract-pay, PIIA, and Benford screens." },
  { id: "detail", label: "GTAS detail bundle (account-structure view)",
    desc: "Resources, obligations by period, federal/treasury accounts, budget functions, object classes — carries appropriation-account identity." },
]

function fyChoices(): { fy: number; label: string }[] {
  const now = new Date()
  const cur = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  return [
    { fy: cur, label: `FY${cur} — in progress (Oct 1, ${cur - 1} → today)` },
    ...[1, 2, 3, 4].map(i => ({ fy: cur - i, label: `FY${cur - i} — complete year` })),
  ]
}

export default function AcquirePanel({ agency }: { agency: Agency }) {
  const C = useTheme()
  const choices = fyChoices()
  const [dataset, setDataset] = useState<Dataset>("transactions-all")
  const [fy, setFy] = useState(choices[0].fy)
  const [busy, setBusy] = useState<"server" | "local" | null>(null)
  const [result, setResult] = useState<SaveResult | null>(null)
  const [log, setLog] = useState<PullLog[]>([])
  const dsMeta = DATASETS.find(d => d.id === dataset)!
  const inProgress = fy === choices[0].fy

  // pipeline stage: 1 choose → 2 pull → 3 store → (4 lakehouse · 5 insights are offline script stages)
  const stage = busy ? 2 : result?.ok ? 3 : 1

  const addLog = (mode: PullLog["mode"]): number => {
    const id = Date.now()
    setLog(l => [{ id, ts: new Date().toLocaleTimeString(), label: `${agency.id} · ${dsMeta.label.split(" (")[0]} · FY${fy}`, mode, status: "pending" as const }, ...l].slice(0, 8))
    return id
  }
  const endLog = (id: number, ok: boolean, outcome: string) =>
    setLog(l => l.map(e => e.id === id ? { ...e, status: ok ? "done" : "failed", outcome } : e))

  const saveToFolder = async () => {
    setBusy("server"); setResult(null)
    const id = addLog("sourcedata")
    try {
      const r = await fetch("/api/acquire", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agency: agency.id, dataset, fy }) })
      const j: SaveResult = await r.json()
      setResult(j)
      endLog(id, !!j.ok, j.ok ? `${j.records?.toLocaleString() ?? "?"} records → ${j.ephemeral ? "/tmp (ephemeral)" : "sourcedata/"} · ${((j.bytes ?? 0) / 1024).toFixed(0)} KB` : (j.error ?? "failed"))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setResult({ ok: false, error: msg }); endLog(id, false, msg)
    } finally { setBusy(null) }
  }

  const downloadLocal = async () => {
    setBusy("local"); setResult(null)
    const id = addLog("local")
    try {
      const r = await fetch(`/api/acquire?agency=${agency.id}&dataset=${dataset}&fy=${fy}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
      const blob = new Blob([JSON.stringify(j, null, 2)], { type: "application/json" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${agency.id}_${dataset}_FY${fy}_actiondate.json`
      a.click(); URL.revokeObjectURL(a.href)
      const recs = j.records ?? j.transactions?.length ?? null
      setResult({ ok: true, records: recs, contractRecords: j.contractRecords ?? null, assistanceRecords: j.assistanceRecords ?? null,
        bytes: blob.size, fyLabel: j.actionDateFiscalYear ?? `FY${fy}`,
        note: "Downloaded to your machine — drop into sourcedata/ and run the lakehouse build to make it analyzable." })
      endLog(id, true, `${recs?.toLocaleString() ?? "?"} records → browser download · ${(blob.size / 1024).toFixed(0)} KB`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setResult({ ok: false, error: msg }); endLog(id, false, msg)
    } finally { setBusy(null) }
  }

  const sel: React.CSSProperties = { background:C.card, color:C.text, border:`1px solid ${C.border}`,
    borderRadius:8, padding:"8px 12px", fontSize:15, cursor:"pointer", maxWidth:"100%" }

  const STAGES = [
    { n: 1, icon: "🎛", t: "Choose", d: "dataset + action-date FY" },
    { n: 2, icon: "📡", t: "Pull", d: "live api.usaspending.gov" },
    { n: 3, icon: "📦", t: "Store", d: "sourcedata/ or local file" },
    { n: 4, icon: "🦆", t: "Lakehouse", d: "duck build → silver parquet" },
    { n: 5, icon: "📊", t: "Insights", d: "gold report → this portal" },
  ]

  return (
    <Card title="⬇ Acquire Data — live USAspending pull"
          sub={`Guided acquisition for ${agency.abbrev}: pick → pull → store → analyze. Defaults to the CURRENT in-progress fiscal year.`}>

      {/* ── WHERE AM I: pipeline stepper ── */}
      <div style={{ display:"flex", alignItems:"center", gap:0, overflowX:"auto", marginBottom:14, paddingBottom:4 }}>
        {STAGES.map((st, i) => {
          const active = st.n === stage
          const done = st.n < stage
          const offline = st.n > 3
          return (
            <div key={st.n} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
              <div style={{ textAlign:"center", width:128, padding:"8px 6px", borderRadius:10,
                            background: active ? `${C.blue}1f` : "transparent",
                            border:`2px solid ${active ? C.blue : done ? C.green : C.border}`,
                            opacity: offline ? 0.75 : 1 }}>
                <div style={{ fontSize:18 }}>{done ? "✅" : st.icon}</div>
                <div style={{ fontSize:13.5, fontWeight:700, color: active ? C.blue : done ? C.green : C.text }}>{st.n} · {st.t}</div>
                <div style={{ fontSize:11, color:C.muted, lineHeight:1.3, marginTop:2 }}>{st.d}{offline ? " (script)" : ""}</div>
              </div>
              {i < STAGES.length - 1 && <span style={{ color: st.n < stage ? C.green : C.muted, padding:"0 4px", fontSize:15 }}>→</span>}
            </div>
          )
        })}
        <Badge color={busy ? C.gold : result?.ok ? C.green : C.cyan}>
          {busy ? "STAGE 2 — PULLING…" : result?.ok ? "STAGE 3 COMPLETE — stored" : "AT STAGE 1 — choose & pull"}</Badge>
      </div>

      {/* ── WHAT / WHY / HOW ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(230px, 1fr))", gap:10, marginBottom:14 }}>
        {([["WHAT", "Fresh transaction and account data for the selected agency, straight from USAspending's nightly-refreshed API — small enough to pull in seconds, current through today.", C.blue],
           ["WHY", "The bundled folder data is budget-book and snapshot based; these pulls add the LIVE execution layer — and feed the lakehouse where the multi-GB archives become queryable.", C.gold],
           ["HOW", "Pick dataset + FY → pull → store (auto-foldered server-side, or download). Then locally: duck build → gold report. Big archives skip stages 1–3 (manual download) and enter at stage 4.", C.green]] as const)
          .map(([t, d, col]) => (
          <div key={t} style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${col}`, borderRadius:9, padding:"9px 12px" }}>
            <div style={{ fontSize:13, fontWeight:800, color:col, letterSpacing:"0.08em", marginBottom:4 }}>{t}</div>
            <div style={{ fontSize:13.5, color:C.textSub, lineHeight:1.6 }}>{d}</div>
          </div>
        ))}
      </div>

      {/* ── controls ── */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:8 }}>
        <select value={dataset} onChange={e => { setDataset(e.target.value as Dataset); setResult(null) }} style={sel}>
          {DATASETS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:14, color:C.muted }}>Action-date FY</span>
          <select value={fy} onChange={e => { setFy(Number(e.target.value)); setResult(null) }} style={sel}>
            {choices.map(c => <option key={c.fy} value={c.fy}>{c.label}</option>)}
          </select>
        </div>
        <Badge color={C.cyan}>{agency.abbrev} · toptier {agency.toptier}</Badge>
        {inProgress && <Badge color={C.green}>LIVE — through today</Badge>}
      </div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:10 }}>{dsMeta.desc}</div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
        <button onClick={saveToFolder} disabled={busy !== null}
          style={{ padding:"11px 18px", borderRadius:9, fontSize:15, fontWeight:700, cursor:"pointer",
                   border:`1px solid ${C.borderAccent}`, background:`${C.blue}26`, color:C.blue }}>
          {busy === "server" ? "Pulling & storing…" : "📁 Auto-store in sourcedata/ (Department › FY folders)"}
        </button>
        <button onClick={downloadLocal} disabled={busy !== null}
          style={{ padding:"11px 18px", borderRadius:9, fontSize:15, fontWeight:700, cursor:"pointer",
                   border:`1px solid ${C.border}`, background:C.card, color:C.text }}>
          {busy === "local" ? "Pulling…" : "💾 Download to my computer"}
        </button>
      </div>

      {result && (
        <div style={{ marginBottom:12, padding:"11px 14px", borderRadius:9,
                      background: result.ok ? `${C.green}10` : `${C.red}10`,
                      border:`1px solid ${result.ok ? C.green : C.red}55` }}>
          {result.ok ? (
            <div style={{ fontSize:15, color:C.textSub, lineHeight:1.65 }}>
              <Badge color={result.ephemeral ? C.gold : C.green}>{result.ephemeral ? "END STATE: SAVED (EPHEMERAL /tmp)" : "END STATE: STORED"}</Badge>
              {result.fyLabel && <Badge color={C.cyan}>{result.fyLabel}</Badge>}
              <span style={{ marginLeft:8 }}>
                {result.records != null && <b style={{ color:C.text }}>{result.records.toLocaleString()} records</b>}
                {result.contractRecords != null && result.assistanceRecords != null &&
                  <span> ({result.contractRecords.toLocaleString()} contract · {result.assistanceRecords.toLocaleString()} assistance)</span>}
                {result.bytes != null && <span> · {(result.bytes / 1024).toFixed(0)} KB</span>}
                {result.path && <span> · <code style={{ fontSize:13, color:C.cyan }}>{result.path}</code></span>}
              </span>
              {result.note && <div style={{ marginTop:5, fontSize:14, color:C.muted }}>{result.note}</div>}
            </div>
          ) : <div style={{ fontSize:15, color:C.red }}>END STATE: FAILED — {result.error}</div>}
        </div>
      )}

      {/* ── session pull log ── */}
      {log.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, letterSpacing:"0.06em", marginBottom:6 }}>📜 SESSION PULL LOG — pending · done · failed</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {log.map(e => (
              <div key={e.id} style={{ display:"flex", gap:10, alignItems:"center", fontSize:13.5, padding:"6px 10px",
                                       background:C.card, border:`1px solid ${C.border}`, borderRadius:8, flexWrap:"wrap" }}>
                <Badge color={e.status === "done" ? C.green : e.status === "failed" ? C.red : C.gold}>
                  {e.status === "pending" ? "⏳ PENDING" : e.status === "done" ? "✓ DONE" : "✗ FAILED"}</Badge>
                <span style={{ color:C.muted, fontFamily:"var(--font-mono)" }}>{e.ts}</span>
                <span style={{ color:C.text, fontWeight:600 }}>{e.label}</span>
                <Badge color={C.purple}>{e.mode}</Badge>
                {e.outcome && <span style={{ color:C.textSub }}>{e.outcome}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── dataset inventory by category ── */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.text, letterSpacing:"0.06em", marginBottom:6 }}>🗂 DATASET INVENTORY BY CATEGORY (this installation)</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(215px, 1fr))", gap:8 }}>
          {([["📁 Budget books (folder)", "DoD PB2026+PB2027 J-books · SEC FY2027 CBJ — bundled, drive the deep explorer", C.blue],
             ["📦 Bulk archives (local disk)", "FY2026 Contracts FULL (~4.6 GB) + Delta (~3.5 GB) — enter at lakehouse stage 4", C.gold],
             ["🦆 Lakehouse silver", "agency=/fy= partitioned Parquet — built; DoD FY2026 gold report produced", C.green],
             ["📡 API pulls (this panel)", `session: ${log.filter(e => e.status === "done").length} completed · ${log.filter(e => e.status === "pending").length} pending · gaps tracked in the Runbook below`, C.cyan]] as const)
            .map(([t, d, col]) => (
            <div key={t} style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${col}`, borderRadius:8, padding:"8px 11px" }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:C.text }}>{t}</div>
              <div style={{ fontSize:12.5, color:C.textSub, lineHeight:1.55, marginTop:3 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── time basis (condensed) ── */}
      <div style={{ padding:"9px 12px", background:`${C.gold}0d`, border:`1px solid ${C.gold}44`, borderRadius:9, fontSize:13.5, color:C.textSub, lineHeight:1.65 }}>
        <b style={{ color:C.gold }}>⏱ Time basis:</b> the FY selector is the <b style={{ color:C.text }}>action-date fiscal year</b> (when
        the obligation happened; in-progress year runs through today) — <b style={{ color:C.text }}>not the appropriation (TAS) year</b>.
        Multi-year money means FY{fy} actions can spend appropriations enacted years earlier; TAS attribution lives in the GTAS
        detail and File C. Every file embeds a <code>timeBasis</code> block so populations stay self-documenting.
      </div>
    </Card>
  )
}
