// app/api/health/route.ts — simple liveness check for GitHub Actions + monitoring
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, boolean> = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google:    !!process.env.GOOGLE_AI_API_KEY,
    groq:      !!process.env.GROQ_API_KEY,
    database:  !!process.env.DATABASE_URL,
  }

  const allOk = Object.values(checks).every(Boolean)

  return NextResponse.json(
    {
      status:    allOk ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
      version:   process.env.npm_package_version ?? '0.1.0',
    },
    { status: allOk ? 200 : 207 },
  )
}
