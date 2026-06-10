#!/usr/bin/env ts-node
/**
 * scripts/fetch-intelligence.ts
 * Run by GitHub Actions daily at 8 AM ET — fetches OSO-relevant news from
 * SEC, OMB, OIG, Federal Register, Congress, and federal procurement sources.
 * Scores each item's OSO financial management impact via LLM, pushes to Neon DB.
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
  cat: string; urg: 'HIGH' | 'MEDIUM' | 'LOW'; impact: string
}> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) return { cat: feedCat, urg: 'MEDIUM', impact: 'Review for OSO financial management relevance.' }

  const systemPrompt = `You are a senior federal financial management analyst at the SEC Office of Support Operations (OSO),
Business Management & Continuity Branch (BMCB). Your job is to assess how news items affect OSO's financial
management operations: budget execution ($11M+ allotment), OIG compliance (OIG-582/584), GPC program,
COR surveillance, FY2028 formulation, ADA compliance, and stakeholder reporting.

Categories relevant to OSO:
- "Congressional Action" — appropriations, hearings, FTE authorizations, markup actions
- "Budget Action" — OMB guidance, DOGE efficiency targets, apportionment, reprogramming
- "Procurement & Contracts" — FAR/GSAM changes, SAM.gov updates, T&M contract rules, COR policy
- "OIG & Compliance" — OIG reports, audit findings, internal control guidance, FMFIA
- "SEC Operations" — SEC organizational changes, IT systems, fee collections, workforce
- "Federal Management" — GSA, OPM, OFPP, government-wide FM policy affecting OSO operations

Urgency for OSO:
- HIGH: Requires OSO action within 5 business days or creates direct ADA/OIG risk
- MEDIUM: Affects OSO planning within 30 days; include in next brief to Brian Williams
- LOW: Background awareness; monitor for future impact

Respond ONLY with valid JSON:
{"cat":"category from list above","urg":"HIGH|MEDIUM|LOW","impact":"one specific sentence on OSO financial management implication — cite dollar amounts, deadlines, or regulatory refs where relevant"}`

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
            cat:    result.cat    ?? feedCat,
            urg:    result.urg    ?? 'MEDIUM',
            impact: result.impact ?? 'Monitor for OSO financial management impact.',
          })
        } catch {
          resolve({ cat: feedCat, urg: 'LOW', impact: 'Unable to assess impact.' })
        }
      })
    })
    req.on('error', () => resolve({ cat: feedCat, urg: 'LOW', impact: 'Scoring unavailable.' }))
    req.setTimeout(20000, () => {
      req.destroy()
      resolve({ cat: feedCat, urg: 'LOW', impact: 'Scoring timeout — review manually.' })
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

// ─── OSO-relevant RSS/Atom feeds ──────────────────────────────────────────────
// All feeds verified reachable from GitHub Actions (Azure IPs).
// sec.gov/rss and oig.sec.gov are Cloudflare-blocked from Azure — replaced.
// federalnewsnetwork.com returns 0 items from Azure IPs — replaced.
// "office-of-management-and-budget" slug returns unrelated content — fixed to EOP.
const RSS_FEEDS = [
  // Federal Register — SEC-specific rules and notices
  {
    url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions%5Bagencies%5D%5B%5D=securities-and-exchange-commission&per_page=8',
    src: 'Federal Register (SEC)',
    defaultCat: 'SEC Operations',
  },
  // Federal Register — Executive Office of the President (OMB, OSTP, CEA)
  // "executive-office-of-the-president" is the correct parent slug; "office-of-management-and-budget"
  // alone returns unrelated Defense dept content from the FR API.
  {
    url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions%5Bagencies%5D%5B%5D=executive-office-of-the-president&per_page=8',
    src: 'Federal Register (EOP/OMB)',
    defaultCat: 'Budget Action',
  },
  // CBO — budget analysis, appropriations scoring, fiscal projections
  // Replaces sec.gov/rss (Cloudflare-blocked from GitHub Actions Azure IPs)
  {
    url: 'https://www.cbo.gov/rss/all.xml',
    src: 'CBO',
    defaultCat: 'Budget Action',
  },
  // GAO — federal financial management, internal controls, audit readiness
  {
    url: 'https://www.gao.gov/rss/reports.xml',
    src: 'GAO',
    defaultCat: 'OIG & Compliance',
  },
  // Federal Register — GSA procurement rules, SAM.gov updates, acquisition policy
  // Replaces federalnewsnetwork.com/procurement (CDN blocks Azure IPs, 0 items)
  {
    url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions%5Bagencies%5D%5B%5D=general-services-administration&per_page=6',
    src: 'Federal Register (GSA)',
    defaultCat: 'Procurement & Contracts',
  },
  // Federal Register — OPM workforce and pay/benefits policy
  // Replaces oig.sec.gov (ENOTFOUND from GitHub Actions — DNS blocked)
  {
    url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions%5Bagencies%5D%5B%5D=office-of-personnel-management&per_page=6',
    src: 'Federal Register (OPM)',
    defaultCat: 'Federal Management',
  },
  // GovExec — federal management, workforce, budget execution trends
  {
    url: 'https://www.govexec.com/rss/management/',
    src: 'GovExec',
    defaultCat: 'Federal Management',
  },
  // FedScoop — federal IT modernization and agency operations
  // Replaces federalnewsnetwork.com/budget (CDN blocks Azure IPs, 0 items)
  {
    url: 'https://fedscoop.com/feed/',
    src: 'FedScoop',
    defaultCat: 'SEC Operations',
  },
]

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
          await upsertNews({
            cat:          scored.cat,
            urg:          scored.urg,
            headline:     item.title.slice(0, 200),
            body:         item.description.slice(0, 800),
            impact:       scored.impact,
            src:          feed.src,
            url:          item.link || null,
            published_at: item.published_at || undefined,
          })
          totalInserted++
          console.log(`  ✓ [${scored.urg}] [${scored.cat}] ${item.title.slice(0, 70)}`)
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
