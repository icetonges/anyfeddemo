// app/api/agency-data/route.ts
// Unified agency data endpoint.
//   ?agency=DOD&slice=budget   → bundled JSON from ./sourcedata ETL (default source)
//   ?agency=FDIC&slice=budget  → live USAspending.gov fallback
//   ?agency=DOD&slice=awards   → transaction-level awards (ML workbench source)
import { NextRequest, NextResponse } from 'next/server'
import { getAgency } from '@/lib/agencies'
import dodBudget from '@/lib/data/dod_budget.json'
import dodAwards from '@/lib/data/dod_awards.json'
import mlDatasets from '@/lib/data/ml_datasets.json'

export const revalidate = 3600

const USA = 'https://api.usaspending.gov/api/v2'

async function usaspending(path: string) {
  const res = await fetch(`${USA}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`USAspending ${res.status} for ${path}`)
  return res.json()
}

/** Live budgetary resources by FY for any toptier agency */
async function liveBudget(toptier: string) {
  const data = await usaspending(`/agency/${toptier}/budgetary_resources/`)
  type FYRow = {
    fiscal_year: number
    agency_budgetary_resources: number | null
    agency_total_obligated: number | null
  }
  const years = (data.agency_data_by_year ?? []) as FYRow[]
  return {
    source: 'live:usaspending',
    fiscalYears: years
      .filter(y => y.agency_budgetary_resources != null)
      .sort((a, b) => a.fiscal_year - b.fiscal_year)
      .map(y => ({
        fy: `FY${y.fiscal_year}`,
        budgetaryResources: y.agency_budgetary_resources,
        obligated: y.agency_total_obligated,
        obligationRate: y.agency_budgetary_resources
          ? Math.round(1000 * (y.agency_total_obligated ?? 0) / y.agency_budgetary_resources) / 10
          : null,
      })),
  }
}

/** Live obligations by award category + recent awards for any toptier agency */
async function liveAwards(toptier: string, name: string) {
  const fy = new Date().getMonth() >= 9
    ? new Date().getFullYear() + 1
    : new Date().getFullYear()
  const [byCat, sub] = await Promise.all([
    usaspending(`/agency/${toptier}/obligations_by_award_category/?fiscal_year=${fy - 1}`),
    usaspending(`/agency/${toptier}/sub_agency/?fiscal_year=${fy - 1}&limit=10`).catch(() => null),
  ])
  type Cat = { category: string; aggregated_amount: number }
  type Sub = { name: string; total_obligations: number; transaction_count: number }
  return {
    source: 'live:usaspending',
    fiscalYear: `FY${fy - 1}`,
    agency: name,
    total: byCat.total_aggregated_amount ?? 0,
    byCategory: ((byCat.results ?? []) as Cat[])
      .filter(c => c.aggregated_amount > 0)
      .map(c => ({ name: c.category, total: c.aggregated_amount })),
    bySubAgency: sub
      ? ((sub.results ?? []) as Sub[]).map(s => ({
          name: s.name, total: s.total_obligations, count: s.transaction_count }))
      : [],
  }
}

/** Live multi-dimension detail for ANY toptier agency — powers the Data
 *  Intelligence page and the live Data Explorer. Four drillable dimensions
 *  (sub-agency→office, budget function→subfunction, federal account→treasury
 *  account, object class) + FY resources series with obligation-by-period. */
async function liveDetail(toptier: string, name: string, fyParam?: string | null) {
  const now = new Date()
  const currentFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  const fy = Number(fyParam) || currentFY - 1   // default: last completed FY (full 12 periods)

  type Node = { name: string; code?: string; value: number; outlays?: number; count?: number; children: Node[] }
  const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : 0)

  const [br, sub, bf, fa, oc] = await Promise.all([
    usaspending(`/agency/${toptier}/budgetary_resources/`).catch(() => null),
    usaspending(`/agency/${toptier}/sub_agency/?fiscal_year=${fy}&limit=100`).catch(() => null),
    usaspending(`/agency/${toptier}/budget_function/?fiscal_year=${fy}&limit=100`).catch(() => null),
    usaspending(`/agency/${toptier}/federal_account/?fiscal_year=${fy}&limit=100`).catch(() => null),
    usaspending(`/agency/${toptier}/object_class/?fiscal_year=${fy}&limit=100`).catch(() => null),
  ])

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const mapObligated = (r: any): Node => ({
    name: r.name ?? r.code ?? '\u2014', code: r.code, value: num(r.obligated_amount),
    outlays: num(r.gross_outlay_amount),
    children: Array.isArray(r.children) ? r.children.map(mapObligated) : [],
  })
  const mapSub = (r: any): Node => ({
    name: r.name ?? '\u2014', code: r.code ?? r.abbreviation, value: num(r.total_obligations),
    count: num(r.transaction_count),
    children: Array.isArray(r.children) ? r.children.map(mapSub) : [],
  })
  const years = ((br?.agency_data_by_year ?? []) as any[])
    .filter(y => y.agency_budgetary_resources != null)
    .sort((a, b) => a.fiscal_year - b.fiscal_year)
    .map(y => ({
      fy: `FY${y.fiscal_year}`,
      resources: num(y.agency_budgetary_resources),
      obligated: num(y.agency_total_obligated),
      rate: y.agency_budgetary_resources
        ? Math.round(1000 * num(y.agency_total_obligated) / y.agency_budgetary_resources) / 10 : null,
      byPeriod: ((y.agency_obligation_by_period ?? []) as any[])
        .map(p => ({ period: num(p.period), obligated: num(p.obligated) }))
        .sort((a, b) => a.period - b.period),
    }))
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    source: 'live:usaspending', agency: name, fiscalYear: `FY${fy}`, fetchedAt: new Date().toISOString(),
    years,
    dims: {
      subAgency:      { label: 'Sub-agency',      childLabel: 'Office',             measure: 'award obligations',   nodes: (sub?.results ?? []).map(mapSub) },
      budgetFunction: { label: 'Budget Function',  childLabel: 'Subfunction',        measure: 'account obligations', nodes: (bf?.results ?? []).map(mapObligated) },
      federalAccount: { label: 'Federal Account',  childLabel: 'Treasury Account',   measure: 'account obligations', nodes: (fa?.results ?? []).map(mapObligated) },
      objectClass:    { label: 'Object Class',     childLabel: '',                   measure: 'account obligations', nodes: (oc?.results ?? []).map(mapObligated) },
    },
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const agencyId = (sp.get('agency') ?? 'DOD').toUpperCase()
  const slice = sp.get('slice') ?? 'budget'
  const agency = getAgency(agencyId)

  try {
    // ML dataset registry is agency-independent
    if (slice === 'ml-datasets') {
      return NextResponse.json({ source: 'folder:sourcedata', ...mlDatasets })
    }

    // Audited Financial Report statements (Treasury Fiscal Data, GAO-audited):
    // Statements of Net Cost BY AGENCY, all statement years (~2K rows, $B).
    if (slice === 'statements') {
      const r = await fetch(
        'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/statement_net_cost?page%5Bsize%5D=10000',
        { next: { revalidate: 86400 } })
      if (!r.ok) throw new Error(`fiscaldata ${r.status}`)
      const j = await r.json()
      return NextResponse.json({ source: 'live:fiscaldata (audited FR)', unit: 'billions USD',
        rows: j.data ?? [], fetchedAt: new Date().toISOString() })
    }

    // Live multi-dimension detail works for EVERY agency (incl. DoD/SEC \u2014
    // it complements their folder data with GTAS-derived execution detail).
    if (slice === 'detail') {
      return NextResponse.json(await liveDetail(agency.toptier, agency.name, sp.get('fy')))
    }

    // \u2500\u2500 Default source: bundled folder data \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    if (agency.id === 'DOD') {
      if (slice === 'budget') return NextResponse.json({ source: 'folder:sourcedata', ...dodBudget })
      if (slice === 'awards') return NextResponse.json({ source: 'folder:sourcedata', ...dodAwards })
    }
    if (agency.id === 'SEC' && slice === 'budget') {
      // SEC constants are bundled client-side (lib/sec-data); provide passthrough marker
      return NextResponse.json({ source: 'folder:sourcedata', bundled: 'sec-data' })
    }

    // \u2500\u2500 Fallback: live USAspending \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    if (slice === 'budget') return NextResponse.json(await liveBudget(agency.toptier))
    if (slice === 'awards') return NextResponse.json(await liveAwards(agency.toptier, agency.name))

    return NextResponse.json({ error: `Unknown slice '${slice}'` }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg, agency: agency.id, slice }, { status: 502 })
  }
}
