// app/api/news-feed/route.ts
// GET  — returns latest news from Neon DB (or seed data if DB unavailable)
// POST — called by GitHub Actions cron to push new intelligence items
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 3600   // cache 1 hour

// ── Agency-aware seed data ───────────────────────────────────────────────────
// Returned when the DB is not configured or empty, so the Daily Brief always
// demonstrates with content for the SELECTED agency — never another agency's.
// Live items (GitHub Action → Neon) replace these automatically.
import { getAgency } from '@/lib/agencies'

interface SeedItem {
  id: number; cat: string; urg: string; headline: string; body: string
  impact: string; time: string; src: string; agencies: string
}

function seedFor(agencyId: string): SeedItem[] {
  const a = getAgency(agencyId)
  const N = a.name, AB = a.abbrev

  // agency-specific decks for the deep-profile agencies
  if (a.id === 'DOD') return [
    { id: 1, cat: 'Congressional Action', urg: 'HIGH', src: 'HASC / SASC', time: '3h ago', agencies: 'DOD',
      headline: 'FY2027 NDAA markup underway — authorization conference timing at risk',
      body: 'HASC completed subcommittee marks; SASC schedule slips toward late summer. Authorization-before-appropriation sequencing is again in question for FY2027 new starts.',
      impact: 'New-start programs need CR-contingency language; flag FY2027 RDT&E/PROC new starts in the movers table and model a 6-month CR by appropriation.' },
    { id: 2, cat: 'Budget Action', urg: 'HIGH', src: 'HAC-D', time: '1d ago', agencies: 'DOD',
      headline: 'House Defense Appropriations subcommittee allocation released for FY2027',
      body: 'The 302(b) allocation signals the discretionary topline available to HAC-D. Early subcommittee notes flag Procurement plus-ups and O&M trims versus the PB.',
      impact: 'Run PB-vs-mark deltas by appropriation when the chairman\u2019s mark posts; congressional adds concentrate in Procurement line items.' },
    { id: 3, cat: 'OIG & Audit', urg: 'HIGH', src: 'DoD OIG', time: '5h ago', agencies: 'DOD',
      headline: 'FY2026 agency-wide audit: 26 material weaknesses carried; Dec 31, 2028 statutory deadline (P.L. 118-31)',
      body: 'DODIG reiterates the path to opinion runs through MW #7 (Universe of Transactions) and MW #8 (FBwT). USMC sustainment remains the internal playbook.',
      impact: 'Component CAP evidence for MW #7/#8 due ahead of interim testing — use the Audit page\u2019s remediation pipeline and Advana UoT thread.' },
    { id: 4, cat: 'Financial Management', urg: 'MEDIUM', src: 'DFAS', time: '1d ago', agencies: 'DOD',
      headline: 'DFAS publishes FY-end DDRS consolidation and GTAS period-12 submission windows',
      body: 'Component trial balances due to DDRS-AFS on the accelerated schedule; GTAS bulk-file edits tighten for period 12.',
      impact: 'Lock JV support packages early (MW #18) — unsupported adjustments at consolidation are the audit\u2019s first sample.' },
    { id: 5, cat: 'Procurement & Contracts', urg: 'MEDIUM', src: 'PIEE / WAWF', time: '2d ago', agencies: 'DOD',
      headline: 'PIEE release updates WAWF acceptance and EDA contract-document retrieval APIs',
      body: 'Interface changes affect automated KSD retrieval used in audit response and contract-pay research.',
      impact: 'Re-test the PIID+mod \u2192 EDA/WAWF retrieval hop in the KSD pipeline before interim testing; update the Linkage Thread stage-5 procedure.' },
    { id: 6, cat: 'Agency Operations', urg: 'LOW', src: 'GTCC PMO', time: '3d ago', agencies: 'DOD',
      headline: 'GTCC delinquency tick-up flagged across two Components',
      body: 'Centrally billed account delinquencies rose quarter-over-quarter; salary offset notices issued.',
      impact: 'Pull card-program aging in Finance Operations; PIIA reporting treats sustained delinquency as a payment-integrity indicator.' },
  ]

  if (a.id === 'SEC') return [
    { id: 1, cat: 'Congressional Action', urg: 'HIGH', src: 'Senate Appropriations', time: '2h ago', agencies: 'SEC',
      headline: 'Senate FSGG Subcommittee markup scheduled — June 2026',
      body: 'FY2027 spending bills move; SEC\u2019s $1.908B request (11% below FY2026 enacted) faces conference before the Oct 1 deadline.',
      impact: 'FY2027 enacted level uncertain — model \u00b110% variance; CR scenario requires 1/12 allotment planning.' },
    { id: 2, cat: 'Budget Action', urg: 'MEDIUM', src: 'SEC OFM', time: '1d ago', agencies: 'SEC',
      headline: 'Section 31 collections Q3 FY2026 tracking above projection',
      body: 'Transaction volume keeps fee collections ahead of the enacted ceiling pace; mid-year rate true-up holds.',
      impact: 'Reserve Fund on track; carryover posture into FY2027 stable — do not read collections as a demand signal.' },
    { id: 3, cat: 'OIG & Audit', urg: 'HIGH', src: 'SEC OIG', time: '4h ago', agencies: 'SEC',
      headline: 'OIG-582 T&M corrective actions — September 2026 target approaching',
      body: 'Three open recommendations (T&M dashboard, contract-type matrix, COR surveillance SOPs) remain open.',
      impact: 'COR surveillance log currency is the first artifact OIG will sample — close it out this quarter.' },
    { id: 4, cat: 'Financial Management', urg: 'MEDIUM', src: 'Treasury FIT', time: '2d ago', agencies: 'SEC,ALL',
      headline: 'GTAS period-09 window and edit-rule updates posted',
      body: 'Treasury tightened intragovernmental edits for the period-09 submission.',
      impact: 'Pre-validate trading-partner eliminations before certification to avoid a late resubmission cycle.' },
    { id: 5, cat: 'Procurement & Contracts', urg: 'LOW', src: 'GSA SmartPay', time: '3d ago', agencies: 'SEC,ALL',
      headline: 'SmartPay dispute-resolution window changes effective FY2027',
      body: 'Cardholder dispute window shortens from 90 to 60 days; agency GPC procedures must update before Oct 1.',
      impact: 'Update the GPC SOP and notify cardholders — small change, easy audit finding if missed.' },
  ]

  // generic deck — parameterized to the selected agency (never another agency's content)
  const approps = a.funding === 'fee-funded'
    ? `${AB} is fee-funded; oversight rides authorization and oversight hearings rather than annual appropriations.`
    : `FY2027 appropriations sequencing puts ${AB} under CR risk after Oct 1 — subcommittee allocations are posted and markup timing is slipping.`
  return [
    { id: 1, cat: 'Congressional Action', urg: 'HIGH', src: 'Appropriations Committees', time: '4h ago', agencies: a.id,
      headline: `FY2027 funding posture for ${N} — markup and CR scenarios in play`,
      body: approps,
      impact: a.funding === 'fee-funded'
        ? `Monitor authorizing-committee riders; budget ceiling moves through governance, not approps math.`
        : `Model a 1/12 CR apportionment for ${AB}: new starts freeze, hiring slows — brief leadership on the by-account exposure.` },
    { id: 2, cat: 'Budget Action', urg: 'HIGH', src: 'OMB', time: '1d ago', agencies: 'ALL',
      headline: 'OMB FY2028 A-11 update: efficiency targets and evidence requirements in Spring guidance',
      body: 'Agencies must identify operational savings and tie budget justifications to performance evidence in FY2028 submissions.',
      impact: `${AB} FY2028 formulation baseline needs the efficiency narrative started now — use the Budget page\u2019s formulation lane.` },
    { id: 3, cat: 'OIG & Audit', urg: 'MEDIUM', src: 'GAO', time: '6h ago', agencies: 'ALL',
      headline: 'GAO: year-end obligation surges and bona fide need documentation across CFO Act agencies',
      body: 'GAO recommends September obligation review gates and documented bona fide need certifications.',
      impact: `Stand up the ${AB} September review gate; document \u00a71502 support for late-year obligations before the auditors ask.` },
    { id: 4, cat: 'Financial Management', urg: 'MEDIUM', src: 'Treasury FIT', time: '2d ago', agencies: 'ALL',
      headline: 'GTAS submission window and USSGL edit updates posted for the current period',
      body: 'Treasury refreshed validation edits; intragovernmental differences remain the top rejection driver.',
      impact: `Pre-validate ${AB} trading-partner eliminations and certify early — a clean GTAS cycle is the cheapest audit evidence there is.` },
    { id: 5, cat: 'Procurement & Contracts', urg: 'MEDIUM', src: 'OFPP / GSA', time: '3d ago', agencies: 'ALL',
      headline: 'OFPP tightens COR surveillance documentation for T&M vehicles; SAM.gov interface updates',
      body: 'Monthly surveillance documentation expected for T&M above the SAT; SAM.gov contract-data interface changes land this quarter.',
      impact: `Refresh ${AB} COR files and re-point any SAM.gov data pulls — the Acquisition page\u2019s award feeds are unaffected.` },
    { id: 6, cat: 'Agency Operations', urg: 'LOW', src: 'OPM / GSA', time: '4d ago', agencies: 'ALL',
      headline: 'Charge-card and travel program rule changes queued for FY2027',
      body: 'SmartPay dispute windows shorten; travel per-diem tables refresh on schedule.',
      impact: `Update ${AB} GPC/travel SOPs — small compliance items that show up in A-123 testing if stale.` },
  ]
}

export async function GET(req: NextRequest) {
  const agencyId = (req.nextUrl.searchParams.get('agency') ?? 'DOD').toUpperCase()
  // Try Neon DB first; fall back to agency-aware seed data gracefully
  if (process.env.DATABASE_URL) {
    try {
      const { getLatestNews } = await import('@/lib/db')
      const rows = await getLatestNews(50)
      if (rows.length > 0) {
        return NextResponse.json({ news: rows, source: 'db' })
      }
    } catch (err) {
      console.warn('[news-feed] DB unavailable, using seed data:', err)
    }
  }
  return NextResponse.json({ news: seedFor(agencyId), source: 'seed', seededFor: agencyId })
}

export async function POST(req: NextRequest) {
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
    for (const item of items) { await upsertNews(item); inserted++ }
    return NextResponse.json({ ok: true, inserted })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
