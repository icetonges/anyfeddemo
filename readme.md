# ANY FED — Federal Financial Management Portal

> Any-agency FM showcase: budget lifecycle, accounting, audit, finance operations,
> internal controls, contracts & acquisition, and a real-computation AI/ML workbench.
> Built on the SEC CFO portal foundation — the legacy portal remains at `/sec-cfo`.

**Live:** deploy to Vercel → `/anyfed` (root redirects there)

## What's Inside

| Module | Description |
|---|---|
| 🏛️ Executive Overview | Per-agency topline: DoD J-book exhibits, SEC CBJ, or live USAspending |
| 📊 Budget Lifecycle | Formulation · Enactment · Execution (A-11 end-to-end), exhibit drilldowns, obligation flow |
| 📒 Accounting | USSGL chart & posting logic, JE quality gates, FBwT reconciliation, GTAS |
| 🔍 Audit | DODIG-2026-032 — all 26 material weaknesses, FIAR methodology, guidance library |
| 💳 Finance Operations | DTS travel, GTC travel card, GPC purchase card programs & integrity hooks |
| 🛡️ Internal Controls | OMB A-123 control matrix, deficiency ladder, continuous monitoring |
| 📄 Contracts & Acquisition | USAspending prime transactions — recipients, types, NAICS, sub-agencies |
| 🤖 AI/ML Workbench | DataRobot-style blueprints computed live in-browser: Holt/OLS forecasting, robust-Z anomalies, Benford's Law, k-means, risk scoring |
| 💬 AI FM Analyst | Chain-of-LLMs (Gemini → Claude → Groq) with agency-aware system prompts |

## Data Architecture

1. **Default source — `sourcedata/` folder.** Drop agency folders in; run the ETL:
   ```powershell
   python scripts/etl_sourcedata.py    # → lib/data/*.json (bundled at build)
   ```
   Currently loaded: **DoD** (FY2026/FY2027 PB exhibit books M-1/O-1/P-1/R-1/RF-1,
   USAspending CSV extracts, FY2025 AFR + DODIG audit PDFs) and **SEC** (FY2025–FY2027 CBJs).
2. **Fallback — live USAspending.gov.** Every other department/agency in the dropdown
   pulls budgetary resources, obligation rates, and award obligations live
   (`/api/agency-data`), no key required.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Recharts (unchanged from secosodemo)
- **AI:** Chain-of-LLMs — Gemini default → Claude Sonnet → Groq Llama fallback (unchanged)
- **ML:** `lib/ml/engine.ts` — pure-TS real computation (no canned outputs)
- **Database:** Neon serverless PostgreSQL (news feed) · **Cron:** GitHub Actions
- **Hosting:** Vercel with ISR revalidation

## Quick Start

```powershell
npm install
copy .env.example .env.local        # fill in API keys
python scripts/etl_sourcedata.py    # parse sourcedata/ → lib/data/
npm run dev                          # http://localhost:3000 → /anyfed
```

## Routes

| Route | Page |
|---|---|
| `/` | redirects to `/anyfed` |
| `/anyfed` | ANY FED portal (agency dropdown: DoD default) |
| `/sec-cfo` | Legacy SEC CFO Intelligence Portal (kept intact) |
| `/api/agency-data` | folder-bundle + USAspending fallback API |
| `/api/ai-chat` | chain-of-LLMs analyst (agency-aware) |
