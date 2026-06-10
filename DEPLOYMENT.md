# SEC Financial Management Portal — Full Deployment Guide

**Stack:** Next.js 15 · React 19 · TypeScript · Vercel · Neon PostgreSQL · GitHub Actions  
**Repo path:** `C:\Users\Peter-HP\git\secdemo`  
**Live URL:** `https://secdemo.vercel.app` (or your custom Vercel domain)

---

## Table of Contents

1. [Local Setup](#1-local-setup)
2. [Neon Database](#2-neon-database)
3. [API Keys](#3-api-keys)
4. [Vercel Deployment](#4-vercel-deployment)
5. [Vercel Environment Variables](#5-vercel-environment-variables)
6. [GitHub Repository Secrets](#6-github-repository-secrets)
7. [GitHub Actions Cron](#7-github-actions-cron)
8. [Verify Everything Works](#8-verify-everything-works)
9. [File Structure](#9-file-structure)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Local Setup

```powershell
# Open PowerShell or VS Code terminal

# 1a — Navigate to repo
cd C:\Users\Peter-HP\git\secdemo

# 1b — Install dependencies
npm install

# 1c — Copy env template
copy .env.example .env.local
# Then open .env.local in VS Code and fill in values (see Section 3)

# 1d — Run dev server
npm run dev
# Open http://localhost:3000 — should redirect to /sec-cfo
```

---

## 2. Neon Database

Neon is a serverless Postgres DB. Free tier is enough.

### Create Neon Project

1. Go to **https://neon.tech** → Sign up with GitHub
2. Click **New Project** → Name it `secdemo` → Region: `US East (Ohio)`
3. Click **Create Project**

### Get Connection String

1. From the Neon dashboard → your project → **Connection Details**
2. Select the `.env` tab
3. Copy the value next to `DATABASE_URL=`  
   It looks like:  
   `postgresql://username:password@ep-xxx-yyy.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Paste into `.env.local` as `DATABASE_URL=...`

### DB Schema (auto-created)

Tables are created automatically on first cron run via `bootstrapSchema()`.  
You can also trigger it manually:

```powershell
# From repo root
npx ts-node --project tsconfig.scripts.json --transpile-only scripts/fetch-intelligence.ts
```

---

## 3. API Keys

### Anthropic (Claude)
1. Go to **https://console.anthropic.com** → API Keys → Create Key
2. Copy the key → paste as `ANTHROPIC_API_KEY=sk-ant-...`

### Google AI Studio (Gemini)
1. Go to **https://aistudio.google.com** → Get API Key
2. Copy → paste as `GOOGLE_AI_API_KEY=AIza...`

### Groq
1. Go to **https://console.groq.com** → API Keys → Create
2. Copy → paste as `GROQ_API_KEY=gsk_...`

### CRON_SECRET
Generate any random string (32+ chars). Used to authenticate GitHub Actions → Vercel calls.

```powershell
# PowerShell — generate a random secret
-join ((48..57 + 65..90 + 97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 4. Vercel Deployment

### First Deploy

```powershell
# Install Vercel CLI (once)
npm install -g vercel

# From repo root
cd C:\Users\Peter-HP\git\secdemo

# Deploy (follow prompts)
vercel

# When asked:
#   Set up and deploy?         → Y
#   Which scope?               → your personal account
#   Link to existing project?  → N
#   Project name?              → secdemo
#   In which directory?        → ./   (press Enter)
#   Override settings?         → N

# First deploy URL will be printed, e.g.:
#   https://secdemo-abc123.vercel.app
```

### Subsequent Deploys

```powershell
# Production deploy
vercel --prod

# Or just push to GitHub main branch (auto-deploys if connected)
git push origin main
```

### Connect GitHub Repo for Auto-Deploy

1. Go to **https://vercel.com/dashboard**
2. Find your `secdemo` project → **Settings** → **Git**
3. Click **Connect Git Repository**
4. Authorize GitHub → select `Peter-HP/secdemo` (or your repo name)
5. Branch: `main` → Save  
   → Every `git push origin main` now auto-deploys

---

## 5. Vercel Environment Variables

**Critical:** These must be set in Vercel, not just `.env.local`.  
`.env.local` is only for local dev and is never deployed.

### How to Add

1. Go to **https://vercel.com/dashboard** → `secdemo` project
2. Click **Settings** → **Environment Variables**
3. For each variable below: enter Name, Value, select **Production + Preview + Development** → **Save**

### Required Variables

| Variable Name | Where to get the value | Environments |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Production, Preview |
| `GOOGLE_AI_API_KEY` | aistudio.google.com → Get API Key | Production, Preview |
| `GROQ_API_KEY` | console.groq.com → API Keys | Production, Preview |
| `DATABASE_URL` | neon.tech → your project → Connection Details | Production, Preview |
| `CRON_SECRET` | Random 32-char string you generated | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL e.g. `https://secdemo.vercel.app` | Production |

### Verify After Adding

```powershell
# Check env vars are live
curl https://secdemo.vercel.app/api/health
# Expected response:
# {"status":"ok","checks":{"anthropic":true,"google":true,"groq":true,"database":true},...}
```

---

## 6. GitHub Repository Secrets

GitHub Actions needs the same secrets to run the intelligence cron.

### How to Add

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

| Secret Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Same as Vercel |
| `GOOGLE_AI_API_KEY` | Same as Vercel |
| `GROQ_API_KEY` | Same as Vercel |
| `DATABASE_URL` | Same as Vercel |
| `CRON_SECRET` | Same as Vercel |
| `NEXT_PUBLIC_APP_URL` | `https://secdemo.vercel.app` (your live URL) |

---

## 7. GitHub Actions Cron

The workflow at `.github/workflows/intelligence-update.yml` runs automatically once pushed.

### Schedule

```
0 11,15,19,23,1 * * 1-5
```
= Every 4 hours at 11:00, 15:00, 19:00, 23:00, 01:00 UTC on Monday–Friday  
= Approximately 07:00, 11:00, 15:00, 19:00, 21:00 ET

### Manual Trigger

1. GitHub repo → **Actions** tab
2. Select **SEC Intelligence Update** from the left sidebar
3. Click **Run workflow** → **Run workflow**  
   Optional: check "Enable debug logging" to see detailed output

### Monitor Runs

- GitHub → Actions → **SEC Intelligence Update** → click a run
- Each step shows ✅ or ❌ with full logs
- Job summary shows timestamp + status

---

## 8. Verify Everything Works

Run these checks in order after deploying:

```powershell
# Replace with your actual Vercel URL
$BASE = "https://secdemo.vercel.app"

# 1. Health check — all providers connected
curl "$BASE/api/health"

# 2. News feed — returns seed data or DB data
curl "$BASE/api/news-feed"

# 3. AI chat — chain-of-LLMs working
curl -X POST "$BASE/api/ai-chat" `
  -H "Content-Type: application/json" `
  -d '{"messages":[{"role":"user","content":"What is the SEC FY2027 budget request?"}],"task":"value"}'

# 4. Main portal loads
# Open in browser: https://secdemo.vercel.app/sec-cfo
```

### Expected Results

| Endpoint | Expected |
|---|---|
| `/api/health` | `{"status":"ok","checks":{"anthropic":true,...}}` |
| `/api/news-feed` | `{"news":[...],"source":"seed"}` (seed) or `"source":"db"` after first cron |
| `/api/ai-chat` | `{"text":"...","modelUsed":"gemini-3.5-flash"}` |
| `/sec-cfo` | Full 8-page portal loads in browser |

---

## 9. File Structure

```
secdemo/
│
├── app/                              Next.js App Router
│   ├── layout.tsx                    Root layout — IBM Plex fonts
│   ├── page.tsx                      Redirects / → /sec-cfo
│   ├── globals.css                   Global styles
│   ├── sec-cfo/
│   │   └── page.tsx                  Portal page (ISR revalidate: 4h)
│   └── api/
│       ├── ai-chat/route.ts          POST — chain-of-LLMs chat endpoint
│       ├── news-feed/route.ts        GET/POST — news from Neon DB
│       └── health/route.ts           GET — liveness check
│
├── components/sec/
│   └── SECFinancialPortal.tsx        8-page portal (1,436 lines)
│
├── lib/
│   ├── models.ts                     LLM model registry + chainFor()
│   ├── llm-chain.ts                  Chain-of-LLMs router (Groq/Gemini/Claude)
│   ├── db.ts                         Neon PostgreSQL client
│   └── sec-data.ts                   Budget constants (CBJ FY2027)
│
├── types/
│   └── index.ts                      Shared TypeScript interfaces
│
├── scripts/
│   └── fetch-intelligence.ts         Run by GitHub Actions cron
│
├── public/
│   └── robots.txt
│
├── .github/workflows/
│   └── intelligence-update.yml       Cron: every 4h weekdays
│
├── .env.example                      Safe to commit — no values
├── .env.local                        Local dev — DO NOT COMMIT
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── tsconfig.scripts.json
```

---

## 10. Troubleshooting

### Build fails: "Cannot find module '@neondatabase/serverless'"
```powershell
npm install
```

### `/api/health` shows `"database": false`
- Check `DATABASE_URL` is set in Vercel Environment Variables
- Ensure Neon project is in `us-east-2` (or update the URL region)
- Verify the connection string ends with `?sslmode=require`

### AI chat returns 500
- Check all three API keys (`ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `GROQ_API_KEY`) are set
- The chain tries Gemini → Claude → Groq in order; only one needs to work
- Check Vercel function logs: Vercel dashboard → your project → **Functions** tab

### GitHub Actions cron not firing
- Actions must be enabled: GitHub repo → **Settings** → **Actions** → **Allow all actions**
- Secrets must be set (Section 6)
- First cron fires on the schedule; use **Run workflow** to trigger manually immediately

### News feed shows only seed data
- Run the cron manually (Section 7) to populate the DB
- Check `DATABASE_URL` is set as a GitHub Secret (not just Vercel env var)
- Check cron job logs in GitHub → Actions

### TypeScript errors in VS Code
```powershell
npm run type-check
```
Most errors resolve after `npm install` completes.

---

## Quick Reference — Commands

```powershell
npm run dev          # Local dev server → http://localhost:3000
npm run build        # Production build (test before deploying)
npm run type-check   # TypeScript check without building
vercel               # Deploy preview
vercel --prod        # Deploy to production
```

---

*Sources: SEC FY2027 CBJ (April 2026) · OMB Circular A-11 · ADA 31 U.S.C.§1341 · Consolidated Appropriations Act FY2026 (P.L.119-75)*
