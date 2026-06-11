// app/api/documents/route.ts — the ingested-data library.
//   ?op=list           → walk ./sourcedata and inventory every document/dataset
//                        (AFR PDFs, Fiscal Data statements, USAspending archives,
//                        DoD J-books, SEC CBJ, gold reports) with agency tagging
//   ?op=read&p=<rel>   → safe excerpt of a text-format file for AI analysis
// On Vercel the bulk folders are not deployed (.vercelignore) — the API returns
// whatever is present and flags the environment so the UI can explain.
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ROOT = path.join(process.cwd(), 'sourcedata')
const TEXT_EXT = new Set(['.json', '.csv', '.txt', '.md'])
const LIST_EXT = new Set(['.json', '.csv', '.txt', '.md', '.pdf', '.xlsx', '.xls'])
const SKIP_DIRS = new Set(['warehouse', 'node_modules', '.git'])
const MAX_FILES = 1200
const MAX_DEPTH = 7
const EXCERPT_CHARS = 20000
const READ_CAP_BYTES = 512 * 1024          // never read more than 512 KB from disk

interface Doc {
  path: string; name: string; ext: string; bytes: number; mtime: string
  bucket: string; agency: string; analyzable: boolean
}

function bucketOf(rel: string): { bucket: string; agency: string } {
  const seg = rel.split('/')
  const top = seg[0]
  if (top === 'AFR') return { bucket: 'AFR — audited statements', agency: seg[1] ?? 'ALL' }
  if (top === 'FiscalData') return { bucket: 'Treasury Fiscal Data', agency: 'ALL' }
  if (top === 'USAspending') return { bucket: 'USAspending archives', agency: seg.includes('processed') ? (seg[seg.indexOf('processed') + 1] ?? 'ALL').toUpperCase() : 'ALL' }
  if (top === 'Department of Defense') return { bucket: 'DoD folder (J-books · awards · audit)', agency: 'DOD' }
  if (top === 'Security Exchange Commission') return { bucket: 'SEC folder (CBJ)', agency: 'SEC' }
  return { bucket: top, agency: 'ALL' }
}

async function walk(dir: string, rel: string, depth: number, out: Doc[]) {
  if (depth > MAX_DEPTH || out.length >= MAX_FILES) return
  let entries
  try { entries = await fs.readdir(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (out.length >= MAX_FILES) return
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) await walk(path.join(dir, e.name), r, depth + 1, out)
      continue
    }
    const ext = path.extname(e.name).toLowerCase()
    if (!LIST_EXT.has(ext)) continue
    let st
    try { st = await fs.stat(path.join(dir, e.name)) } catch { continue }
    const { bucket, agency } = bucketOf(r)
    out.push({
      path: r, name: e.name, ext, bytes: st.size, mtime: st.mtime.toISOString().slice(0, 10),
      bucket, agency,
      analyzable: TEXT_EXT.has(ext) && st.size > 0,
    })
  }
}

function safeResolve(rel: string): string | null {
  const p = path.resolve(ROOT, rel)
  if (!p.startsWith(path.resolve(ROOT) + path.sep) && p !== path.resolve(ROOT)) return null
  return p
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const op = sp.get('op') ?? 'list'

  if (op === 'list') {
    const docs: Doc[] = []
    await walk(ROOT, '', 0, docs)
    docs.sort((a, b) => a.bucket.localeCompare(b.bucket) || a.path.localeCompare(b.path))
    const buckets = Array.from(new Set(docs.map(d => d.bucket)))
    const agencies = Array.from(new Set(docs.map(d => d.agency))).sort()
    return NextResponse.json({
      root: 'sourcedata/', count: docs.length, truncated: docs.length >= MAX_FILES,
      buckets, agencies, docs,
      note: docs.length === 0
        ? 'No sourcedata/ found in this environment — bulk data is excluded from deployment; run locally (npm run dev) for the full library, or use paste/upload.'
        : undefined,
    })
  }

  if (op === 'read') {
    const rel = sp.get('p') ?? ''
    const p = safeResolve(rel)
    if (!p) return NextResponse.json({ error: 'invalid path' }, { status: 400 })
    const ext = path.extname(p).toLowerCase()
    if (!TEXT_EXT.has(ext)) {
      return NextResponse.json({ error: `'${ext}' is not text-analyzable server-side. For PDFs (e.g. AFRs), copy the relevant pages’ text and use Paste, or analyze the Fiscal Data JSON equivalents.` }, { status: 415 })
    }
    let st
    try { st = await fs.stat(p) } catch { return NextResponse.json({ error: 'file not found' }, { status: 404 }) }
    const fh = await fs.open(p, 'r')
    try {
      const len = Math.min(st.size, READ_CAP_BYTES)
      const buf = Buffer.alloc(len)
      await fh.read(buf, 0, len, 0)
      let text = buf.toString('utf-8')
      const truncated = st.size > READ_CAP_BYTES || text.length > EXCERPT_CHARS
      if (text.length > EXCERPT_CHARS) text = text.slice(0, EXCERPT_CHARS)
      return NextResponse.json({
        path: rel, name: path.basename(p), bytes: st.size, truncated,
        excerpt: text,
        note: truncated ? `Showing the first ${EXCERPT_CHARS.toLocaleString()} characters of ${(st.size / 1024).toFixed(0)} KB — the AI analyzes this excerpt.` : undefined,
      })
    } finally { await fh.close() }
  }

  return NextResponse.json({ error: `unknown op '${op}'` }, { status: 400 })
}
