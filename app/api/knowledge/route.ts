// app/api/knowledge/route.ts — the self-evolving knowledge base.
//   POST {action:'save', kind, agency, title, content, model}  → embed + store
//   POST {action:'search', query, agency?}                     → semantic top-k
//   POST {action:'agent'}                                      → LOOPING AGENT:
//        reads last agent digest + 7 days of KB items + latest news, produces
//        an application-wide executive summary, and SAVES IT BACK into the KB
//        (embedded) — each run builds on the previous run's digest.
//   GET  ?op=list | ?op=item&id=N (the retrieval link target)
// DB is imported dynamically (news-feed pattern) so builds don't require env.
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { callChain } from '@/lib/llm-chain'
import { chainFor } from '@/lib/models'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const EMBED_MODEL = 'text-embedding-004'

async function embed(text: string): Promise<string | null> {
  const key = process.env.GOOGLE_AI_API_KEY
  if (!key) return null
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: text.slice(0, 8000) }] } }) })
    if (!r.ok) return null
    const j = await r.json()
    const v = j.embedding?.values
    return Array.isArray(v) ? JSON.stringify(v.map((x: number) => Math.round(x * 1e5) / 1e5)) : null
  } catch { return null }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

async function db() {
  if (!process.env.DATABASE_URL) return null
  try {
    const mod = await import('@/lib/db')
    await mod.bootstrapKb()
    return mod
  } catch (e) { console.warn('[knowledge] DB unavailable:', e); return null }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const op = sp.get('op') ?? 'list'
  const d = await db()
  if (!d) return NextResponse.json({ db: false, items: [], note: 'DATABASE_URL not configured — knowledge persistence is off in this environment.' })

  if (op === 'item') {
    const id = Number(sp.get('id'))
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const item = await d.kbGet(id)
    return item ? NextResponse.json({ db: true, item }) : NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  // list (+ latest digest for the page header)
  const [items, digest] = await Promise.all([d.kbList(500), d.kbLatestDigest()])
  return NextResponse.json({ db: true, items, digest })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const action = body.action ?? 'save'
  const d = await db()
  if (!d) return NextResponse.json({ db: false, note: 'DATABASE_URL not configured — output not persisted.' })

  // ── save: every AI output funnels through here ─────────────────────────
  if (action === 'save') {
    const { kind, agency, title, content, model } = body
    if (!kind || !title || !content) return NextResponse.json({ error: 'kind, title, content required' }, { status: 400 })
    const hash = sha(`${kind}|${content}`)
    const emb = await embed(`${title}\n${content}`)
    const id = await d.kbInsert({ kind, agency: (agency ?? 'ALL').toUpperCase(), title: String(title).slice(0, 300),
      content: String(content).slice(0, 24000), model, hash, embedding: emb })
    return NextResponse.json({ ok: true, id, deduped: id === null, embedded: !!emb })
  }

  // ── search: semantic retrieval over the whole store ────────────────────
  if (action === 'search') {
    const q = String(body.query ?? '').trim()
    if (!q) return NextResponse.json({ error: 'query required' }, { status: 400 })
    const qe = await embed(q)
    const rows = await d.kbEmbeddings(1500)
    if (!qe) {  // embedding offline → keyword fallback
      const hits = rows.filter(r => `${r.title} ${r.preview}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
      return NextResponse.json({ ok: true, mode: 'keyword', hits: hits.map(h => ({ ...h, score: null, embedding: undefined })) })
    }
    const qv = JSON.parse(qe) as number[]
    const scored = rows.map(r => {
      let score = 0
      try { score = cosine(qv, JSON.parse(r.embedding as string)) } catch { /* skip */ }
      return { id: r.id, kind: r.kind, agency: r.agency, title: r.title, preview: r.preview, day: r.day, score: Math.round(score * 1000) / 1000 }
    }).sort((a, b) => b.score - a.score).slice(0, 8)
    return NextResponse.json({ ok: true, mode: 'semantic', hits: scored })
  }

  // ── agent: the self-evolving loop ──────────────────────────────────────
  if (action === 'agent') {
    const [recent, lastDigest] = await Promise.all([d.kbRecent(7, 60), d.kbLatestDigest()])
    let newsBlock = ''
    try {
      const news = await d.getLatestNews(12)
      newsBlock = news.map(n => `- [${n.urg}] ${n.headline} — ${n.impact}`).join('\n')
    } catch { /* news table may be empty */ }
    const itemsBlock = recent.map(r => `[#${r.id}] (${r.day} · ${r.kind} · ${r.agency}) ${r.title}\n   ${String(r.excerpt).replace(/\s+/g, ' ').slice(0, 320)}`).join('\n')

    const system = `You are the ANY FED knowledge-loop agent. The portal saves every AI output (daily briefs, analyst answers, model comparisons, document analyses, ML runs) into a knowledge base. Your job each cycle: digest what the application now knows, surface what changed, and direct what to learn next. You are writing for a federal CFO audience — be specific, cite item ids like [#42], use $ figures and deadlines where the items carry them.`
    const user = `PREVIOUS DIGEST (your last cycle${lastDigest ? `, ${(lastDigest as { at: string }).at}` : ' — none, this is cycle 1'}):
${lastDigest ? String((lastDigest as { content: string }).content).slice(0, 2200) : '(first run)'}

KNOWLEDGE ITEMS — LAST 7 DAYS (${recent.length}):
${itemsBlock || '(none yet — instruct the user to generate briefs/analyses so the loop has material)'}

LATEST INTELLIGENCE FEED:
${newsBlock || '(no news rows yet)'}

Produce this cycle's digest:
1. EXECUTIVE SUMMARY — the whole application's current knowledge state in 3-4 sentences, up to date as of today.
2. WHAT CHANGED — vs the previous digest (or "first cycle baseline").
3. TOP INSIGHTS — exactly 5, each citing item ids.
4. KNOWLEDGE GAPS & NEXT ACTIONS — exactly 3, each naming the portal feature to use (Daily Brief, Document Analysis, AI Analyst, ML Workbench) and what to run.
Under 450 words. No preamble. FORMAT: plain text only — no markdown syntax of any kind (no #, ##, **, *, backticks, tables); UPPERCASE section labels, numbered lines.`

    const base = chainFor('best')
    const chain = body.modelId ? [String(body.modelId), ...base.filter(id => id !== body.modelId)] : base
    const { text, modelUsed } = await callChain(chain, system, [{ role: 'user', content: user }], 1200)
    // save the digest back — THIS is the self-evolving step
    const hash = sha(`agent-digest|${text}`)
    const emb = await embed(text)
    const id = await d.kbInsert({ kind: 'agent-digest', agency: 'ALL',
      title: `Knowledge loop digest — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      content: text, model: modelUsed, hash, embedding: emb })
    return NextResponse.json({ ok: true, id, text, modelUsed, itemsDigested: recent.length })
  }

  return NextResponse.json({ error: `unknown action '${action}'` }, { status: 400 })
}
