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
const PDF_CAP_BYTES = 60 * 1024 * 1024     // PDFs up to 60 MB are extractable
const XLSX_CAP_BYTES = 25 * 1024 * 1024    // workbooks up to 25 MB
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
      analyzable: st.size > 0 && (TEXT_EXT.has(ext)
        || (ext === '.pdf' && st.size <= PDF_CAP_BYTES)
        || ((ext === '.xlsx' || ext === '.xls') && st.size <= XLSX_CAP_BYTES)),
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
    let st
    try { st = await fs.stat(p) } catch { return NextResponse.json({ error: 'file not found' }, { status: 404 }) }

    // ── PDF: server-side text extraction (unpdf / pdf.js) ──────────────────
    if (ext === '.pdf') {
      if (st.size > PDF_CAP_BYTES) {
        return NextResponse.json({ error: `PDF is ${(st.size / 1048576).toFixed(0)} MB — over the ${(PDF_CAP_BYTES / 1048576)} MB extraction cap. Split it or paste the pages you need.` }, { status: 413 })
      }
      try {
        const { extractText, getDocumentProxy } = await import('unpdf')
        const buf = await fs.readFile(p)
        const pdf = await getDocumentProxy(new Uint8Array(buf))
        const { totalPages, text } = await extractText(pdf, { mergePages: true })
        const raw = (text as string).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
        const truncated = raw.length > EXCERPT_CHARS
        return NextResponse.json({
          path: rel, name: path.basename(p), bytes: st.size, truncated, pages: totalPages,
          excerpt: raw.slice(0, EXCERPT_CHARS),
          note: `PDF text extracted (${totalPages} pages${truncated ? `; first ${EXCERPT_CHARS.toLocaleString()} characters analyzed` : ''}). Scanned/image pages yield no text — if the excerpt looks empty, the PDF needs OCR.`,
        })
      } catch (err) {
        return NextResponse.json({ error: `PDF extraction failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
      }
    }

    // ── Excel: SheetJS → CSV text per sheet ────────────────────────────────
    if (ext === '.xlsx' || ext === '.xls') {
      if (st.size > XLSX_CAP_BYTES) {
        return NextResponse.json({ error: `Workbook is ${(st.size / 1048576).toFixed(0)} MB — over the ${(XLSX_CAP_BYTES / 1048576)} MB cap. Export the sheet you need as CSV.` }, { status: 413 })
      }
      try {
        const XLSX = await import('xlsx')
        const buf = await fs.readFile(p)
        const wb = XLSX.read(buf, { type: 'buffer', dense: true })
        const parts: string[] = []
        for (const name of wb.SheetNames.slice(0, 4)) {
          const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name], { blankrows: false })
          parts.push(`=== SHEET: ${name} ===\n${csv.slice(0, Math.ceil(EXCERPT_CHARS / Math.min(wb.SheetNames.length, 4)))}`)
        }
        const textOut = parts.join('\n\n')
        const truncated = textOut.length >= EXCERPT_CHARS || wb.SheetNames.length > 4
        return NextResponse.json({
          path: rel, name: path.basename(p), bytes: st.size, truncated, sheets: wb.SheetNames,
          excerpt: textOut.slice(0, EXCERPT_CHARS),
          note: `Workbook parsed: ${wb.SheetNames.length} sheet(s)${wb.SheetNames.length > 4 ? ', first 4 converted' : ''} — rendered as CSV for analysis.`,
        })
      } catch (err) {
        return NextResponse.json({ error: `Excel parse failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
      }
    }

    if (!TEXT_EXT.has(ext)) {
      return NextResponse.json({ error: `'${ext}' is not analyzable server-side.` }, { status: 415 })
    }
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
