// lib/analyst-context.ts — agency-aware knowledge base for the AI FM Analyst.
// Single source of truth: the same sections that prime the LLM system prompt
// are rendered in the UI grounding panel, so the user can SEE exactly what the
// analyst knows for the selected agency. Replaces the SEC-only blueprint prompt.
import { getAgency } from "@/lib/agencies"
import { getProfile } from "@/lib/agency-profiles"

export interface KBSection { icon: string; title: string; items: string[] }

/* ── per-agency deep extras beyond the structured profile ────────────────── */
const EXTRAS: Record<string, string[]> = {
  DOD: [
    "FY2025 agency-wide audit: DISCLAIMER of opinion — 26 material weaknesses (DODIG-2026-032); statutory clean-opinion deadline Dec 31, 2028 (P.L. 118-31 §1005(b)).",
    "Highest-leverage MWs: #7 Universe of Transactions, #8 Fund Balance with Treasury, #18 Unsupported (JV) adjustments, #4/#5 system access & segregation of duties.",
    "System map: GFEBS (Army) · Navy ERP · DEAMS (Air Force) · DAI (4th Estate) · SABRS (USMC) consolidate via DDRS; feeders DTS, WAWF/PIEE, MOCAS, GCSS, DJMS/DCPS. Treasury Index 097.",
    "USMC's sustained unmodified opinion is the internal remediation playbook; Advana-FM/Databricks is the enterprise data layer for UoT and FBwT evidence.",
    "Loaded folder data: FY2026/FY2027 J-book exhibits (M-1, O-1, P-1, R-1), FY2026 All-Contracts full archive (May 2026 snapshot) + delta, processed DoD gold analysis, FY2025 AFR PDF set incl. MERHCF/MRF.",
  ],
  SEC: [
    "FY2027 CBJ (Apr 2026): FY2026 enacted $2,149M · 4,024 FTE; FY2027 request $1,908M · 4,177 FTE — an 11% dollar cut WITH FTE growth (compensation squeeze).",
    "Section 31 fee offset makes SEC deficit-neutral ($0 net to taxpayers); FY2027 fee rate $7.10 per $1M transaction value; $145M anticipated FY2026→FY2027 carryover, $25M prior-year recoveries.",
    "Cost structure: personnel (OC 11+12) $1,434.9M = 69.1% of $2,078M obligations; Enforcement $633.9M · 1,168 FTE; Examinations $468.5M · 952 FTE.",
    "Open OIG findings: Rpt 582 T&M contract management (3 recs, due Sep 2026); Rpt 584 FISMA Level-3 controls (5 recs, due Dec 2026); Rpt 585 CAT data controls (5 recs, due Mar 2027).",
    "Reserve Fund (capped $100M/yr) is the only multi-year technology money; GAO audits SEC directly — sustained unmodified opinions.",
  ],
}

/* ── government-wide framework every answer applies ───────────────────────── */
const FRAMEWORK: string[] = [
  "Fiscal law: 31 U.S.C. §1341/§1517 (Anti-Deficiency), §1301 (purpose), §1502 (bona fide need), §1552–1557 (account closure); GAO Red Book reasoning.",
  "OMB circulars: A-11 (formulation & execution, SF-132 apportionment, SF-133 execution report), A-123 (ICOFR + ERM), A-136 (financial reporting), A-50 (audit follow-up).",
  "Statutes: CFO Act 1990, FMFIA 1982, FFMIA 1996, GMRA 1994, DATA Act 2014, PIIA 2019, GONE Act 2016.",
  "Accounting: FASAB SFFAS (1, 4, 5, 6, 7, 54); USSGL TFM posting logic — 4-series budgetary vs 1/2/3/5/6/7-series proprietary; GTAS; Treasury CARS; TAS/BETC structure.",
  "Key SF-133 lines: 1910 total budgetary resources · 2190 obligations incurred · 2490 unobligated balance · 4190 outlays — the portal's standard execution measures.",
]

/* ── what data the portal can ground answers in, per agency ──────────────── */
function dataGrounding(id: string, hasLocal: boolean, abbrev: string): string[] {
  const rows: string[] = []
  if (id === "DOD") rows.push(
    "sourcedata/ (DEFAULT): DoD J-book exhibits M-1/O-1/P-1/R-1 (FY2026–27), FY2026 All-Contracts full+delta archives (297-col D1), processed gold report, FY2025 AFR PDFs.")
  else if (id === "SEC") rows.push(
    "sourcedata/ (DEFAULT): SEC FY2027 CBJ dataset (budget, FTE, fee model, OIG findings) bundled in lib/sec-data.")
  else rows.push(
    `${abbrev} has no local folder yet — answers ground in LIVE USAspending/Fiscal Data pulls; the Acquire panel (Data Explorer) can save ${abbrev} pulls into sourcedata/.`)
  rows.push(
    "USAspending live API: budgetary resources by FY, obligations by period, sub-agency → office, budget function → subfunction, federal account → TAS, object class (GTAS-derived).",
    "Treasury Fiscal Data (audited FR): Statements of Net Cost BY AGENCY (FY2015→, $B), gov-wide balance sheets, MTS Table 5 monthly outlays by agency — current through last month-end.",
    `sourcedata/AFR/: the agency's own complete audited financial statements (AFR/PAR PDFs) where harvested — the only agency-level Balance Sheet/SNC/SBR source.`,
    "DuckDB + Parquet lakehouse (sourcedata/USAspending/warehouse): bulk award archives, silver agency=/fy= partitions, gold analytics.",
    "TIME-BASIS DISCIPLINE: action-date FY ≠ appropriation/TAS year ≠ GTAS submission period ≠ last-modified date — every figure must state its basis." )
  return rows
}

/* ── knowledge base: sections shown in the UI AND rendered into the prompt ── */
export function knowledgeBase(agencyId: string): KBSection[] {
  const a = getAgency(agencyId)
  const p = getProfile(a)
  const sections: KBSection[] = [
    { icon: "🏛", title: `${a.abbrev} profile`, items: [
      `Mission: ${p.mission}`,
      `Footprint: ${p.footprint}`,
      `What makes it unique: ${p.uniqueness}`,
    ]},
    { icon: "🧭", title: "FM landscape", items: [
      `Budget: ${p.fm.budget}`,
      `Accounting: ${p.fm.accounting}`,
      `Internal control: ${p.fm.controls}`,
      `Audit: ${p.fm.audit}`,
      `Finance operations: ${p.fm.finops}`,
    ]},
    { icon: "📊", title: "Budget brief", items: [
      p.budget.overview,
      `Funding structure: ${p.budget.fundingStructure}`,
      `Appropriations process: ${p.budget.appropriations}`,
      `Enacted history: ${p.budget.enacted.map(e => `${e.fy} ${e.amount} (${e.note})`).join(" · ")}`,
      ...p.budget.insights.map(i => `Insight: ${i}`),
    ]},
    { icon: "⚖️", title: "Federal FM framework", items: FRAMEWORK },
    { icon: "🗄", title: "Data grounding", items: dataGrounding(a.id, a.hasLocalData, a.abbrev) },
  ]
  if (EXTRAS[a.id]) sections.splice(3, 0, { icon: "🎯", title: `${a.abbrev} deep context`, items: EXTRAS[a.id] })
  return sections
}

/* ── the system prompt the chain runs with ────────────────────────────────── */
export function buildAnalystPrompt(agencyId: string): string {
  const a = getAgency(agencyId)
  const kb = knowledgeBase(agencyId)
  const body = kb.map(s => `${s.title.toUpperCase()}\n${s.items.map(i => `- ${i}`).join("\n")}`).join("\n\n")
  return `You are a senior federal financial management analyst embedded in the ANY FED portal, currently advising the ${a.name} (${a.abbrev}) — a ${a.cfoAct ? "CFO Act" : "non-CFO Act"}, ${a.funding} entity (USAspending toptier ${a.toptier}).

${body}

ANSWER RULES
1. Lead with the answer, then the support. Every dollar figure carries its unit ($K/$M/$B), its measure (TOA, BA, obligations, outlays, net cost), and its time basis.
2. Mark approximations with ≈ and name the verification source (CBJ, appropriations act, AFR, USAspending, Fiscal Data).
3. Cite legal authority by section whenever fiscal law is implicated.
4. Keep budgetary and proprietary accounting distinct — never mix SF-133 and Statement of Net Cost figures without stating the accrual-vs-budgetary bridge.
5. If the portal lacks the data, say exactly which dataset answers the question and where to acquire it (Acquire panel, Fiscal Data API, agency AFR).
6. You advise ${a.abbrev} specifically — never recycle another agency's figures or system names.
7. Be concise and structured; use short labelled lines over long prose.`
}
