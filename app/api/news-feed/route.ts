// app/api/news-feed/route.ts
// GET  — returns latest news from Neon DB (or seed data if DB unavailable)
// POST — called by GitHub Actions cron to push new intelligence items
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 3600   // cache 1 hour

// Seed data — returned when DB is not configured (dev / first deploy).
// Ordered newest-first. Each item includes a `url` pointing to the original source.
const SEED_NEWS = [
  {
    id: 1, cat: 'Congressional Action', urg: 'HIGH',
    headline: 'Senate FSGG Subcommittee Markup — June 2026',
    body: "Senate Appropriations scheduled FSGG markup. SEC's $1.908B FY2027 request may shift pending House-Senate conference before October 1.",
    impact: 'FY2027 enacted level uncertain — OSO must model ±10% scenarios.',
    time: '2h ago', src: 'Senate Appropriations',
    url: 'https://www.appropriations.senate.gov/',
  },
  {
    id: 3, cat: 'Market Intelligence', urg: 'MEDIUM',
    headline: 'Project Crypto Draft Rules Released for Public Comment',
    body: "Chairman Atkins directed release of digital asset classification framework. 60-day comment period opened May 2026.",
    impact: 'Significant new examination workload — Trading & Markets FTE pressure vs. reduced 4,177 cap.',
    time: '4h ago', src: 'SEC.gov',
    url: 'https://www.sec.gov/news/press-releases',
  },
  {
    id: 2, cat: 'Budget Action', urg: 'HIGH',
    headline: 'OMB A-11 FY2028 Update: DOGE 10% Efficiency Targets Required',
    body: 'OMB revised A-11 supplemental guidance. All agencies must identify 10% operational savings for FY2028 submissions. Plans due July 2026.',
    impact: 'OSO must begin FY2028 formulation under enhanced efficiency framework immediately.',
    time: '6h ago', src: 'OMB',
    url: 'https://www.whitehouse.gov/omb/information-for-agencies/circulars/',
  },
  {
    id: 4, cat: 'SEC Operations', urg: 'LOW',
    headline: 'EDGAR Phase 3 Cloud Migration Complete — 34% Cost Reduction',
    body: 'SEC EDGAR completed Phase 3 cloud migration. Per-filing costs fell 34%; uptime 99.97%.',
    impact: 'Positive IT budget signal for FY2027 equipment request ($30.4M).',
    time: '1d ago', src: 'SEC IT Division',
    url: 'https://www.sec.gov/edgar/about',
  },
  {
    id: 5, cat: 'Market Intelligence', urg: 'MEDIUM',
    headline: 'Section 31 Collections Q2 FY2026: 8% Above Projection',
    body: 'Equity market volume drove Section 31 fee collections 8% above projection, reinforcing deficit-neutral posture.',
    impact: 'Reserve fund on track — supports $145M anticipated FY2026→FY2027 carryover.',
    time: '1d ago', src: 'SEC OFM',
    url: 'https://www.sec.gov/about/offices/ofm.htm',
  },
  {
    id: 6, cat: 'Congressional Action', urg: 'MEDIUM',
    headline: 'House FSS Subcommittee Requests FTE Reduction Justification',
    body: 'Subcommittee hearing questioned reduction from 4,542 to 4,177 FTE; mission-area vacancy analysis requested before markup.',
    impact: 'Potential FTE add-back in final appropriations — monitor markup closely.',
    time: '2d ago', src: 'House Appropriations',
    url: 'https://appropriations.house.gov/',
  },
]

export async function GET() {
  // Try Neon DB first; fall back to seed data gracefully
  if (process.env.DATABASE_URL) {
    try {
      const { getLatestNews } = await import('@/lib/db')
      const rows = await getLatestNews(30)
      if (rows.length > 0) {
        return NextResponse.json({ news: rows, source: 'db' })
      }
    } catch (err) {
      console.warn('[news-feed] DB unavailable, using seed data:', err)
    }
  }
  return NextResponse.json({ news: SEED_NEWS, source: 'seed' })
}

export async function POST(req: NextRequest) {
  // Verify cron secret before accepting pushes
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { items } = await req.json()
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items array required' }, { status: 400 })
    }

    const { upsertNews, bootstrapSchema } = await import('@/lib/db')
    await bootstrapSchema()

    let inserted = 0
    for (const item of items) {
      await upsertNews(item)
      inserted++
    }

    return NextResponse.json({ ok: true, inserted })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
