// app/api/acquire/route.ts — pull the newest dataset for an agency from the
// live USAspending API and either (a) store it server-side into sourcedata/
// with an auto-created Department/Agency folder tree, or (b) hand the payload
// back for a local browser download.
//   GET  ?agency=SEC&dataset=transactions&fy=2025&mode=payload   → JSON payload
//   POST { agency, dataset, fy }                                 → write to sourcedata/
import { NextRequest, NextResponse } from 'next/server'
import { getAgency } from '@/lib/agencies'
import fs from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const USA = 'https://api.usaspending.gov/api/v2'

/** Newest contract transactions for the agency & FY (USAspending search API). */
async function fetchTransactions(agencyName: string, fy: number) {
  const filters = {
    agencies: [{ type: 'awarding', tier: 'toptier', name: agencyName }],
    time_period: [{ start_date: `${fy - 1}-10-01`, end_date: `${fy}-09-30` }],
    award_type_codes: ['A', 'B', 'C', 'D'],
  }
  const fields = ['Award ID', 'Recipient Name', 'Transaction Amount', 'Action Date',
                  'Awarding Agency', 'Awarding Sub Agency', 'Award Type']
  const rows: unknown[] = []
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${USA}/search/spending_by_transaction/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters, fields, page, limit: 100, sort: 'Action Date', order: 'desc' }),
    })
    if (!res.ok) throw new Error(`USAspending ${res.status} on transactions page ${page}`)
    const j = await res.json()
    const batch = j.results ?? []
    rows.push(...batch)
    if (!j.page_metadata?.hasNext || batch.length === 0) break
  }
  return {
    dataset: 'newest-contract-transactions',
    source: 'api.usaspending.gov /search/spending_by_transaction',
    agency: agencyName, fiscalYear: `FY${fy}`,
    fetchedAt: new Date().toISOString(),
    records: rows.length, sortedBy: 'Action Date desc',
    transactions: rows,
  }
}

/** GTAS detail bundle — reuses the portal's own detail slice. */
async function fetchDetail(origin: string, agencyId: string, fy: number) {
  const res = await fetch(`${origin}/api/agency-data?agency=${agencyId}&slice=detail&fy=${fy}`)
  if (!res.ok) throw new Error(`detail slice failed (${res.status})`)
  return res.json()
}

async function buildPayload(origin: string, agencyId: string, dataset: string, fy: number) {
  const agency = getAgency(agencyId)
  if (dataset === 'detail') return { agency, payload: await fetchDetail(origin, agency.id, fy) }
  return { agency, payload: await fetchTransactions(agency.name, fy) }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const agencyId = (sp.get('agency') ?? 'DOD').toUpperCase()
  const dataset = sp.get('dataset') ?? 'transactions'
  const fy = Number(sp.get('fy')) || new Date().getFullYear() - 1
  try {
    const { payload } = await buildPayload(req.nextUrl.origin, agencyId, dataset, fy)
    return NextResponse.json(payload)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const agencyId = String(body.agency ?? 'DOD').toUpperCase()
    const dataset = String(body.dataset ?? 'transactions')
    const fy = Number(body.fy) || new Date().getFullYear() - 1
    const { agency, payload } = await buildPayload(req.nextUrl.origin, agencyId, dataset, fy)

    // auto-foldered storage: sourcedata/<Department Name>/USASPENDING/auto/FY<fy>/
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const fileName = `${dataset}_FY${fy}_${stamp}.json`
    const rel = path.join('sourcedata', agency.name, 'USASPENDING', 'auto', `FY${fy}`)
    const json = JSON.stringify(payload, null, 2)

    let dir = path.join(process.cwd(), rel)
    let ephemeral = false
    try {
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, fileName), json, 'utf-8')
    } catch {
      // read-only FS (serverless) → ephemeral fallback
      dir = path.join('/tmp', rel)
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, fileName), json, 'utf-8')
      ephemeral = true
    }
    const records = (payload as { records?: number; transactions?: unknown[] }).records
      ?? (payload as { transactions?: unknown[] }).transactions?.length ?? null

    return NextResponse.json({
      ok: true,
      path: path.join(ephemeral ? '/tmp' : '.', rel, fileName),
      bytes: Buffer.byteLength(json),
      records,
      ephemeral,
      note: ephemeral
        ? 'Server filesystem is read-only (serverless deploy) — saved to ephemeral /tmp. Run the portal locally (npm run dev) for permanent sourcedata/ storage, or use the local-download option.'
        : 'Stored in sourcedata/ with the auto-created Department/Agency folder tree — re-run the ETL to bundle it.',
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }
}
