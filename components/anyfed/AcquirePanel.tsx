"use client"
// components/anyfed/AcquirePanel.tsx — pull the newest dataset for the selected
// agency from the live USAspending API. Two storage modes:
//   • automated — server creates sourcedata/<Department>/USASPENDING/auto/FY<fy>/
//     and writes the JSON there (permanent when running locally)
//   • manual — the payload downloads to your machine as a JSON file
import { useState } from "react"
import { useTheme, Card, Badge } from "./ui"
import type { Agency } from "@/lib/agencies"

type Dataset = "transactions" | "detail"
interface SaveResult { ok: boolean; path?: string; bytes?: number; records?: number | null; ephemeral?: boolean; note?: string; error?: string }

function fyOptions(): number[] {
  const now = new Date()
  const cur = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  return [1, 2, 3, 4].map(i => cur - i)
}

export default function AcquirePanel({ agency }: { agency: Agency }) {
  const C = useTheme()
  const fys = fyOptions()
  const [dataset, setDataset] = useState<Dataset>("transactions")
  const [fy, setFy] = useState(fys[0])
  const [busy, setBusy] = useState<"server" | "local" | null>(null)
  const [result, setResult] = useState<SaveResult | null>(null)

  const qs = `agency=${agency.id}&dataset=${dataset}&fy=${fy}`

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
      const r = await fetch(`/api/acquire?${qs}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
      const blob = new Blob([JSON.stringify(j, null, 2)], { type: "application/json" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${agency.id}_${dataset}_FY${fy}.json`
      a.click()
      URL.revokeObjectURL(a.href)
      const records = j.records ?? j.transactions?.length ?? null
      setResult({ ok: true, records, bytes: blob.size, note: "Downloaded to your machine — drop it into sourcedata/ and re-run the ETL to make it a default source." })
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) })
    } finally { setBusy(null) }
  }

  const sel: React.CSSProperties = { background:C.card, color:C.text, border:`1px solid ${C.border}`,
    borderRadius:8, padding:"8px 12px", fontSize:15.5, cursor:"pointer" }

  return (
    <Card title="⬇ Acquire Data — live USAspending pull"
          sub={`Fetch the newest ${agency.abbrev} dataset from api.usaspending.gov and store it as a source — auto-foldered into sourcedata/ or downloaded locally`}>
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:12 }}>
        <select value={dataset} onChange={e => setDataset(e.target.value as Dataset)} style={sel}>
          <option value="transactions">Newest contract transactions (action-date desc, up to 500)</option>
          <option value="detail">GTAS detail bundle (resources · accounts · functions · object classes)</option>
        </select>
        <select value={fy} onChange={e => setFy(Number(e.target.value))} style={sel}>
          {fys.map(f => <option key={f} value={f}>FY{f}</option>)}
        </select>
        <Badge color={C.cyan}>{agency.abbrev} · toptier {agency.toptier}</Badge>
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
                {result.records != null && <b style={{ color:C.text }}>{result.records.toLocaleString()} records</b>}
                {result.bytes != null && <span> · {(result.bytes / 1024).toFixed(0)} KB</span>}
                {result.path && <span> · <code style={{ fontSize:13.5, color:C.cyan }}>{result.path}</code></span>}
              </span>
              {result.note && <div style={{ marginTop:6, fontSize:14.5, color:C.muted }}>{result.note}</div>}
            </div>
          ) : (
            <div style={{ fontSize:15.5, color:C.red }}>Acquisition failed: {result.error}</div>
          )}
        </div>
      )}

      <div style={{ fontSize:14, color:C.muted, marginTop:10, lineHeight:1.65 }}>
        Auto-store creates the folder tree <code>sourcedata/{agency.name}/USASPENDING/auto/FY{fy}/</code> on the
        server — permanent when running locally; on a serverless deploy it lands on ephemeral /tmp (the response
        will say so), in which case use the local download and drop the file into your sourcedata/ folder.
      </div>
    </Card>
  )
}
