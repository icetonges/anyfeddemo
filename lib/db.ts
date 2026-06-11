// lib/db.ts — Neon PostgreSQL connection + schema bootstrap
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const sql = neon(process.env.DATABASE_URL)

/** Run once to create tables if they don't exist */
export async function bootstrapSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS sec_news (
      id          SERIAL PRIMARY KEY,
      cat         VARCHAR(100)  NOT NULL,
      urg         VARCHAR(10)   NOT NULL DEFAULT 'MEDIUM',
      headline    TEXT          NOT NULL,
      body        TEXT          NOT NULL DEFAULT '',
      impact      TEXT          NOT NULL DEFAULT '',
      src         VARCHAR(200)  NOT NULL DEFAULT '',
      url         TEXT,
      created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `
  // Add published_at column to existing tables (safe on re-run)
  await sql`
    ALTER TABLE sec_news ADD COLUMN IF NOT EXISTS published_at TEXT
  `
  // Agency tags (comma-separated registry ids, e.g. "DOD,TREAS") — ANY FED scope
  await sql`
    ALTER TABLE sec_news ADD COLUMN IF NOT EXISTS agencies TEXT NOT NULL DEFAULT ''
  `

  // Unique index on headline prevents duplicate entries from repeated cron runs
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_news_headline ON sec_news(headline)
  `

  await sql`
    CREATE TABLE IF NOT EXISTS sec_obligations (
      id            SERIAL PRIMARY KEY,
      fiscal_year   INTEGER NOT NULL,
      fiscal_month  INTEGER NOT NULL,
      object_class  VARCHAR(10) NOT NULL,
      program       VARCHAR(100) NOT NULL,
      obligated     BIGINT NOT NULL DEFAULT 0,
      planned       BIGINT NOT NULL DEFAULT 0,
      recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_obligations_key
      ON sec_obligations(fiscal_year, fiscal_month, object_class, program)
  `
}

/** Fetch latest N news items */
export async function getLatestNews(limit = 20) {
  return sql`
    SELECT id, cat, urg, headline, body, impact, src, url, agencies,
           TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'Mon DD, YYYY HH12:MI AM "ET"') AS fetched_at,
           TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'Dy Mon DD HH12:MI AM "ET"') AS time,
           published_at
    FROM   sec_news
    ORDER  BY created_at DESC
    LIMIT  ${limit}
  `
}

/** Insert a news item, ignore duplicates by headline */
export async function upsertNews(item: {
  cat: string; urg: string; headline: string
  body: string; impact: string; src: string; url?: string
  agencies?: string; published_at?: string
}) {
  await sql`
    INSERT INTO sec_news (cat, urg, headline, body, impact, src, url, agencies, published_at)
    VALUES (${item.cat}, ${item.urg}, ${item.headline},
            ${item.body}, ${item.impact}, ${item.src}, ${item.url ?? null},
            ${item.agencies ?? ''}, ${item.published_at ?? null})
    ON CONFLICT (headline) DO UPDATE SET agencies = EXCLUDED.agencies
      WHERE sec_news.agencies = ''
  `
}

// ═══ Knowledge base — self-evolving store for every AI output ═══════════════
// Each saved item carries a Gemini embedding (JSON float array) so the store
// is semantically searchable; the looping agent reads recent items and writes
// its digest BACK into the store, which is what makes the knowledge evolve.

export async function bootstrapKb() {
  await sql`
    CREATE TABLE IF NOT EXISTS kb_items (
      id          SERIAL PRIMARY KEY,
      kind        VARCHAR(30)  NOT NULL,
      agency      VARCHAR(10)  NOT NULL DEFAULT 'ALL',
      title       TEXT         NOT NULL,
      content     TEXT         NOT NULL,
      model       VARCHAR(120) NOT NULL DEFAULT '',
      hash        VARCHAR(64)  NOT NULL,
      embedding   TEXT,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_kb_hash ON kb_items(hash)`
  // soft-delete target: full row preserved with a deletion timestamp
  await sql`
    CREATE TABLE IF NOT EXISTS kb_items_deleted (
      id          INTEGER PRIMARY KEY,
      kind        VARCHAR(30)  NOT NULL,
      agency      VARCHAR(10)  NOT NULL,
      title       TEXT         NOT NULL,
      content     TEXT         NOT NULL,
      model       VARCHAR(120) NOT NULL DEFAULT '',
      hash        VARCHAR(64)  NOT NULL,
      embedding   TEXT,
      created_at  TIMESTAMPTZ  NOT NULL,
      deleted_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_kb_created ON kb_items(created_at DESC)`
}

export async function kbInsert(item: {
  kind: string; agency: string; title: string; content: string
  model?: string; hash: string; embedding?: string | null
}): Promise<number | null> {
  const rows = await sql`
    INSERT INTO kb_items (kind, agency, title, content, model, hash, embedding)
    VALUES (${item.kind}, ${item.agency}, ${item.title}, ${item.content},
            ${item.model ?? ''}, ${item.hash}, ${item.embedding ?? null})
    ON CONFLICT (hash) DO NOTHING
    RETURNING id
  `
  return rows.length ? (rows[0] as { id: number }).id : null
}

/** newest-first inventory (preview only — full content via kbGet) */
export async function kbList(limit = 500) {
  return sql`
    SELECT id, kind, agency, title, model,
           LEFT(content, 220) AS preview, LENGTH(content) AS chars,
           TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'YYYY-MM-DD') AS day,
           TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'HH12:MI AM') AS time
    FROM kb_items ORDER BY created_at DESC LIMIT ${limit}
  `
}

export async function kbGet(id: number) {
  const rows = await sql`
    SELECT id, kind, agency, title, content, model,
           TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'Mon DD, YYYY HH12:MI AM "ET"') AS saved_at
    FROM kb_items WHERE id = ${id}
  `
  return rows[0] ?? null
}

/** id + embedding pairs for semantic search (small volumes — JS cosine) */
export async function kbEmbeddings(limit = 1500) {
  return sql`
    SELECT id, kind, agency, title, LEFT(content, 220) AS preview, embedding,
           TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'YYYY-MM-DD') AS day
    FROM kb_items WHERE embedding IS NOT NULL
    ORDER BY created_at DESC LIMIT ${limit}
  `
}

/** recent full items for the looping agent's context window */
export async function kbRecent(days = 7, limit = 60) {
  return sql`
    SELECT id, kind, agency, title, LEFT(content, 500) AS excerpt,
           TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'YYYY-MM-DD') AS day
    FROM kb_items
    WHERE created_at > NOW() - make_interval(days => ${days})
    ORDER BY created_at DESC LIMIT ${limit}
  `
}

/** the most recent agent digest (continuity for the loop) */
export async function kbLatestDigest() {
  const rows = await sql`
    SELECT id, title, content, TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'Mon DD HH12:MI AM') AS at
    FROM kb_items WHERE kind = 'agent-digest' ORDER BY created_at DESC LIMIT 1
  `
  return rows[0] ?? null
}

/** soft delete: move the row into kb_items_deleted, then remove it */
export async function kbDelete(id: number): Promise<boolean> {
  const moved = await sql`
    INSERT INTO kb_items_deleted (id, kind, agency, title, content, model, hash, embedding, created_at)
    SELECT id, kind, agency, title, content, model, hash, embedding, created_at
    FROM kb_items WHERE id = ${id}
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `
  await sql`DELETE FROM kb_items WHERE id = ${id}`
  return moved.length > 0
}
