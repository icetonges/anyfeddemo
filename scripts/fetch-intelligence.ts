#!/usr/bin/env ts-node
/**
 * scripts/fetch-intelligence.ts
 * Run by GitHub Actions DAILY — fetches federal financial-management news
 * scoped to the ANY FED portal's agency registry (DoD, Treasury, DHS, HHS, VA,
 * DOE, SEC, GSA, OPM + government-wide GAO/CBO/OMB sources), tags each item
 * with the registry agencies it affects, scores FM impact via LLM, pushes to
 * Neon DB. The Daily Brief page renders the result filtered by selected agency.
 */

import https from 'https'
import { upsertNews, bootstrapSchema } from '../lib/db'

// ─── Simple HTTPS GET helper ──────────────────────────────────────────────────
function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'secdemo-intel/1.0 (federal-fm-portal; contact: icetonges@gmail.com)',
        'Accept': 'application/rss+xml, application/atom+xml, text/xml, */*',
      },
      timeout: 15000,
    }, res => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchText(res.headers.location))
        return
      }
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')) })
  })
}

// ─── XML tag extractor ────────────────────────────────────────────────────────
function getTag(xml: string, tag: string): string {
  // Handles both <tag>content</tag> and CDATA
  const m = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml)
  if (!m) return ''
  return m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').trim()
}

function getAttr(xml: string, tag: string, attr: string): string {
  const m = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i').exec(xml)
  return m ? m[1] : ''
}

// ─── Dual RSS/Atom parser ─────────────────────────────────────────────────────
interface FeedItem { title: string; link: string; description: string; published_at: string }

function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = []

  // Atom: uses <entry> tags, <id> or <link href="..."> for URL
  const isAtom = /<feed[\s>]/i.test(xml)
  const entryTag = isAtom ? 'entry' : 'item'
  const entryRegex = new RegExp(`<${entryTag}[\\s>]([\\s\\S]*?)<\\/${entryTag}>`, 'g')

  let match: RegExpExecArray | null
  while ((match = entryRegex.exec(xml)) !== null) {
    const chunk = match[1]
    const title = getTag(chunk, 'title') || getTag(chunk, 'name')
    // Atom uses <link href="..."/> (self-closing) or <id>, RSS uses <link>
    // Fall back to <guid> when <link> is absent or self-closing (some SEC/GAO feeds)
    const rawLink = isAtom
      ? (getAttr(chunk, 'link', 'href') || getTag(chunk, 'id') || getTag(chunk, 'link'))
      : getTag(chunk, 'link')
    // <guid isPermaLink="true"> is a valid article URL in RSS 2.0 spec
    const guid = getTag(chunk, 'guid')
    const link = rawLink || (guid && guid.startsWith('http') ? guid : '')
    const description = getTag(chunk, 'summary') || getTag(chunk, 'description') || getTag(chunk, 'content')
    // Extract original publication date: RSS uses <pubDate>, Atom uses <updated> or <published>
    const rawDate = getTag(chunk, 'pubDate') || getTag(chunk, 'updated') || getTag(chunk, 'published') || ''
    let published_at = ''
    if (rawDate) {
      try {
        const d = new Date(rawDate)
        if (!isNaN(d.getTime())) {
          published_at = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
        }
      } catch { /* keep empty */ }
    }
    if (title) items.push({ title, link, description, published_at })
  }

  return items.slice(0, 8)
}

// ─── LLM impact scorer (Google Gemini Flash) ─────────────────────────────────
async function scoreImpact(title: string, body: string, feedCat: string): Promise<{
  cat: string; urg: 'HIGH' | 'MEDIUM' | 'LOW'; impact: string; agencies: string[]
}> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) return { cat: feedCat, urg: 'MEDIUM', impact: 'Review for federal financial management relevance.', agencies: [] }

  const systemPrompt = `You are a senior federal financial management analyst supporting CFO organizations across ALL federal agencies
(the ANY FED portal: DoD, Treasury, DHS, HHS, VA, DOE, SEC, GSA, OPM, SSA, NASA, and the other CFO Act agencies).
Assess each news item for its FEDERAL FINANCIAL MANAGEMENT impact: budget formulation/enactment/execution, appropriations law (ADA),
accounting & audit readiness (USSGL, GTAS, AFR, material weaknesses), internal controls (A-123), payment integrity (PIIA),
procurement/acquisition, and finance operations (travel, purchase/travel cards, payroll).

Categories:
- "Congressional Action" — appropriations bills, CRs, markups, NDAA, hearings, rescissions
- "Budget Action" — OMB circulars/guidance, apportionment, reprogramming, budget releases
- "Procurement & Contracts" — FAR changes, SAM.gov, protest decisions, acquisition policy
- "OIG & Audit" — GAO/OIG reports, audit findings, material weaknesses, FMFIA/FISCAM
- "Financial Management" — Treasury/FIT guidance, USSGL/TFM updates, GTAS, payment integrity
- "Agency Operations" — agency-specific reorganizations, systems, workforce with FM impact

Urgency for a CFO shop:
- HIGH: action needed within ~5 business days or direct ADA/audit risk
- MEDIUM: affects planning within 30 days
- LOW: background awareness

Agency tagging: from this registry — DOD SEC FDIC TREAS HHS DHS DOE DOJ DOS DOT ED VA USDA DOC DOL HUD DOI EPA NASA GSA NSF OPM SBA SSA USAID NRC FCC CFTC —
list the ids this item materially affects; use ["ALL"] for government-wide items.

Respond ONLY with valid JSON:
{"cat":"category from list above","urg":"HIGH|MEDIUM|LOW","agencies":["DOD","TREAS"],"impact":"one specific sentence on the federal FM implication — cite dollar amounts, deadlines, or regulatory refs where relevant"}`

  const payload = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: `Title: ${title}\n\nBody: ${body.slice(0, 500)}` }] }],
    generationConfig: { maxOutputTokens: 220, temperature: 0.2 },
  })

  const model = 'gemini-2.0-flash'

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path:     `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          const text   = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
          // Extract JSON from response (handle markdown code blocks)
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
          resolve({
            cat:      result.cat    ?? feedCat,
            urg:      result.urg    ?? 'MEDIUM',
            impact:   result.impact ?? 'Monitor for federal financial management impact.',
            agencies: Array.isArray(result.agencies) ? result.agencies.map((a: unknown) => String(a).toUpperCase()) : [],
          })
        } catch {
          resolve({ cat: feedCat, urg: 'LOW', impact: 'Unable to assess impact.', agencies: [] })
        }
      })
    })
    req.on('error', () => resolve({ cat: feedCat, urg: 'LOW', impact: 'Scoring unavailable.', agencies: [] }))
    req.setTimeout(20000, () => {
      req.destroy()
      resolve({ cat: feedCat, urg: 'LOW', impact: 'Scoring timeout — review manually.', agencies: [] })
    })
    req.write(payload)
    req.end()
  })
}

// ─── Revalidate Vercel ISR cache ──────────────────────────────────────────────
async function revalidateVercel(appUrl: string) {
  const url = new URL('/api/news-feed', appUrl)
  return new Promise<void>(resolve => {
    https.get(url.href, { headers: { 'x-revalidate': '1' } }, () => resolve())
       .on('error', () => resolve())
  })
}

// ─── ANY FED agency-scoped RSS/Atom feeds ────────────────────────────────────
// One Federal Register feed per major registry agency + government-wide FM
// sources (GAO, CBO, OMB/EOP, GovExec, FedScoop). All verified reachable from
// GitHub Actions Azure IPs. defaultAgencies seeds tagging; the LLM refines it.
const FR = (slug: string, per = 6) =>
  `https://www.federalregister.gov/api/v1/articles.rss?conditions%5Bagencies%5D%5B%5D=${slug}&per_page=${per}`

const RSS_FEEDS: { url: string; src: string; defaultCat: string; defaultAgencies: string[] }[] = [
  // government-wide FM sources
  { url: 'https://www.gao.gov/rss/reports.xml',  src: 'GAO',  defaultCat: 'OIG & Audit',  defaultAgencies: ['ALL'] },
  { url: 'https://www.cbo.gov/rss/all.xml',      src: 'CBO',  defaultCat: 'Budget Action', defaultAgencies: ['ALL'] },
  { url: FR('executive-office-of-the-president', 8), src: 'Federal Register (EOP/OMB)', defaultCat: 'Budget Action', defaultAgencies: ['ALL'] },
  { url: 'https://www.govexec.com/rss/management/', src: 'GovExec', defaultCat: 'Federal Management', defaultAgencies: ['ALL'] },
  { url: 'https://fedscoop.com/feed/',           src: 'FedScoop', defaultCat: 'Agency Operations', defaultAgencies: ['ALL'] },
  // per-agency Federal Register feeds (registry-scoped)
  { url: FR('defense-department', 8),            src: 'Federal Register (DoD)',      defaultCat: 'Agency Operations', defaultAgencies: ['DOD'] },
  { url: FR('treasury-department'),              src: 'Federal Register (Treasury)', defaultCat: 'Financial Management', defaultAgencies: ['TREAS'] },
  { url: FR('homeland-security-department'),     src: 'Federal Register (DHS)',      defaultCat: 'Agency Operations', defaultAgencies: ['DHS'] },
  { url: FR('health-and-human-services-department'), src: 'Federal Register (HHS)',  defaultCat: 'Agency Operations', defaultAgencies: ['HHS'] },
  { url: FR('veterans-affairs-department'),      src: 'Federal Register (VA)',       defaultCat: 'Agency Operations', defaultAgencies: ['VA'] },
  { url: FR('energy-department'),                src: 'Federal Register (DOE)',      defaultCat: 'Agency Operations', defaultAgencies: ['DOE'] },
  { url: FR('securities-and-exchange-commission'), src: 'Federal Register (SEC)',    defaultCat: 'Agency Operations', defaultAgencies: ['SEC'] },
  { url: FR('general-services-administration'),  src: 'Federal Register (GSA)',      defaultCat: 'Procurement & Contracts', defaultAgencies: ['GSA', 'ALL'] },
  { url: FR('office-of-personnel-management'),   src: 'Federal Register (OPM)',      defaultCat: 'Federal Management', defaultAgencies: ['OPM', 'ALL'] },
]

// keyword fallback tagger (used alongside LLM tags)
const AGENCY_KEYWORDS: [string, RegExp][] = [
  ['DOD',   /\b(defense|pentagon|army|navy|air force|space force|marine|dod|military)\b/i],
  ['TREAS', /\b(treasury|irs|fiscal service|mint\b)/i],
  ['DHS',   /\b(homeland security|dhs|fema|cbp|tsa|coast guard|ice\b)/i],
  ['HHS',   /\b(health and human services|hhs|medicare|medicaid|cms|nih|cdc|fda)\b/i],
  ['VA',    /\b(veterans affairs|\bva\b|veterans health|vba)\b/i],
  ['DOE',   /\b(department of energy|nnsa|national lab)/i],
  ['SEC',   /\b(securities and exchange|sec\.gov)\b/i],
  ['ED',    /\b(department of education|student aid|fafsa)\b/i],
  ['SSA',   /\b(social security)\b/i],
  ['NASA',  /\bnasa\b/i],
  ['DOJ',   /\b(justice department|department of justice|fbi)\b/i],
  ['DOT',   /\b(transportation department|faa|fhwa)\b/i],
  ['GSA',   /\b(gsa|general services|sam\.gov|smartpay)\b/i],
  ['OPM',   /\b(opm|office of personnel|federal employees? health)\b/i],
  ['EPA',   /\bepa\b|environmental protection/i],
  ['SBA',   /\bsmall business administration|\bsba\b/i],
  ['USDA',  /\b(agriculture department|usda)\b/i],
]
function tagAgencies(text: string, seed: string[], llm: string[]): string {
  const out = new Set<string>(seed.concat(llm))
  for (const [id, re] of AGENCY_KEYWORDS) if (re.test(text)) out.add(id)
  if (out.size > 1) out.delete('ALL')      // specific tags beat the wildcard
  return Array.from(out).join(',')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[fetch-intelligence] Starting run:', new Date().toISOString())
  console.log('[fetch-intelligence] Feeds to fetch:', RSS_FEEDS.length)

  await bootstrapSchema()
  console.log('[fetch-intelligence] DB schema ready')

  let totalInserted = 0
  let totalFailed   = 0

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`[fetch-intelligence] Fetching: ${feed.src}`)
      const xml = await fetchText(feed.url)

      if (xml.length < 100) {
        console.warn(`  ⚠️  Empty/short response from ${feed.src} (${xml.length} chars)`)
        totalFailed++
        continue
      }

      const items = parseFeed(xml)
      console.log(`[fetch-intelligence] Parsed ${items.length} items from ${feed.src}`)

      if (items.length === 0) {
        console.warn(`  ⚠️  No items parsed — response preview: ${xml.slice(0, 200).replace(/\n/g,' ')}`)
        totalFailed++
        continue
      }

      for (const item of items) {
        if (!item.title || item.title.length < 5) continue
        try {
          const scored = await scoreImpact(item.title, item.description, feed.defaultCat)
          const agencies = tagAgencies(`${item.title} ${item.description}`, feed.defaultAgencies, scored.agencies)
          await upsertNews({
            cat:          scored.cat,
            urg:          scored.urg,
            headline:     item.title.slice(0, 200),
            body:         item.description.slice(0, 800),
            impact:       scored.impact,
            src:          feed.src,
            url:          item.link || undefined,
            agencies,
            published_at: item.published_at || undefined,
          })
          totalInserted++
          console.log(`  ✓ [${scored.urg}] [${scored.cat}] [${agencies}] ${item.title.slice(0, 70)}`)
        } catch (itemErr) {
          console.error(`  ✗ Failed item "${item.title.slice(0,50)}":`, itemErr)
        }
      }

      // Small delay between feeds to be polite to servers
      await new Promise(r => setTimeout(r, 1000))

    } catch (err) {
      console.error(`[fetch-intelligence] Failed for ${feed.src}:`, err)
      totalFailed++
    }
  }

  console.log(`[fetch-intelligence] Done. Inserted: ${totalInserted}, Failed feeds: ${totalFailed}`)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    await revalidateVercel(appUrl)
    console.log('[fetch-intelligence] Vercel cache revalidated')
  }
}

// Explicit exit prevents "The operation was canceled." / ECANCELED errors:
// Node.js hangs on open HTTPS keep-alive sockets after main() resolves, then
// gets killed by the GitHub Actions runner, producing a non-zero exit code
// even when the script succeeded. process.exit(0) forces clean termination.
main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[fetch-intelligence] Fatal:', err)
    process.exit(1)
  })
