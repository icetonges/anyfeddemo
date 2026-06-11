"use client"
// components/anyfed/AboutApp.tsx — the job aid: how this portal is built, how
// it works, and how to use it. Two audiences (developer · operations), six
// tabs, visual diagrams, and step-by-step procedures you can follow alone.
import { useState } from "react"
import { useTheme, Card, SectionTitle, Badge } from "./ui"

const TABS = ["What This Is", "Architecture (Dev)", "Build It Yourself (Dev)", "Data Pipeline", "Loop Agent (AI)", "User Guide (Ops)", "Troubleshooting"] as const
type Tab = typeof TABS[number]

// ── content data ─────────────────────────────────────────────────────────────
const PAGES: [string, string, string][] = [
  ["🏛️ Executive Overview", "Decision-grade posture: clickable KPIs, CFO decision queue, action items", "Start every session here; brief leadership from it"],
  ["🧠 Data Intelligence", "Profile/compare/drill every dataset; UoT linkage thread; quality scoring", "When you need to understand or defend the DATA itself"],
  ["🗂️ Data Explorer", "Deep J-book explorer (DoD), live drill (all agencies), Acquire + Runbook + Catalog", "Line-item analysis and data acquisition"],
  ["📊 Budget Management", "Briefing + three-world cross-check (J-book × GTAS × awards) + exports", "Budget formulation/execution analysis and briefings"],
  ["📒 Accounting", "AUDITED Statements of Net Cost by agency/year (Fiscal Data) + disconnect analysis + Statement Builder + USSGL reference", "Statements, accrual-vs-budgetary analysis, USSGL lookups"],
  ["🔍 Audit", "26 MWs, 8 deep dives: components → Advana solution → plan → live pipeline demo", "Audit remediation strategy and demonstrations"],
  ["💳 Finance Operations", "DTS/GTC/GPC program reference and KPIs", "Travel/charge-card program questions"],
  ["🛡️ Internal Controls", "A-123 control catalog", "Control design and testing reference"],
  ["📄 Contracts & Acquisition", "Award-data views", "Vendor/contract questions"],
  ["🤖 AI/ML Workbench", "DataRobot-style: pick data → run real models → leaderboard", "Benford, anomalies, risk scoring, forecasting"],
  ["💬 AI FM Analyst", "Chat over the loaded context (Gemini → Groq → Claude) · model arena + judge", "Free-form questions; needs API keys"],
  ["📑 Document Analysis", "Pick a library document (PDF/Excel/JSON/CSV) → chain of AI actions", "Summaries, figure extraction, compliance scans of real documents"],
  ["📰 Daily Brief", "Live agency-tagged FM intelligence + AI executive brief", "Morning situational awareness; brief leadership"],
  ["🧬 Knowledge Base", "Every AI output saved + embedded · looping agent digest · semantic search", "Retrieve anything the portal ever produced; app-wide summary"],
]

const STACK = [
  ["BROWSER", "#0ea5e9", "React 19 client components · recharts charts · in-memory data cache (useAgencyData) · mouse-follow agent (AgentProvider) · dark/light theme context"],
  ["NEXT.JS 15 (App Router, Vercel)", "#10b981", "API routes: /api/agency-data (bundled JSON + live USAspending + detail slice) · /api/acquire (pull & store) · /api/ai-chat (LLM chain) · /api/data-insight"],
  ["DATA TIER", "#f59e0b", "① bundled JSON (lib/data/*, built by ETL from sourcedata/) · ② live api.usaspending.gov (nightly-refreshed) · ③ DuckDB+Parquet lakehouse (offline, multi-GB archives)"],
  ["AI TIER", "#a78bfa", "lib/ml/engine.ts — real in-browser models (Benford, robust-z, k-means, Holt) · lib/llm-chain.ts — Gemini → Groq → Claude fallback (server-side keys)"],
]

const FILES: [string, string][] = [
  ["app/anyfed/page.tsx + app/page.tsx", "entry → renders AnyFedPortal"],
  ["app/api/agency-data/route.ts", "THE data endpoint: bundled slices + live USAspending + detail (5 endpoints)"],
  ["app/api/acquire/route.ts", "data acquisition: pull → auto-foldered store or download payload"],
  ["components/anyfed/AnyFedPortal.tsx", "shell: nav, agency selector, theme, provenance footer"],
  ["components/anyfed/ui.tsx", "design system: DARK/LIGHT palettes, Card/KPI/Badge/Row/Spinner"],
  ["components/anyfed/useAgencyData.ts", "data hook with cache + ALL shared TypeScript shapes"],
  ["components/anyfed/agent.tsx", "reusable mouse-follow AI agent (AgentProvider + agentProps)"],
  ["lib/agencies.ts", "the 28-agency registry (id, toptier code, funding model)"],
  ["lib/agency-profiles.ts", "mission/footprint/FM landscape + budget briefings per agency"],
  ["lib/data-insights.ts · live-insights.ts", "deterministic analysis engines (J-book · live GTAS)"],
  ["lib/audit-solutions.ts · demo-pipeline.ts", "MW deep-dive content · live-demo pipeline engine"],
  ["lib/ml/engine.ts · registry.ts", "the real ML models + blueprint catalog"],
  ["lib/llm-chain.ts · models.ts", "LLM fallback chain Gemini → Groq → Claude"],
  ["scripts/etl_sourcedata.py", "J-book xlsx + award CSVs → lib/data/*.json (bundled slices)"],
  ["scripts/usaspending_duck.py", "DuckDB lakehouse: build / gold / sql / status"],
  ["scripts/usaspending_coverage.py", "coverage scan + API gap fill"],
  ["scripts/fiscaldata_statements.py", "audited FR statements (SNC by agency, Balance Sheet) → folder + DuckDB"],
  ["sourcedata/", "all source data (J-books, audit PDFs, USAspending tree) — bulk git-ignored"],
]

const BUILD_STEPS: [string, string[]][] = [
  ["1 · Prerequisites (10 min)", [
    "Install Node.js 20+ (node -v to check), Python 3.9+ (python --version), and git.",
    "Optional for AI narration: API keys for Google AI, Groq, Anthropic.",
    "Optional for the lakehouse: pip install duckdb"]],
  ["2 · Get the code (2 min)", [
    "git clone <your-repo-url> anyfeddemo && cd anyfeddemo",
    "npm install   — installs Next 15, React 19, recharts, AI SDKs"]],
  ["3 · Environment variables (optional, 3 min)", [
    "Create .env.local in the repo root (never commit it):",
    "GOOGLE_AI_API_KEY=…  GROQ_API_KEY=…  ANTHROPIC_API_KEY=…",
    "Without keys everything works except LLM narration/chat — deterministic analytics never need keys."]],
  ["4 · Source data layout (5 min)", [
    "sourcedata/Department of Defense/dod_1/FY2026 + FY2027 → the -1 exhibit xlsx files",
    "sourcedata/Department of Defense/USASPENDING/ → award CSV extracts",
    "sourcedata/Department of Defense/audit/ → AFR + DODIG PDFs",
    "sourcedata/USAspending/ → bulk archives tree (see its README.md)"]],
  ["5 · Run the ETL (2 min)", [
    "python scripts/etl_sourcedata.py   — parses xlsx/CSV → lib/data/dod_budget.json, dod_awards.json",
    "Re-run whenever files in sourcedata/ change; outputs are committed (small)."]],
  ["6 · Run locally (1 min)", [
    "npm run dev → http://localhost:3000",
    "Local mode = full power: Acquire auto-store writes permanently into sourcedata/."]],
  ["7 · Build the lakehouse (optional, minutes)", [
    "python scripts/usaspending_duck.py build      — archives → silver Parquet",
    "python scripts/usaspending_duck.py gold --agency 097 --fy 2026",
    "python scripts/usaspending_coverage.py scan   — what's held vs missing"]],
  ["8 · Deploy to Vercel (10 min)", [
    "Push to GitHub (bulk data is git-ignored — keep it that way; 100MB hard limit).",
    "vercel.com → Import repo → add the three API keys as Environment Variables → Deploy.",
    "Serverless note: auto-store falls back to ephemeral /tmp; use local download there."]],
  ["9 · Add a new agency (15 min)", [
    "lib/agencies.ts → add one row (id, name, toptier code from USAspending, funding model).",
    "Done — every live page lights up automatically via the detail slice.",
    "Optional depth: add a profile in lib/agency-profiles.ts; drop CBJ files in sourcedata/<Agency>/ and extend the ETL."]],
  ["10 · Add a new page (20 min)", [
    "Create components/anyfed/MyPage.tsx — export default function MyPage({ agency }) using Card/KPI from ./ui.",
    "AnyFedPortal.tsx → add NAV entry { id:'mypage', label:'…', icon:'…' } + render line in content.",
    "PageProvenance.tsx → add the page's data-source map entry.",
    "npm run lint && npx tsc --noEmit — both must pass before commit."]],
]

const PIPELINE = [
  ["📥 ACQUIRE", "Acquire panel (API pulls) · Download Center GUI (bulk archives, File A/B/C)", "#0ea5e9"],
  ["📁 BRONZE", "sourcedata/ — raw files as landed, git-ignored, never edited", "#64748b"],
  ["⚙️ ETL / BUILD", "etl_sourcedata.py → bundled JSON · usaspending_duck.py build → silver Parquet", "#f59e0b"],
  ["🏆 GOLD", "lib/data/*.json (committed) · processed/<agency>/FY/analysis_report.json", "#10b981"],
  ["📊 PORTAL", "pages read gold JSON + live API; exports (JSON/CSV/PDF) leave from here", "#a78bfa"],
]

const RECIPES: [string, string[]][] = [
  ["Brief FY2026 DoD posture in 5 minutes", [
    "Executive Overview → read the 8 KPIs (click Execution Variance for the lifecycle drill)",
    "Note the Decision Queue cards — each states the decision, not just the number",
    "Budget Management → Budget Intelligence → export the Excel cross-check for the meeting"]],
  ["Answer 'who is getting the money?'", [
    "Data Explorer (DoD) → drag P-1 onto the canvas → Pivot & Compare → group by Organization",
    "Or any agency: Data Intelligence → Drill-down → Sub-agency tab → expand to offices",
    "Award names: Budget Management → Award World strip (top recipient/sub-agency)"]],
  ["Prove a number (UoT thread)", [
    "Data Intelligence → section 6 Cross-Dataset Linkage → click through the 5 stages",
    "Each arrow shows the join key; the worked example uses your real archive data",
    "For the audit framing: Audit → MW #7 → Live Demo → Run solution pipeline"]],
  ["Run an audit demonstration for stakeholders", [
    "Audit → click MW #7 (or #15 for payment risk) → walk the 6 tabs in order",
    "Finish on Live Demo → ▶ Run solution pipeline — 5 stages animate with real numbers",
    "The evidence artifact (stage 4) is the screenshot-worthy closer"]],
  ["Pull this week's freshest data", [
    "Data Explorer → Acquire Data → keep defaults (current FY, contract+assistance) → Download to my computer",
    "Monthly deep refresh: run the Task Scheduler one-liner in the Data Operations Runbook"]],
]

const TROUBLE: [string, string][] = [
  ["A page shows 'Live fetch failed' or empty live data", "USAspending may not publish that FY for that agency yet — switch the FY selector back a year. The API itself refreshes nightly; brand-new FYs populate gradually."],
  ["Acquire says SAVED (EPHEMERAL)", "You're on the Vercel deploy — serverless storage is temporary by design. Use 💾 Download to my computer, or run locally (npm run dev) for permanent sourcedata/ writes."],
  ["AI Analyst / narration says offline", "No API keys in the environment. Add GOOGLE_AI_API_KEY / GROQ_API_KEY / ANTHROPIC_API_KEY to .env.local (local) or Vercel env vars (deploy). Everything else works without them."],
  ["GitHub refuses to push ('files too large')", "Never commit files >100MB. The .gitignore already excludes sourcedata bulk trees — if a big file slipped in, remove it from the commit (git rm --cached <file>) before pushing."],
  ["Git says 'lock file exists'", "A git operation was interrupted. Close git clients, delete .git/index.lock, retry."],
  ["New sourcedata files don't show in the portal", "Bundled pages read lib/data/*.json — re-run python scripts/etl_sourcedata.py, then redeploy/restart. Live pages need no rebuild."],
  ["Where do I see what data a page uses?", "Every page has a DATA PROVENANCE footer at the bottom listing its exact files, folders, and endpoints."],
  ["Numbers differ between pages", "Different worlds by design: J-book (plan) vs GTAS (account execution) vs awards (who got it). Budget Management → Budget Intelligence explains and reconciles them."],
]

export default function AboutApp() {
  const C = useTheme()
  const [tab, setTab] = useState<Tab>("What This Is")
  return (
    <div>
      <SectionTitle title="About This App — Job Aid"
        sub="How it's built (developer), how it works (architecture & pipeline), and how to use it (operations) — step-by-step, so you can replicate and operate it alone." />
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:"8px 15px", borderRadius:8, fontSize:14.5, fontWeight: tab === t ? 700 : 500, cursor:"pointer",
                     border:`1px solid ${tab === t ? C.borderAccent : C.border}`, background: tab === t ? `${C.blue}1f` : C.card,
                     color: tab === t ? C.blue : C.muted }}>{t}</button>
        ))}
      </div>

      {tab === "What This Is" && (
        <>
          <Card title="ANY FED — Federal Financial Management Portal" sub="One portal, every agency, three data worlds">
            <div style={{ fontSize:15.5, color:C.textSub, lineHeight:1.75, marginBottom:12 }}>
              A production-pattern showcase for federal FM: budget formulation→enactment→execution, accounting, audit
              remediation, finance operations, internal controls, and acquisition — powered by real data (DoD J-books,
              SEC CBJ, USAspending bulk archives, live GTAS API) and real models (Benford, anomaly, risk, forecasting)
              computed in your browser, narrated by an AI chain (Gemini → Groq → Claude). Default agency: DoD (folder
              data); all 28 registry agencies work live.
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["Next.js 15", "React 19", "TypeScript", "recharts", "DuckDB + Parquet", "Python ETL", "USAspending API", "Vercel"].map(t =>
                <Badge key={t} color={C.cyan}>{t}</Badge>)}
            </div>
          </Card>
          <div style={{ height:14 }} />
          <Card title="Capability map — the 14 pages" sub="What each page does and when to reach for it">
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14, minWidth:680 }}>
                <thead><tr style={{ color:C.muted, textAlign:"left" }}>
                  {["Page", "What it does", "When to use it"].map(h => <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
                </tr></thead>
                <tbody>{PAGES.map((p, i) => (
                  <tr key={i}>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:600, whiteSpace:"nowrap" }}>{p[0]}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, lineHeight:1.5 }}>{p[1]}</td>
                    <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.muted, lineHeight:1.5 }}>{p[2]}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "Architecture (Dev)" && (
        <>
          <Card title="System diagram — four layers" sub="Request flow: browser → Next.js API routes → data tier; AI runs in-browser (models) and server-side (LLM chain)">
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {STACK.map(([t, col, d], i) => (
                <div key={t}>
                  <div style={{ background:`${col}14`, border:`2px solid ${col}`, borderRadius:10, padding:"10px 14px" }}>
                    <div style={{ fontSize:14.5, fontWeight:800, color:col, letterSpacing:"0.05em", marginBottom:4 }}>{t}</div>
                    <div style={{ fontSize:13.5, color:C.textSub, lineHeight:1.6 }}>{d}</div>
                  </div>
                  {i < STACK.length - 1 && <div style={{ textAlign:"center", color:C.muted, fontSize:15, lineHeight:1 }}>▼</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.65, marginTop:10 }}>
              Key patterns: <b style={{ color:C.text }}>useAgencyData(agency, slice, extra)</b> caches every fetch in-memory per key;
              <b style={{ color:C.text }}> AgentProvider + agentProps()</b> makes any element explain itself on hover;
              <b style={{ color:C.text }}> ThemeContext</b> (DARK/LIGHT in ui.tsx) drives all colors — never hardcode hex in components.
            </div>
          </Card>
          <div style={{ height:14 }} />
          <Card title="File map — where everything lives" sub="The files you'll actually touch, one line each">
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {FILES.map(([f, d], i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"baseline", fontSize:13.5, flexWrap:"wrap", padding:"4px 0", borderBottom:`1px solid ${C.border}` }}>
                  <code style={{ color:C.cyan, fontSize:13, minWidth:300 }}>{f}</code>
                  <span style={{ color:C.textSub, lineHeight:1.5, flex:1 }}>{d}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === "Build It Yourself (Dev)" && (
        <Card title="Replication guide — zero to deployed in ~1 hour" sub="Follow the steps in order; every command is exact. Steps 3, 7 are optional.">
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {BUILD_STEPS.map(([t, items], i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`4px solid ${C.blue}`, borderRadius:9, padding:"11px 14px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{t}</div>
                {items.map((it, j) => (
                  <div key={j} style={{ display:"flex", gap:8, fontSize:13.5, lineHeight:1.65, marginBottom:3 }}>
                    <span style={{ color:C.blue }}>▸</span>
                    <span style={{ color: /^(git|npm|python|vercel|GOOGLE|pip|node)/.test(it) ? C.cyan : C.textSub,
                                   fontFamily: /^(git|npm|python|vercel|GOOGLE|pip|node)/.test(it) ? "var(--font-mono)" : "inherit",
                                   fontSize: /^(git|npm|python|vercel|GOOGLE|pip|node)/.test(it) ? 12.5 : 13.5 }}>{it}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Data Pipeline" && (
        <>
          <Card title="The five-stage flow" sub="Every byte in the portal travels this path — same stages as the Acquire stepper">
            <div style={{ display:"flex", alignItems:"stretch", gap:0, overflowX:"auto", paddingBottom:4 }}>
              {PIPELINE.map(([t, d, col], i) => (
                <div key={t} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                  <div style={{ width:200, background:`${col}14`, border:`2px solid ${col}`, borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:col, marginBottom:4 }}>{t}</div>
                    <div style={{ fontSize:12.5, color:C.textSub, lineHeight:1.55 }}>{d}</div>
                  </div>
                  {i < PIPELINE.length - 1 && <span style={{ color:C.muted, padding:"0 6px", fontSize:16 }}>→</span>}
                </div>
              ))}
            </div>
          </Card>
          <div style={{ height:14 }} />
          <Card title="Script reference" sub="The four Python tools — command, input, output, cadence">
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5, minWidth:720 }}>
                <thead><tr style={{ color:C.muted, textAlign:"left" }}>
                  {["Script", "Command", "Input → Output", "When"].map(h => <th key={h} style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {([["etl_sourcedata.py", "python scripts/etl_sourcedata.py", "J-book xlsx + award CSVs → lib/data/*.json", "after any sourcedata change"],
                     ["usaspending_duck.py", "build · gold --agency 097 --fy 2026 · sql · status", "bulk archives → silver Parquet → gold report", "monthly, after archive downloads"],
                     ["usaspending_coverage.py", "scan · fill", "folder tree → coverage_manifest.json; API → gtas JSON", "monthly, before downloads"],
                     ["fiscaldata_statements.py", "python scripts/fiscaldata_statements.py all", "Fiscal Data API → audited FR statements → sourcedata/FiscalData/ + DuckDB fr_* tables", "annually, after each FR release (~Feb)"],
                     ["usaspending_pipeline.py", "python scripts/usaspending_pipeline.py --agency 097 --fy 2026", "stdlib fallback if DuckDB unavailable", "rarely"]] as const)
                    .map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:600, fontFamily:"var(--font-mono)", fontSize:12.5 }}>{r[0]}</td>
                      <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}`, color:C.cyan, fontFamily:"var(--font-mono)", fontSize:12 }}>{r[1]}</td>
                      <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}`, color:C.textSub, lineHeight:1.5 }}>{r[2]}</td>
                      <td style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}`, color:C.muted }}>{r[3]}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize:13.5, color:C.muted, marginTop:10, lineHeight:1.6 }}>
              Full cadence table, coverage matrix, and the monthly Task-Scheduler one-liner live in
              <b style={{ color:C.text }}> Data Explorer → Data Operations Runbook</b>.
            </div>
          </Card>
        </>
      )}

      {tab === "Loop Agent (AI)" && (
        <>
          <Card title="🧬 The Knowledge-Loop Agent — what it is" sub="The portal's self-evolving memory: every AI output becomes durable, searchable knowledge that the next AI cycle builds on">
            <div style={{ fontSize:15.5, color:C.textSub, lineHeight:1.8 }}>
              LLMs are stateless — every chat starts from zero. The loop agent fixes that at the application level:
              every output any AI surface produces (daily briefs, analyst answers, model-arena comparisons and verdicts,
              document analyses, ML runs) is <b style={{ color:C.text }}>captured, embedded, and stored</b>; on each cycle the agent
              re-reads what the application now knows — <b style={{ color:C.text }}>including its own previous digest</b> — and writes a new
              application-wide executive summary <b style={{ color:C.text }}>back into the same store</b>. That write-back is the loop:
              cycle N&apos;s output is cycle N+1&apos;s input, so the knowledge base compounds instead of resetting.
            </div>
          </Card>
          <div style={{ height:14 }} />
          <Card title="How it's built — the five components" sub="all in this repository; no external vector database or agent framework">
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14, minWidth:700 }}>
                <thead><tr style={{ color:C.muted, textAlign:"left" }}>
                  {["Component", "File", "What it does"].map(h => <th key={h} style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[
                    ["① Capture hooks", "lib/knowledge.ts → wired into NewsBrief · AIAnalyst · DocAnalysis · MLWorkbench", "fire-and-forget saveKnowledge() after every AI output — silent on failure so persistence never breaks the UX"],
                    ["② Store + embeddings", "Neon Postgres kb_items via lib/db.ts", "kind · agency · title · content · model · SHA-256 hash (dedupe) · Gemini text-embedding-004 vector (768-dim, JSON)"],
                    ["③ The API", "app/api/knowledge/route.ts", "save (embed + insert) · search (cosine similarity in JS over the vectors) · item (permanent retrieval link) · agent (the loop cycle)"],
                    ["④ The loop cycle", "POST /api/knowledge {action:'agent'}", "previous digest + last 7 days of items + latest intelligence feed → LLM chain → new digest → SAVED BACK embedded"],
                    ["⑤ The triggers", ".github/workflows/intelligence-update.yml + the 🧬 page button", "daily ~6 AM ET after the news fetch (automated loop) and on-demand (interactive loop), with a model dropdown to pin the LLM"],
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.text, fontWeight:700, whiteSpace:"nowrap" }}>{r[0]}</td>
                      <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.cyan, fontFamily:"var(--font-mono)", fontSize:12.5 }}>{r[1]}</td>
                      <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, color:C.textSub, lineHeight:1.55 }}>{r[2]}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </Card>
          <div style={{ height:14 }} />
          <Card title="One cycle, step by step" sub="what happens when the agent runs (automatically each morning, or when you press the button)">
            <div style={{ display:"flex", alignItems:"stretch", gap:0, overflowX:"auto", paddingBottom:6 }}>
              {[
                ["📥", "GATHER", "its own previous digest + last 7 days of saved items + latest 12 intelligence items"],
                ["🧩", "COMPOSE", "continuity prompt: 'here is what you said last cycle; here is what's new'"],
                ["🤖", "REASON", "LLM chain (your pinned model first, fallbacks behind) writes the digest"],
                ["📝", "DIGEST", "exec summary · what changed vs last cycle · 5 insights citing [#item-ids] · 3 gaps + next actions"],
                ["💾", "WRITE BACK", "digest saved into kb_items, embedded — it becomes item [#N]"],
                ["🔁", "LOOP", "next cycle reads THIS digest as its memory — the loop closes"],
              ].map((st, i, arr) => (
                <div key={i} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                  <div style={{ width:170, padding:"10px 10px", borderRadius:10, textAlign:"center", border:`2px solid ${i === 5 ? C.purple : C.border}`, background: i === 5 ? `${C.purple}14` : C.card }}>
                    <div style={{ fontSize:21 }}>{st[0]}</div>
                    <div style={{ fontSize:13.5, fontWeight:800, color: i === 5 ? C.purple : C.text, letterSpacing:"0.05em" }}>{st[1]}</div>
                    <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.45, marginTop:3 }}>{st[2]}</div>
                  </div>
                  {i < arr.length - 1 && <span style={{ padding:"0 6px", color:C.muted, fontSize:16 }}>→</span>}
                </div>
              ))}
            </div>
          </Card>
          <div style={{ height:14 }} />
          <Card title="The three loops in action" sub="the system runs three nested feedback loops at different speeds">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:10 }}>
              {[
                ["🔄 Capture loop — seconds", C.cyan, "You generate any AI output anywhere in the portal → it's saved and embedded instantly → it's immediately findable in semantic search and citable by the next digest. Every interaction makes the store richer."],
                ["🌅 Daily automation loop — 24h", C.blue, "GitHub Action at ~6 AM ET: fetch agency-tagged news → score impact → run the agent over news + the week's knowledge → save the digest → revalidate the site. The portal wakes up briefed without anyone touching it."],
                ["🧬 Self-evolution loop — cycle over cycle", C.purple, "Each digest names KNOWLEDGE GAPS and the exact feature to run (e.g., 'run a Benford screen on VA awards'). When you do, the new items land in the store, and the NEXT digest measures what changed — the agent steers its own learning agenda."],
              ].map(([t, col, body], i) => (
                <div key={i} style={{ background:C.card, border:`1px solid ${String(col)}55`, borderTop:`3px solid ${String(col)}`, borderRadius:10, padding:"11px 13px" }}>
                  <div style={{ fontSize:15, fontWeight:800, color:String(col), marginBottom:6 }}>{t}</div>
                  <div style={{ fontSize:14, color:C.textSub, lineHeight:1.65 }}>{body}</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{ height:14 }} />
          <Card title="What makes it special" sub="design choices that matter for a federal FM context">
            <div style={{ fontSize:14.5, color:C.textSub, lineHeight:1.85 }}>
              ① <b style={{ color:C.text }}>Write-back memory</b> — the agent's output is its own future input; stateless LLMs gain durable, compounding state without fine-tuning.
              ② <b style={{ color:C.text }}>Audit-grade lineage</b> — every insight cites item ids ([#42]) that resolve to permanent retrieval links (/api/knowledge?op=item&id=42); you can trace any claim to the exact saved output that produced it.
              ③ <b style={{ color:C.text }}>Semantic recall</b> — Gemini embeddings + cosine similarity mean "FBwT reconciliation findings" finds the right items even when no keyword matches.
              ④ <b style={{ color:C.text }}>Idempotent by construction</b> — SHA-256 content hashing dedupes; re-running anything never double-counts knowledge.
              ⑤ <b style={{ color:C.text }}>Model-agnostic</b> — the cycle runs on the chain (pin any model from the dropdown; fallbacks behind it), so no single provider outage breaks the loop.
              ⑥ <b style={{ color:C.text }}>Graceful degradation</b> — no DATABASE_URL? The app works normally, persistence just switches off with a visible notice. No embedding key? Search falls back to keywords.
            </div>
          </Card>
        </>
      )}

      {tab === "User Guide (Ops)" && (
        <Card title="Task recipes — follow along, no prior knowledge needed" sub="The five workflows that cover 90% of real use">
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {RECIPES.map(([t, steps], i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 15px" }}>
                <div style={{ fontSize:15.5, fontWeight:700, color:C.text, marginBottom:8 }}>🎯 {t}</div>
                {steps.map((st, j) => (
                  <div key={j} style={{ display:"flex", gap:10, fontSize:14, lineHeight:1.65, marginBottom:4 }}>
                    <span style={{ fontWeight:800, color:C.blue, fontFamily:"var(--font-mono)", flexShrink:0 }}>{j + 1}.</span>
                    <span style={{ color:C.textSub }}>{st}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.65 }}>
              Universal habits: the <b style={{ color:C.text }}>agency selector</b> (top-left) re-scopes every page ·
              hover anything on Data Intelligence/Explorer for the <b style={{ color:C.text }}>AI agent's read</b> ·
              every page's <b style={{ color:C.text }}>Data Provenance footer</b> names its sources ·
              FY selectors default to the <b style={{ color:C.text }}>current in-progress year</b>.
            </div>
          </div>
        </Card>
      )}

      {tab === "Troubleshooting" && (
        <Card title="Troubleshooting & FAQ" sub="The eight situations you'll actually meet, with the fix">
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {TROUBLE.map(([q, a], i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"10px 13px" }}>
                <div style={{ fontSize:14.5, fontWeight:700, color:C.gold, marginBottom:4 }}>❓ {q}</div>
                <div style={{ fontSize:14, color:C.textSub, lineHeight:1.65 }}>{a}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
