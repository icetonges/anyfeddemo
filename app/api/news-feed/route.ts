// app/api/news-feed/route.ts
// GET  — returns latest news from Neon DB (or seed data if DB unavailable)
// POST — called by GitHub Actions cron to push new intelligence items
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 3600   // cache 1 hour

// Seed data — returned when DB is not configured or empty.
// These are illustrative scenarios; no url field is set because there is no
// real source article to link to. "View Source" only appears on live DB items
// that carry an actual article URL extracted from the RSS feed.
// Covers all 6 OSO-relevant categories, newest-first.
const SEED_NEWS = [
  // Congressional Action
  { id:1, cat:'Congressional Action', urg:'HIGH',
    headline:'Senate FSGG Subcommittee Markup Scheduled — June 2026',
    body:"Senate Appropriations FSGG Subcommittee scheduled markup of FY2027 spending bills. SEC's $1.908B request (11% below FY2026 enacted) faces conference process before Oct 1 deadline. Potential for CR if no agreement reached.",
    impact:"FY2027 enacted level uncertain — OSO planning must model ±10% variance; CR scenario requires 1/12 allotment planning.",
    time:'2h ago', src:'Senate Appropriations' },
  { id:2, cat:'Congressional Action', urg:'MEDIUM',
    headline:'House FSS Subcommittee Requests FTE Reduction Justification',
    body:'House Financial Services Appropriations Subcommittee hearing questioned reduction from 4,542 to 4,177 FTE; mission-area vacancy analysis requested before markup.',
    impact:"Potential FTE add-back in final appropriations — monitor markup; OSO headcount and OC 11.0 allotment may shift.",
    time:'1d ago', src:'House Appropriations' },
  // Budget Action
  { id:3, cat:'Budget Action', urg:'HIGH',
    headline:'OMB A-11 FY2028 Update: DOGE 10% Efficiency Targets Mandatory',
    body:'OMB revised Circular A-11 supplemental guidance requiring all agencies to identify 10% operational savings for FY2028 submissions. OSO efficiency plans due to OMB July 2026.',
    impact:"OSO must begin FY2028 formulation under enhanced efficiency framework — baseline assessments and office-level targets due immediately.",
    time:'6h ago', src:'OMB' },
  { id:4, cat:'Budget Action', urg:'MEDIUM',
    headline:'Section 31 Collections Q2 FY2026: 8% Above Projection',
    body:'Equity market volume drove Section 31 transaction fee collections 8% above projection in Q2 FY2026, reinforcing the SEC deficit-neutral posture.',
    impact:"Reserve fund on track — supports $145M anticipated carryover to FY2027; OSO FY2027 allotment baseline stable.",
    time:'1d ago', src:'SEC OFM' },
  // OIG & Compliance
  { id:5, cat:'OIG & Compliance', urg:'HIGH',
    headline:'OIG-582 T&M Corrective Action Deadline Approaching — Sep 2026',
    body:'SEC OIG Report 582 three open recommendations (quarterly T&M dashboard, contract type matrix, COR surveillance SOPs) remain open. OSO BMCB responsible for all three. Target: September 30, 2026.',
    impact:"COR-001 (Patriot Security) surveillance log OVERDUE — immediate submission required to avoid escalation.",
    time:'4h ago', src:'SEC OIG' },
  { id:6, cat:'OIG & Compliance', urg:'MEDIUM',
    headline:'GAO: Federal Agencies Warned on Year-End Obligation Spike Risks',
    body:'GAO report flags year-end spending surge patterns at multiple agencies. Recommends agencies establish September obligation freeze procedures and document bona fide need certifications.',
    impact:"OSO should document September obligation freeze memo per SOP-003 and ensure all September actions meet bona fide need rule.",
    time:'2d ago', src:'GAO' },
  // Procurement & Contracts
  { id:7, cat:'Procurement & Contracts', urg:'MEDIUM',
    headline:'OFPP Updates COR Surveillance Requirements for T&M Contracts',
    body:'Office of Federal Procurement Policy issued guidance strengthening COR surveillance log requirements for time-and-materials contracts. Monthly documentation now required for all T&M vehicles above $150K.',
    impact:"Directly strengthens OIG-582 corrective action framework — OSO COR surveillance SOP update required; M. Johnson Patriot Security log compliance critical.",
    time:'3h ago', src:'OFPP/OMB' },
  { id:8, cat:'Procurement & Contracts', urg:'LOW',
    headline:'SAM.gov Post-FPDS Migration: New Contract Search Interface Live',
    body:'GSA confirmed full transition from FPDS.gov to SAM.gov Contract Awards Management portal is complete. Legacy FPDS.gov decommissioned February 24, 2026. All contract data now in SAM.gov.',
    impact:"OSO FM Specialist must use SAM.gov for all vendor SAM registration checks and contract award data — FPDS access no longer available.",
    time:'5d ago', src:'GSA / SAM.gov' },
  // SEC Operations
  { id:9, cat:'SEC Operations', urg:'LOW',
    headline:'EDGAR Phase 3 Cloud Migration Complete — 34% Per-Filing Cost Reduction',
    body:"SEC's EDGAR system completed Phase 3 of cloud migration. Per-filing processing costs fell 34%, system uptime reached 99.97%. IT modernization saves estimated $8M annually.",
    impact:"Positive IT budget signal for FY2027 equipment request ($30.4M); EDGAR savings may support OSO tech modernization requests.",
    time:'2d ago', src:'SEC IT Division' },
  { id:10, cat:'SEC Operations', urg:'MEDIUM',
    headline:'Project Crypto Framework Released — Significant New Examination Workload',
    body:"Chairman Atkins directed release of digital asset classification framework for public comment (60-day period). New examination workload anticipated for Trading & Markets division.",
    impact:"FTE pressure in FY2027 vs. reduced 4,177 cap — OSO OSBO-PSE physical security demand may increase with expanded examination staffing.",
    time:'4h ago', src:'SEC.gov' },
  // Federal Management
  { id:11, cat:'Federal Management', urg:'MEDIUM',
    headline:'GSA SmartPay 3: New Dispute Resolution Timeline Effective FY2027',
    body:'GSA updated SmartPay 3 program rules reducing cardholder dispute resolution window from 90 to 60 days. All agency GPC programs must update internal procedures before October 1.',
    impact:"OSO GPC program requires SOP-004 update — notify all four OSO cardholders (Mallon, Printis, Hochberg, Taylor) of revised dispute timeline.",
    time:'3d ago', src:'GSA SmartPay' },
  { id:12, cat:'Federal Management', urg:'LOW',
    headline:'OPM FY2027 Federal Benefits Open Season Dates Announced',
    body:'OPM announced Federal Benefits Open Season dates: November 10 – December 8, 2026. All federal employees may change health, dental, vision, and FSA elections during this period.',
    impact:"OSO payroll OC 12.0 benefits costs may shift in FY2027 Q2 based on employee enrollment changes — flag to OHR for OSO headcount planning.",
    time:'1d ago', src:'OPM' },
]

export async function GET() {
  // Try Neon DB first; fall back to seed data gracefully
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
  return NextResponse.json({ news: SEED_NEWS, source: 'seed' })
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
