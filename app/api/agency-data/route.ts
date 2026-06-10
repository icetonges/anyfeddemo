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

    // ── Default source: bundled folder data ──────────────────────────────
    if (agency.id === 'DOD') {
      if (slice === 'budget') return NextResponse.json({ source: 'folder:sourcedata', ...dodBudget })
      if (slice === 'awards') return NextResponse.json({ source: 'folder:sourcedata', ...dodAwards })
    }
    if (agency.id === 'SEC' && slice === 'budget') {
      // SEC constants are bundled client-side (lib/sec-data); provide passthrough marker
      return NextResponse.json({ source: 'folder:sourcedata', bundled: 'sec-data' })
    }

    // ── Fallback: live USAspending ────────────────────────────────────────
    if (slice === 'budget') return NextResponse.json(await liveBudget(agency.toptier))
    if (slice === 'awards') return NextResponse.json(await liveAwards(agency.toptier, agency.name))

    return NextResponse.json({ error: `Unknown slice '${slice}'` }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg, agency: agency.id, slice }, { status: 502 })
  }
}
