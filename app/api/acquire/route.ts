// app/api/acquire/route.ts — pull extensive, current datasets for an agency
// from the live USAspending API and either (a) store them server-side into
// sourcedata/ with an auto-created Department/Agency folder tree, or (b) hand
// the payload back for a local browser download.
//
// TIME-BASIS DISCIPLINE (federal data carries several different year stamps):
//   • The fy parameter = federal fiscal year of the transaction ACTION DATE
//     (Oct 1 – Sep 30): when the obligation event happened. The in-progress
//     FY is supported — its window runs through "today".
//   • This is NOT the appropriation (TAS) year: multi-year money means an
//     FY2026 action can obligate FY2024 Procurement appropriations. TAS-year
//     attribution requires the account-level TAS fields (GTAS detail bundle
//     carries account structure; full TAS detail comes from custom account
//     downloads).
//   • GTAS detail = agency-certified monthly submissions for the reporting FY.
//
//   GET  ?agency=SEC&dataset=transactions-all&fy=2026&mode=payload → JSON
//   POST { agency, dataset, fy }                                   → sourcedata/
import { NextRequest, NextResponse } from 'next/server'
import { getAgency } from '@/lib/agencies'
import fs from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 60

const USA = 'https://api.usaspending.gov/api/v2'
const CONTRACT_CODES = ['A', 'B', 'C', 'D']
const ASSIST_CODES = ['02', '03', '04', '05', '06', '07', '08', '09', '10', '11']
const FIELDS = ['Award ID', 'Mod', 'Recipient Name', 'Action Date', 'Transaction Amount',
                'Awarding Agency', 'Awarding Sub Agency', 'Award Type']

function currentFY(): number {
  const now = new Date()
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
}
function fyWindow(fy: number): { start: string; end: string; inProgress: boolean } {
  const start = `${fy - 1}-10-01`
  const sep30 = `${fy}-09-30`
  const today = new Date().toISOString().slice(0, 10)
  const inProgress = fy === currentFY()
  return { start, end: inProgress && today < sep30 ? today : sep30, inProgress }
}

/** One transaction population (newest first) — pages fetched in parallel. */
async function fetchTxnSet(agencyName: string, fy: number, codes: string[], kind: string, maxPages = 10) {
  const w = fyWindow(fy)
  const body = (page: number) => JSON.stringify({
    filters: {
      agencies: [{ type: 'awarding', tier: 'toptier', name: agencyName }],
      time_period: [{ start_date: w.start, end_date: w.end }],
      award_type_codes: codes,
    },
    fields: FIELDS, page, limit: 100, sort: 'Action Date', order: 'desc',
  })
  const pages = await Promise.all(Array.from({ length: maxPages }, (_, i) =>
    fetch(`${USA}/search/spending_by_transaction/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body(i + 1),
    }).then(r => (r.ok ? r.json() : null)).catch(() => null)
  ))
  const rows: Record<string, unknown>[] = []
  for (const p of pages) {
    const batch = (p?.results ?? []) as Record<string, unknown>[]
    if (!batch.length) break
    rows.push(...batch.map(r => ({ ...r, kind })))
  }
  return rows
}

const TIME_BASIS = {
  fyParameterMeans: 'Federal fiscal year of the transaction ACTION DATE (Oct 1 – Sep 30) — the execution view: when the obligation event occurred.',
  notAppropriationYear: 'This is NOT the appropriation (TAS) year. Multi-year and no-year money means an action in this window can obligate appropriations enacted in earlier years. TAS-year attribution requires account-level TAS fields.',
  otherStamps: 'Other date stamps you will meet in federal data: appropriation/TAS year (year(s) of the money), GTAS submission period (monthly reporting), period of performance dates, and Last Modified (record maintenance — never analytical).',
}

async function fetchTransactions(agencyName: string, fy: number, scope: 'contracts' | 'all') {
  const w = fyWindow(fy)
  const [contracts, assistance] = await Promise.all([
    fetchTxnSet(agencyName, fy, CONTRACT_CODES, 'contract', 10),
    scope === 'all' ? fetchTxnSet(agencyName, fy, ASSIST_CODES, 'assistance', 10) : Promise.resolve([]),
  ])
  const transactions = [...contracts, ...assistance]
  return {
    dataset: scope === 'all' ? 'newest-contract-and-assistance-transactions' : 'newest-contract-transactions',
    source: 'api.usaspending.gov /search/spending_by_transaction',
    agency: agencyName,
    actionDateFiscalYear: `FY${fy}${w.inProgress ? ' (in progress)' : ' (complete)'}`,
    actionDateWindow: { start: w.start, end: w.end },
    timeBasis: TIME_BASIS,
    fetchedAt: new Date().toISOString(),
    records: transactions.length,
    contractRecords: contracts.length,
    assistanceRecords: assistance.length,
    sortedBy: 'Action Date desc (newest first)',
    transactions,
  }
}

/** GTAS detail bundle — reuses the portal's own detail slice. */
async function fetchDetail(origin: string, agencyId: string, fy: number) {
  const res = await fetch(`${origin}/api/agency-data?agency=${agencyId}&slice=detail&fy=${fy}`)
  if (!res.ok) throw new Error(`detail slice failed (${res.status})`)
  const j = await res.json()
  return { ...j, reportingFiscalYear: `FY${fy}${fyWindow(fy).inProgress ? ' (in progress — partial periods)' : ''}`, timeBasis: { reportingYear: 'GTAS detail reflects agency-certified monthly submissions for the reporting fiscal year — account-structure view, carries appropriation account identity.' } }
}

async function buildPayload(origin: string, agencyId: string, dataset: string, fy: number) {
  const agency = getAgency(agencyId)
  if (dataset === 'detail') return { agency, payload: await fetchDetail(origin, agency.id, fy) }
  if (dataset === 'transactions-all') return { agency, payload: await fetchTransactions(agency.name, fy, 'all') }
  if (dataset === 'bundle') {
    const [txns, detail] = await Promise.all([
      fetchTransactions(agency.name, fy, 'all'),
      fetchDetail(origin, agency.id, fy).catch(e => ({ error: String(e) })),
    ])
    return { agency, payload: {
      dataset: 'complete-acquisition-bundle',
      agency: agency.name, fiscalYear: `FY${fy}`, fetchedAt: new Date().toISOString(),
      timeBasis: TIME_BASIS,
      records: txns.records,
      transactions: txns, gtasDetail: detail,
    } }
  }
  return { agency, payload: await fetchTransactions(agency.name, fy, 'contracts') }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const agencyId = (sp.get('agency') ?? 'DOD').toUpperCase()
  const dataset = sp.get('dataset') ?? 'transactions-all'
  const fy = Number(sp.get('fy')) || currentFY()
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
    const dataset = String(body.dataset ?? 'transactions-all')
    const fy = Number(body.fy) || currentFY()
    const { agency, payload } = await buildPayload(req.nextUrl.origin, agencyId, dataset, fy)

    // auto-foldered storage: sourcedata/<Department Name>/USASPENDING/auto/FY<fy>/
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const fileName = `${dataset}_FY${fy}_actiondate_${stamp}.json`
    const rel = path.join('sourcedata', agency.name, 'USASPENDING', 'auto', `FY${fy}`)
    const json = JSON.stringify(payload, null, 2)

    let dir = path.join(process.cwd(), rel)
    let ephemeral = false
    try {
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, fileName), json, 'utf-8')
    } catch {
      dir = path.join('/tmp', rel)
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, fileName), json, 'utf-8')
      ephemeral = true
    }
    const p = payload as { records?: number; contractRecords?: number; assistanceRecords?: number }
    return NextResponse.json({
      ok: true,
      path: path.join(ephemeral ? '/tmp' : '.', rel, fileName),
      bytes: Buffer.byteLength(json),
      records: p.records ?? null,
      contractRecords: p.contractRecords ?? null,
      assistanceRecords: p.assistanceRecords ?? null,
      fyLabel: `FY${fy}${fyWindow(fy).inProgress ? ' (in progress)' : ''}`,
      ephemeral,
      note: ephemeral
        ? 'Server filesystem is read-only (serverless deploy) — saved to ephemeral /tmp. Run the portal locally (npm run dev) for permanent sourcedata/ storage, or use the local-download option.'
        : 'Stored in sourcedata/ with the auto-created Department/Agency folder tree — re-run the ETL to bundle it.',
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }
}
