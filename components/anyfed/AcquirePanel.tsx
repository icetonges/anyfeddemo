"use client"
// components/anyfed/AcquirePanel.tsx — pull extensive, up-to-date datasets for
// the selected agency from the live USAspending API. Time-basis is explicit:
// the FY selector is the ACTION-DATE fiscal year (execution view), including
// the in-progress FY — not the appropriation (TAS) year. Two storage modes:
// auto-foldered into sourcedata/ (server) or local download (manual).
import { useState } from "react"
import { useTheme, Card, Badge } from "./ui"
import type { Agency } from "@/lib/agencies"

type Dataset = "transactions-all" | "transactions" | "detail" | "bundle"
interface SaveResult {
  ok: boolean; path?: string; bytes?: number; records?: number | null
  contractRecords?: number | null; assistanceRecords?: number | null
  fyLabel?: string; ephemeral?: boolean; note?: string; error?: string
}

const DATASETS: { id: Dataset; label: string; desc: string }[] = [
  { id: "transactions-all", label: "Contract + assistance transactions (extensive — up to 2,000)",
    desc: "Newest obligation events first: contracts (A–D) and grants/loans/direct payments (02–11), with award, recipient, sub-agency, type, and mod." },
  { id: "bundle", label: "Complete bundle — transactions + GTAS detail (richest)",
    desc: "Everything: up to 2,000 transactions PLUS the GTAS account view (resources, federal accounts, budget functions, object classes) in one file — the full analysis-ready package." },
  { id: "transactions", label: "Contract transactions only (up to 1,000)",
    desc: "Procurement-only population — for contract-pay, PIIA, and Benford screens." },
  { id: "detail", label: "GTAS detail bundle (account-structure view)",
    desc: "Resources, obligations by period, federal/treasury accounts, budget functions, object classes — the dimension that carries appropriation-account identity." },
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
  const [fy, setFy] = useState(choices[0].fy)        // default: the CURRENT in-progress FY
  const [busy, setBusy] = useState<"server" | "local" | null>(null)
  const [result, setResult] = useState<SaveResult | null>(null)
  const dsMeta = DATASETS.find(d => d.id === dataset)!
  const inProgress = fy === choices[0].fy

  const saveToFolder = async () => {
    setBusy("server"); setResult(null)
    try {
      const r = await fetch("/api/acquire", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agency: agency.id, dataset, fy }) })
      setResult(await r.json())
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) })
    } finally { setBusy(null) }
  }

  const downloadLocal = async () => {
    setBusy("local"); setResult(null)
    try {
      const r = await fetch(`/api/acquire?agency=${agency.id}&dataset=${dataset}&fy=${fy}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
      const blob = new Blob([JSON.stringify(j, null, 2)], { type: "application/json" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${agency.id}_${dataset}_FY${fy}_actiondate.json`
      a.click()
      URL.revokeObjectURL(a.href)
      setResult({ ok: true, records: j.records ?? j.transactions?.length ?? null,
        contractRecords: j.contractRecords ?? null, assistanceRecords: j.assistanceRecords ?? null,
        bytes: blob.size, fyLabel: j.actionDateFiscalYear ?? `FY${fy}`,
        note: "Downloaded to your machine — drop it into sourcedata/ and re-run the ETL to make it a default source." })
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) })
    } finally { setBusy(null) }
  }

  const sel: React.CSSProperties = { background:C.card, color:C.text, border:`1px solid ${C.border}`,
    borderRadius:8, padding:"8px 12px", fontSize:15.5, cursor:"pointer", maxWidth:"100%" }

  return (
    <Card title="⬇ Acquire Data — live USAspending pull"
          sub={`Fetch extensive, up-to-date ${agency.abbrev} data from api.usaspending.gov — defaults to the CURRENT in-progress fiscal year — and store it auto-foldered in sourcedata/ or locally`}>
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
        {inProgress && <Badge color={C.green}>LIVE — newest activity through today</Badge>}
      </div>
      <div style={{ fontSize:14.5, color:C.muted, lineHeight:1.6, marginBottom:12 }}>{dsMeta.desc}</div>

      {/* time-basis discipline — don't mix the year stamps */}
      <div style={{ marginBottom:14, padding:"10px 13px", background:`${C.gold}0d`, border:`1px solid ${C.gold}44`, borderRadius:9 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.gold, letterSpacing:"0.05em", marginBottom:5 }}>
          ⏱ TIME BASIS — KNOW WHICH YEAR YOU ARE HOLDING
        </div>
        <div style={{ fontSize:14.5, color:C.textSub, lineHeight:1.7 }}>
          The selector above is the <b style={{ color:C.text }}>action-date fiscal year</b> — when the obligation
          event occurred (Oct 1 – Sep 30; the in-progress year runs through today). It is <b style={{ color:C.text }}>not
          the appropriation (TAS) year</b>: with multi-year and no-year money, an FY{fy} action can obligate
          appropriations enacted years earlier — appropriation-year attribution needs the account-level TAS fields
          (the GTAS detail carries account identity). Other stamps in federal data: GTAS submission period (monthly
          reporting), period of performance, and Last&nbsp;Modified (record maintenance — never analytical).
          Every downloaded file embeds this <code>timeBasis</code> block so the population is self-documenting.
        </div>
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <button onClick={saveToFolder} disabled={busy !== null}
          style={{ padding:"11px 18px", borderRadius:9, fontSize:15.5, fontWeight:700, cursor:"pointer",
                   border:`1px solid ${C.borderAccent}`, background:`${C.blue}26`, color:C.blue }}>
          {busy === "server" ? "Fetching & storing…" : "📁 Auto-store in sourcedata/ (Department › USASPENDING › FY folders)"}
        </button>
        <button onClick={downloadLocal} disabled={busy !== null}
          style={{ padding:"11px 18px", borderRadius:9, fontSize:15.5, fontWeight:700, cursor:"pointer",
                   border:`1px solid ${C.border}`, background:C.card, color:C.text }}>
          {busy === "local" ? "Fetching…" : "💾 Download locally (manual storage)"}
        </button>
      </div>

      {result && (
        <div style={{ marginTop:12, padding:"11px 14px", borderRadius:9,
                      background: result.ok ? `${C.green}10` : `${C.red}10`,
                      border:`1px solid ${result.ok ? C.green : C.red}55` }}>
          {result.ok ? (
            <div style={{ fontSize:15.5, color:C.textSub, lineHeight:1.65 }}>
              <Badge color={result.ephemeral ? C.gold : C.green}>{result.ephemeral ? "SAVED (EPHEMERAL)" : "SAVED"}</Badge>
              <span style={{ marginLeft:10 }}>
                {result.fyLabel && <Badge color={C.cyan}>{result.fyLabel}</Badge>}
                {result.records != null && <b style={{ color:C.text, marginLeft:8 }}>{result.records.toLocaleString()} records</b>}
                {result.contractRecords != null && result.assistanceRecords != null &&
                  <span> ({result.contractRecords.toLocaleString()} contract · {result.assistanceRecords.toLocaleString()} assistance)</span>}
                {result.bytes != null && <span> · {(result.bytes / 1024).toFixed(0)} KB</span>}
                {result.path && <span> · <code style={{ fontSize:13.5, color:C.cyan }}>{result.path}</code></span>}
              </span>
              {result.note && <div style={{ marginTop:6, fontSize:14.5, color:C.muted }}>{result.note}</div>}
              <div style={{ marginTop:6, fontSize:14.5, color:C.muted }}>
                Analyze it now: the <b style={{ color:C.text }}>AI/ML Workbench</b> runs Benford, anomaly, risk and
                clustering screens on transaction populations like this; <b style={{ color:C.text }}>Data Intelligence</b> profiles
                the GTAS dimensions.
              </div>
            </div>
          ) : (
            <div style={{ fontSize:15.5, color:C.red }}>Acquisition failed: {result.error}</div>
          )}
        </div>
      )}

      <div style={{ fontSize:14, color:C.muted, marginTop:10, lineHeight:1.65 }}>
        Auto-store creates <code>sourcedata/{agency.name}/USASPENDING/auto/FY{fy}/</code> on the server — permanent
        when running locally; on a serverless deploy it lands on ephemeral /tmp (the response will say so), in which
        case use the local download and drop the file into your sourcedata/ folder.
      </div>
    </Card>
  )
}
