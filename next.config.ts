import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Never bundle local source data into serverless functions (Vercel 300MB cap).
  // /api/documents reads sourcedata/ at runtime when running locally; on Vercel
  // it gracefully reports the bulk library as local-only.
  outputFileTracingExcludes: {
    '*': [
      './sourcedata/AFR/**',
      './sourcedata/Department of Defense/**',
      './sourcedata/USAspending/**',
      './sourcedata/FEDJOBS/**',
      './sourcedata/FiscalData/financial-report/statement_net_cost/**',
      './sourcedata/FiscalData/financial-report/balance_sheets/**',
      './sourcedata/FiscalData/financial-report/mts_outlays_by_agency_monthly/**',
    ],
  },
  // Allow server-side environment variables to flow through
  env: {
    ANTHROPIC_API_KEY:    process.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_API_KEY:    process.env.GOOGLE_AI_API_KEY,
    GROQ_API_KEY:         process.env.GROQ_API_KEY,
    DATABASE_URL:         process.env.DATABASE_URL,
    CRON_SECRET:          process.env.CRON_SECRET,
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY'    },
        ],
      },
    ]
  },
}

export default nextConfig
