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
    SELECT id, cat, urg, headline, body, impact, src, url,
           TO_CHAR(created_at, 'Dy Mon DD HH24:MI') AS time
    FROM   sec_news
    ORDER  BY created_at DESC
    LIMIT  ${limit}
  `
}

/** Insert a news item, ignore duplicates by headline */
export async function upsertNews(item: {
  cat: string; urg: string; headline: string
  body: string; impact: string; src: string; url?: string
}) {
  await sql`
    INSERT INTO sec_news (cat, urg, headline, body, impact, src, url)
    VALUES (${item.cat}, ${item.urg}, ${item.headline},
            ${item.body}, ${item.impact}, ${item.src}, ${item.url ?? null})
    ON CONFLICT (headline) DO NOTHING
  `
}
