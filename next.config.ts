import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
