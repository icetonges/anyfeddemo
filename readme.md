# SEC Financial Management Portal

> U.S. Securities and Exchange Commission · Office of Support Operations  
> Business Management and Continuity Branch — CFO Intelligence Portal

**Live:** deploy to Vercel → `https://secdemo.vercel.app/sec-cfo`

## What's Inside

| Page | Description |
|---|---|
| 🏛️ Executive Overview | Budget trajectory, program breakdown, FY2027 strategic priorities |
| ⚡ Budget Execution | ADA risk simulator, object class table, obligation tracking |
| 🔭 Planning & Formulation | FY2028 builder, 3-year framework, A-11 timeline |
| 🎯 Program Analysis | 10-office FTE & obligation analysis, Section 31 fee data |
| 🔍 OIG & Internal Controls | Open findings tracker, PIIA/A-123 control framework |
| 📡 Live Intelligence | GitHub Actions cron → Neon DB → live news feed |
| 🤖 AI FM Analyst | Chain-of-LLMs: Gemini 3.5 Flash → Claude Sonnet → Groq fallback |
| 📚 Guidance Library | ADA · Appropriations Law · OMB A-11 · SEC Funding Mechanism |

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Recharts
- **AI:** Chain-of-LLMs (Gemini 3.5 Flash default → Claude Sonnet → Groq Llama)
- **Database:** Neon serverless PostgreSQL
- **Cron:** GitHub Actions (every 4h weekdays)
- **Hosting:** Vercel with ISR revalidation

## Quick Start

```powershell
npm install
copy .env.example .env.local   # fill in API keys
npm run dev                     # http://localhost:3000
```

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full setup including Vercel env vars and GitHub Actions secrets.

## Data Sources

All budget data sourced from official documents:
- SEC FY2027 Congressional Budget Justification (April 2026)
- OMB Circular A-11 (2025 edition)
- Anti-Deficiency Act 31 U.S.C.§1341
- Consolidated Appropriations Act FY2026 (P.L.119-75)
