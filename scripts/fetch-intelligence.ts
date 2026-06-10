#!/usr/bin/env ts-node
/**
 * scripts/fetch-intelligence.ts
 * Run by GitHub Actions on schedule — fetches SEC/OMB/Congress news,
 * scores each item's financial management impact via LLM, pushes to Neon DB.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/fetch-intelligence.ts
 */

import https from 'https'
import { upsertNews, bootstrapSchema } from '../lib/db'

// ─── Simple HTTPS GET helper ──────────────────────────────────────────────────
function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'secdemo-intel/1.0' } }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

// ─── Minimal RSS parser ───────────────────────────────────────────────────────
function parseRSS(xml: string): Array<{ title: string; link: string; description: string }> {
  const items: Array<{ title: string; link: string; description: string }> = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null
  while ((match = itemRegex.exec(xml)) !== null) {
    const get = (tag: string) => {
      const m = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`).exec(match![1])
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''
    }
    items.push({ title: get('title'), link: get('link'), description: get('description') })
  }
  return items.slice(0, 6)
}

// ─── LLM impact scorer (Anthropic) ───────────────────────────────────────────
async function scoreImpact(title: string, body: string): Promise<{
  cat: string; urg: 'HIGH' | 'MEDIUM' | 'LOW'; impact: string
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { cat: 'SEC Operations', urg: 'MEDIUM', impact: 'Review for OSO financial management relevance.' }

  const payload = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: `You are a SEC OSO financial management analyst. 
Classify news items and assess OSO financial management impact.
Respond ONLY with valid JSON — no other text:
{"cat":"Congressional Action|Budget Action|Market Intelligence|SEC Operations","urg":"HIGH|MEDIUM|LOW","impact":"one sentence on specific OSO financial management implication"}`,
    messages: [{ role: 'user', content: `Title: ${title}\nBody: ${body.slice(0, 400)}` }],
  })

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers:  {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(payload),
      },
    }, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          const text   = parsed.content?.[0]?.text ?? '{}'
          const result = JSON.parse(text)
          resolve({
            cat:    result.cat    ?? 'SEC Operations',
            urg:    result.urg    ?? 'MEDIUM',
            impact: result.impact ?? 'Monitor for OSO financial management impact.',
          })
        } catch {
          resolve({ cat: 'SEC Operations', urg: 'LOW', impact: 'Unable to assess impact.' })
        }
      })
    })
    req.on('error', () => resolve({ cat: 'SEC Operations', urg: 'LOW', impact: 'Scoring unavailable.' }))
    req.write(payload)
    req.end()
  })
}

// ─── Revalidate Vercel cache ──────────────────────────────────────────────────
async function revalidateVercel(appUrl: string) {
  const url = new URL('/api/news-feed', appUrl)
  return new Promise<void>(resolve => {
    https.get(url.href, { headers: { 'x-revalidate': '1' } }, () => resolve())
       .on('error', () => resolve())
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const RSS_FEEDS = [
  { url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&dateb=&owner=include&count=10&output=atom', src: 'SEC.gov' },
]

async function main() {
  console.log('[fetch-intelligence] Starting run:', new Date().toISOString())

  await bootstrapSchema()
  console.log('[fetch-intelligence] DB schema ready')

  let totalInserted = 0

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`[fetch-intelligence] Fetching: ${feed.src}`)
      const xml   = await fetchText(feed.url)
      const items = parseRSS(xml)
      console.log(`[fetch-intelligence] Parsed ${items.length} items from ${feed.src}`)

      for (const item of items) {
        if (!item.title) continue
        const scored = await scoreImpact(item.title, item.description)
        await upsertNews({
          cat:     scored.cat,
          urg:     scored.urg,
          headline: item.title.slice(0, 200),
          body:    item.description.slice(0, 800),
          impact:  scored.impact,
          src:     feed.src,
          url:     item.link,
        })
        totalInserted++
        console.log(`  ✓ [${scored.urg}] ${item.title.slice(0, 60)}`)
      }
    } catch (err) {
      console.error(`[fetch-intelligence] Failed for ${feed.src}:`, err)
    }
  }

  console.log(`[fetch-intelligence] Done. Inserted: ${totalInserted}`)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    await revalidateVercel(appUrl)
    console.log('[fetch-intelligence] Vercel cache revalidated')
  }
}

main().catch(err => {
  console.error('[fetch-intelligence] Fatal:', err)
  process.exit(1)
})
