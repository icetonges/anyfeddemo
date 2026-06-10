"use client"

import { useState, useEffect, useRef, createContext, useContext } from "react";
import type { ReactNode, CSSProperties } from "react";
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models";
import type { ModelId } from "@/lib/models";
import { PageDailyUpdate, PageAboutApp, PageAboutMe } from "./NewPages";
import {
  OSOBadge, OSOKPI, OSOCard, SH, OSOTh, OSOTd, BurnBar, OSOModal,
  PageDashboard, PageSystems, PageOFM, PageStakeholders, PageSOPs,
  PageActions, PageBudget, PageCOR, PageGPC, PageTime,
  OSOPageFormulation, OSOPageOIG, PageBriefs,
  PagePayroll, PageTravel, PageFacilityFleet,
} from "./OSOPagesV2";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, ReferenceLine, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM — DARK & LIGHT THEMES
// ═══════════════════════════════════════════════════════════════════════════
const DARK = {
  bg:          "#03070e",
  sidebar:     "#060c18",
  surface:     "#0a1020",
  card:        "#0d1528",
  border:      "rgba(14,100,200,0.16)",
  borderAccent:"rgba(14,165,233,0.38)",
  blue:        "#0ea5e9",
  cyan:        "#22d3ee",
  gold:        "#f59e0b",
  green:       "#10b981",
  red:         "#ef4444",
  orange:      "#f97316",
  purple:      "#a78bfa",
  indigo:      "#6366f1",
  text:        "#e2e8f0",
  textSub:     "#94a3b8",
  muted:       "#94a3b8",
  dim:         "#1e3050",
  // v2 tokens
  sidebarHi:   "#0f1929",
  cardHov:     "#161f30",
  navy:        "#1d4ed8",
  skyBlue:     "#60a5fa",
  greenBg:     "rgba(16,185,129,0.12)",
  redBg:       "rgba(239,68,68,0.12)",
  goldBg:      "rgba(245,158,11,0.12)",
  orangeBg:    "rgba(249,115,22,0.12)",
  purpleBg:    "rgba(167,139,250,0.12)",
  cyanBg:      "rgba(34,211,238,0.12)",
  input:       "#1e293b",
  inputBorder: "rgba(255,255,255,0.1)",
};

const LIGHT = {
  bg:          "#f0f4f8",
  sidebar:     "#0e1f3d",  // dark navy — sidebar stays dark in both modes for readability
  surface:     "#ffffff",
  card:        "#f8fafc",
  border:      "rgba(14,100,200,0.20)",
  borderAccent:"rgba(14,165,233,0.45)",
  blue:        "#0369a1",
  cyan:        "#0891b2",
  gold:        "#b45309",
  green:       "#047857",
  red:         "#b91c1c",
  orange:      "#c2410c",
  purple:      "#6d28d9",
  indigo:      "#4338ca",
  text:        "#0f172a",
  textSub:     "#334155",
  muted:       "#475569",
  dim:         "#e2e8f0",
  // v2 tokens
  sidebarHi:   "#132240",
  cardHov:     "#f8f9fb",
  navy:        "#1d4ed8",
  skyBlue:     "#3b82f6",
  greenBg:     "#ecfdf5",
  redBg:       "#fef2f2",
  goldBg:      "#fffbeb",
  orangeBg:    "#fff7ed",
  purpleBg:    "#f5f3ff",
  cyanBg:      "#ecfeff",
  input:       "#ffffff",
  inputBorder: "#cbd5e1",
};

type Theme = typeof DARK;
const ThemeContext = createContext<Theme>(DARK);
const useTheme = (): Theme => useContext(ThemeContext);

// ═══════════════════════════════════════════════════════════════════════════
// DATA — FY2027 CBJ (SEC, April 2026) — ACTUAL SOURCE DATA
// ═══════════════════════════════════════════════════════════════════════════
const BUDGET_HISTORY = [
  { fy:"FY23", enacted:2093, requested:2436, fte:4789 },
  { fy:"FY24", enacted:2097, requested:2519, fte:4548 },
  { fy:"FY25", enacted:2149, requested:2594, fte:4542 },
  { fy:"FY26", enacted:2149, requested:2149, fte:4024 },
  { fy:"FY27", enacted:null, requested:1908, fte:4177  },
];
const PROGRAM_DATA = [
  { prog:"Enforcement",        fy25:693,fy26:607,fy27:634, fte25:1302,fte26:1114,fte27:1168 },
  { prog:"Examinations",       fy25:499,fy26:470,fy27:468, fte25:1066,fte26:942, fte27:952  },
  { prog:"Dir & Admin Support",fy25:313,fy26:307,fy27:320, fte25:724, fte26:684, fte27:732  },
  { prog:"Corp Finance",       fy25:184,fy26:178,fy27:179, fte25:405, fte26:370, fte27:375  },
  { prog:"Trading & Markets",  fy25:123,fy26:113,fy27:115, fte25:252, fte26:221, fte27:229  },
  { prog:"Invest. Management", fy25:96, fy26:85, fy27:89,  fte25:200, fte26:170, fte27:178  },
  { prog:"Econ & Risk Analysis",fy25:85,fy26:82, fy27:83,  fte25:182, fte26:167, fte27:169  },
  { prog:"Other Program Offices",fy25:109,fy26:100,fy27:102,fte25:218,fte26:193,fte27:204  },
  { prog:"General Counsel",    fy25:71, fy26:64, fy27:64,  fte25:142, fte26:117, fte27:123  },
  { prog:"Inspector General",  fy25:25, fy26:25, fy27:24,  fte25:51,  fte26:46,  fte27:47   },
];
const OBJ_CLASS = [
  { code:"11.0", name:"Personnel Compensation", fy25:1091555, fy26:976079,  fy27:1034473, pct:49.8 },
  { code:"12.0", name:"Personnel Benefits",     fy25:415675,  fy26:390464,  fy27:400403,  pct:19.3 },
  { code:"25.0", name:"Other Contractual Svcs", fy25:524689,  fy26:505614,  fy27:492957,  pct:23.7 },
  { code:"23.0", name:"Rent, Comm & Utilities", fy25:103874,  fy26:104236,  fy27:108890,  pct:5.2  },
  { code:"31.0", name:"Equipment",              fy25:24072,   fy26:46030,   fy27:30420,   pct:1.5  },
  { code:"24.0", name:"Printing & Repro",       fy25:12466,   fy26:1110,    fy27:4799,    pct:0.2  },
  { code:"21.0", name:"Travel",                 fy25:3858,    fy26:4058,    fy27:4162,    pct:0.2  },
  { code:"42.0", name:"Insurance & Indemn.",    fy25:563,     fy26:750,     fy27:766,     pct:0.0  },
  { code:"26.0", name:"Supplies & Materials",   fy25:616,     fy26:844,     fy27:861,     pct:0.0  },
  { code:"32.0", name:"Land & Structures",      fy25:75,      fy26:456,     fy27:169,     pct:0.0  },
  { code:"13.0", name:"Benefits-Former Pers.",  fy25:21946,   fy26:2182,    fy27:31,      pct:0.0  },
  { code:"22.0", name:"Transportation",         fy25:39,      fy26:69,      fy27:70,      pct:0.0  },
];
const FEE_DATA = [
  { fy:"FY21", rate:22.9, reserve:55 },
  { fy:"FY22", rate:8.0,  reserve:67 },
  { fy:"FY23", rate:17.4, reserve:78 },
  { fy:"FY24", rate:14.3, reserve:85 },
  { fy:"FY25", rate:0.0,  reserve:92 },
  { fy:"FY26", rate:8.9,  reserve:98 },
  { fy:"FY27", rate:7.1,  reserve:100},
];
// NewsItem type — shared across static seed and live API data
type NewsItem = {
  id: number; cat: string; urg: string;
  headline: string; body: string; impact: string;
  src: string; time: string; url?: string | null;
}

// Local fallback — used when /api/news-feed is unavailable.
// Ordered newest-first. Add `url` pointing to the original source.
const NEWS_FEED: NewsItem[] = [
  { id:1, cat:"Congressional Action", urg:"HIGH",
    headline:"Senate FSGG Subcommittee Markup — June 2026",
    body:"Senate Appropriations Committee scheduled Financial Services and General Government markup. SEC's $1.908B FY2027 request may shift; House-Senate conference likely before October 1 deadline.",
    impact:"FY2027 enacted level remains uncertain — OSO planning must model ±10% from request.",
    time:"2h ago", src:"Senate Appropriations",
    url:"https://www.appropriations.senate.gov/" },
  { id:3, cat:"Market Intelligence", urg:"MEDIUM",
    headline:"Project Crypto Draft Rules Released for Public Comment",
    body:"Chairman Atkins directed policy divisions to release framework for digital asset classification. 'Innovation exemption' concept published. 60-day comment period opened.",
    impact:"Significant new examination workload in Trading & Markets — FTE pressure in FY2027 vs. reduced 4,177 cap.",
    time:"4h ago", src:"SEC.gov",
    url:"https://www.sec.gov/news/press-releases" },
  { id:2, cat:"Budget Action", urg:"HIGH",
    headline:"OMB A-11 FY2028 Update: DOGE Efficiency Targets Mandatory",
    body:"OMB revised Circular A-11 supplemental guidance. All agencies must identify 10% operational savings for FY2028 submissions. Efficiency plans due to OMB July 2026.",
    impact:"OSO must begin FY2028 formulation under enhanced efficiency framework — baseline assessments due immediately.",
    time:"6h ago", src:"OMB",
    url:"https://www.whitehouse.gov/omb/information-for-agencies/circulars/" },
  { id:4, cat:"SEC Operations", urg:"LOW",
    headline:"EDGAR Phase 3 Cloud Migration Complete — 34% Cost Reduction",
    body:"SEC's EDGAR system completed Phase 3 of cloud migration. Per-filing processing costs fell 34%, system uptime reached 99.97%.",
    impact:"Positive IT budget envelope signal for FY2027 equipment request ($30.4M).",
    time:"1d ago", src:"SEC IT Division",
    url:"https://www.sec.gov/edgar/about" },
  { id:5, cat:"Market Intelligence", urg:"MEDIUM",
    headline:"Section 31 Collections Q2 FY2026: 8% Above Projection",
    body:"Strong equity market volume in Q2 FY2026 drove Section 31 transaction fee collections above projection, reinforcing the agency's deficit-neutral posture.",
    impact:"Reserve fund on track — supports $145M anticipated carryover to FY2027.",
    time:"1d ago", src:"SEC OFM",
    url:"https://www.sec.gov/about/offices/ofm.htm" },
  { id:6, cat:"Congressional Action", urg:"MEDIUM",
    headline:"House FSS Subcommittee Requests FTE Reduction Justification",
    body:"House Financial Services Appropriations Subcommittee hearing questioned the reduction from 4,542 to 4,177 FTE, requesting mission-area vacancy analysis before markup.",
    impact:"Potential congressional add-back of FTE authority — monitor markup closely.",
    time:"2d ago", src:"House Appropriations",
    url:"https://appropriations.house.gov/" },
];

const AI_KNOWLEDGE = {
  home:"The SEC operates on a deficit-neutral funding model — Section 31 transaction fees offset the entire appropriation, so operations cost taxpayers $0 net. FY2027 request of $1.908B represents an 11% reduction from FY2026 enacted, driven by $145M anticipated carryover and $25M prior-year obligation recoveries.",
  execution:"OMB Circular A-11 §120 governs apportionment — OMB controls the release of funds quarterly. The Anti-Deficiency Act (31 U.S.C.§1341) prohibits obligations exceeding the apportioned amount. OSO's financial management role: track burn rates, flag anomalies early, coordinate with OMB before year-end.",
  formulation:"FY2028 formulation follows the A-11 cycle: Spring 2026 guidance → internal program assessments → OMB submission (Sep 2026) → OMB passback → appeals → President's Budget (Feb 2027) → congressional action. OSO coordinates internal resource planning across all program offices.",
  programs:"Enforcement ($634M, 1,168 FTE) and Examinations ($468M, 952 FTE) together account for 53% of total obligations. These mission-critical accounts are protected from deeper cuts — they directly serve the SEC's three-part mission: investor protection, fair markets, capital formation.",
  objectclass:"Object Class 11.0 (Personnel Compensation, $1.034B) + 12.0 (Personnel Benefits, $400M) = 69.1% of total obligations. This concentration means every hiring decision has major budget implications. Object Class 25.0 (contracts, $493M) is the primary non-personnel lever.",
  oig:"OIG Report 582 (T&M Contract Management, Aug 2024) had 7 recommendations — ALL CLOSED before April 1, 2025 per the SEC Management Report Apr–Sep 2025. Controls now embedded: T&M utilization dashboard, COR SOPs, contract type decision matrix. Currently open: OIG-574 FISMA FY2022 (1 of 13 recs, spring 2026), OIG-584 FISMA FY2024 (6 of 10 recs, spring 2026). No OSO-specific open OIG findings as of Sep 30, 2025.",
  fee:"Section 31 of the Securities Exchange Act authorizes transaction fees on equity trades. Section 6(b) sets the annual rate (currently $7.10/$1M). In FY2025 the rate was $0 — collections exceeded the appropriation. This makes the SEC unique among federal agencies: fee collections fully offset the appropriation.",
  tech:"The SEC's FY2027 AI Task Force will centralize governance for AI adoption across the agency. OSO financial management can leverage AI for: obligation anomaly detection, burn rate forecasting, automated ADA risk scoring, natural-language budget Q&A for stakeholders, and AI-assisted justification drafting.",
};

// ═══════════════════════════════════════════════════════════════════════════
// OSO OPS PORTAL — DATA (from oso-financial-portal-v2)
// ═══════════════════════════════════════════════════════════════════════════
const DISCLAIMER = `⚠️  DISCLAIMER: This application was developed for career preparation and job-search purposes. All data, figures, names, organizational structures, and operational assumptions are based solely on publicly available information (SEC.gov, USAJOBS, SEC OIG Reports 482/488/582/584, SEC Congressional Budget Justifications FY2025-2027, OMB Circulars A-11/A-123, FAR/GSAM, GSA SmartPay, and SAM.gov public records). No non-public, proprietary, or agency-internal data has been used. Reasonable assumptions have been made where public information is incomplete. This tool does not represent official SEC policy, operations, or endorsement. It is a demonstration prototype for interview preparation and job-search purposes only.`;

// Actions as of June 1, 2026 — Month 9 of FY2026 · Q4 execution · Year-end planning underway
const INIT_ACTIONS: any[] = [
  { id:1, type:"COR ACTION",        ref:"COR-2026-018",  desc:"Monthly T&M Ceiling Review — Patriot Security (May 2026)", vendor:"Patriot Security Inc",  amount:1146000, oc:"25.0", office:"OSBO-PSE", status:"OVERDUE",          created:"2026-06-01", due:"2026-06-07", adaRisk:"HIGH",   cor:"R. Jackson", note:"T&M contract — May COR surveillance log not submitted; 83% of ceiling obligated — 4Q trend watch. OIG-582 CLOSED but T&M monitoring SOPs remain in effect." },
  { id:2, type:"OBLIGATION",        ref:"OSO-OBL-044",   desc:"Security Guard Services Q4 FY26 — Monthly Obligation",    vendor:"Patriot Security Inc",  amount:127333, oc:"25.0", office:"OSBO-PSE", status:"PENDING REVIEW",   created:"2026-05-29", due:"2026-06-10", adaRisk:"MEDIUM", cor:"R. Jackson", note:"Q4 obligation — verify remaining ceiling before approval; ceiling 83% consumed YTD" },
  { id:3, type:"OBLIGATION",        ref:"OSO-OBL-045",   desc:"Janitorial Services HQ — June 2026",                      vendor:"CleanFed Corp",         amount:42000,  oc:"25.0", office:"OSBO-FO",  status:"APPROVED",        created:"2026-06-01", due:"2026-06-07", adaRisk:"LOW",    cor:"L. Torres",  note:"" },
  { id:4, type:"OBLIGATION",        ref:"OSO-OBL-046",   desc:"COOP Alternate Site — Q4 FY26 Lease Payment",             vendor:"GSA (Delegated)",       amount:58000,  oc:"23.0", office:"BMCB",     status:"APPROVED",        created:"2026-06-01", due:"2026-06-15", adaRisk:"LOW",    cor:"N/A",        note:"" },
  { id:5, type:"GPC PURCHASE",      ref:"GPC-2026-029",  desc:"Server Room Cooling Unit — Emergency Replacement",        vendor:"APC Inc",               amount:4200,   oc:"31.0", office:"OSBO-FSS", status:"PENDING RECONCILE",created:"2026-05-28", due:"2026-06-04", adaRisk:"LOW",    cor:"N/A",        note:"5-day recon window closes Jun 4 — S. Park action required", cardholder:"S. Park" },
  { id:6, type:"GPC PURCHASE",      ref:"GPC-2026-028",  desc:"Office Supplies — FOIA Research Branch",                  vendor:"Staples Adv",           amount:840,    oc:"26.0", office:"OFS",      status:"RECONCILED",      created:"2026-05-22", due:"2026-05-29", adaRisk:"LOW",    cor:"N/A",        note:"", cardholder:"K. Webb" },
  { id:7, type:"OBLIGATION",        ref:"OSO-OBL-047",   desc:"Records Mgmt License — Option Year (FY27 contingent)",    vendor:"FileNet Gov Solutions", amount:95500,  oc:"25.0", office:"OAMR",     status:"PENDING REVIEW",  created:"2026-05-28", due:"2026-06-20", adaRisk:"MEDIUM", cor:"A. Davis",   note:"⚠️ FY2027 funding uncertain — CR risk if no enacted appropriation by Oct 1; do not obligate until FY27 funding confirmed" },
  { id:8, type:"BUDGET FORMULATION",ref:"FORM-2027-CR",  desc:"FY2027 Continuing Resolution Scenario — 1/12 Plan",       vendor:"N/A",                   amount:0,      oc:"ALL",  office:"BMCB",     status:"IN PROGRESS",     created:"2026-05-20", due:"2026-06-30", adaRisk:"MEDIUM", cor:"N/A",        note:"Senate FSGG markup scheduled Jun 2026 — model CR at 1/12 monthly allotment ($958K/month) if no enacted FY27 by Oct 1" },
  { id:9, type:"BUDGET FORMULATION",ref:"FORM-2028-001", desc:"FY2028 Budget Formulation — BMCB Kickoff",                vendor:"N/A",                   amount:0,      oc:"ALL",  office:"BMCB",     status:"IN PROGRESS",     created:"2026-06-01", due:"2026-07-31", adaRisk:"LOW",    cor:"N/A",        note:"OMB A-11 FY2028 guidance issued May 2026 with 10% efficiency target; internal planning now underway" },
  { id:10, type:"BUDGET FORMULATION",ref:"YEAR-END-001", desc:"FY2026 Year-End Sweep — De-obligation & ULO Review",           vendor:"N/A",                    amount:0,      oc:"ALL",  office:"BMCB",     status:"NOT STARTED",      created:"2026-06-01", due:"2026-08-15", adaRisk:"MEDIUM", cor:"N/A",       note:"⚠️ Begin Q4 ULO review — identify contracts for de-obligation before Sep 30 close to optimize carryover" },
  // ── FACILITY ACTIONS (tie to Facility & Fleet tab) ─────────────────────────
  { id:11, type:"FACILITY ACTION", ref:"FAC-2026-003", desc:"Replacement Lease Procurement — Boston District Office",         vendor:"GSA/PBS",                amount:1420000, oc:"23.0", office:"OSBO-CL",  status:"IN PROGRESS",      created:"2026-04-01", due:"2026-09-30", adaRisk:"MEDIUM", cor:"L. Torres", note:"Lease expires Jun 2027 — OA amendment submitted to GSA; target execution by Feb 2027. Failure to execute risks office continuity." },
  { id:12, type:"FACILITY ACTION", ref:"FAC-2026-004", desc:"Seattle District Office — Co-location / Consolidation Study",     vendor:"GSA/PBS",                amount:0,       oc:"23.0", office:"OSBO-CL",  status:"IN PROGRESS",      created:"2026-05-01", due:"2026-11-30", adaRisk:"LOW",    cor:"L. Torres", note:"Lease expires Mar 2027. Assessing consolidation with SF regional; GSA market study due Nov 2026." },
  { id:13, type:"FACILITY ACTION", ref:"FAC-2026-005", desc:"Denver Regional Office — RLP Package Preparation",                vendor:"GSA/PBS",                amount:0,       oc:"23.0", office:"OSBO-CL",  status:"NOT STARTED",      created:"2026-06-01", due:"2027-03-31", adaRisk:"LOW",    cor:"L. Torres", note:"Lease expires Sep 2027. Market survey initiated; Request for Lease Proposals to GSA by Q2 FY2027." },
  { id:14, type:"FACILITY ACTION", ref:"FAC-2026-006", desc:"OSBO-PSE Physical Security Contract — Annual Obligation",         vendor:"Patriot Security Inc",   amount:127333,  oc:"25.0", office:"OSBO-PSE", status:"PENDING REVIEW",   created:"2026-06-02", due:"2026-06-15", adaRisk:"HIGH",   cor:"R. Jackson", note:"Q4 obligation — ceiling 83% consumed. Verify remaining balance before approval; T&M contract — apply COR monitoring SOPs per OA guidance (OIG-582 CLOSED; controls remain in effect)." },
  // ── FLEET ACTIONS (tie to Facility & Fleet tab) ─────────────────────────────
  { id:15, type:"FLEET ACTION",    ref:"FLT-2026-001", desc:"VEH-004 (GSA-5012) Preventive Maintenance — Ford F-150 Utility", vendor:"GSA Fleet Service Center",amount:0,       oc:"25.0", office:"OSBO-FO",  status:"OVERDUE",          created:"2026-06-01", due:"2026-06-07", adaRisk:"MEDIUM", cor:"N/A",       note:"PM overdue per GSA mileage interval (51,200 mi). Schedule with GSA Fleet service center immediately — vehicle out of service." },
  { id:16, type:"FLEET ACTION",    ref:"FLT-2026-002", desc:"FAST Annual Fleet Data Submission — FY2026",                      vendor:"GSA / DOE FEMP",         amount:0,       oc:"ALL",  office:"OSBO-FO",  status:"NOT STARTED",      created:"2026-06-01", due:"2026-10-31", adaRisk:"LOW",    cor:"N/A",       note:"Federal Automotive Statistical Tool annual data call. OSO compiles mileage, fuel cost, VIN data for all 10 vehicles." },
  { id:17, type:"FLEET ACTION",    ref:"FLT-2026-003", desc:"WEX Fuel Card Monthly Review — All OSO Vehicles (May 2026)",     vendor:"GSA WEX",                amount:0,       oc:"25.0", office:"OSBO-FO",  status:"IN PROGRESS",      created:"2026-06-01", due:"2026-06-10", adaRisk:"LOW",    cor:"N/A",       note:"Review fuel card transactions for all 10 vehicles. Flag any personal use or unusual patterns per GSA policy." },
  // ── PAYROLL ACTIONS (tie to Payroll & FTE tab) ──────────────────────────────
  { id:18, type:"PAYROLL ACTION",  ref:"PAY-2026-001", desc:"Budget Analyst Vacancy — SK-12 Recruitment Action (BMCB)",       vendor:"OHR / USAJOBS",          amount:98230,   oc:"11.0", office:"BMCB",     status:"IN PROGRESS",      created:"2026-05-01", due:"2026-08-01", adaRisk:"LOW",    cor:"N/A",       note:"Position VACANT since Feb 2026. OHR announcement open on USAJOBS. FM Specialist absorbing backlog pending fill." },
  { id:19, type:"PAYROLL ACTION",  ref:"PAY-2026-002", desc:"PP17 Half Pay Period — OC 11.0 + OC 12.0 Obligation Entry",      vendor:"NFC / HR Connect",       amount:161550,  oc:"11.0", office:"BMCB",     status:"APPROVED",         created:"2026-06-01", due:"2026-06-07", adaRisk:"LOW",    cor:"N/A",       note:"June 1, 2026 partial pay period. OC 11.0: $124,250 · OC 12.0: $37,300 · Enter in Momentum by Jun 7." },
  { id:20, type:"PAYROLL ACTION",  ref:"PAY-2026-003", desc:"Program Analyst Vacancy — SK-11 Recruitment Action (OFS)",       vendor:"OHR / USAJOBS",          amount:82764,   oc:"11.0", office:"OFS",      status:"NOT STARTED",      created:"2026-06-01", due:"2026-09-01", adaRisk:"LOW",    cor:"N/A",       note:"Second vacant position. OHR intake form not yet submitted. FM Specialist to coordinate salary savings offset in Year-End sweep." },
  // ── TRAVEL ACTIONS (tie to Travel tab) ─────────────────────────────────────
  { id:21, type:"TRAVEL ACTION",   ref:"TRV-2026-041", desc:"ENF Exams Support TDY — New York Regional (3 days)",             vendor:"N/A",                    amount:1840,    oc:"21.0", office:"OSBO-PSE", status:"PENDING REVIEW",   created:"2026-05-30", due:"2026-06-14", adaRisk:"LOW",    cor:"N/A",       note:"Travel authorization pending BMCB approval. NYC lodging: $258/night × 3 + M&IE. GTC required. Advance TA needed." },
  { id:22, type:"TRAVEL ACTION",   ref:"TRV-2026-042", desc:"OIG-584 FISMA Controls Follow-up — BMCB/OIT Coordination TDY",   vendor:"N/A",                    amount:620,     oc:"21.0", office:"BMCB",     status:"APPROVED",         created:"2026-05-28", due:"2026-06-20", adaRisk:"LOW",    cor:"N/A",       note:"OIG-584 FISMA follow-up coordination. 6 recs still open (spring 2026 target). FM Specialist attends OIT-BMCB coordination meeting." },
  { id:23, type:"TRAVEL ACTION",   ref:"TRV-2026-043", desc:"Records Management Conference — OAMR Staff TDY (2 staff, 4 days)",vendor:"NARA / Conference Host", amount:4860,    oc:"21.0", office:"OAMR",     status:"PENDING REVIEW",   created:"2026-06-01", due:"2026-07-15", adaRisk:"LOW",    cor:"N/A",       note:"Two OAMR staff attending NARA annual records mgmt conference. Lodging + M&IE + registration. Verify conference is mission-critical per FTR." },
];
// FY2026 allotments — current operating year (Oct 1 2025 – Sep 30 2026)
//
// SOURCE BASIS — TWO-LAYER BUDGET (why AD says $110M+):
//   Layer 1 — OSO Organizational Budget (CBJ FY2025 p.74-75):
//     $36,959K total (92 FTE): Salaries $24,800K + Non-Personnel $12,159K
//   Layer 2 — OSO Program Execution (funds administered by OSO from Agency Direction pool):
//     Facility leases (OSBO-CL): $58,520K — 12 locations per CBJ Appropriations Language p.16
//       "rental of space (to include multiple year leases) in DC and elsewhere"
//       OC 23.0 agency-wide = $109,014K (FY2025 CBJ p.13); OSO-administered lease share = $58.5M
//     Physical security contracts (OSBO-PSE): $19,500K — guard contracts, HQ + 11 regionals
//     FOIA processing contracts (OFS): portion of total OFS allotment
//   TOTAL OSO MANAGED OBLIGATIONS: ~$112M (consistent with AD's $110M+ claim)
//   NOTE: OIT organizational budget = $112.7M (FY2025) — separate from OSO
//
// FY2026 basis: FY2025 actuals scaled for FTE reduction 92→74; lease costs from CBJ p.16 + Facility data
// YTD as of June 1, 2026 = Month 9 of 12 · benchmark burn rate: 75.0%
const INIT_ALLOTMENTS: any[] = [
  { office:"OFS",      label:"FOIA Services",                 fy26:13200000, ytd:10296000 },  // 78.0% — FOIA staff + contractor support ~9,500+ requests/yr
  { office:"OSBO-PSE", label:"Physical Security & Emergency", fy26:19500000, ytd:16185000 },  // 83.0% — guard contracts HQ + 11 regionals; T&M high burn
  { office:"OSBO-PS",  label:"Personnel Security",            fy26:3100000,  ytd:2356000  },  // 76.0% — background investigations, clearances, HSPD-12
  { office:"OSBO-CL",  label:"Construction & Leasing",        fy26:58520000, ytd:43890000 },  // 75.0% — LEASES: HQ $28.4M + 11 regionals $30.1M = $58.5M (CBJ p.16)
  { office:"OSBO-FO",  label:"Facilities Operations",         fy26:8200000,  ytd:6068000  },  // 74.0% — maintenance, utilities, building management
  { office:"OSBO-FSS", label:"Facilities Systems & Services", fy26:2900000,  ytd:2088000  },  // 72.0% — access control, building automation systems
  { office:"OAMR",     label:"Admin & Mission Resilience",    fy26:2100000,  ytd:1617000  },  // 77.0% — records management, COOP, admin programs
  { office:"BMCB",     label:"Business Mgmt & Continuity",    fy26:4480000,  ytd:3584000  },  // 80.0% — business mgmt, personnel allotment, COOP oversight
  // Total FY2026: $112,000K | YTD: $86,084K (76.9%) | Source: CBJ FY2025 p.13,14,16,74-75
];
const INIT_OIG: any[] = [
  // ── OIG-582: CLOSED — all 7 recs resolved before Apr 1 2025 per SEC Management Report Apr-Sep 2025 ──
  { id:"OIG-582", title:"T&M Contract Management", status:"CLOSED", due:"2025-03-31", recs:7, closed:7, priority:"HIGH",
    closedNote:"All 7 recommendations implemented and closed with OIG concurrence prior to April 1, 2025. Source: SEC Management Report to Congress (Apr 1 – Sep 30, 2025) — Report 582 absent from Table 1 of pending corrective actions.",
    actions:[
      { id:"A1", text:"Quarterly T&M ceiling utilization dashboard — deployed agency-wide", status:"CLOSED", owner:"FM Specialist / OA" },
      { id:"A2", text:"Contract type decision matrix for new acquisitions", status:"CLOSED", owner:"Office of Acquisitions" },
      { id:"A3", text:"COR surveillance log SOPs and monthly reporting protocol", status:"CLOSED", owner:"COR Network / BMCB" },
      { id:"A4", text:"T&M contract file documentation requirements updated", status:"CLOSED", owner:"Office of Acquisitions" },
      { id:"A5", text:"Pre-award contract type analysis process implemented", status:"CLOSED", owner:"Office of Acquisitions" },
      { id:"A6", text:"T&M contract monitoring procedures established", status:"CLOSED", owner:"OCOO / Office of Acquisitions" },
      { id:"A7", text:"COR and contracting officer T&M training program delivered", status:"CLOSED", owner:"OHR + Office of Acquisitions" },
    ]},
  // ── OIG-574: FISMA FY2022 — 1 of 13 recs still open, spring 2026 target ──
  { id:"OIG-574", title:"FISMA FY2022 Evaluation (Financial Systems)", status:"IN PROGRESS", due:"2026-03-31", recs:13, closed:12, priority:"MEDIUM",
    closedNote:"12 of 13 recommendations closed with OIG concurrence. 1 remaining rec in progress; anticipated completion spring 2026. Source: SEC Management Report Apr–Sep 2025, Table 1.",
    actions:[
      { id:"C1", text:"Remaining FISMA Level 3 control remediation (final open rec)", status:"IN PROGRESS", owner:"OIT / OCOO" },
    ]},
  // ── OIG-584: FISMA FY2024 — 6 of 10 recs still open, spring 2026 target ──
  { id:"OIG-584", title:"FISMA FY2024 Evaluation (Financial Systems)", status:"IN PROGRESS", due:"2026-03-31", recs:10, closed:4, priority:"MEDIUM",
    closedNote:"4 of 10 recommendations closed with OIG concurrence. 6 remaining in progress; anticipated completion spring 2026. Source: SEC Management Report Apr–Sep 2025, Table 1.",
    actions:[
      { id:"D1", text:"Zero trust architecture implementation milestones", status:"IN PROGRESS", owner:"OIT" },
      { id:"D2", text:"Vulnerability management remediation — financial systems", status:"IN PROGRESS", owner:"OIT" },
      { id:"D3", text:"Access control and identity management controls", status:"IN PROGRESS", owner:"OIT / OCOO" },
      { id:"D4", text:"Incident response plan updates", status:"IN PROGRESS", owner:"OIT" },
      { id:"D5", text:"Configuration management documentation", status:"IN PROGRESS", owner:"OIT" },
      { id:"D6", text:"Security assessment and authorization", status:"IN PROGRESS", owner:"OIT" },
    ]},
];
// GPC as of June 1, 2026 — YTD spend reflects 8 months of FY2026 (Oct 2025 – May 2026)
const INIT_GPC: any[] = [
  { id:"GPC-001", cardholder:"K. Webb (OFS-R1)",    limit:2500,  ytdSpend:8340,  pending:0,    lastRecon:"2026-05-29", status:"CURRENT" },
  { id:"GPC-002", cardholder:"S. Park (OSBO-FSS)",  limit:10000, ytdSpend:24600, pending:4200, lastRecon:"2026-05-28", status:"PENDING" },
  { id:"GPC-003", cardholder:"M. Chen (OSBO-FO)",   limit:5000,  ytdSpend:16800, pending:0,    lastRecon:"2026-05-30", status:"CURRENT" },
  { id:"GPC-004", cardholder:"A. Rivera (OFS-R3)",  limit:2500,  ytdSpend:3120,  pending:0,    lastRecon:"2026-05-28", status:"CURRENT" },
];
// COR surveillance as of June 1, 2026 — Month 9; contracts at ~75–83% ceiling utilization
const INIT_COR: any[] = [
  { id:"COR-001", officer:"R. Jackson", contract:"Patriot Security Guard Services",  vendor:"Patriot Security Inc",  ceiling:1528000, ytdOblig:1146000, utilPct:75.0, lastLog:"2026-04-30", nextDue:"2026-05-31", status:"OVERDUE", oig582:true,  contractType:"T&M" },
  { id:"COR-002", officer:"C. Smith",   contract:"FOIA Processing Support Services", vendor:"Apex Tech Solutions",   ceiling:245000,  ytdOblig:183750,  utilPct:75.0, lastLog:"2026-05-28", nextDue:"2026-06-30", status:"CURRENT", oig582:false, contractType:"FFP" },
  { id:"COR-003", officer:"A. Davis",   contract:"Records Management System License",vendor:"FileNet Gov Solutions",  ceiling:95500,   ytdOblig:71625,   utilPct:75.0, lastLog:"2026-05-27", nextDue:"2026-06-30", status:"CURRENT", oig582:false, contractType:"FFP" },
  { id:"COR-004", officer:"L. Torres",  contract:"Janitorial Services HQ",           vendor:"CleanFed Corp",         ceiling:504000,  ytdOblig:378000,  utilPct:75.0, lastLog:"2026-05-31", nextDue:"2026-06-30", status:"CURRENT", oig582:true,  contractType:"T&M" },
];
// Timekeeping — week of May 27-31, 2026 · Month 9 of FY2026 · Q4 year-end execution
const INIT_TIME: any[] = [
  { name:"Q4 Burn Rate Review — All OSO Offices (Month 9 · Momentum)",  hrs:6,  cat:"BUDGET EXECUTION",  week:"May 27-31" },
  { name:"FY2026 Year-End Projection & ADA Risk Assessment (Aug-Sep)",   hrs:8,  cat:"BUDGET EXECUTION",  week:"May 27-31" },
  { name:"OIG-584 FISMA Controls — OCOO Coordination & Evidence Package Review", hrs:6, cat:"INTERNAL CONTROLS", week:"May 27-31" },
  { name:"FY2028 Budget Formulation — A-11 Guidance Review / BMCB Kickoff", hrs:4, cat:"FORMULATION",    week:"May 27-31" },
  { name:"GPC May Reconciliation — SmartPay IOD Portal Review",          hrs:2,  cat:"COMPLIANCE",        week:"May 27-31" },
  { name:"Monthly Status Report (May) — Draft for J. Harrison",          hrs:5,  cat:"REPORTING",         week:"May 27-31" },
  { name:"FY2027 CR Risk Briefing — C. Reeves (OSBO) Year-End Outlook", hrs:2,  cat:"ADVISORY",          week:"May 27-31" },
  { name:"SAM.gov Vendor Checks — Q4 Obligation Pipeline",               hrs:1,  cat:"ADMIN",             week:"May 27-31" },
];

const fmt$ = (n: number) => n>=1e6?`$${(n/1e6).toFixed(2)}M`:n>=1e3?`$${(n/1e3).toFixed(0)}K`:`$${n.toLocaleString()}`;
const fmtFull = (n: number) => `$${n.toLocaleString()}`;


// ═══════════════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════
const Tip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  const C = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px" }}>
      <div style={{ fontSize:16, color:C.muted, marginBottom:5 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:16, color:p.color||C.text, marginBottom:2 }}>
          {p.name}: <b>{typeof p.value==="number" && p.value>100 ? `$${p.value.toLocaleString()}` : p.value}</b>
        </div>
      ))}
    </div>
  );
};

function KPI({ label, value, sub, delta, positive, accent, icon }: {
  label: string; value: string; sub?: string; delta?: string;
  positive?: boolean | null; accent?: string; icon?: string;
}) {
  const C = useTheme();
  const ac = accent || C.blue;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                  padding:"18px 20px", flex:1, minWidth:160, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                    background:`linear-gradient(90deg,${ac},transparent)` }} />
      <div style={{ fontSize:16, color:C.muted, letterSpacing:"0.07em",
                    textTransform:"uppercase", marginBottom:6 }}>{icon} {label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:ac,
                    fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{value}</div>
      {sub   && <div style={{ fontSize:16, color:C.muted, marginTop:4 }}>{sub}</div>}
      {delta && <div style={{ fontSize:16, color:positive===false ? C.red : C.green,
                               marginTop:3, fontWeight:600 }}>{delta}</div>}
    </div>
  );
}

function PageHeader({ icon, title, subtitle, right }: {
  icon: string; title: string; subtitle?: string; right?: ReactNode;
}) {
  const C = useTheme();
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                  marginBottom:28, paddingBottom:18, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:44, height:44, borderRadius:10, background:C.dim,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{icon}</div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:C.text, letterSpacing:"-0.03em", margin:0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize:16, color:C.muted, margin:"3px 0 0" }}>{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function Card({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
  const C = useTheme();
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`,
                  borderRadius:12, padding:22, ...style }}>{children}</div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  const C = useTheme();
  return (
    <div style={{ fontSize:16, fontWeight:700, color:C.muted, letterSpacing:"0.08em",
                  textTransform:"uppercase", marginBottom:14 }}>{children}</div>
  );
}

function Badge({ children, color }: { children: ReactNode; color?: string }) {
  const C = useTheme();
  const bc = color || C.blue;
  return (
    <span style={{ background:`${bc}22`, color:bc, fontSize:16, fontWeight:700,
                   letterSpacing:"0.06em", padding:"2px 9px", borderRadius:20 }}>{children}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: HOME / EXECUTIVE OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════
function PageHome({ navigate }: { navigate: (page: string) => void }) {
  const C = useTheme();
  const COLORS = [C.red, C.blue, C.purple, C.cyan, C.orange, C.green, C.gold, C.indigo, C.muted, C.textSub];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <PageHeader icon="🏛️" title="Executive Overview"
        subtitle="FY2026 Execution · FY2027 Congressional Action · FY2028 Formulation"
        right={
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:16, color:C.green, fontWeight:600 }}>● Live</div>
            <div style={{ fontSize:16, color:C.muted }}>Data: SEC FY2027 CBJ, April 2026</div>
          </div>
        }
      />

      {/* Alert Banner */}
      <div style={{ background:"rgba(245,158,11,0.08)", border:`1px solid rgba(245,158,11,0.3)`,
                    borderRadius:10, padding:"13px 18px", display:"flex", gap:12, alignItems:"center" }}>
        <span style={{ fontSize:18 }}>⚠️</span>
        <div>
          <div style={{ fontSize:17, fontWeight:700, color:C.gold }}>
            FY2027 Appropriations Pending — Senate FSGG Markup Scheduled June 2026
          </div>
          <div style={{ fontSize:16, color:C.muted, marginTop:2 }}>
            SEC's $1.908B request (11% below FY2026 enacted) requires congressional action before Oct 1, 2027.
            OSO planning must account for ±10% variance until enacted level is confirmed.
          </div>
        </div>
        <button onClick={() => navigate("news")}
          style={{ marginLeft:"auto", flexShrink:0, background:C.gold, border:"none",
                   borderRadius:7, padding:"6px 14px", fontSize:16, fontWeight:700,
                   color:"#000", cursor:"pointer" }}>View Intel →</button>
      </div>

      {/* KPI Row */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <KPI label="FY27 Budget Request" value="$1.908B" sub="SEC Operations · 11% reduction"
          delta="−$241M vs FY26 enacted" positive={false} accent={C.orange} icon="💰" />
        <KPI label="FY26 Enacted" value="$2.149B" sub="Year of Execution · Active"
          delta="4,024 FTE authorized" positive={true} accent={C.green} icon="⚡" />
        <KPI label="FY27 FTE Request" value="4,177" sub="Full-Time Equivalents"
          delta="+153 compensation adds" positive={true} accent={C.blue} icon="👥" />
        <KPI label="Personnel Share" value="69.1%" sub="Comp + Benefits of obligations"
          delta="$1,434.9M of $2,078M" positive={null} accent={C.purple} icon="📊" />
        <KPI label="Deficit Impact" value="$0" sub="Fee-offset — deficit neutral"
          delta="Section 31 / §6(b)" positive={true} accent={C.cyan} icon="⚖️" />
      </div>

      {/* Budget Trend + Program Breakdown */}
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16 }}>
        <Card>
          <SectionLabel>Budget Trajectory FY23 – FY27 ($M) · Enacted vs Requested</SectionLabel>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={BUDGET_HISTORY} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.dim} />
              <XAxis dataKey="fy" tick={{ fill:C.muted, fontSize:12 }} />
              <YAxis yAxisId="l" domain={[1700,2700]} tick={{ fill:C.muted, fontSize:12 }}
                     tickFormatter={v=>`$${v}M`} />
              <YAxis yAxisId="r" orientation="right" domain={[3700,5100]}
                     tick={{ fill:C.muted, fontSize:12 }} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:12, color:C.muted }} />
              <Bar yAxisId="l" dataKey="enacted"   name="Enacted ($M)"   fill={C.blue}   radius={[3,3,0,0]} opacity={0.85} />
              <Bar yAxisId="l" dataKey="requested" name="Requested ($M)" fill={C.orange} radius={[3,3,0,0]} opacity={0.65} />
              <Line yAxisId="r" type="monotone" dataKey="fte" name="FTE"
                    stroke={C.cyan} strokeWidth={2} dot={{ fill:C.cyan, r:4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionLabel>FY27 Program Obligations ($M) · Top 6 Mission Areas</SectionLabel>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={PROGRAM_DATA.slice(0,6)} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.dim} />
              <XAxis type="number" tick={{ fill:C.muted, fontSize:12 }}
                     tickFormatter={v=>`$${v}M`} />
              <YAxis type="category" dataKey="prog" tick={{ fill:C.muted, fontSize:12 }} width={130} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="fy27" name="FY27 ($M)" radius={[0,4,4,0]}>
                {PROGRAM_DATA.slice(0,6).map((_,i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Strategic Priorities */}
      <Card>
        <SectionLabel>FY2027 Strategic Priorities — From CBJ Executive Summary, April 2026</SectionLabel>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {[
            { icon:"₿", title:"Project Crypto", color:C.gold,
              text:"Comprehensive regulatory framework for digital assets, tokenized securities, stablecoin classification. Basis for increased examination workload." },
            { icon:"🚀", title:"Capital Formation", color:C.green,
              text:"IPO modernization — review disclosure burdens, expand private market investor access, innovation exemption framework under Chairman Atkins." },
            { icon:"🤖", title:"AI Integration", color:C.cyan,
              text:"AI Task Force centralizing governance across agency. EDGAR cloud modernization, AI-enhanced market surveillance, commercial off-the-shelf technology priority." },
            { icon:"📉", title:"Fiscal Discipline", color:C.orange,
              text:"$1.908B = 11% reduction. $145M carryover + $25M recoveries offset current services. Deficit-neutral via Section 31 fee offset. Lean workforce realignment." },
          ].map((p,i) => (
            <div key={i} style={{ background:C.surface, borderRadius:8, padding:"16px 14px",
                                   border:`1px solid ${C.border}`, borderLeft:`3px solid ${p.color}` }}>
              <div style={{ fontSize:22, marginBottom:7 }}>{p.icon}</div>
              <div style={{ fontSize:17, fontWeight:700, color:p.color, marginBottom:7 }}>{p.title}</div>
              <div style={{ fontSize:16, color:C.muted, lineHeight:1.55 }}>{p.text}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Nav Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { page:"execution",  icon:"⚡", label:"Budget Execution",       sub:"ADA risk · Object class · Burn rate", color:C.green  },
          { page:"formulation",icon:"🔭", label:"Planning & Formulation", sub:"FY2028 builder · A-11 timeline",     color:C.purple },
          { page:"programs",   icon:"🎯", label:"Program Analysis",       sub:"10 offices · FTE · Cost drivers",    color:C.blue   },
          { page:"news",       icon:"📡", label:"Live Intelligence",      sub:"Congressional · Market · Budget",     color:C.gold   },
        ].map((n,i) => (
          <button key={i} onClick={() => navigate(n.page)}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                     padding:"18px 16px", cursor:"pointer", textAlign:"left",
                     borderTop:`3px solid ${n.color}`, transition:"border-color 0.2s" }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{n.icon}</div>
            <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:5 }}>{n.label}</div>
            <div style={{ fontSize:16, color:C.muted }}>{n.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: BUDGET EXECUTION
// ═══════════════════════════════════════════════════════════════════════════
function PageExecution() {
  const C = useTheme();
  const [burn, setBurn] = useState(74);
  const enacted = 2149;
  const months = ["Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"];
  const ytdMonths = 8;
  const ytdObl  = Math.round(enacted * (burn/100) * (ytdMonths/12));
  const projFull = Math.round(enacted * (burn/100));
  const unoblig  = enacted - ytdObl;
  const adaRisk  = projFull > enacted * 1.005;

  const monthlyData = months.map((m,i) => ({
    month: m,
    plan: Math.round(enacted / 12),
    actual: i < ytdMonths ? Math.round(enacted / 12 * (burn/100) * (i < 3 ? 0.91 : 1.01)) : undefined,
    projected: i >= ytdMonths - 1 ? Math.round(enacted / 12 * (burn/100)) : undefined,
  }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <PageHeader icon="⚡" title="Budget Execution Monitor"
        subtitle="FY2026 · Enacted $2,149M · 4,024 FTE · OMB Circular A-11 §120 Apportionment Framework" />

      {adaRisk && (
        <div style={{ background:"rgba(239,68,68,0.1)", border:`1px solid ${C.red}`,
                      borderRadius:10, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
          <span style={{ fontSize:22 }}>🚨</span>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:C.red }}>
              ANTI-DEFICIENCY ACT RISK — Projected Obligations May Exceed Enacted Appropriation
            </div>
            <div style={{ fontSize:16, color:C.muted, marginTop:4, lineHeight:1.6 }}>
              <strong>Statute:</strong> 31 U.S.C.§1341 — prohibits obligations exceeding apportioned amounts.<br/>
              <strong>Projected:</strong> ${projFull.toLocaleString()}M vs ${enacted.toLocaleString()}M enacted.
              Immediately notify OMB, impose obligation freeze on non-mission-critical contracts,
              review apportionment with OCFO.
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <KPI label="YTD Obligations" value={`$${ytdObl.toLocaleString()}M`}
          sub={`Through May FY2026 (${ytdMonths} months)`}
          delta={`${(ytdObl/enacted*100).toFixed(1)}% of enacted`}
          positive={null} accent={C.blue} icon="📋" />
        <KPI label="Projected Full Year" value={`$${projFull.toLocaleString()}M`}
          sub={`vs $${enacted}M enacted`}
          delta={adaRisk ? "⚠️ ADA RISK" : "✓ Within enacted limit"}
          positive={!adaRisk} accent={adaRisk ? C.red : C.green} icon="📊" />
        <KPI label="Unobligated Balance" value={`$${unoblig.toLocaleString()}M`}
          sub="Remaining authority" delta="Subject to apportionment" positive={null} accent={C.gold} icon="💼" />
        <KPI label="Obligation Rate" value={`${burn}%`} sub="of enacted (annualized)"
          delta="Drag slider to model" positive={null} accent={C.cyan} icon="🔥" />
      </div>

      {/* Burn Rate Simulator */}
      <Card>
        <SectionLabel>ADA Risk Simulator — FY2026 Obligation Burn Rate Modeler</SectionLabel>
        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:16, color:C.muted }}>Annual Burn Rate (% of $2,149M enacted)</span>
            <span style={{ fontSize:16, fontWeight:700, color:adaRisk ? C.red : C.blue,
                           fontFamily:"monospace" }}>{burn}%</span>
          </div>
          <input type="range" min={55} max={115} value={burn}
            onChange={e => setBurn(+e.target.value)}
            style={{ width:"100%", accentColor: adaRisk ? C.red : C.blue }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, color:C.muted, marginTop:4 }}>
            <span>55% — Under-obligation risk (program delays)</span>
            <span>100% — Full execution</span>
            <span>115% — ADA violation</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.dim} />
            <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:12 }} />
            <YAxis tick={{ fill:C.muted, fontSize:12 }} tickFormatter={v=>`$${Math.round(v/1000)}M`} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:12, color:C.muted }} />
            <ReferenceLine y={enacted/12} stroke={C.orange} strokeDasharray="6 3"
              label={{ value:"Monthly Plan", fill:C.orange, fontSize:12, position:"insideTopRight" }} />
            <Bar dataKey="plan"      name="Monthly Plan ($K)"   fill={C.dim}    radius={[2,2,0,0]} opacity={0.5} />
            <Bar dataKey="actual"    name="Actual ($K)"         fill={C.blue}   radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="projected" name="Projected ($K)"
              stroke={adaRisk ? C.red : C.gold} strokeWidth={2} strokeDasharray="7 3"
              dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Object Class Table */}
      <Card>
        <SectionLabel>Object Class Execution — FY25 Actual · FY26 Enacted · FY27 Request · Dollars in Thousands</SectionLabel>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:16 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["OC Code","Object Class","FY25 Actual","FY26 Enacted","FY27 Request","Δ FY26→FY27","FY27 %"].map(h => (
                  <th key={h} style={{ padding:"9px 12px", textAlign: h==="Object Class" ? "left" : "right",
                    color:C.muted, fontSize:16, fontWeight:600, letterSpacing:"0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OBJ_CLASS.map((r,i) => {
                const delta = r.fy27 - r.fy26;
                const deltaPct = ((delta/r.fy26)*100).toFixed(1);
                return (
                  <tr key={i} style={{ borderBottom:`1px solid rgba(30,60,120,0.15)`,
                                        background: i%2===0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                    <td style={{ padding:"8px 12px", textAlign:"right", color:C.muted,
                                  fontFamily:"monospace", fontSize:16 }}>{r.code}</td>
                    <td style={{ padding:"8px 12px", color:C.text, fontWeight: i<2 ? 700 : 400 }}>{r.name}</td>
                    <td style={{ padding:"8px 12px", textAlign:"right", color:C.muted,
                                  fontFamily:"monospace" }}>{r.fy25.toLocaleString()}</td>
                    <td style={{ padding:"8px 12px", textAlign:"right", color:C.muted,
                                  fontFamily:"monospace" }}>{r.fy26.toLocaleString()}</td>
                    <td style={{ padding:"8px 12px", textAlign:"right", color:C.blue,
                                  fontFamily:"monospace", fontWeight:600 }}>{r.fy27.toLocaleString()}</td>
                    <td style={{ padding:"8px 12px", textAlign:"right",
                                  color: delta < 0 ? C.green : delta > 0 ? C.orange : C.muted,
                                  fontFamily:"monospace", fontWeight:600 }}>
                      {delta >= 0 ? "+" : ""}{delta.toLocaleString()} ({delta >= 0 ? "+" : ""}{deltaPct}%)
                    </td>
                    <td style={{ padding:"8px 12px", textAlign:"right" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
                        <div style={{ width:60, background:C.dim, borderRadius:3, height:5 }}>
                          <div style={{ width:`${Math.min(r.pct*3,100)}%`, height:"100%",
                                         background: i<2 ? C.purple : C.blue, borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:16, color:C.muted }}>{r.pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop:`1px solid ${C.border}`, fontWeight:700 }}>
                <td colSpan={2} style={{ padding:"10px 12px", color:C.text }}>TOTAL OBLIGATIONS</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color:C.muted, fontFamily:"monospace" }}>2,199,428</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color:C.muted, fontFamily:"monospace" }}>2,031,893</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color:C.blue, fontFamily:"monospace" }}>2,078,000</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color:C.orange, fontFamily:"monospace" }}>+46,107 (+2.3%)</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Apportionment Law Box */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {[
          { title:"Anti-Deficiency Act", cite:"31 U.S.C. §1341", color:C.red, icon:"⚖️",
            points:["Prohibits obligations/expenditures exceeding available appropriations","Applies to annual, multi-year, and no-year funds","Violations: administrative + criminal sanctions","Reporting: agency head → President → Congress (§1351)"] },
          { title:"Apportionment Authority", cite:"OMB Circular A-11 §120", color:C.gold, icon:"📋",
            points:["OMB apportions funds quarterly — limits when obligations can be incurred","Agencies may not obligate beyond apportioned amounts","Reapportionment request required for unanticipated needs","OSO monitors allotment subcategories by program office"] },
        ].map((b,i) => (
          <Card key={i}>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:22 }}>{b.icon}</span>
              <div>
                <div style={{ fontSize:17, fontWeight:700, color:b.color }}>{b.title}</div>
                <div style={{ fontSize:16, color:C.muted }}>{b.cite}</div>
              </div>
            </div>
            {b.points.map((p,j) => (
              <div key={j} style={{ display:"flex", gap:8, marginBottom:7, alignItems:"flex-start" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:b.color,
                               marginTop:5, flexShrink:0 }} />
                <span style={{ fontSize:16, color:C.muted, lineHeight:1.5 }}>{p}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: PLANNING & FORMULATION
// ═══════════════════════════════════════════════════════════════════════════
function PageFormulation() {
  const C = useTheme();
  const [fy28p, setFy28p] = useState(1060);
  const [fy28c, setFy28c] = useState(475);
  const [fy28it, setFy28it] = useState(115);
  const [fy28o, setFy28o] = useState(105);
  const total = fy28p + fy28c + fy28it + fy28o;
  const delta = total - 1908;
  const overCeil = total > 2050;

  const timeline = [
    { phase:"Spring 2026", task:"OMB A-11 Guidance Issued",              status:"done",    detail:"FY2028 budget call; DOGE 10% efficiency targets required" },
    { phase:"May–Jun 2026", task:"Internal Program Assessments",          status:"active",  detail:"OSO collects program-office needs; baseline analysis underway" },
    { phase:"Jul 2026",    task:"OMB Submission & Passback",              status:"pending", detail:"Agency submits to OMB; OMB returns with allocation decisions" },
    { phase:"Aug 2026",    task:"Appeals & Final Reconciliation",          status:"pending", detail:"Agency appeals window; final CFO sign-off" },
    { phase:"Sep 2026",    task:"Internal Budget Review Committee",        status:"pending", detail:"SECRC review; congressional narrative finalized" },
    { phase:"Feb 2027",    task:"President's Budget Submission",           status:"pending", detail:"FY2028 CBJ delivered to Congress (first Monday in February)" },
    { phase:"Mar–Sep 2027",task:"Congressional Action",                   status:"pending", detail:"Hearings, FSGG markup, authorization, appropriations floor votes" },
    { phase:"Oct 1, 2027", task:"FY2028 Execution Begins",                status:"pending", detail:"Apportionment released; allotments issued; obligations authorized" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <PageHeader icon="🔭" title="Budget Planning & Formulation"
        subtitle="FY2026 Execution · FY2027 Congressional Action · FY2028 Formulation — OMB Circular A-11" />

      {/* 3-Year Framework */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
        {[
          { fy:"FY2026", role:"Year of Execution", color:C.green, icon:"⚡",
            items:["Enacted: $2,149M · 4,024 FTE","Obligations tracking through Q3","ADA monitoring — burn rate ~74%","OMB quarterly apportionment review","Reprogramming authority: 31 U.S.C.§1532","Year-end obligation acceleration plan"] },
          { fy:"FY2027", role:"Congressional Action Year", color:C.gold, icon:"🏛️",
            items:["Request: $1,908M · 4,177 FTE","11% reduction from FY2026 enacted","Senate FSGG markup — June 2026","Section 31 fee-offset deficit-neutral","Project Crypto regulatory build-out","AI Task Force FY2027 implementation"] },
          { fy:"FY2028", role:"Formulation & Planning", color:C.purple, icon:"🔭",
            items:["Internal assessments underway","A-11 Spring 2026 guidance received","DOGE 10% efficiency mandate","Program justification drafts due July","Strategic plan FY22–26 alignment","CBJ submission: February 2027"] },
        ].map((c,i) => (
          <Card key={i} style={{ borderTop:`3px solid ${c.color}` }}>
            <div style={{ fontSize:16, color:c.color, fontWeight:700, letterSpacing:"0.08em", marginBottom:3 }}>{c.icon} {c.fy}</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:14 }}>{c.role}</div>
            {c.items.map((item,j) => (
              <div key={j} style={{ display:"flex", gap:8, marginBottom:7, alignItems:"flex-start" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:c.color, marginTop:5, flexShrink:0 }} />
                <span style={{ fontSize:16, color:C.muted }}>{item}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* FY2028 Builder */}
      <Card>
        <SectionLabel>FY2028 Budget Formulation Workspace — Interactive Resource Planning Tool</SectionLabel>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
          <div>
            <div style={{ fontSize:16, color:C.muted, marginBottom:16, lineHeight:1.6 }}>
              Adjust resource levers to model FY2028 submission. Tool checks against projected OMB ceiling
              (~$1,800–$2,050M based on FY2025–2027 trajectory and DOGE efficiency mandate).
            </div>
            {[
              { label:"Personnel Comp & Benefits (OC 11+12)", key:"fy28p", val:fy28p, set:setFy28p, min:900, max:1400, color:C.purple, note:"~69% of total — dominant cost driver" },
              { label:"Other Contractual Services (OC 25.0)", key:"fy28c", val:fy28c, set:setFy28c, min:420, max:580, color:C.blue, note:"IT contracts, professional services" },
              { label:"Rent, IT & Equipment (OC 23+31)", key:"fy28it", val:fy28it, set:setFy28it, min:80, max:180, color:C.cyan, note:"Cloud migration, EDGAR infrastructure" },
              { label:"All Other Object Classes", key:"fy28o", val:fy28o, set:setFy28o, min:60, max:150, color:C.gold, note:"Travel, supplies, printing, insurance" },
            ].map((s,i) => (
              <div key={i} style={{ marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <div>
                    <span style={{ fontSize:16, color:C.text }}>{s.label}</span>
                    <div style={{ fontSize:16, color:C.muted }}>{s.note}</div>
                  </div>
                  <span style={{ fontSize:17, fontWeight:700, color:s.color,
                                  fontFamily:"monospace" }}>${s.val}M</span>
                </div>
                <input type="range" min={s.min} max={s.max} value={s.val}
                  onChange={e => s.set(+e.target.value)}
                  style={{ width:"100%", accentColor:s.color }} />
              </div>
            ))}
          </div>

          <div style={{ background:C.surface, borderRadius:10, padding:22,
                         display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ fontSize:17, fontWeight:700, color:C.text }}>FY2028 Submission Preview</div>
            <div>
              <div style={{ fontSize:16, color:C.muted, marginBottom:4 }}>Total Budget Request</div>
              <div style={{ fontSize:30, fontWeight:800, color:C.blue,
                             fontFamily:"monospace" }}>${total.toLocaleString()}M</div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:12,
                           borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:16, color:C.muted }}>vs. FY2027 Request ($1,908M)</span>
              <span style={{ fontSize:17, fontWeight:700,
                              color: delta>0 ? C.orange : C.green }}>
                {delta>=0?"+":""}{delta}M ({delta>=0?"+":""}{(delta/1908*100).toFixed(1)}%)
              </span>
            </div>
            <div>
              <div style={{ fontSize:16, color:C.muted, marginBottom:10 }}>Resource Composition</div>
              {[
                { label:"Personnel", val:fy28p, color:C.purple },
                { label:"Contracts", val:fy28c, color:C.blue   },
                { label:"IT/Equip",  val:fy28it, color:C.cyan  },
                { label:"Other",     val:fy28o, color:C.gold   },
              ].map((b,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:72, fontSize:16, color:C.muted }}>{b.label}</div>
                  <div style={{ flex:1, background:C.dim, borderRadius:3, height:8 }}>
                    <div style={{ width:`${b.val/total*100}%`, height:"100%",
                                   background:b.color, borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:16, color:b.color, fontFamily:"monospace",
                                  width:44, textAlign:"right" }}>{(b.val/total*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div style={{ background: overCeil ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.08)",
                           border:`1px solid ${overCeil ? C.red : C.green}`,
                           borderRadius:8, padding:12 }}>
              <div style={{ fontSize:16, fontWeight:700, color: overCeil ? C.red : C.green }}>
                {overCeil ? "⚠️ Exceeds projected OMB ceiling — additional justification required" : "✓ Within projected OMB ceiling band"}
              </div>
              <div style={{ fontSize:16, color:C.muted, marginTop:4 }}>
                Projected ceiling: ~$1,800–$2,050M based on FY2025–2027 trajectory + DOGE mandate
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* A-11 Timeline */}
      <Card>
        <SectionLabel>FY2028 A-11 Budget Cycle — Current Status: May 30, 2026</SectionLabel>
        <div style={{ position:"relative" }}>
          {timeline.map((s,i) => (
            <div key={i} style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0,
                               background: s.status==="done" ? C.green : s.status==="active" ? C.blue : C.dim,
                               display:"flex", alignItems:"center", justifyContent:"center",
                               fontSize:16, fontWeight:700, color:"#fff" }}>
                  {s.status==="done" ? "✓" : s.status==="active" ? "●" : i+1}
                </div>
                {i < timeline.length-1 && (
                  <div style={{ width:2, height:30, background:C.dim, marginTop:2 }} />
                )}
              </div>
              <div style={{ paddingBottom: i < timeline.length-1 ? 14 : 0 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:16, color:C.gold, fontFamily:"monospace",
                                  background:`${C.gold}15`, padding:"1px 7px",
                                  borderRadius:4 }}>{s.phase}</span>
                  <span style={{ fontSize:17, fontWeight:600,
                                  color: s.status==="active" ? C.blue : C.text }}>{s.task}</span>
                  {s.status==="done" && <Badge color={C.green}>Completed</Badge>}
                  {s.status==="active" && <Badge color={C.blue}>In Progress</Badge>}
                </div>
                <div style={{ fontSize:16, color:C.muted, marginTop:3 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: PROGRAM ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════
function PagePrograms() {
  const C = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const COLORS = [C.red,C.blue,C.purple,C.cyan,C.orange,C.green,C.gold,C.indigo,C.textSub,C.muted];

  const fteChange = PROGRAM_DATA.map(p => ({
    prog: p.prog,
    change: p.fte27 - p.fte26,
    pct: (((p.fte27 - p.fte26) / p.fte26)*100).toFixed(1),
  }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <PageHeader icon="🎯" title="Program Analysis"
        subtitle="10 Program Offices · FTE & Obligations · FY25 Actual → FY27 Request · Source: CBJ Tables pp.8-9" />

      {/* Program vs FTE side by side */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <SectionLabel>Obligations by Program ($M) — FY25 · FY26 · FY27</SectionLabel>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={PROGRAM_DATA} layout="vertical" barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.dim} />
              <XAxis type="number" tick={{ fill:C.muted, fontSize:12 }} tickFormatter={v=>`$${v}M`} />
              <YAxis type="category" dataKey="prog" tick={{ fill:C.muted, fontSize:12 }} width={130} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:12, color:C.muted }} />
              <Bar dataKey="fy25" name="FY25 Actual ($M)"   fill={C.muted}   radius={[0,3,3,0]} opacity={0.5} />
              <Bar dataKey="fy26" name="FY26 Enacted ($M)"  fill={C.blue}    radius={[0,3,3,0]} opacity={0.7} />
              <Bar dataKey="fy27" name="FY27 Request ($M)"  fill={C.cyan}    radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionLabel>FTE by Program — FY26 Enacted vs FY27 Request</SectionLabel>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={PROGRAM_DATA} layout="vertical" barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.dim} />
              <XAxis type="number" tick={{ fill:C.muted, fontSize:12 }} />
              <YAxis type="category" dataKey="prog" tick={{ fill:C.muted, fontSize:12 }} width={130} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:12, color:C.muted }} />
              <Bar dataKey="fte26" name="FY26 FTE"  fill={C.purple}  radius={[0,3,3,0]} opacity={0.65} />
              <Bar dataKey="fte27" name="FY27 FTE"  fill={C.orange}  radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* FTE Change Table */}
      <Card>
        <SectionLabel>FTE Change Analysis — FY26 Enacted → FY27 Request · Mission Impact Assessment</SectionLabel>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:16 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Program Office","FY25 Actual","FY26 Enacted","FY27 Request","FTE Δ","% Δ","$/FTE FY27","Mission Share"].map(h => (
                <th key={h} style={{ padding:"8px 12px", textAlign:h==="Program Office"?"left":"right",
                  color:C.muted, fontSize:16, fontWeight:600, letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROGRAM_DATA.map((p,i) => {
              const delta = p.fte27 - p.fte26;
              const costPerFte = Math.round(p.fy27*1000/p.fte27);
              const share = (p.fy27 / PROGRAM_DATA.reduce((s,x)=>s+x.fy27,0)*100).toFixed(1);
              return (
                <tr key={i} style={{ borderBottom:`1px solid rgba(30,60,120,0.15)`,
                                      background: i%2===0 ? "transparent":"rgba(255,255,255,0.014)",
                                      cursor:"pointer" }}>
                  <td style={{ padding:"9px 12px", color:C.text, fontWeight:500 }}>{p.prog}</td>
                  <td style={{ padding:"9px 12px", textAlign:"right", color:C.muted, fontFamily:"monospace", fontSize:16 }}>{p.fte25}</td>
                  <td style={{ padding:"9px 12px", textAlign:"right", color:C.muted, fontFamily:"monospace", fontSize:16 }}>{p.fte26}</td>
                  <td style={{ padding:"9px 12px", textAlign:"right", color:C.blue,  fontFamily:"monospace", fontWeight:600 }}>{p.fte27}</td>
                  <td style={{ padding:"9px 12px", textAlign:"right", fontFamily:"monospace", fontWeight:700,
                                color: delta>0 ? C.green : delta<0 ? C.red : C.muted }}>
                    {delta>=0?"+":""}{delta}
                  </td>
                  <td style={{ padding:"9px 12px", textAlign:"right", fontFamily:"monospace",
                                color: delta>0 ? C.green : delta<0 ? C.red : C.muted }}>
                    {delta>=0?"+":""}{((delta/p.fte26)*100).toFixed(1)}%
                  </td>
                  <td style={{ padding:"9px 12px", textAlign:"right", color:C.gold, fontFamily:"monospace", fontSize:16 }}>
                    ${costPerFte.toLocaleString()}K
                  </td>
                  <td style={{ padding:"9px 12px", textAlign:"right" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
                      <div style={{ width:50, background:C.dim, borderRadius:3, height:5 }}>
                        <div style={{ width:`${parseFloat(share)*4}%`, height:"100%",
                                       background:COLORS[i], borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:16, color:C.muted }}>{share}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Section 31 Fee Revenue */}
      <Card>
        <SectionLabel>Section 31 Transaction Fee Revenue — FY21 to FY27 · Deficit-Neutral Funding Mechanism</SectionLabel>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={FEE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.dim} />
              <XAxis dataKey="fy" tick={{ fill:C.muted, fontSize:12 }} />
              <YAxis yAxisId="l" tick={{ fill:C.muted, fontSize:12 }} />
              <YAxis yAxisId="r" orientation="right" domain={[0,110]} tick={{ fill:C.muted, fontSize:12 }} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:12, color:C.muted }} />
              <Bar yAxisId="l" dataKey="rate" name="Fee Rate ($/M)" fill={C.gold} opacity={0.8} radius={[3,3,0,0]} />
              <Line yAxisId="r" dataKey="reserve" name="Reserve Fund ($M)" stroke={C.green} strokeWidth={2} dot={{ fill:C.green, r:3 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:10, justifyContent:"center" }}>
            {[
              { title:"Section 31 Authority", body:"Securities Exchange Act §31: authorizes transaction fees on equity security trades. Rate set annually by Section 6(b)." },
              { title:"FY2025 Rate = $0", body:"Fee rate set to zero when projected collections exceeded the appropriation — a unique self-correcting mechanism." },
              { title:"Reserve Fund Cap", body:"Reserve Fund capped at $100M per statute. Excess collections reduce the following year's fee rate." },
              { title:"Deficit-Neutral Design", body:"SEC's appropriation is fully offset by fee collections — operations add $0 to the federal deficit." },
            ].map((f,i) => (
              <div key={i} style={{ background:C.surface, borderRadius:7, padding:"10px 12px",
                                     border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.cyan, marginBottom:3 }}>{f.title}</div>
                <div style={{ fontSize:16, color:C.muted }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: LIVE INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════
function PageNews() {
  const C = useTheme();
  const [filter, setFilter] = useState("ALL");
  const [urgFilter, setUrgFilter] = useState("");
  const [feed, setFeed] = useState<NewsItem[]>(NEWS_FEED);
  const [feedSource, setFeedSource] = useState<"local"|"db"|"seed">("local");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date|null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function loadFeed() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/news-feed");
      const data = await r.json();
      if (Array.isArray(data.news) && data.news.length > 0) {
        setFeed(data.news as NewsItem[]);
        setFeedSource(data.source ?? "db");
        setLastRefresh(new Date());
      }
    } catch { /* silently keep current feed */ }
    setRefreshing(false);
  }

  useEffect(() => { loadFeed(); }, []);

  const urgColor: Record<string, string> = { HIGH:C.red, MEDIUM:C.gold, LOW:C.green };
  const catColor: Record<string, string> = {
    "Congressional Action":C.purple, "Budget Action":C.orange,
    "Market Intelligence":C.blue, "SEC Operations":C.cyan,
    "OIG & Compliance":C.red, "Procurement & Contracts":C.gold,
    "Federal Management":C.green,
  };
  const cats = ["ALL","Congressional Action","Budget Action","OIG & Compliance","Procurement & Contracts","SEC Operations","Federal Management"];
  const resetFilters = () => { setFilter("ALL"); setUrgFilter(""); };
  const isFiltered = filter !== "ALL" || !!urgFilter;
  let visible = filter === "ALL" ? feed : feed.filter(n => n.cat === filter);
  if (urgFilter) visible = visible.filter(n => n.urg === urgFilter);
  const srcColor = feedSource === "db" ? C.green : feedSource === "seed" ? C.gold : C.muted;
  const srcLabel = feedSource === "db" ? "Live DB" : feedSource === "seed" ? "Seed" : "Local";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <PageHeader icon="📡" title="Live Congressional & Market Intelligence"
        subtitle={`${feed.length} items · newest first · history preserved · OSO relevance scored`}
        right={
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, background:C.card,
                           border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 12px" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:srcColor }} />
              <span style={{ fontSize:14, color:srcColor, fontWeight:600 }}>{srcLabel}</span>
              {lastRefresh && <span style={{ fontSize:13, color:C.muted }}>· {lastRefresh.toLocaleTimeString()}</span>}
            </div>
            <button onClick={loadFeed} disabled={refreshing}
              style={{ background:refreshing?C.dim:`linear-gradient(135deg,${C.blue},${C.cyan})`,
                        border:"none", borderRadius:8, padding:"7px 16px",
                        color:"#fff", fontSize:14, fontWeight:700,
                        cursor:refreshing?"wait":"pointer",
                        opacity:refreshing?0.7:1, display:"flex", alignItems:"center", gap:6 }}>
              {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
            </button>
          </div>
        }
      />

      {/* Stat strip — clickable to filter */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        {[
          { label:"Total Items",      value:feed.length,                                             color:C.blue,   isActive: !isFiltered,                         onClick: resetFilters },
          { label:"HIGH Priority",    value:feed.filter(n=>n.urg==="HIGH").length,                   color:C.red,    isActive: urgFilter==="HIGH",                   onClick: ()=>{ urgFilter==="HIGH" ? resetFilters() : (setUrgFilter("HIGH"), setFilter("ALL")) } },
          { label:"OIG & Compliance", value:feed.filter(n=>n.cat==="OIG & Compliance").length,       color:C.orange, isActive: filter==="OIG & Compliance",          onClick: ()=>{ filter==="OIG & Compliance" ? resetFilters() : (setFilter("OIG & Compliance"), setUrgFilter("")) } },
          { label:"Congressional",    value:feed.filter(n=>n.cat==="Congressional Action").length,   color:C.purple, isActive: filter==="Congressional Action",      onClick: ()=>{ filter==="Congressional Action" ? resetFilters() : (setFilter("Congressional Action"), setUrgFilter("")) } },
          { label:"Budget Action",    value:feed.filter(n=>n.cat==="Budget Action").length,          color:C.gold,   isActive: filter==="Budget Action",             onClick: ()=>{ filter==="Budget Action" ? resetFilters() : (setFilter("Budget Action"), setUrgFilter("")) } },
          { label:"Procurement",      value:feed.filter(n=>n.cat==="Procurement & Contracts").length,color:C.cyan,   isActive: filter==="Procurement & Contracts",   onClick: ()=>{ filter==="Procurement & Contracts" ? resetFilters() : (setFilter("Procurement & Contracts"), setUrgFilter("")) } },
        ].map((s,i) => (
          <div key={i} onClick={s.onClick}
            style={{ flex:1, minWidth:100, background: s.isActive ? `${s.color}18` : C.card,
                      border:`1px solid ${s.isActive ? s.color : C.border}`,
                      borderRadius:9, padding:"12px 14px", borderTop:`3px solid ${s.color}`,
                      cursor:"pointer", transition:"all 0.18s",
                      boxShadow: s.isActive ? `0 0 0 1px ${s.color}40` : "none" }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:"monospace" }}>{s.value}</div>
            <div style={{ fontSize:13, color: s.isActive ? s.color : C.muted, fontWeight: s.isActive ? 600 : 400 }}>{s.label}</div>
            {s.isActive && <div style={{ fontSize:10, color:s.color, marginTop:2, letterSpacing:1 }}>▲ ACTIVE</div>}
          </div>
        ))}
      </div>

      {/* Filter pills + Reset */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        {cats.map(c => (
          <button key={c} onClick={()=>{ setFilter(c); setUrgFilter(""); }}
            style={{ background: filter===c && !urgFilter ? C.blue : C.card,
                      border:`1px solid ${filter===c && !urgFilter ? C.blue : C.border}`,
                      borderRadius:20, padding:"5px 15px", fontSize:16,
                      cursor:"pointer", color: filter===c && !urgFilter ? "#fff" : C.muted,
                      transition:"all 0.2s" }}>{c}</button>
        ))}
        {isFiltered && (
          <button onClick={resetFilters}
            style={{ background:"transparent", border:`1px solid ${C.red}60`,
                      borderRadius:20, padding:"5px 14px", fontSize:13,
                      cursor:"pointer", color:C.red, fontWeight:600,
                      transition:"all 0.2s", display:"flex", alignItems:"center", gap:5 }}>
            ✕ Reset
          </button>
        )}
        {isFiltered && (
          <span style={{ fontSize:13, color:C.muted, marginLeft:4 }}>
            Showing {visible.length} of {feed.length}
          </span>
        )}
      </div>

      {/* News cards — newest on top, all history shown */}
      {visible.map((item, idx) => (
        <div key={`${item.id}-${idx}`}
          style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`,
                    borderLeft:`5px solid ${urgColor[item.urg]}`, padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
                          alignItems:"flex-start", marginBottom:10, flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <Badge color={urgColor[item.urg]}>{item.urg} PRIORITY</Badge>
              <Badge color={catColor[item.cat]||C.blue}>{item.cat}</Badge>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>{item.src}</span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                     style={{ fontSize:13, color:C.blue, textDecoration:"none" }} title="Open source">↗</a>
                )}
              </div>
              {(item as any).published_at && (
                <span style={{ fontSize:12, color:C.muted }}>Published: {(item as any).published_at}</span>
              )}
              {/* fetched_at is already converted to ET in the DB query; item.time (UTC) is intentionally hidden */}
              {(item as any).fetched_at
                ? <span style={{ fontSize:11, color:C.dim, fontStyle:"italic" }}>Fetched: {(item as any).fetched_at}</span>
                : item.time
                  ? <span style={{ fontSize:12, color:C.muted }}>{item.time}</span>
                  : null}
            </div>
          </div>
          <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:8 }}>{item.headline}</div>
          <div style={{ fontSize:16, color:C.textSub, lineHeight:1.7, marginBottom:12 }}>{item.body}</div>
          <div style={{ background:`${C.gold}12`, border:`1px solid ${C.gold}30`,
                          borderRadius:7, padding:"9px 13px",
                          display:"flex", flexDirection: isMobile ? "column" : "row",
                          gap: isMobile ? 6 : 10, alignItems:"flex-start" }}>
            <span style={{ fontSize:15, fontWeight:700, color:C.gold, flexShrink:0 }}>💡 OSO IMPACT</span>
            <span style={{ fontSize:14, color:C.muted, flex:1, lineHeight:1.6 }}>{item.impact}</span>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                 style={{ fontSize:14, color:C.blue, textDecoration:"none",
                           fontWeight:600, flexShrink:0,
                           alignSelf: isMobile ? "flex-end" : "flex-start" }}>
                View Source →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: OIG FINDINGS & INTERNAL CONTROLS
// ═══════════════════════════════════════════════════════════════════════════
function PageOIG() {
  const C = useTheme();
  const OIG_FINDINGS = [
    { rpt:"OIG-582", title:"T&M Contract Management", div:"OSO/Acquisitions", status:"CLOSED", due:"Closed Mar 2025",
      recs:7, detail:"All 7 recommendations implemented and closed with OIG concurrence prior to April 1, 2025. Controls now embedded: T&M dashboard, COR SOPs, contract type matrix. Source: SEC Mgmt Report Apr–Sep 2025.", color:C.green },
    { rpt:"OIG-574", title:"FISMA FY2022 Evaluation", div:"OIT / OCOO", status:"IN PROGRESS", due:"Spring 2026",
      recs:13, detail:"12 of 13 recommendations closed. 1 remaining FISMA Level 3 control gap under remediation; completion anticipated spring 2026. Source: SEC Mgmt Report Apr–Sep 2025.", color:C.gold },
    { rpt:"OIG-584", title:"FISMA FY2024 Evaluation", div:"OIT / OCOO", status:"IN PROGRESS", due:"Spring 2026",
      recs:10, detail:"4 of 10 recommendations closed. 6 open recs covering ZTA, vulnerability management, access controls, incident response, and configuration management. Source: SEC Mgmt Report Apr–Sep 2025.", color:C.gold },
    { rpt:"OIG-585", title:"CAT Usage Oversight", div:"Trading & Markets", status:"OPEN", due:"TBD",
      recs:5, detail:"Additional oversight and monitoring of the SEC's CAT usage needed. New report issued during FY2025. Corrective actions being developed.", color:C.orange },
  ];
  const controls = [
    { ctrl:"Budget Formulation Review", type:"Preventive", frequency:"Annual", status:"Effective", owner:"OSO CFO", risk:"LOW" },
    { ctrl:"Obligation Approval Workflow", type:"Preventive", frequency:"Per transaction", status:"Effective", owner:"OSO/Budget", risk:"LOW" },
    { ctrl:"Monthly Obligation Reconciliation", type:"Detective", frequency:"Monthly", status:"Effective", owner:"OSO FM", risk:"LOW" },
    { ctrl:"ADA Threshold Monitoring", type:"Detective", frequency:"Weekly", status:"Needs Improvement", owner:"OSO FM", risk:"MEDIUM" },
    { ctrl:"T&M Contract COR Surveillance", type:"Preventive", frequency:"Monthly", status:"Effective", owner:"OSO/Acq", risk:"LOW" },
    { ctrl:"Year-End Obligation Closeout", type:"Detective", frequency:"Annual", status:"Effective", owner:"OSO FM", risk:"LOW" },
    { ctrl:"Apportionment Compliance Check", type:"Preventive", frequency:"Quarterly", status:"Effective", owner:"OSO/OMB", risk:"LOW" },
  ];
  const riskColor: Record<string, string> = { HIGH:C.red, MEDIUM:C.gold, LOW:C.green };
  const statusColor: Record<string, string> = { Effective:C.green, "Needs Improvement":C.gold, Deficient:C.red };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <PageHeader icon="🔍" title="OIG Findings & Internal Controls"
        subtitle="Open Recommendations · PIIA Compliance · FMFIA Internal Control Framework · OMB Circular A-123" />

      {/* OIG Summary KPIs */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <KPI label="Open Findings" value="3" sub="OIG-574, 584, 585" delta="Corrective actions in progress" positive={null} accent={C.gold} icon="⚠️" />
        <KPI label="In Progress" value="2" sub="OIG-574 (1 rec) · OIG-584 (6 recs)" delta="Both target spring 2026" positive={null} accent={C.gold} icon="🔄" />
        <KPI label="Closed (OIG-582)" value="✅" sub="All 7 recs closed before Apr 2025" delta="T&M controls now embedded" positive={true} accent={C.green} icon="✅" />
        <KPI label="Open Recs (OCOO)" value="7" sub="OIG-574: 1 · OIG-584: 6" delta="OIT primary; OCOO oversight" positive={null} accent={C.gold} icon="📋" />
      </div>

      {/* OIG Finding Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {OIG_FINDINGS.map((f,i) => (
          <Card key={i} style={{ borderLeft:`4px solid ${f.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:16, fontFamily:"monospace", color:f.color, fontWeight:700 }}>{f.rpt}</div>
                <div style={{ fontSize:16, fontWeight:700, color:C.text, marginTop:2 }}>{f.title}</div>
              </div>
              <Badge color={f.status==="CLOSED" ? C.green : f.status==="IN PROGRESS" ? C.gold : C.red}>
                {f.status}
              </Badge>
            </div>
            <div style={{ fontSize:16, color:C.muted, marginBottom:10, lineHeight:1.55 }}>{f.detail}</div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:16 }}>
              <span style={{ color:C.muted }}>Division: <span style={{ color:C.textSub }}>{f.div}</span></span>
              <span style={{ color:C.muted }}>Recs: <span style={{ color:f.color, fontWeight:600 }}>{f.recs}</span></span>
              <span style={{ color:C.muted }}>Due: <span style={{ color:C.gold }}>{f.due}</span></span>
            </div>
          </Card>
        ))}
      </div>

      {/* Internal Controls Table */}
      <Card>
        <SectionLabel>Internal Control Framework — PIIA / OMB A-123 / FMFIA Assessment</SectionLabel>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:16 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Control Activity","Type","Frequency","Status","Control Owner","Risk Level"].map(h => (
                <th key={h} style={{ padding:"8px 12px", textAlign:"left",
                  color:C.muted, fontSize:16, fontWeight:600, letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {controls.map((r,i) => (
              <tr key={i} style={{ borderBottom:`1px solid rgba(30,60,120,0.15)`,
                                    background:i%2===0?"transparent":"rgba(255,255,255,0.014)" }}>
                <td style={{ padding:"9px 12px", color:C.text, fontWeight:500 }}>{r.ctrl}</td>
                <td style={{ padding:"9px 12px", color:C.muted }}>{r.type}</td>
                <td style={{ padding:"9px 12px", color:C.muted }}>{r.frequency}</td>
                <td style={{ padding:"9px 12px" }}>
                  <Badge color={statusColor[r.status]||C.muted}>{r.status}</Badge>
                </td>
                <td style={{ padding:"9px 12px", color:C.muted }}>{r.owner}</td>
                <td style={{ padding:"9px 12px" }}>
                  <Badge color={riskColor[r.risk]}>{r.risk}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: AI ANALYST
// ═══════════════════════════════════════════════════════════════════════════
// ─── AI page module-level constants (must be outside component for stable refs) ──
const AI_PROVIDER_LABEL: Record<string, string> = { google:"Google", groq:"Groq", anthropic:"Anthropic" };
const AI_PROVIDER_ORDER: Array<"google" | "groq" | "anthropic"> = ["google", "groq", "anthropic"];

// ModelDropdown — OUTSIDE PageAI so React never remounts it on re-render
function ModelDropdown({ value, onChange, C }: { value: ModelId; onChange:(v:ModelId)=>void; C: any }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as ModelId)}
      style={{ width:"100%", background:C.surface, border:`1px solid ${C.borderAccent}`,
                borderRadius:8, padding:"9px 11px", color:C.text, fontSize:14,
                cursor:"pointer", outline:"none", fontFamily:"inherit" }}>
      {AI_PROVIDER_ORDER.map(prov => (
        <optgroup key={prov} label={`── ${AI_PROVIDER_LABEL[prov]} ──`}>
          {MODELS.filter(m => m.provider === prov).map(m => (
            <option key={m.id} value={m.id}>
              {m.name}{m.isDefault ? " ★" : ""}{m.badge ? ` [${m.badge}]` : ""}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// ChatPanel — OUTSIDE PageAI for the same reason
function ChatPanel({ msgs, isLoading, botRef, modelLabel, accent, C }: {
  msgs: ChatMsg[]; isLoading: boolean; botRef: React.RefObject<HTMLDivElement | null>;
  modelLabel: string; accent: string; C: any;
}) {
  return (
    <div style={{ flex:1, overflowY:"auto", background:C.surface, borderRadius:12,
                   border:`1px solid ${accent}44`, padding:16,
                   display:"flex", flexDirection:"column", gap:12, minHeight:0 }}>
      <div style={{ fontSize:12, fontWeight:700, color:accent, letterSpacing:"0.06em",
                     textTransform:"uppercase" as const, paddingBottom:8,
                     borderBottom:`1px solid ${C.border}` }}>{modelLabel}</div>
      {msgs.length === 0 && !isLoading && (
        <div style={{ textAlign:"center", color:C.muted, padding:"30px 0", fontSize:14 }}>
          Awaiting response from {modelLabel}...
        </div>
      )}
      {msgs.map((m,i) => (
        <div key={i} style={{
          alignSelf: m.role==="user" ? "flex-end" : "flex-start",
          maxWidth:"92%",
          background: m.role==="user" ? `${C.blue}15` : `${accent}10`,
          border:`1px solid ${m.role==="user" ? `${C.blue}30` : `${accent}30`}`,
          borderRadius:10, padding:"10px 14px"
        }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:4,
                         display:"flex", justifyContent:"space-between", gap:8 }}>
            <span>{m.role==="user" ? "YOU" : "AI"}</span>
            {m.role==="assistant" && m.modelUsed && (
              <span style={{ color:accent, fontFamily:"monospace",
                              background:`${accent}15`, padding:"1px 6px", borderRadius:3 }}>
                {m.modelUsed}
              </span>
            )}
          </div>
          <div style={{ fontSize:14, color:C.text, lineHeight:1.65, whiteSpace:"pre-wrap" as const }}>{m.content}</div>
        </div>
      ))}
      {isLoading && (
        <div style={{ alignSelf:"flex-start", background:`${accent}10`,
                       border:`1px solid ${accent}30`, borderRadius:10, padding:"10px 14px" }}>
          <div style={{ fontSize:12, color:accent }}>Analyzing with {modelLabel}...</div>
        </div>
      )}
      <div ref={botRef} />
    </div>
  );
}

type ChatMsg = { role: string; content: string; modelUsed?: string };

async function callAI(messages: ChatMsg[], modelId: string): Promise<{text:string;modelUsed?:string}> {
  const res = await fetch("/api/ai-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, task: "best", modelId }),
  });
  // Parse safely — Vercel/proxy errors can return non-JSON bodies
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    const raw = await res.text().catch(() => "");
    throw new Error(raw.slice(0, 200) || `HTTP ${res.status} — non-JSON response from AI endpoint`);
  }
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status} — AI endpoint error`);
  if (!data.text) throw new Error(data.error ?? "Model returned an empty response. Try a different model.");
  return { text: data.text, modelUsed: data.modelUsed };
}

function PageAI() {
  const C = useTheme();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL_ID);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareModel, setCompareModel] = useState<ModelId>(DEFAULT_MODEL_ID);
  const [compareMessages, setCompareMessages] = useState<ChatMsg[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const compareBotRef = useRef<HTMLDivElement>(null);

  const OSO_CONTEXT = `You are an expert federal financial management analyst embedded in the SEC Office of Support Operations (OSO).
OSO is responsible for: FOIA Services (OFS), Physical Security & Emergency (OSBO-PSE), Personnel Security, Construction & Leasing, Facilities Operations, Administrative & Mission Resilience (OAMR), and Business Management & Continuity Branch (BMCB).
Key figures (names anonymized — dummy identifiers used): J. Harrison (Chief, BMCB / direct supervisor), R. Buckley (AD for Operations), T. Laurent (OSO Director), N. Kauffman (CFO/OFM).
Operational staff (dummy names): C. Reeves (AD Security & Building Ops), D. Mitchell (AD FOIA Services), R. Jackson (COR — security contracts), S. Park (Admin Officer / GPC), L. Torres (Facilities COR), K. Webb/M. Chen/A. Rivera (GPC cardholders).

BUDGET EXECUTION — FY2026 (current operating year · June 1 · Month 9 of 12):
OSO TOTAL MANAGED OBLIGATIONS: ~$112M FY2026. This reflects TWO layers: (1) OSO Organizational Budget ($37M, per FY2025 CBJ p.74-75 — personnel $25M + NPE $12M), PLUS (2) OSO Program Execution funds administered from the Agency Direction appropriation: facility leases OSBO-CL ($58.5M — 12 locations; CBJ Appropriations Language p.16 explicitly authorizes "rental of space including multiple year leases"), physical security OSBO-PSE ($19.5M — guard contracts HQ + 11 regionals). Total managed: $112M. OFM's OC 23.0 agency-wide = $109M (CBJ p.13); OSO-administered lease share = $58.5M. YTD: ~$86M = 76.9% — on track vs. 75% benchmark. OSBO-PSE at 83% (T&M high burn). OSBO-CL at 75% (lease payments monthly/predictable). NOTE: OIT organizational budget = $112.7M separately.
OIG status: OIG-582 (T&M contract management) — CLOSED, all 7 recs implemented before Apr 2025; controls embedded. Currently open: OIG-574 FISMA FY2022 (1 rec remaining, spring 2026), OIG-584 FISMA FY2024 (6 of 10 recs, spring 2026). No OSO-specific open OIG findings as of Sep 30, 2025. T&M COR surveillance SOPs remain in effect per OIG-582 corrective action — oversight continues even though finding is closed.
GPC cardholders: K. Webb (OFS-R1, $2.5K limit), S. Park (OSBO-FSS, $10K limit — 1 pending reconciliation), M. Chen (OSBO-FO, $5K), A. Rivera (OFS-R3, $2.5K). Reconciliation deadline: 5 business days per OMB A-123 Appendix B.

PAYROLL & FTE — OC 11.0 / OC 12.0:
SEC uses the SK pay scale (not GS) — administratively determined, ranges parallel to GS but titled SK-1 through SK-17.
OSO BMCB authorized: 9 positions. Current onboard: 7 FTE. Vacancies: 2 (SK-12 Budget Analyst in BMCB, SK-11 Program Analyst in OFS).
Annual onboard payroll: ~$977K OC 11.0 + ~$263K OC 12.0 = ~$1.04M total personnel cost (BMCB direct staff only).
Benefits loaded at 30% of base per OMB standard fringe rate (A-11 §85). 26 pay periods in FY2027.
FY2026 payroll allotment (OC 11+12): $4.2M (all OSO offices). YTD after 17 pay periods: ~$2.75M. Burn rate: ~65.4% — on track for Month 9 (projected year-end ~$4.2M).
Key payroll positions: J. Harrison SK-14 (Branch Chief BMCB), FM Specialist SK-13, D. Mitchell SK-14 (AD OFS), C. Reeves SK-14 (AD OSBO-PSE), R. Jackson SK-12 (COR).
Vacancy savings: lapsed salary cannot be reprogrammed without OFM approval. ADA risk if projections exceed $4.2M allotment (31 U.S.C. §1341).
If both vacancies are filled, projected FY end personnel cost increases by ~$235K — would exceed allotment and trigger ADA review.

TRAVEL — OC 21.0:
FY2027 OSO travel budget (OC 21.0): $85,000 allotment.
YTD travel obligations (approved + completed): ~$7,660 (~9% burn). On track.
Active travel requests: 6 total — 2 approved, 2 pending BMCB approval, 1 completed, 1 draft.
Pending approval: C. Reeves (Atlanta, $1,640) and D. Mitchell (San Francisco, $2,950) — both require J. Harrison sign-off.
GTC (Government Travel Card) program: 5 active Citibank cards. FM Specialist card has outstanding voucher ($1,230) due within 5 days per FTR §301-52.
FTR compliance (41 CFR 301-304 — governs all non-DoD civilian agencies including the SEC; JTR is DoD-only and does NOT apply): GTC mandatory use per FTR §301-70.700; vouchers due within 5 working days of return per FTR §301-52.3; M&IE 75% on first/last day per FTR §301-11.100.
Per diem highlights: DC $294/day, NYC $381/day, SF $354/day, Chicago $315/day, Atlanta $272/day.

AGENCY-WIDE:
FY2027 SEC agency request: $1.908B (11% below FY2026 enacted $2.149B). Fee-offset: Section 31 / §6(b) — deficit neutral. FTE cap: 4,177 (down from 4,542).
Pending: Senate FSGG markup (June 2026). OMB A-11 FY2028 efficiency target: 10% reduction. FPDS replaced by SAM.gov (Feb 24, 2026).
Answer as a knowledgeable OSO FM Specialist would. Be precise, cite law/regulation where relevant, and flag ADA risks proactively.`;

  function buildContext(msgs: ChatMsg[], userMsg: string): ChatMsg[] {
    return msgs.length === 0
      ? [{ role:"user", content:`[CONTEXT]\n${OSO_CONTEXT}\n\n[QUESTION]\n${userMsg}` }]
      : [...msgs, { role:"user", content:userMsg }];
  }

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    const contextMsg = buildContext(messages, msg);
    setMessages(prev => [...prev, { role:"user", content:msg }]);
    setInput("");

    // Primary model
    setLoading(true);
    try {
      const { text, modelUsed } = await callAI(contextMsg, selectedModel);
      setMessages(prev => [...prev, { role:"assistant", content:text, modelUsed }]);
    } catch (err) {
      setMessages(prev => [...prev, { role:"assistant", content:`Error: ${(err as Error).message}` }]);
    }
    setLoading(false);

    // Compare model (if enabled)
    if (compareMode) {
      const compareCtx = buildContext(compareMessages, msg);
      setCompareMessages(prev => [...prev, { role:"user", content:msg }]);
      setCompareLoading(true);
      try {
        const { text, modelUsed } = await callAI(compareCtx, compareModel);
        setCompareMessages(prev => [...prev, { role:"assistant", content:text, modelUsed }]);
      } catch (err) {
        setCompareMessages(prev => [...prev, { role:"assistant", content:`Error: ${(err as Error).message}` }]);
      }
      setCompareLoading(false);
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);
  useEffect(() => { compareBotRef.current?.scrollIntoView({ behavior:"smooth" }); }, [compareMessages, compareLoading]);

  const starters = [
    { cat:"OSO Operations", q:"What are the top ADA risks in OSO's FY2027 execution based on current obligations?" },
    { cat:"OSO Operations", q:"OIG-582 is now closed — what controls did OSO implement, and what does that mean for T&M contract management going forward?" },
    { cat:"OSO Operations", q:"What should the FM Specialist do when the OSBO security guard T&M contract ceiling hits 80%?" },
    { cat:"Budget & Law",   q:"Explain the Section 31 fee-offset mechanism and why SEC is deficit-neutral." },
    { cat:"Budget & Law",   q:"What is the bona fide need rule and how does it apply at OSO year-end?" },
    { cat:"Intel Context",  q:"How should OSO plan for the Senate FSGG markup uncertainty on the FY2027 appropriation?" },
    { cat:"Intel Context",  q:"What does the OMB A-11 10% DOGE efficiency target mean for OSO's FY2028 submission?" },
    { cat:"FM Practice",    q:"How do I prepare the monthly financial status report for Brian Williams?" },
  ];

  const urgColor: Record<string,string> = { HIGH:C.red, MEDIUM:C.gold, LOW:C.green };
  const liveHighlights = NEWS_FEED.filter(n => n.urg === "HIGH" || n.urg === "MEDIUM").slice(0,3);
  const selectedMeta  = MODELS.find(m => m.id === selectedModel);
  const compareMeta   = MODELS.find(m => m.id === compareModel);

  // ModelDropdown moved to module scope

  // ChatPanel moved to module scope

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 160px)" }}>
      <PageHeader icon="🤖" title="AI FM Analyst — OSO Edition"
        subtitle="OSO-aware · Live intel context · ADA / OMB A-11 / OIG-582 CLOSED · OIG-574/584 open · Chain-of-LLMs fallback" />

      <div style={{ display:"grid",
                     gridTemplateColumns: compareMode ? "1fr 1fr 300px" : "1fr 300px",
                     gap:14, flex:1, minHeight:0 }}>

        {/* ── PRIMARY CHAT ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:0, minHeight:0 }}>
          {/* Model label when in compare mode */}
          {compareMode && (
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:12, color:C.muted, marginBottom:4, fontWeight:600 }}>MODEL A</div>
              <ModelDropdown value={selectedModel} onChange={setSelectedModel} C={C} />
            </div>
          )}
          {/* Normal empty state (only when not in compare mode) */}
          {!compareMode && messages.length === 0 ? (
            <div style={{ flex:1, overflowY:"auto", background:C.surface, borderRadius:12,
                           border:`1px solid ${C.border}`, padding:20, marginBottom:14,
                           display:"flex", flexDirection:"column", gap:14, minHeight:0 }}>
              <div style={{ textAlign:"center", padding:"36px 20px", color:C.muted }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🏛️</div>
                <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:8 }}>
                  SEC OSO Financial Intelligence
                </div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.7, maxWidth:440, margin:"0 auto 16px" }}>
                  Pre-loaded with OSO office structure, FY2027 budget data, OIG findings, and live intelligence.
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
                  {["OSO BMCB ✓","OIG-582 CLOSED ✓","OIG-574/584 ✓","FY2027 CBJ ✓"].map((p,i)=>(
                    <span key={i} style={{ fontSize:13, background:`${C.blue}18`, color:C.blue,
                                           padding:"3px 10px", borderRadius:20, fontWeight:600 }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ChatPanel msgs={messages} isLoading={loading} botRef={bottomRef}
              modelLabel={selectedMeta?.name ?? selectedModel} accent={C.blue} C={C} />
          )}
          {/* Input row */}
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
              placeholder={compareMode
                ? "Ask a question — sent to both models simultaneously..."
                : "Ask about OSO obligations, OIG findings, ADA risk, budget formulation..."}
              style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                        padding:"12px 16px", color:C.text, fontSize:14, outline:"none", fontFamily:"inherit" }} />
            <button onClick={send} disabled={loading || compareLoading || !input.trim()}
              style={{ background:`linear-gradient(135deg,${C.blue},${C.purple})`, border:"none",
                        borderRadius:10, padding:"12px 20px", color:"#fff", fontSize:14,
                        fontWeight:700, cursor:"pointer",
                        opacity: loading || compareLoading || !input.trim() ? 0.5 : 1 }}>
              {loading ? "..." : compareMode ? "Send Both" : "Send"}
            </button>
          </div>
        </div>

        {/* ── COMPARE CHAT (only when compareMode is on) ── */}
        {compareMode && (
          <div style={{ display:"flex", flexDirection:"column", gap:0, minHeight:0 }}>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:12, color:C.muted, marginBottom:4, fontWeight:600 }}>MODEL B</div>
              <ModelDropdown value={compareModel} onChange={setCompareModel} C={C} />
            </div>
            <ChatPanel msgs={compareMessages} isLoading={compareLoading} botRef={compareBotRef}
              modelLabel={compareMeta?.name ?? compareModel} accent={C.purple} C={C} />
          </div>
        )}

        {/* ── SIDEBAR ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>

          {/* Compare toggle */}
          <div style={{ background:C.card, border:`1px solid ${compareMode ? C.purple : C.border}`,
                         borderRadius:10, padding:"12px 14px" }}>
            <button onClick={() => { setCompareMode(m => !m); setCompareMessages([]); }}
              style={{ width:"100%", background: compareMode
                          ? `linear-gradient(135deg,${C.blue},${C.purple})`
                          : C.dim,
                        border:"none", borderRadius:8, padding:"10px",
                        color: compareMode ? "#fff" : C.muted,
                        fontSize:14, fontWeight:700, cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              ⚖️ {compareMode ? "Exit Compare Mode" : "Compare Two Models"}
            </button>
            {compareMode && (
              <div style={{ fontSize:12, color:C.muted, marginTop:8, lineHeight:1.5, textAlign:"center" as const }}>
                Your question is sent to both models simultaneously. Responses appear side by side.
              </div>
            )}
          </div>

          {/* Model selector (primary) — only when NOT in compare mode */}
          {!compareMode && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.muted,
                              letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:10 }}>Model</div>
              <ModelDropdown value={selectedModel} onChange={setSelectedModel} C={C} />
              {selectedMeta && (
                <div style={{ marginTop:8, fontSize:13, color:C.muted, lineHeight:1.5 }}>
                  {selectedMeta.description}
                  <div style={{ marginTop:4, display:"flex", gap:8 }}>
                    <span>ctx: {selectedMeta.contextWindow}</span>
                    {selectedMeta.isFree ? <span style={{ color:C.green }}>Free</span>
                      : <span style={{ color:C.gold }}>${selectedMeta.inputPricePer1M}/1M</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick starters */}
          {(["OSO Operations","Budget & Law","Intel Context","FM Practice"] as const).map(cat => (
            <div key={cat}>
              <div style={{ fontSize:12, fontWeight:700, color:C.muted,
                              letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:6 }}>{cat}</div>
              {starters.filter(s => s.cat === cat).map((s,i) => (
                <button key={i} onClick={() => setInput(s.q)}
                  style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:7,
                            padding:"9px 11px", fontSize:13, color:C.textSub, cursor:"pointer",
                            textAlign:"left" as const, lineHeight:1.5, marginBottom:6, display:"block" }}>
                  {s.q}
                </button>
              ))}
            </div>
          ))}

          {/* Live Intel Context — above Knowledge */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.muted, letterSpacing:"0.08em",
                            textTransform:"uppercase" as const, marginBottom:10 }}>📡 Live Intel Context</div>
            {liveHighlights.map((n,i) => (
              <div key={i} style={{ marginBottom:10, paddingBottom:i<liveHighlights.length-1?10:0,
                                     borderBottom:i<liveHighlights.length-1?`1px solid ${C.border}`:undefined }}>
                <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:urgColor[n.urg]||C.muted,
                                  background:`${urgColor[n.urg]||C.muted}18`, padding:"1px 6px", borderRadius:3 }}>
                    {n.urg}
                  </span>
                  <span style={{ fontSize:11, color:C.muted }}>{n.cat}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, lineHeight:1.4, marginBottom:2 }}>{n.headline}</div>
                <div style={{ fontSize:12, color:C.gold, lineHeight:1.4 }}>→ {n.impact}</div>
              </div>
            ))}
            <button onClick={() => setInput("Based on the current live intelligence — Senate FSGG markup pending and OMB 10% efficiency target — what should OSO prioritize for FY2028 formulation?")}
              style={{ width:"100%", marginTop:6, background:`${C.blue}15`, border:`1px solid ${C.blue}44`,
                        borderRadius:6, padding:"6px 10px", fontSize:13, color:C.blue,
                        cursor:"pointer", fontWeight:600 }}>
              Ask AI about live intel →
            </button>
          </div>

          {/* OSO Knowledge pills */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px" }}>
            <div style={{ fontSize:13, color:C.muted, marginBottom:8, fontWeight:700, letterSpacing:"0.06em" }}>
              OSO KNOWLEDGE LOADED
            </div>
            {[
              { label:"OSO Budget & Offices", color:C.blue },
              { label:"OIG-574 / OIG-584 Open Findings (FISMA)", color:C.gold },
              { label:"FY2027 CBJ · $1.908B", color:C.gold },
              { label:"ADA / OMB A-11 / FAR", color:C.purple },
              { label:"GPC · COR · Momentum", color:C.cyan },
              { label:"Stakeholder Map", color:C.green },
              { label:"Section 31 Fee Mechanism", color:C.orange },
              { label:"Live Intel Feed", color:C.textSub },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:item.color, flexShrink:0 }} />
                <span style={{ fontSize:13, color:C.muted }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: GUIDANCE LIBRARY
// ═══════════════════════════════════════════════════════════════════════════
function PageGuidance() {
  const C = useTheme();
  const [active, setActive] = useState(0);
  const topics = [
    { title:"Anti-Deficiency Act", icon:"⚖️", cite:"31 U.S.C. §1341",
      sections:[
        { head:"What the ADA Prohibits",
          body:"An officer or employee of the United States Government may not make or authorize an expenditure or obligation exceeding an amount available in an appropriation or fund for the expenditure or obligation. Violations include both obligations (entering contracts) and expenditures (making payments)." },
        { head:"ADA Applicability at SEC",
          body:"Applies to all SEC obligations against its appropriated funds. Each apportionment category (by program, by quarter, by project) creates a separate ADA limit. OSO must monitor: (1) gross obligations vs. enacted appropriation, (2) obligations by quarter vs. apportioned amounts, (3) commitments that may become obligations." },
        { head:"Reporting Requirements (§1351)",
          body:"Any potential ADA violation must be reported immediately to: (1) SEC Inspector General, (2) agency head (Chair), (3) OMB Director, (4) Congress. Reporting cannot be delayed for investigation — the report goes out simultaneously with the investigation." },
        { head:"Penalties",
          body:"Administrative: written reprimand up to removal from position. Criminal (§1350): knowing and willful violation = fine up to $5,000 and/or imprisonment up to 2 years." },
      ]},
    { title:"Appropriations Law", icon:"🏛️", cite:"31 U.S.C. §1301 et seq.",
      sections:[
        { head:"Purpose Statute (§1301(a))",
          body:"Appropriations shall be applied only to the objects for which the appropriations were made except as otherwise provided by law. The three-part purpose test: (1) the expenditure must be authorized by law, (2) the amount must not be prohibited, (3) the expenditure must not be otherwise provided for." },
        { head:"Bona Fide Need Rule",
          body:"An annual appropriation may be obligated only to meet a legitimate, or bona fide, need arising in the fiscal year for which the appropriation was made. Multi-year needs must have a continuing relationship across fiscal years to obligate future-year funds." },
        { head:"Time Limits on Appropriations",
          body:"Annual (1-year) funds: available only during the fiscal year. Multi-year funds: available for the period specified. No-year funds: available until expended. SEC FY2026 appropriation: annual, expires Sep 30, 2026. Note: $145M no-year budget authority in FY2026 is available into FY2027." },
        { head:"Reprogramming Authority",
          body:"§1532 permits transfers between appropriation accounts with advance approval. Below-threshold reprogrammings are reported to Congress. Above-threshold require committee approval. OSO must track reprogrammings against cumulative thresholds." },
      ]},
    { title:"OMB Circular A-11", icon:"📋", cite:"OMB Circular A-11 (2025 edition)",
      sections:[
        { head:"Budget Formulation (Part 6)",
          body:"Agencies submit budget requests to OMB by September per the A-11 schedule. The request includes: program narratives, performance goals, object class breakdowns, and FTE justifications. OSO coordinates the internal call, collects submissions, and assembles the agency package." },
        { head:"Apportionment (§120)",
          body:"OMB apportions budget authority to agencies, controlling the rate of spending. Categories: (1) by time period, (2) by program/project/activity, (3) by another basis. Agencies may not obligate funds not yet apportioned — this is the mechanism enforcing ADA compliance operationally." },
        { head:"Budget Execution (Part 4)",
          body:"Agencies must track obligations against apportioned amounts, prepare SF-133 reports quarterly, and submit final year-end reports. OSO's execution monitoring must flag: (1) over-obligation of apportioned amounts, (2) insufficient obligation of expiring funds, (3) improper use of funds." },
        { head:"FY2028 Key Dates",
          body:"Spring 2026: A-11 guidance issued. Sep 2026: Agency submission to OMB. Nov 2026: OMB passback. Dec 2026: Appeals. Feb 3, 2027: President's Budget to Congress. Apr–Sep 2027: Congressional action. Oct 1, 2027: New fiscal year begins." },
      ]},
    { title:"SEC Funding Mechanism", icon:"💹", cite:"Securities Exchange Act §§31, 6(b); 15 U.S.C. §78ee",
      sections:[
        { head:"Section 31 Fee Authority",
          body:"Section 31 of the Exchange Act requires national securities exchanges and FINRA to pay fees to the SEC based on the volume of securities transactions. The fee is levied on the sellers of securities — not the investors directly — and collected from the exchanges." },
        { head:"Annual Rate Setting (§6(b))",
          body:"The SEC sets the fee rate for each fiscal year. The formula: (projected appropriation) / (projected transaction volume) = fee rate. If collections are projected to exceed the appropriation, the rate is set to $0 (as in FY2025). Current FY2027 rate: $7.10 per $1,000,000 of sale proceeds." },
        { head:"Reserve Fund (§31(j))",
          body:"Excess collections above the appropriation flow to the Reserve Fund, capped at $100M. The Reserve Fund may be used, with OMB approval, for unforeseen SEC technology investments. Currently at ~$98-100M." },
        { head:"Investor Protection Fund",
          body:"Separate from operations — funded by disgorgement and penalties. Used to compensate whistleblowers. Accounted for separately from the fee-offset appropriation. Does not affect OSO financial management." },
      ]},
  ];
  const tp = topics[active];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <PageHeader icon="📚" title="Financial Management Guidance Library"
        subtitle="Appropriations Law · OMB Circulars · SEC Funding Statutes · ADA · Fiscal Law Reference" />

      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:16 }}>
        {/* Topic list */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {topics.map((t,i) => (
            <button key={i} onClick={()=>setActive(i)}
              style={{ background: active===i ? C.blue : C.card,
                        border:`1px solid ${active===i ? C.blue : C.border}`,
                        borderRadius:9, padding:"12px 14px", cursor:"pointer",
                        textAlign:"left", transition:"all 0.2s" }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{t.icon}</div>
              <div style={{ fontSize:16, fontWeight:700, color: active===i ? "#fff" : C.text }}>{t.title}</div>
              <div style={{ fontSize:16, color: active===i ? "rgba(255,255,255,0.6)" : C.muted, marginTop:2 }}>{t.cite}</div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:`${C.blue}15`, border:`1px solid ${C.borderAccent}`,
                          borderRadius:10, padding:"14px 18px", display:"flex", gap:12 }}>
            <span style={{ fontSize:24 }}>{tp.icon}</span>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{tp.title}</div>
              <div style={{ fontSize:16, color:C.blue }}>{tp.cite}</div>
            </div>
          </div>
          {tp.sections.map((s,i) => (
            <Card key={i}>
              <div style={{ fontSize:17, fontWeight:700, color:C.cyan, marginBottom:10 }}>{s.head}</div>
              <div style={{ fontSize:17, color:C.textSub, lineHeight:1.75 }}>{s.body}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// PAGE: FM TOOLBOX — Job Requirements, Systems, Appropriations Law, Budget
//       Process, Case Studies
// ═══════════════════════════════════════════════════════════════════════════
function PageToolbox() {
  const C = useTheme();
  // ── ALL STATE LIFTED TO TOP LEVEL — prevents inner-component remount bug ──
  const [tab, setTab]               = useState("jobreq");
  const [jobSection, setJobSection] = useState("overview");
  const [toolActive, setToolActive] = useState(0);
  const [lawActive,  setLawActive]  = useState(0);
  const [phase,      setPhase]      = useState("formulation");
  const [caseActive, setCaseActive] = useState(0);
  const [analytic,   setAnalytic]   = useState("overview");

  const tabs = [
    { id:"jobreq",    label:"Job Requirements",   icon:"📋" },
    { id:"tools",     label:"Tools & Systems",    icon:"🖥️"  },
    { id:"applaw",    label:"Appropriations Law", icon:"⚖️"  },
    { id:"process",   label:"Budget Process",     icon:"🔄"  },
    { id:"cases",     label:"Case Studies",       icon:"📂"  },
    { id:"analytics", label:"Analytics & AI/ML",  icon:"📊"  },
  ];

  // ── Shared primitives ──────────────────────────────────────────────────
  const H = ({ children }: any) => (
    <div style={{ fontSize:15, fontWeight:800, color:C.blue, letterSpacing:"0.08em",
                  textTransform:"uppercase" as const, marginBottom:6, marginTop:18 }}>{children}</div>
  );
  const Body = ({ children }: any) => (
    <div style={{ fontSize:16, color:C.textSub, lineHeight:1.75, marginBottom:8 }}>{children}</div>
  );
  const Cite = ({ children }: any) => (
    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color:C.cyan,
                   background:`${C.cyan}14`, borderRadius:3, padding:"1px 6px" }}>{children}</span>
  );
  const Chip = ({ label, color }: any) => (
    <span style={{ fontSize:12, fontWeight:700, background:`${color}18`, color,
                   borderRadius:4, padding:"2px 8px", marginRight:5, marginBottom:4,
                   display:"inline-block", letterSpacing:"0.04em" }}>{label}</span>
  );
  const InfoBox = ({ icon, title, body, color }: any) => (
    <div style={{ background:`${color}10`, border:`1px solid ${color}30`, borderLeft:`4px solid ${color}`,
                  borderRadius:8, padding:"12px 15px", marginBottom:12 }}>
      <div style={{ fontSize:15, fontWeight:700, color, marginBottom:5 }}>{icon} {title}</div>
      <div style={{ fontSize:15, color:C.textSub, lineHeight:1.7 }}>{body}</div>
    </div>
  );
  const SectionCard = ({ title, sub, children }: any) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                  padding:"18px 20px", marginBottom:16 }}>
      <div style={{ fontWeight:700, fontSize:17, color:C.text, marginBottom:3 }}>{title}</div>
      {sub && <div style={{ fontSize:14, color:C.muted, marginBottom:12 }}>{sub}</div>}
      {children}
    </div>
  );

  // ── TAB: JOB REQUIREMENTS ───────────────────────────────────────────────
  // ── JobReq uses lifted state (jobSection / setJobSection) ──────────────
  const JobReq = () => {
    const section = jobSection; const setSection = setJobSection;
    const secs = [
      { id:"overview",     label:"Role Overview" },
      { id:"knowledge",    label:"Required Knowledge" },
      { id:"skills",       label:"Key Skills" },
      { id:"competencies", label:"Core Competencies" },
      { id:"typical",      label:"Typical Duties" },
    ];
    return (
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {secs.map(s => (
            <button key={s.id} onClick={()=>setSection(s.id)}
              style={{ background: section===s.id ? `${C.blue}22` : C.card,
                       border:`1px solid ${section===s.id ? C.blue : C.border}`,
                       borderLeft:`3px solid ${section===s.id ? C.blue : "transparent"}`,
                       borderRadius:7, padding:"9px 12px", fontSize:14,
                       color:section===s.id ? C.blue : C.muted, cursor:"pointer",
                       textAlign:"left" as const, fontWeight:section===s.id?700:400 }}>
              {s.label}
            </button>
          ))}
        </div>
        <div>
          {section === "overview" && (
            <SectionCard title="Financial Management Specialist — OSO BMCB" sub="SEC · Office of Support Operations · Business Management & Continuity Branch · SK-0501-13">
              <InfoBox icon="🏛️" title="Agency Context" color={C.blue}
                body="The Securities and Exchange Commission (SEC) protects investors, maintains fair and orderly markets, and facilitates capital formation. OSO (Office of Support Operations) provides administrative and operational support across 12 SEC locations — including FOIA services (~13,250 requests/yr), physical security, facilities management, personnel security, records management, and mission resilience. OSO is the operational component of the SEC's Agency Direction and Administrative Support program ($306.6M enacted, FY2026 CBJ). OSO's total managed obligations = ~$112M FY2026 — confirmed by the AD. This includes: organizational budget ($37M per FY2025 CBJ p.74-75, 92 FTE), PLUS program execution funds: facility leases ($58.5M — 12 locations, authorized by CBJ Appropriations Language p.16), physical security contracts ($19.5M), FOIA processing, and building ops. OC 23.0 agency-wide = $109M (CBJ p.13); OSO administers the $58.5M lease share. The BMCB Financial Management Specialist manages OSO's ~$112M total program execution across 8 sub-offices." />
              <InfoBox icon="🎯" title="Position Purpose" color={C.purple}
                body="Serve as the OSO budget and financial management expert responsible for budget formulation, execution monitoring, ADA compliance, OIG corrective action support, and stakeholder financial briefings. The position interfaces daily with OFM (Office of Financial Management) and coordinates the FY budget call across OFS, OSBO, OAMR, and BMCB." />
              <InfoBox icon="📍" title="Grade & Pay" color={C.gold}
                body="SK-13 (SEC's administratively-determined pay scale, equivalent to GS-13 in structure). Locality pay: Washington DC area (31.96% adjustment). Competitive total compensation including federal benefits package at 30% of base." />
            </SectionCard>
          )}
          {section === "knowledge" && (
            <SectionCard title="Required Knowledge Areas" sub="Based on SK-0501-13 series standard and SEC BMCB position description">
              {[
                { area:"Federal Appropriations Law", level:"EXPERT", color:C.red,
                  detail:"GAO Principles of Federal Appropriations Law (Red Book). Anti-Deficiency Act (31 U.S.C. §1341), Purpose Statute (§1301), Bona Fide Need Rule, Time Limitations (§1502), Transfer Authority (§1532). Must be able to apply these independently to novel fact patterns." },
                { area:"OMB Budget Circulars", level:"EXPERT", color:C.red,
                  detail:"Circular A-11 (budget formulation, apportionment, execution reporting). Circular A-123 (management accountability, ERM, internal controls). Circular A-136 (financial reporting). Must translate OMB policy into OSO-specific procedures." },
                { area:"Federal Financial Systems", level:"PROFICIENT", color:C.gold,
                  detail:"Momentum (core financial system / ERP). BPPAS (SEC budget planning). SAM.gov (vendor registration, contract awards). GSA SmartPay IOD (GPC reconciliation). USASpending.gov (public spending data). OMB GTAS (Treasury Account Symbol submissions)." },
                { area:"Procurement & Acquisition", level:"PROFICIENT", color:C.gold,
                  detail:"FAR Parts 4, 8, 13 (micropurchases, GPC). FAR Part 1.602-2 (COR duties). Contract types: FFP, T&M, IDIQ. T&M COR monitoring SOPs (implemented per now-closed OIG-582). OFPP GPC policy (OMB A-123 Appendix B). SAM.gov vendor registration requirements." },
                { area:"Budget Formulation", level:"PROFICIENT", color:C.gold,
                  detail:"Congressional Budget Justification (CBJ) structure. Object class coding (OMB Circular A-11 Appendix B). Program, project, and activity (PPA) structure. FTE planning and salary/benefits projection methodology. OMB scoring of mandatory vs. discretionary." },
                { area:"Performance Management", level:"FAMILIAR", color:C.cyan,
                  detail:"GPRA Modernization Act requirements. Program Assessment Rating Tool (PART) legacy. OMB A-11 Part 6 performance integration. Agency Strategic Plan linkage to budget requests." },
              ].map((k,i) => (
                <div key={i} style={{ marginBottom:12, background:C.dim+"33", borderRadius:8, padding:"11px 14px",
                                       borderLeft:`3px solid ${k.color}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontWeight:700, color:C.text }}>{k.area}</span>
                    <Chip label={k.level} color={k.color} />
                  </div>
                  <div style={{ fontSize:15, color:C.textSub, lineHeight:1.65 }}>{k.detail}</div>
                </div>
              ))}
            </SectionCard>
          )}
          {section === "skills" && (
            <SectionCard title="Key Skills & Abilities" sub="Assessed in the application and interview process">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { skill:"Budget Execution Monitoring", note:"Track obligations vs. allotment by office, object class, and quarter. Identify burn-rate deviations ≥10% and recommend corrective action. Produce monthly status reports with ADA risk ratings.", level:"Critical" },
                  { skill:"Financial Analysis & Forecasting", note:"Project year-end obligations using historical burn rates and known pipeline. Scenario planning for CR, reprogramming, and vacancy-fill impacts on OC 11+12.", level:"Critical" },
                  { skill:"Stakeholder Communication", note:"Translate financial data into plain-language briefings for branch chiefs, ADs, and the OSO Director. Produce one-pagers, tables, and dashboard summaries — not data dumps.", level:"Critical" },
                  { skill:"ADA Risk Assessment", note:"Apply the three-part test to proposed obligations. Flag obligations that approach or exceed apportioned amounts. Know the §1351 reporting trigger and mandatory notification chain.", level:"Critical" },
                  { skill:"GPC Program Administration", note:"Pull SmartPay IOD transaction reports monthly. Verify reconciliation status for each cardholder. Identify split-purchase patterns, missing receipts, and misclassified object codes.", level:"High" },
                  { skill:"COR Surveillance Support", note:"Track monthly T&M ceiling utilization against contract ceilings. Apply T&M COR SOPs (embedded controls from OIG-582, now CLOSED). Know FAR 1.602-2 COR appointment requirements.", level:"High" },
                  { skill:"Budget Formulation & Justification", note:"Coordinate the internal budget call across 4 OSO offices. Compile object-class breakdowns, FTE narratives, and program change justifications. Reconcile to prior-year actuals.", level:"High" },
                  { skill:"Records Management", note:"Maintain obligation documentation per NARA GRS 1.1 (6-year retention). File annual certifications. Support audits with retrievable documentation packages.", level:"Medium" },
                ].map((s,i) => (
                  <div key={i} style={{ background:C.dim+"33", borderRadius:8, padding:"11px 13px",
                                         borderTop:`3px solid ${s.level==="Critical"?C.red:s.level==="High"?C.gold:C.cyan}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontWeight:700, color:C.text, fontSize:15 }}>{s.skill}</span>
                      <Chip label={s.level} color={s.level==="Critical"?C.red:s.level==="High"?C.gold:C.cyan} />
                    </div>
                    <div style={{ fontSize:14, color:C.textSub, lineHeight:1.6 }}>{s.note}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          {section === "competencies" && (
            <SectionCard title="OPM Core Competencies — SK-0501 Financial Management Series">
              {[
                { comp:"Financial Management", rating:5, desc:"Prepares, justifies, and/or administers the budget for program areas; uses cost-benefit thinking to set priorities; monitors expenditures; understands the significance of variances and takes appropriate action." },
                { comp:"Technical Credibility", rating:5, desc:"Understands and appropriately applies procedures, requirements, regulations, and policies related to specialized expertise. Makes sound decisions; acknowledges mistakes and seeks to improve." },
                { comp:"Oral Communication", rating:4, desc:"Expresses information to individuals or groups effectively; listens to others; attends to nonverbal cues; responds appropriately. Adapts explanations of complex fiscal law for non-financial audiences." },
                { comp:"Written Communication", rating:4, desc:"Writes in a clear, concise, organized manner. Produces financial briefs, status reports, corrective action documentation, and SOP updates that are audit-ready." },
                { comp:"Problem Solving", rating:4, desc:"Identifies and analyzes problems. Uses sound reasoning to arrive at conclusions; finds alternative solutions to complex problems; distinguishes between relevant and irrelevant information." },
                { comp:"Interpersonal Skills", rating:3, desc:"Shows understanding, friendliness, courtesy, tact, empathy, cooperation, concern, and politeness toward others. Relates well to different people with varying backgrounds." },
              ].map((c,i) => (
                <div key={i} style={{ display:"flex", gap:14, padding:"10px 0", borderBottom:`1px solid ${C.border}22` }}>
                  <div style={{ minWidth:220, flexShrink:0 }}>
                    <div style={{ fontWeight:700, color:C.text, fontSize:15 }}>{c.comp}</div>
                    <div style={{ display:"flex", gap:3, marginTop:5 }}>
                      {[1,2,3,4,5].map(n => (
                        <div key={n} style={{ width:14, height:14, borderRadius:2,
                                               background: n<=c.rating ? C.blue : C.dim }} />
                      ))}
                      <span style={{ fontSize:12, color:C.muted, marginLeft:5 }}>Level {c.rating}/5</span>
                    </div>
                  </div>
                  <div style={{ fontSize:15, color:C.textSub, lineHeight:1.65 }}>{c.desc}</div>
                </div>
              ))}
            </SectionCard>
          )}
          {section === "typical" && (
            <SectionCard title="Typical Daily / Weekly Duties">
              {[
                { freq:"DAILY",   color:C.red,    duties:[
                  "Monitor Momentum for new obligations and flag any that approach or exceed allotment by OC or office",
                  "Check incoming email from OFM for apportionment notices, data calls, or policy updates",
                  "Track COR surveillance log due dates — immediately escalate overdue logs",
                  "Review GPC cardholder notifications from SmartPay for new transactions",
                ]},
                { freq:"WEEKLY",  color:C.gold,   duties:[
                  "Run burn-rate calculations for each OSO office and compare to monthly benchmark",
                  "Prepare and distribute weekly obligation pipeline summary to J. Harrison (BMCB Chief)",
                  "Update OIG-574/584 FISMA corrective action tracker — coordinate with OIT on evidence packages",
                  "Review SAM.gov registrations for any contracts coming up for renewal",
                ]},
                { freq:"MONTHLY", color:C.blue,   duties:[
                  "Pull SmartPay IOD reports — verify all 4 OSO GPC cardholders reconciled within 5 business days",
                  "Prepare OSO Monthly Financial Status Brief (due 10th of month) — burn rate tables, ADA risk, OIG status",
                  "Reconcile Momentum obligations against OSO internal tracker — resolve discrepancies",
                  "Submit T&M COR ceiling utilization report — sustained practice per OIG-582 controls (now embedded, OIG-582 CLOSED)",
                ]},
                { freq:"QUARTERLY", color:C.purple, duties:[
                  "Prepare SF-133 input for OFM (Budget Execution of Resources report)",
                  "Brief J. Harrison and R. Buckley on quarterly burn-rate trends and year-end projection",
                  "Review all open ULOs (unliquidated obligations) — identify candidates for de-obligation",
                  "Update GPC spending trend analysis — flag any cardholder approaching annual threshold",
                ]},
              ].map((g,i) => (
                <div key={i} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:g.color, letterSpacing:"0.12em",
                                 marginBottom:7 }}>{g.freq}</div>
                  {g.duties.map((d,j) => (
                    <div key={j} style={{ display:"flex", gap:10, marginBottom:7 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:g.color,
                                    flexShrink:0, marginTop:8 }} />
                      <div style={{ fontSize:15, color:C.textSub, lineHeight:1.65 }}>{d}</div>
                    </div>
                  ))}
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      </div>
    );
  };

  // ── TAB: TOOLS & SYSTEMS — uses lifted state (toolActive) ───────────────
  const ToolsTab = () => {
    const active = toolActive; const setActive = setToolActive;
    const systems = [
      { name:"Momentum (Oracle EBS)", type:"Core Financial System", icon:"⚙️", color:C.blue,
        what:"Momentum is the SEC's enterprise resource planning (ERP) system — the authoritative system of record for all agency financial transactions. Every obligation, disbursement, and accounting entry flows through Momentum.",
        access:"Accessed via SEC intranet at momentum.sec.gov. Requires PIV card authentication. OSO users have role-based access limited to OSO cost centers (cost center codes BMCB, OFS, OSBO, OAMR).",
        keyFunctions:[
          "Obligation entry — enter obligations against the correct cost center, OC, and appropriation TAS",
          "Query by cost center — run 'Budget vs. Actual' reports to get real-time burn rate",
          "ULO review — pull unliquidated obligation aging report monthly",
          "Object class validation — verify OC codes before submission (OFM cannot correct OC errors retroactively)",
          "Year-end close — last entries must be in by COB Sep 30; OFM provides exact cutoff time",
        ],
        watchouts:"Do not override system budget controls — OIG-488 finding resulted from manual overrides. Contact OFM before any system workaround. Object class coding errors are the most common audit finding.",
      },
      { name:"BPPAS", type:"Budget Planning & Performance Analysis System", icon:"📊", color:C.purple,
        what:"BPPAS (Budget Planning, Programming, and Analysis System) is the SEC's internal budget planning tool. Used for formulating the annual budget request, tracking allotments, and generating the internal budget call worksheets distributed to OSO offices.",
        access:"SEC intranet. OFM manages master access; OSO FM Specialist has read/write for OSO program codes. Budget call templates are distributed as Excel exports from BPPAS.",
        keyFunctions:[
          "Budget call worksheet generation — produces the template sent to OFS, OSBO, OAMR, BMCB",
          "Allotment tracking — reflects sub-allotments loaded after OFM receives OMB apportionment",
          "Object class crosswalk — maps internal SEC program codes to OMB A-11 object classes",
          "FTE planning — links position data to salary projections for OC 11.0/12.0 formulation",
          "Prior-year actuals — used as the baseline for FY+2 budget formulation",
        ],
        watchouts:"BPPAS allotment data lags Momentum by 24-48 hours. Always use Momentum for real-time obligation checks. BPPAS is planning data; Momentum is the legal record.",
      },
      { name:"SAM.gov", type:"System for Award Management", icon:"🔍", color:C.green,
        what:"SAM.gov replaced FPDS.gov in February 2026 as the single portal for federal contract awards, vendor registration, and acquisition data. FAR 4.1103 requires active SAM registration before any contract award.",
        access:"Public-facing at sam.gov. No login required for basic entity search. Contracting functions require government PIV login. Replaced legacy FPDS-NG for reporting.",
        keyFunctions:[
          "Vendor SAM registration check — verify any vendor is 'Active' before obligating (required by FAR 4.1103)",
          "Contract award data — search by NAICS code, agency, or vendor to benchmark pricing",
          "Entity exclusion check — verify vendor not on the exclusion/debarment list (required pre-award)",
          "CAGE code lookup — used for contract modifications and purchase order generation",
          "Transition from FPDS — legacy FPDS contract records accessible via SAM.gov Archive",
        ],
        watchouts:"Check SAM registration status the day of award, not just at contract start. Registrations expire annually. An expired registration stops obligation processing in Momentum.",
      },
      { name:"GSA SmartPay IOD", type:"GPC Administration Portal", icon:"💳", color:C.gold,
        what:"GSA SmartPay's Individual Online Dispute (IOD) portal — actually the broader SmartPay management portal — is used by OSO GPC cardholders and the FM Specialist to manage transaction data, reconciliation status, and compliance monitoring for the 4 OSO Government Purchase Cards.",
        access:"https://iopay.gsa.gov. Citibank-hosted portal. FM Specialist has Approving Official (AO) access, enabling view of all 4 cardholder accounts. Cardholders have individual login.",
        keyFunctions:[
          "Monthly transaction pull — download all OSO cardholder transactions for the billing cycle",
          "Reconciliation status monitoring — verify each cardholder reconciled within 5 business days",
          "Delinquency alerts — automatically flags accounts with outstanding balances past 30 days",
          "Split-purchase detection — side-by-side transaction view to identify same-vendor same-day patterns",
          "Monthly AO certification — FM Specialist certifies all OSO cardholder accounts as AO each month",
        ],
        watchouts:"5-business-day reconciliation window is strict — OMB A-123 Appendix B. An unreconciled account past 30 days becomes 'delinquent' and is reportable to OFM. Two delinquencies in 12 months triggers card suspension.",
      },
      { name:"USASpending.gov", type:"Public Federal Spending Database", icon:"🌐", color:C.cyan,
        what:"The public transparency portal for all federal contract awards, grants, and financial data. Useful for the OSO FM Specialist for benchmarking contract pricing, reviewing SEC-wide obligation trends, and verifying published spending data matches internal records.",
        access:"Fully public at usaspending.gov. No login required. Advanced Search allows filtering by agency, program, NAICS, and contractor. FPDS data migrated here.",
        keyFunctions:[
          "SEC spending profile — filter to AGENCY: Securities and Exchange Commission for all SEC contracts",
          "Vendor history — search contractor name to see pricing on similar contracts government-wide",
          "Object class trends — view SEC historical spending by object class for formulation baseline",
          "Award detail — download transaction-level data for audit support or benchmarking",
          "FSRS (sub-award reporting) — verify prime contractors are reporting sub-awards as required",
        ],
        watchouts:"USASpending data lags by 30-60 days. Not suitable for real-time monitoring — use Momentum for current-year execution. Useful for historical analysis and price benchmarking.",
      },
      { name:"OMB MAX / SAP BRIM", type:"OMB Reporting & Budget System", icon:"📤", color:C.orange,
        what:"OMB MAX (now transitioning to SAP BRIM) is the interagency portal through which SEC submits budget data to OMB during formulation. The FM Specialist uses MAX for A-11 schedule submissions, apportionment requests, and GTAS (Governmentwide Treasury Account Symbol Adjusted Trial Balance System) data validation.",
        access:"MAX.OMB.gov (MAX Portal). PIV-card authenticated. OFM manages agency-level access; OSO FM Specialist may have read access for apportionment status and SF-132/133 data.",
        keyFunctions:[
          "Apportionment status — view OMB apportionment of SEC's annual appropriation by category",
          "SF-133 data — monitor Budget Execution of Resources report data submitted to OMB quarterly",
          "A-11 schedule compliance — track submission deadlines and OFM approval workflow",
          "GTAS validation — verify TAS/BETC (Treasury Account Symbol / Business Event Type Code) accuracy",
          "Passback documents — OFM distributes OMB passback decisions via MAX workspace",
        ],
        watchouts:"OMB MAX is transitioning to the Unified Shared Services Management (USSM) portal over FY2026-2027. Expect system changes during this period. OFM will communicate new access procedures.",
      },
    ];
    const sys = systems[active];
    return (
      <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {systems.map((s,i) => (
            <button key={i} onClick={()=>setActive(i)}
              style={{ background: active===i ? `${s.color}22` : C.card,
                       border:`1px solid ${active===i ? s.color : C.border}`,
                       borderLeft:`3px solid ${active===i ? s.color : "transparent"}`,
                       borderRadius:7, padding:"9px 12px", cursor:"pointer", textAlign:"left" as const }}>
              <div style={{ fontSize:16, marginBottom:2 }}>{s.icon}</div>
              <div style={{ fontSize:13, fontWeight:active===i?700:500, color:active===i?s.color:C.text,
                             lineHeight:1.3 }}>{s.name}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.type}</div>
            </button>
          ))}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`4px solid ${sys.color}`,
                      borderRadius:10, padding:"20px 22px" }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:14 }}>
            <span style={{ fontSize:28 }}>{sys.icon}</span>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:C.text }}>{sys.name}</div>
              <div style={{ fontSize:14, color:sys.color, fontWeight:600 }}>{sys.type}</div>
            </div>
          </div>
          <H>What It Is</H>
          <Body>{sys.what}</Body>
          <H>How to Access</H>
          <Body>{sys.access}</Body>
          <H>Key Functions for OSO FM Specialist</H>
          <div style={{ marginBottom:12 }}>
            {sys.keyFunctions.map((f,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:`${sys.color}22`,
                               color:sys.color, fontSize:12, fontWeight:700, display:"flex",
                               alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</div>
                <div style={{ fontSize:15, color:C.textSub, lineHeight:1.65 }}>{f}</div>
              </div>
            ))}
          </div>
          <div style={{ background:`${C.gold}12`, border:`1px solid ${C.gold}30`, borderRadius:7,
                         padding:"10px 14px" }}>
            <span style={{ fontWeight:700, color:C.gold, fontSize:14 }}>⚠️ Watch Out: </span>
            <span style={{ fontSize:14, color:C.muted }}>{sys.watchouts}</span>
          </div>
        </div>
      </div>
    );
  };

  // ── TAB: APPROPRIATIONS LAW — uses lifted state (lawActive) ────────────
  const AppropLaw = () => {
    const active = lawActive; const setActive = setLawActive;
    const laws = [
      { title:"GAO Red Book Overview", cite:"GAO-04-261SP (4th ed.)", icon:"📕", color:C.red,
        sections:[
          { head:"What Is the Red Book?",
            body:"The Principles of Federal Appropriations Law (known as the Red Book) is published by the GAO. Now in its fourth edition, it is the authoritative reference on federal fiscal law. Four volumes cover: (1) Introduction & Appropriations Framework, (2) Purpose, Time, Amount, (3) Agency-specific authorities, (4) Claims, Judgments, Miscellaneous. The FM Specialist at the SEC should have working knowledge of Volumes 1 and 2." },
          { head:"The Three Pillars of Appropriations Law",
            body:"Every appropriation has three legal constraints that the FM Specialist must apply to every transaction: (1) PURPOSE — can this money legally be used for this object? (2) TIME — is this the right fiscal year for this obligation? (3) AMOUNT — do we have enough budget authority to cover this? Violate any one of three and you have a potential ADA violation or improper obligation." },
          { head:"Hierarchy of Authority",
            body:"1. U.S. Constitution (Art. I §9 — Appropriations Clause). 2. Statutes (31 U.S.C., specific appropriations acts). 3. OMB Circulars (A-11, A-123) and Treasury Financial Manual. 4. Agency regulations and delegations. 5. GAO decisions (advisory but highly influential). 6. Court of Federal Claims opinions." },
          { head:"Where to Find Red Book",
            body:"Freely available at gao.gov/legal/red-book/overview. The FM Specialist should bookmark all four volumes. GAO publishes updates and supplements when new decisions alter established principles. Search by statute section number or subject keyword." },
        ]},
      { title:"Purpose Statute", cite:"31 U.S.C. §1301(a)", icon:"🎯", color:C.blue,
        sections:[
          { head:"The Rule",
            body:"'Appropriations shall be applied only to the objects for which the appropriations were made except as otherwise provided by law.' The purpose statute is the most commonly applied fiscal law rule. It answers the question: Am I allowed to spend this money on this thing?" },
          { head:"Three-Part Necessary Expense Test",
            body:"To determine whether an expenditure is authorized under an appropriation, apply the necessary expense doctrine: (1) Must be for an authorized purpose — directly related to the appropriation's purpose. (2) Cannot be otherwise provided for by law — no specific prohibition exists. (3) Must be reasonably necessary — not merely convenient, but genuinely connected to the mission. All three parts must be satisfied." },
          { head:"Common Purpose Violations",
            body:"Examples of purpose statute violations: Using travel funds (OC 21.0) to purchase office supplies. Using operations funds (OC 25.0) to pay employee salaries (OC 11.0). Using one program's funds for another program's costs. Using prior-year no-year funds for current-year unrelated purposes. Using SEC appropriation for any non-SEC government activity." },
          { head:"Augmentation of Appropriations",
            body:"An agency may not augment its appropriation by collecting fees or retaining offsetting receipts unless specifically authorized. 31 U.S.C. §3302 (miscellaneous receipts statute) requires that unauthorized collections be deposited in the Treasury as miscellaneous receipts. The SEC's Section 31 fee offset is a specific statutory exception." },
        ]},
      { title:"Anti-Deficiency Act", cite:"31 U.S.C. §§1341, 1342, 1517", icon:"⛔", color:C.red,
        sections:[
          { head:"What the ADA Prohibits",
            body:"§1341: An officer may not make or authorize an obligation or expenditure exceeding an amount available in an appropriation. §1342: No voluntary services beyond those authorized. §1517: An officer may not make or authorize an obligation or expenditure exceeding an apportionment or its equivalent. The ADA creates both an obligation limit (§1341 — the appropriated amount) and an apportionment limit (§1517 — the OMB-apportioned amount)." },
          { head:"The §1351 Reporting Trigger",
            body:"When an agency head learns of a potential or actual ADA violation, they must report to: (1) the President (via OMB), (2) Congress, and (3) the Inspector General. The report cannot be withheld pending investigation — it is concurrent. Time limit: immediately upon knowledge. The OSO FM Specialist is the first-line detector and must alert the chain of command the same day." },
          { head:"Penalties — Administrative",
            body:"§1349(a): An officer who knowingly and willfully violates §1341 or §1342 shall be subject to administrative discipline including written reprimand, suspension, demotion, or removal. The penalty is progressive and discretionary. Negligent violations may result in reprimand; willful violations typically result in removal." },
          { head:"Penalties — Criminal",
            body:"§1350: Knowing and willful violation of §1341 or §1342 is a crime: fine up to $5,000 AND/OR imprisonment up to 2 years. Both elements required: the person must (1) know the act is prohibited and (2) willfully commit it. Negligence alone does not create criminal liability. Criminal referrals go through DOJ; administrative referrals go through the Inspector General." },
        ]},
      { title:"Time Limitations", cite:"31 U.S.C. §§1502, 1552, 1553", icon:"⏳", color:C.purple,
        sections:[
          { head:"The Bona Fide Need Rule",
            body:"An annual appropriation may be used only to meet a genuine need arising in — or existing at the start of — the fiscal year for which the appropriation was made. §1502(a): A fixed-term appropriation is available only for payment of expenses properly incurred during the period of availability or to complete contracts properly made within that period. The BFN rule is the time-dimension application of the purpose statute." },
          { head:"Types of Appropriations by Time",
            body:"(1) Annual (1-year): Available only during the fiscal year — for the SEC, Oct 1 – Sep 30. (2) Multi-year: Available for a specified period (e.g., '2-year' funds). (3) No-year: Available until expended. (4) Contract authority: Obligational authority before appropriation. SEC's primary appropriation is annual, with $145M in no-year Budget Authority for FY2026 carryover flexibility." },
          { head:"Expired vs. Canceled Appropriations",
            body:"After a fiscal year ends, the appropriation enters 'expired' status for 5 years. Expired funds: can still be used to pay valid obligations incurred before expiration; cannot be used for new obligations. After 5 years, accounts are 'canceled' — any remaining balance is returned to the Treasury. Upward adjustments to closed accounts require a new appropriation. OSO FM Specialist must track 5-year clock on prior-year appropriations." },
          { head:"September Spending — The Surge Problem",
            body:"Year-end spending surges are a recurring audit focus. GAO and OIG scrutinize September obligation spikes. To defend September obligations: (1) document the specific FY2026 need, (2) explain why the need cannot wait until October 1, (3) confirm the goods/services will be received in FY2026, (4) document approval chain. OSO SOP-003 covers the September obligation freeze memo procedure." },
        ]},
      { title:"Transfer & Reprogramming", cite:"31 U.S.C. §1532 · OMB A-11 §20", icon:"🔄", color:C.gold,
        sections:[
          { head:"Transfer Authority",
            body:"§1532: Amounts appropriated for one purpose may be transferred to another purpose only when authorized by law. Congress grants specific transfer authority in most appropriations acts, typically subject to: (1) advance notification to Appropriations Committees, (2) percentage caps (often 10%), (3) cumulative limits across the fiscal year. Transfers without statutory authority are ADA violations." },
          { head:"Reprogramming vs. Transfer",
            body:"A reprogramming moves funds within a single appropriation account (within the same TAS). A transfer moves funds between different appropriation accounts (between TAS codes). The SEC's single appropriation account means most OSO realignments are reprogrammings, not transfers. OSO FM must track cumulative reprogrammings against the threshold before a committee notification is triggered." },
          { head:"Below-Threshold vs. Above-Threshold",
            body:"OMB A-11 §20 and agency-specific appropriations language define thresholds. Below-threshold reprogrammings (typically up to 10% or $500K in program changes): reported to Congress in quarterly or annual reports. Above-threshold: requires advance notification to and approval from Appropriations Committees before the reprogramming occurs. SEC OFM manages threshold tracking; OSO FM Specialist provides input data." },
          { head:"Practical Application at OSO",
            body:"Common OSO reprogramming scenarios: OSBO-PSE security contract grows beyond initial estimate — may require reprogramming from OSBO-FO. Unexpected COOP site cost — reprogramming from BMCB. FTE vacancy savings reallocated to contracts. Each scenario must be documented: problem statement, amount, source account, receiving account, and legal authority. Route through J. Harrison → R. Buckley → OFM." },
        ]},
    ];
    const law = laws[active];
    return (
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {laws.map((l,i) => (
            <button key={i} onClick={()=>setActive(i)}
              style={{ background: active===i ? `${l.color}22` : C.card,
                       border:`1px solid ${active===i ? l.color : C.border}`,
                       borderLeft:`3px solid ${active===i ? l.color : "transparent"}`,
                       borderRadius:7, padding:"10px 12px", cursor:"pointer", textAlign:"left" as const }}>
              <div style={{ fontSize:14, fontWeight:active===i?700:500, color:active===i?l.color:C.text,
                             marginBottom:2 }}>{l.icon} {l.title}</div>
              <div style={{ fontSize:11, fontFamily:"monospace", color:C.muted }}>{l.cite}</div>
            </button>
          ))}
        </div>
        <div>
          {law.sections.map((s,i) => (
            <SectionCard key={i} title={s.head}>
              <Body>{s.body}</Body>
            </SectionCard>
          ))}
        </div>
      </div>
    );
  };

  // ── TAB: BUDGET PROCESS — uses lifted state (phase / setPhase) ─────────
  const BudgetProcess = () => {
    // phase / setPhase already in scope from PageToolbox
    const phases = [
      { id:"formulation", label:"Formulation", icon:"✏️", color:C.purple },
      { id:"congress",    label:"Congressional Action", icon:"🏛️", color:C.blue },
      { id:"enactment",   label:"Enactment & Apportionment", icon:"✅", color:C.green },
      { id:"execution",   label:"Execution", icon:"⚡", color:C.gold },
    ];
    const content: Record<string, any> = {
      formulation: {
        timeline:[
          { when:"Spring (Year-2)",   what:"OMB issues A-11 Guidance",          who:"OMB",          detail:"OMB publishes updated Circular A-11 with the schedule, instructions, and policy priorities (e.g., FY2028 DOGE 10% efficiency target). Agencies begin internal planning." },
          { when:"May–Jul (Year-2)",  what:"Agency Internal Budget Call",       who:"OSO FM Spec",  detail:"BMCB FM Specialist distributes internal budget call templates to OFS, OSBO, OAMR, BMCB. Each office submits object-class breakdowns, FTE narratives, and program change justifications. FM Specialist coordinates, validates, and consolidates." },
          { when:"Aug (Year-2)",      what:"Agency Submission to OMB",         who:"SEC OFM",       detail:"OFM assembles SEC-wide budget request from all program offices. OSO package is a component. Request submitted to OMB in MAX/BRIM per A-11 schedule." },
          { when:"Oct–Nov (Year-2)",  what:"OMB Review & Passback",            who:"OMB/SEC",       detail:"OMB analysts review SEC's submission. OMB issues 'passback' — their proposed allowance for SEC, usually lower than the request. SEC budget office prepares appeals." },
          { when:"Dec–Jan",           what:"Appeals & Presidential Budget",    who:"OMB/President", detail:"SEC appeals significant passback changes. Final decisions made by OMB Director. President's Budget assembled from all agency submissions." },
          { when:"Feb (Year-1)",      what:"President's Budget Released",      who:"OMB",           detail:"President transmits budget to Congress per 31 U.S.C. §1105 (first Monday in February). SEC Congressional Budget Justification (CBJ) published. Congressional hearings begin." },
        ],
        osotip:"For FY2028: OMB A-11 guidance received May 2026. OSO internal budget call kicks off June-July 2026. Submissions from OFS, OSBO, OAMR, BMCB due to FM Specialist by July 31. OSO package due to OFM by August 31.",
      },
      congress: {
        timeline:[
          { when:"Feb–Mar",   what:"Budget Justification Hearings",          who:"SEC Chairs",   detail:"SEC leadership testifies before FSGG Subcommittees in House and Senate. FM Specialist supports OFM in preparing hearing-ready data books and fact sheets on OSO programs." },
          { when:"Mar–Apr",   what:"Committee Markup",                       who:"Congress",     detail:"House FSGG and Senate FSGG Subcommittees 'mark up' the appropriations bill — setting dollar amounts for SEC programs. Markup may differ significantly from the President's Budget request." },
          { when:"May–Jun",   what:"Full Committee and Floor Votes",         who:"Congress",     detail:"After subcommittee markup, the full Appropriations Committee votes, then the bill moves to the floor of each chamber. Amendments may be offered. The Senate and House often pass different versions." },
          { when:"Jun–Sep",   what:"House-Senate Conference",                who:"Congress",     detail:"A conference committee reconciles differences between House and Senate versions. For SEC FY2027: markup scheduled June 2026, conference likely Sep–Oct 2026." },
          { when:"Before Oct 1", what:"Enrollment & Presidential Signature", who:"President",   detail:"If all 12 appropriations bills pass, the President signs by September 30. If not, Congress passes a Continuing Resolution (CR) to keep the government open at prior-year levels." },
          { when:"Oct 1+",    what:"Continuing Resolution (if no enactment)",who:"Congress",    detail:"Under a CR, the SEC operates at 1/12 of its prior-year enacted level each month. OSO must model this scenario: ~$112M FY2026 total managed ÷ 12 = $9.33M/month in a CR environment (note: lease payments ~$4.9M/month are largely fixed obligations). No new programs or increased obligation rates above prior-year." },
        ],
        osotip:"For FY2027: Senate FSGG markup scheduled June 2026. House-Senate conference expected Oct 2026. CR scenario for OSO = $9.33M/month (1/12 of ~$112M FY2026 total managed). Lease obligations (~$4.9M/month) are fixed regardless of CR — flag to OFM immediately if CR threatens lease payment authority.",
      },
      enactment: {
        timeline:[
          { when:"Signing Day",   what:"Appropriations Act Enacted",          who:"President",    detail:"The President signs the appropriations act into law. The act specifies the exact dollar amount for the SEC for the fiscal year (e.g., '$X million for necessary expenses of the Securities and Exchange Commission'). This is the legal basis for all FY obligations." },
          { when:"Within Days",  what:"OMB Apportionment Process",            who:"OMB",          detail:"Within days of enactment, SEC OFM submits an SF-132 (Apportionment and Reapportionment Schedule) to OMB. OMB apportions the appropriated funds by program, time period, or other category. Agencies may not obligate more than is apportioned." },
          { when:"Week 1",       what:"Allotment by Agency Head",             who:"CFO",          detail:"After OMB apportions, the agency head (via CFO) allots funds to program offices. SEC OFM loads allotments into Momentum and BPPAS by cost center and object class. OSO receives its allotment for each of 8 offices." },
          { when:"Week 1–2",     what:"Sub-allotment to OSO",                 who:"OFM/OSO",      detail:"OFM loads OSO's allotment by cost center in Momentum. BMCB FM Specialist verifies that each office's allotment matches the approved OSO budget. Discrepancies are flagged to OFM within 48 hours." },
          { when:"Ongoing",      what:"Re-apportionment (if needed)",         who:"OMB",          detail:"If program needs change during the year, the SEC submits a revised SF-132 to OMB for re-apportionment. Common trigger: supplemental appropriation, rescission, sequestration, or emergency requirement." },
          { when:"Year-End",     what:"Final Apportionment / Warrant",        who:"Treasury",     detail:"Treasury issues warrants authorizing the SEC to draw on its appropriation. Year-end: any obligated but unexpended amounts are carried forward as unliquidated obligations (ULOs). Unobligated balances of annual funds expire Sep 30." },
        ],
        osotip:"OSO FM Specialist action at allotment: (1) verify all 8 office allotments loaded correctly in Momentum, (2) reconcile BPPAS allotment data against Momentum within 48 hours, (3) distribute internal spending authority memos to each OSO office head, (4) set up monthly benchmark tracking.",
      },
      execution: {
        timeline:[
          { when:"Oct 1 – Daily",  what:"Obligation Monitoring",               who:"FM Specialist", detail:"Daily: check Momentum for new obligations entered by OSO contracting officers. Verify cost center, OC code, and appropriation TAS are correct. Calculate running burn rate for each office. Flag any item approaching 90% of allotment." },
          { when:"Monthly",        what:"Burn Rate Analysis & Status Report",  who:"FM Specialist", detail:"By the 5th: Pull Momentum data. By the 8th: Draft monthly status brief for J. Harrison. Include: burn rate by office vs. benchmark, ADA risk assessment, OIG corrective action updates, GPC status, pending obligations. Distribute by the 10th." },
          { when:"Quarterly",      what:"SF-133 Report Preparation",          who:"OFM/FM Spec",   detail:"OFM prepares the SF-133 (Report on Budget Execution and Budgetary Resources) and submits to OMB. OSO FM Specialist provides supporting data, reconciles Momentum totals, and certifies OSO cost center accuracy." },
          { when:"August",         what:"Year-End Projection & ULO Review",   who:"FM Specialist", detail:"August 1: Project full-year obligations for all OSO offices. Flag any office tracking over 100% of allotment — ADA risk. Review all ULOs — identify de-obligation candidates. Brief J. Harrison and R. Buckley by August 15." },
          { when:"September",      what:"Year-End Close & Obligation Freeze",  who:"FM Specialist", detail:"September 1: Recommend discretionary obligation freeze memo. September 1-30: Every proposed obligation gets bona fide need review. September 15: Final ULO de-obligation sweep. September 28: Final Momentum reconciliation with OFM. September 30 COB: Last entry deadline." },
          { when:"October",        what:"Post-Close & New FY Kickoff",        who:"FM Specialist", detail:"October 1: New fiscal year begins. Verify new-year allotments loaded in Momentum. Certify prior-year obligation record is complete. Begin FY+1 burn rate monitoring. OFM issues October close reports within 30 days." },
        ],
        osotip:"FY2026 Execution Status (June 1): Month 9 · 76.9% of $112M total managed obligated ($86.1M YTD) · OSBO-CL (leases) at 75% ($43.9M of $58.5M — monthly lease payments very predictable) · OSBO-PSE at 83% ($16.2M of $19.5M — security T&M contract ceiling watch for Q4) · OFS at 78% ($10.3M of $13.2M) · Overall tracking to benchmark. SOURCE: CBJ FY2025 p.13 (OC 23.0=$109M), p.16 (Appropriations Language — leases), p.74-75 (OSO org budget $36.96M).",
      },
    };
    const p = content[phase];
    const phaseObj = phases.find(x=>x.id===phase)!;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Phase selector */}
        <div style={{ display:"flex", gap:0, background:C.dim+"44", borderRadius:10, padding:4 }}>
          {phases.map(ph => (
            <button key={ph.id} onClick={()=>setPhase(ph.id)}
              style={{ flex:1, background: phase===ph.id ? ph.color : "transparent",
                       border:"none", borderRadius:7, padding:"10px 8px",
                       cursor:"pointer", transition:"all 0.18s" }}>
              <div style={{ fontSize:18, marginBottom:2 }}>{ph.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color: phase===ph.id ? "#fff" : C.muted,
                             lineHeight:1.3 }}>{ph.label}</div>
            </button>
          ))}
        </div>
        {/* Timeline */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {p.timeline.map((t: any, i: number) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:14, alignItems:"flex-start" }}>
              <div style={{ background:`${phaseObj.color}18`, border:`1px solid ${phaseObj.color}30`,
                             borderRadius:7, padding:"7px 10px", textAlign:"center" as const }}>
                <div style={{ fontSize:12, fontWeight:700, color:phaseObj.color, lineHeight:1.4 }}>{t.when}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{t.who}</div>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8,
                             padding:"11px 14px", borderLeft:`3px solid ${phaseObj.color}` }}>
                <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>{t.what}</div>
                <div style={{ fontSize:15, color:C.textSub, lineHeight:1.65 }}>{t.detail}</div>
              </div>
            </div>
          ))}
        </div>
        {/* OSO tip */}
        <div style={{ background:`${phaseObj.color}12`, border:`1px solid ${phaseObj.color}30`,
                       borderRadius:8, padding:"11px 15px" }}>
          <span style={{ fontWeight:700, color:phaseObj.color, fontSize:14 }}>💡 OSO FM Tip: </span>
          <span style={{ fontSize:14, color:C.muted }}>{p.osotip}</span>
        </div>
      </div>
    );
  };

  // ── TAB: CASE STUDIES — uses lifted state (caseActive) ─────────────────
  const CaseStudies = () => {
    const active = caseActive; const setActive = setCaseActive;
    const cases = [
      { id:1, title:"ADA Violation — Exceeding Apportionment", law:"31 U.S.C. §§1341, 1517", severity:"CRITICAL", color:C.red,
        facts:"An OSO office head, under pressure to meet a year-end project deadline, directs the FM Specialist to obligate $150,000 for a new construction contract in OSBO-CL. The FY2026 OSBO-CL allotment is $3,600,000. YTD obligations are $3,580,000. The remaining allotment is $20,000. The proposed obligation exceeds the allotment by $130,000.",
        issue:"Does this obligation violate the Anti-Deficiency Act?",
        analysis:"Yes. Under 31 U.S.C. §1341(a), an officer may not make or authorize an obligation exceeding the amount available in an appropriation. The available balance is $20,000. The proposed $420,000 obligation would exceed this by $400,000. It does not matter that the project is mission-critical or that the office head directed it — the FM Specialist may not authorize this obligation. Executing it would make both the authorizing officer and the FM Specialist liable.",
        outcome:"Correct action: Decline to enter the obligation. Immediately notify J. Harrison (BMCB Chief) and flag the ADA risk. Identify available reprogramming authority from another OSO office or request an allotment adjustment from OFM before any obligation is entered. If the office head insists: document the direction in writing and escalate to R. Buckley (AD, Operations). The FM Specialist's duty is to prevent ADA violations — not to execute them on direction.",
        lesson:"Lesson: Budget controls in Momentum exist precisely to prevent this. Do not override system controls. If a transaction is blocked, that block is the system enforcing appropriations law — not a technical error.",
      },
      { id:2, title:"Purpose Statute Violation — Wrong Fund Use", law:"31 U.S.C. §1301(a)", severity:"HIGH", color:C.orange,
        facts:"In September, OSBO-FO (Facilities Operations) is at 97% of its $5,100,000 allotment. The FOIA Services branch (OFS) has $340,000 remaining in its allotment. The OSBO-FO office head asks the FM Specialist to use OFS allotment funds to pay a $52,000 facilities management invoice, arguing that the FOIA office indirectly benefits from facilities services.",
        issue:"Can OFS funds be used to pay a Facilities Operations invoice?",
        analysis:"No. Under the purpose statute (31 U.S.C. §1301(a)), appropriations must be applied only to the objects for which they were made. OFS allotment funds are designated for FOIA Services operations. Facilities management costs are properly chargeable to OSBO-FO. The 'indirect benefit' argument does not satisfy the necessary expense test — the expense is not directly related to FOIA Services operations and is specifically provided for under the OSBO-FO allotment. Using OFS funds for this invoice would also constitute an improper cross-subsidy between cost centers.",
        outcome:"Correct action: Deny the request. Advise that OSBO-FO must either: (1) request an allotment increase from OFM, (2) seek a reprogramming from another OSBO sub-account, or (3) de-obligate existing OSBO-FO ULOs to create room. Document the denial and rationale in writing. Route the reprogramming request through J. Harrison to OFM.",
        lesson:"Lesson: Cost center allotments exist for a legal reason. Commingling funds between program offices, even within OSO, requires documented OFM approval and proper accounting entries — not an informal substitution.",
      },
      { id:3, title:"Bona Fide Need — September Year-End Rush", law:"31 U.S.C. §1502(a) · Bona Fide Need Doctrine", severity:"HIGH", color:C.gold,
        facts:"On September 25, an OSBO office head submits an obligation request for $78,000 in office furniture. The request references a need to 'use up remaining FY2026 balance.' The proposed delivery date is October 15 — two weeks into FY2027. The FY2026 allotment has $83,000 remaining in OSBO.",
        issue:"Can FY2026 funds be obligated for furniture to be delivered on October 15, 2026?",
        analysis:"No, for the furniture with an October 15 delivery date. Under 31 U.S.C. §1502(a) and the bona fide need doctrine, an annual appropriation may be used only to meet a genuine need arising during the period of availability (FY2026, ending Sep 30, 2026). Furniture to be delivered in FY2027 represents a FY2027 need, not a FY2026 need — the delivery date controls. The phrase 'use up remaining balance' is not a bona fide need. This is the textbook 'September surge' problem that OIG and GAO scrutinize. If the furniture were needed and delivered before September 30, the obligation would be appropriate (with documentation).",
        outcome:"Correct action: Decline the obligation as submitted. If the furniture is genuinely needed before Sep 30, the office must arrange delivery by Sep 30 — and document the genuine operational need (not the fund-expiration rationale). If the need is FY2027, it should be obligated in FY2027 from the new appropriation. The FM Specialist must document this decision and add it to the September obligation freeze memo under SOP-003.",
        lesson:"Lesson: The motivation for an obligation ('use up the balance') is irrelevant and actually harmful — it signals the absence of a bona fide need. Every September obligation must be defensible on its own operational merits.",
      },
      { id:4, title:"Time Limitations — Using Expired Funds", law:"31 U.S.C. §§1552, 1553", severity:"MEDIUM", color:C.purple,
        facts:"In November 2026 (FY2027), OFM notifies OSO that a contractor submitted a late invoice for $14,200 for work performed and accepted in August 2026 (FY2026). The FY2026 appropriation has expired as of September 30, 2026. The FM Specialist needs to determine how to process this payment.",
        issue:"Can the FY2026 expired appropriation still be used to pay this valid FY2026 invoice?",
        analysis:"Yes — with important conditions. Under 31 U.S.C. §1553 (Liquidation of Obligation), an expired appropriation may be used for up to 5 years after expiration to liquidate (pay) obligations that were properly incurred before the account expired. The key test: (1) Was the obligation properly incurred in FY2026? Yes — work was performed and accepted in August 2026. (2) Was the obligation recorded in Momentum in FY2026? This is the critical issue — if the obligation was not recorded before September 30, there may be an issue with whether it was a valid FY2026 obligation. If it was recorded, the FY2026 expired account can pay it.",
        outcome:"Action: Verify in Momentum that the underlying contract obligation was recorded in FY2026. If recorded: route to OFM to process payment from the expired FY2026 account. If NOT recorded: consult OFM and SEC General Counsel — an unrecorded obligation may require a new obligation from FY2027 funds with proper justification, and potentially an ADA review if the commitment was made verbally or informally in FY2026.",
        lesson:"Lesson: Timely obligation recording is critical. Informal commitments, unrecorded agreements, and late-arriving invoices all create these after-the-fact problems. The FM Specialist must enforce obligation recording discipline — not just payment processing.",
      },
      { id:5, title:"SEC Fee Rate — Section 31 Scenario", law:"Securities Exchange Act §31 · 15 U.S.C. §78ee", severity:"INFO", color:C.cyan,
        facts:"Congress appropriates $1,908,000,000 for the SEC for FY2027. OMB projects that equity transaction volume on national securities exchanges for FY2027 will total approximately $269 trillion in aggregate principal amount of securities sales. The SEC must set the Section 31 fee rate for FY2027.",
        issue:"What is the Section 31 fee rate for FY2027 (per $1,000,000 of sale proceeds)?",
        analysis:"Under §6(b) of the Securities Exchange Act, the SEC sets the fee rate as follows: Rate = (Appropriation) ÷ (Projected Volume). Rate = $1,908,000,000 ÷ $269,000,000,000,000 × $1,000,000 = $7.10 per $1,000,000. This matches the published FY2027 rate of $7.10 per $1M. The fee is a self-offsetting collection — Section 31 fees fully fund the SEC's appropriation, making the SEC budget-neutral to the federal government on a net basis. If actual collections exceed the appropriation, excess flows to the §31(j) Reserve Fund (capped at $100M).",
        outcome:"OSO Financial Management implication: The Section 31 fee mechanism makes the SEC's budget discussion in Congress primarily about the amount of the appropriation and the 4,177 FTE cap — not about the source of funds. A larger appropriation means a higher fee rate (and vice versa). If Congress cuts the SEC budget to $1.7B, the fee rate would fall to approximately $6.32 per $1M. The OSO FM Specialist should understand this mechanism when briefing stakeholders on why the SEC budget 'costs' the Treasury nothing on a net basis.",
        lesson:"Lesson: Understanding the SEC's unique funding mechanism (deficit-neutral, fee-offset) is essential for contextualizing OSO budget decisions. Unlike most agencies, a budget 'cut' at the SEC does not necessarily mean reduced federal outlays — it may simply result in a lower fee rate collected from exchanges.",
      },
    ];
    const c = cases[active];
    return (
      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {cases.map((cs,i) => (
            <button key={i} onClick={()=>setActive(i)}
              style={{ background: active===i ? `${cs.color}22` : C.card,
                       border:`1px solid ${active===i ? cs.color : C.border}`,
                       borderLeft:`3px solid ${active===i ? cs.color : "transparent"}`,
                       borderRadius:7, padding:"10px 12px", cursor:"pointer", textAlign:"left" as const }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:12, fontWeight:700, color:active===i?cs.color:C.muted }}>CASE {cs.id}</span>
                <span style={{ fontSize:10, fontWeight:700, background:`${cs.color}18`, color:cs.color,
                                borderRadius:3, padding:"1px 5px" }}>{cs.severity}</span>
              </div>
              <div style={{ fontSize:13, fontWeight:active===i?700:500, color:active===i?cs.color:C.text,
                             lineHeight:1.4 }}>{cs.title}</div>
              <div style={{ fontSize:11, fontFamily:"monospace", color:C.muted, marginTop:3 }}>{cs.law}</div>
            </button>
          ))}
        </div>
        <div>
          <SectionCard title={`Case ${c.id}: ${c.title}`} sub={c.law}>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <Chip label={c.severity} color={c.color} />
              <Chip label={c.law} color={C.muted} />
            </div>
            <H>Facts</H>
            <Body>{c.facts}</Body>
            <H>Issue</H>
            <div style={{ background:`${C.blue}10`, border:`1px solid ${C.blue}22`, borderRadius:7,
                           padding:"10px 14px", marginBottom:12 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.blue, fontStyle:"italic" }}>{c.issue}</div>
            </div>
            <H>Legal Analysis</H>
            <Body>{c.analysis}</Body>
            <H>Outcome & Correct Action</H>
            <div style={{ background:`${c.color}10`, border:`1px solid ${c.color}30`, borderRadius:7,
                           padding:"11px 14px", marginBottom:12 }}>
              <div style={{ fontSize:15, color:C.textSub, lineHeight:1.7 }}>{c.outcome}</div>
            </div>
            <H>Key Lesson</H>
            <div style={{ background:`${C.gold}10`, border:`1px solid ${C.gold}30`, borderRadius:7,
                           padding:"10px 14px" }}>
              <span style={{ fontWeight:700, color:C.gold }}>📌 </span>
              <span style={{ fontSize:15, color:C.muted, lineHeight:1.65 }}>{c.lesson}</span>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <PageHeader icon="🧰" title="FM Toolbox"
        subtitle="Job Requirements · Financial Systems · Appropriations Law · Budget Process · Case Studies · Analytics & AI/ML" />

      {/* Tab bar */}
      <div style={{ display:"flex", gap:4, background:C.card, borderRadius:10, padding:5,
                     border:`1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1, background: tab===t.id ? C.blue : "transparent",
                     border:`1px solid ${tab===t.id ? C.blue : "transparent"}`,
                     borderRadius:7, padding:"9px 6px", cursor:"pointer", transition:"all 0.18s" }}>
            <div style={{ fontSize:16, marginBottom:2 }}>{t.icon}</div>
            <div style={{ fontSize:13, fontWeight:tab===t.id?700:400,
                           color:tab===t.id?"#fff":C.muted }}>{t.label}</div>
          </button>
        ))}
      </div>

      {tab === "jobreq"    && <JobReq />}
      {tab === "tools"     && <ToolsTab />}
      {tab === "applaw"    && <AppropLaw />}
      {tab === "process"   && <BudgetProcess />}
      {tab === "cases"     && <CaseStudies />}
      {tab === "analytics" && (() => {
        // ── TAB: ANALYTICS & AI/ML — uses lifted state (analytic / setAnalytic) ──
        const SCard = ({ title, sub, children }: any) => (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px", marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:17, color:C.text, marginBottom:2 }}>{title}</div>
            {sub && <div style={{ fontSize:13, color:C.muted, marginBottom:10 }}>{sub}</div>}
            {children}
          </div>
        );
        const H = ({ children }: any) => <div style={{ fontSize:14, fontWeight:800, color:C.blue, letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:5, marginTop:14 }}>{children}</div>;
        const P = ({ children }: any) => <div style={{ fontSize:15, color:C.textSub, lineHeight:1.75, marginBottom:8 }}>{children}</div>;
        const Tag = ({ label, color }: any) => <span style={{ fontSize:11, fontWeight:700, background:`${color}18`, color, borderRadius:4, padding:"2px 8px", marginRight:4, display:"inline-block" }}>{label}</span>;

        const sections = [
          { id:"overview",   label:"Why Analytics Matters",  icon:"🎯" },
          { id:"burnrate",   label:"Burn Rate Analytics",    icon:"📈" },
          { id:"anomaly",    label:"Anomaly Detection / ML", icon:"🔍" },
          { id:"nlp",        label:"NLP & Document AI",      icon:"📝" },
          { id:"rpa",        label:"Automation & RPA",       icon:"🤖" },
          { id:"dashboard",  label:"Dashboard Design",       icon:"📊" },
          { id:"govai",      label:"AI in Federal FM",       icon:"🏛️" },
        ];

        return (
          <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:16 }}>
            {/* Sidebar */}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {sections.map(s => (
                <button key={s.id} onClick={()=>setAnalytic(s.id)}
                  style={{ background: analytic===s.id ? `${C.purple}22` : C.card,
                           border:`1px solid ${analytic===s.id ? C.purple : C.border}`,
                           borderLeft:`3px solid ${analytic===s.id ? C.purple : "transparent"}`,
                           borderRadius:7, padding:"9px 12px", cursor:"pointer", textAlign:"left" as const,
                           fontWeight:analytic===s.id?700:400,
                           color:analytic===s.id?C.purple:C.muted, fontSize:14 }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div>
              {analytic === "overview" && (
                <div>
                  <SCard title="Why Data Analytics Transforms Federal Financial Management" sub="From reactive reporting to proactive intelligence — the shift every OSO FM Specialist needs to make">
                    <P>Traditional federal financial management is largely <strong style={{color:C.text}}>backward-looking</strong>: pull a Momentum report, compute last month's burn rate, send a status brief. This cycle leaves decision-makers reacting to problems rather than anticipating them. Data analytics and AI invert this model — they enable the FM Specialist to identify a spending anomaly before it becomes an ADA violation, forecast year-end position with 95% confidence in August, and generate stakeholder briefings in minutes rather than hours.</P>
                    <P>The SEC's FY2027 CBJ explicitly calls out AI and data analytics as agency priorities: <em>"The SEC will accelerate its transition to secure, cloud-based systems and expand the use of advanced analytics and AI to enhance market surveillance and compliance."</em> Within OSO, the same tools that make markets smarter can make the FM function smarter.</P>
                    <H>The OSO FM Analytics Stack</H>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                      {[
                        { layer:"Data Sources", items:["Momentum ERP (obligations, payments)", "BPPAS (allotments, budget plans)", "SAM.gov (contract data)", "GSA SmartPay (GPC transactions)", "USASpending.gov (historical)"], color:C.blue },
                        { layer:"Analytics Layer", items:["Excel + Power Query (current state)", "Python / pandas (intermediate)", "SQL on BPPAS data exports", "R or Python for forecasting models", "Power BI / Tableau for visualization"], color:C.purple },
                        { layer:"AI/ML Applications", items:["Burn rate forecasting (regression)", "Anomaly detection (isolation forest)", "NLP for contract/OIG document parsing", "Pattern recognition in GPC transactions", "Automated brief generation (LLMs)"], color:C.gold },
                        { layer:"Governance", items:["FedRAMP-authorized tools only", "No PII in cloud AI tools", "OMB AI policy compliance (M-24-10)", "Data classification checks before upload", "FISMA controls on analytics systems"], color:C.red },
                      ].map((l,i) => (
                        <div key={i} style={{ background:C.dim+"33", borderRadius:8, padding:"11px 13px", borderTop:`3px solid ${l.color}` }}>
                          <div style={{ fontSize:13, fontWeight:800, color:l.color, letterSpacing:"0.07em", marginBottom:7 }}>{l.layer}</div>
                          {l.items.map((item,j) => <div key={j} style={{ fontSize:14, color:C.textSub, marginBottom:3 }}>• {item}</div>)}
                        </div>
                      ))}
                    </div>
                  </SCard>
                  <SCard title="The OSO FM Maturity Model" sub="From spreadsheet-first to AI-assisted financial management">
                    {[
                      { level:"Level 1 — Manual", color:C.red,    desc:"Momentum reports exported to Excel. Burn rates calculated manually. Status briefs built from scratch each month. Anomalies discovered after the fact. Reaction time: days to weeks." },
                      { level:"Level 2 — Structured", color:C.gold, desc:"Standardized templates and formulas. Monthly burn rate tracking in a maintained Excel tracker. Consistent object class coding. Status briefs generated from a standard template. Reaction time: days." },
                      { level:"Level 3 — Automated", color:C.cyan,  desc:"Power Query / Python scripts auto-pull Momentum data exports. Burn rate dashboards refresh on schedule. Threshold alerts trigger automatically. Briefs generated from structured data. Reaction time: hours." },
                      { level:"Level 4 — Predictive", color:C.blue,  desc:"Machine learning models forecast year-end position with confidence intervals. Anomaly detection flags outliers before they become violations. NLP scans new contracts for OIG-flagged patterns. Reaction time: minutes." },
                      { level:"Level 5 — AI-Assisted", color:C.purple, desc:"LLMs draft stakeholder briefs from structured data. AI validates obligation entries against the purpose statute. Automated ADA risk scoring on every proposed transaction. The FM Specialist becomes a reviewer and decision-maker rather than a data processor. Reaction time: real-time." },
                    ].map((m,i) => (
                      <div key={i} style={{ display:"flex", gap:12, marginBottom:10, alignItems:"flex-start" }}>
                        <div style={{ minWidth:130, background:`${m.color}18`, border:`1px solid ${m.color}30`, borderRadius:6, padding:"5px 10px", textAlign:"center" as const }}>
                          <div style={{ fontSize:12, fontWeight:700, color:m.color, lineHeight:1.3 }}>{m.level.split("—")[0]}</div>
                          <div style={{ fontSize:11, color:m.color }}>— {m.level.split("—")[1]}</div>
                        </div>
                        <div style={{ fontSize:14, color:C.textSub, lineHeight:1.65, flex:1 }}>{m.desc}</div>
                      </div>
                    ))}
                  </SCard>
                </div>
              )}

              {analytic === "burnrate" && (
                <SCard title="Burn Rate Analytics — From Monthly Report to Predictive Model" sub="How to build a living burn rate model that forecasts year-end position automatically">
                  <H>The Standard Monthly Burn Rate Calculation</H>
                  <P>The baseline burn rate formula every FM Specialist must know: <strong style={{color:C.cyan, fontFamily:"monospace"}}>Burn Rate % = YTD Obligations ÷ Total Allotment × 100</strong>. The monthly benchmark is <strong style={{color:C.text}}>Month Number ÷ 12</strong> (e.g., Month 9 benchmark = 75.0%). Deviation &gt;10% above or below benchmark requires narrative explanation in the status brief.</P>
                  <H>Linear Projection Model (Level 3)</H>
                  <P>A simple but powerful improvement: instead of just reporting what has been spent, project what will be spent by September 30. The formula: <strong style={{color:C.cyan, fontFamily:"monospace"}}>Projected Year-End = (YTD Obligations ÷ Months Elapsed) × 12</strong>. In Excel, this is two cells. In Python/pandas, it runs across all 8 OSO offices in one pass. The resulting "projected surplus / deficit" figure is more actionable than a burn rate percentage alone.</P>
                  <div style={{ background:C.dim+"44", borderRadius:8, padding:"12px 14px", marginBottom:12, fontFamily:"monospace", fontSize:13, color:C.cyan }}>
                    <div style={{ color:C.muted, marginBottom:5 }}># Python example — burn rate projection for all OSO offices</div>
                    <div>import pandas as pd</div>
                    <div>df = pd.read_excel("momentum_export.xlsx")</div>
                    <div>df["pct_burned"] = df["ytd"] / df["allotment"] * 100</div>
                    <div>df["projected_ye"] = df["ytd"] / 9 * 12  <span style={{color:C.muted}}># Month 9</span></div>
                    <div>df["variance"] = df["projected_ye"] - df["allotment"]</div>
                    <div>df["ada_risk"] = df["variance"].apply(lambda x: "HIGH" if x &gt; 0 else "LOW")</div>
                    <div style={{ color:C.muted, marginTop:4 }}># Outputs: table with burn %, projected YE, surplus/deficit, ADA flag</div>
                  </div>
                  <H>Seasonality-Adjusted Projection (Level 4)</H>
                  <P>Not all months spend equally. Security contracts surge in Q1 (new option year). Construction peaks in Q2-Q3. September obligations spike for year-end certifications. A seasonality-adjusted model weights each month's spending by historical patterns, producing more accurate year-end forecasts than a simple average. This requires 3+ years of historical Momentum data (obtainable via USASpending.gov for benchmarking).</P>
                  <H>Confidence Intervals — What Good Forecasting Looks Like</H>
                  <P>A professional burn rate forecast includes not just a point estimate but a confidence range: "Projected year-end: $52.8M ± $1.4M (95% CI)." The bounds are calculated from historical month-to-month variance in each office's spending. When the lower bound approaches the allotment ceiling, that's an early ADA warning signal — even if the central projection is within limits.</P>
                  <H>Automated Threshold Alerts</H>
                  <P>In a Level 3/4 system, instead of manually checking each office monthly, you configure threshold alerts: if any office's projected year-end exceeds allotment by &gt;5%, the system sends an email to the FM Specialist automatically. This transforms monitoring from a monthly chore into a continuous background process, freeing the FM Specialist to focus on the flagged cases rather than the routine ones.</P>
                </SCard>
              )}

              {analytic === "anomaly" && (
                <SCard title="Anomaly Detection & Machine Learning for Obligation Monitoring" sub="Using ML to catch problems before they become ADA violations">
                  <H>What Is an Anomaly in Federal Financial Data?</H>
                  <P>An anomaly is a transaction that deviates significantly from expected patterns based on historical norms. In the OSO context, anomalies worth detecting include: (1) an obligation entered against the wrong cost center (object class mismatch), (2) a spike in OSBO-PSE spending outside the normal security contract cycle, (3) a GPC transaction that looks like a split purchase (two charges from the same vendor on the same day, each below the MPT), (4) a September obligation with a delivery date in October, (5) a commitment entered into Momentum without a corresponding contract number.</P>
                  <H>Isolation Forest — The Right Algorithm for FM Anomalies</H>
                  <P>The Isolation Forest algorithm is particularly well-suited to federal financial data because: (1) it works with small datasets (you don't need years of data), (2) it's unsupervised — you don't need labeled "fraud" examples to train it, (3) it handles high-dimensional data (multiple object classes, multiple offices) naturally, and (4) it produces an interpretable "anomaly score" for each transaction.</P>
                  <div style={{ background:C.dim+"44", borderRadius:8, padding:"12px 14px", marginBottom:12, fontFamily:"monospace", fontSize:13, color:C.cyan }}>
                    <div style={{ color:C.muted, marginBottom:5 }}># Isolation Forest on OSO GPC transaction data</div>
                    <div>from sklearn.ensemble import IsolationForest</div>
                    <div>import pandas as pd</div>
                    <div>df = pd.read_csv("smartpay_transactions.csv")</div>
                    <div>features = df[["amount","day_of_month","vendor_frequency","oc_code"]]</div>
                    <div>clf = IsolationForest(contamination=0.05, random_state=42)</div>
                    <div>df["anomaly_score"] = clf.fit_predict(features)</div>
                    <div>flags = df[df["anomaly_score"] == -1]  <span style={{color:C.muted}}># -1 = anomalous</span></div>
                    <div style={{ color:C.muted, marginTop:4 }}># Output: list of flagged transactions for FM Specialist review</div>
                  </div>
                  <H>Split-Purchase Pattern Detection (Rule-Based + ML Hybrid)</H>
                  <P>GPC split-purchase detection is ideal for a hybrid approach. The rule-based layer flags obvious cases (same vendor, same cardholder, same day, amounts summing above MPT). The ML layer catches the subtler cases: same vendor over multiple days in the same billing cycle, or multiple cardholders at the same vendor within a short window. The hybrid catches what rules alone miss without the false-positive rate of pure ML.</P>
                  <H>Object Class Mismatch Detection</H>
                  <P>Natural language processing can help here: train a simple text classifier on the description field of Momentum obligation entries. The model learns that "security guard services" → OC 25.0, "office furniture" → OC 31.0, "employee salary" → OC 11.0. When an obligation description doesn't match its coded object class, the model flags it for review. This catches one of the most common audit findings (object class coding errors) automatically — before OFM or OIG finds them.</P>
                  <H>Practical Implementation Path for OSO</H>
                  {[
                    { step:"Step 1", desc:"Export Momentum obligation data to CSV (monthly). This is a standard report OFM can provide or that the FM Specialist can run directly.", tool:"Momentum / Excel" },
                    { step:"Step 2", desc:"Load into a Python/pandas notebook. Compute statistical baselines (mean, std dev) for each office and object class combination.", tool:"Python (pandas, scipy)" },
                    { step:"Step 3", desc:"Apply Isolation Forest or simple z-score thresholding to flag outliers. Anything beyond 2.5 standard deviations gets flagged.", tool:"scikit-learn" },
                    { step:"Step 4", desc:"Output a flagged-items table to Excel. FM Specialist reviews each flagged item and codes it as 'valid' or 'investigate.' This feedback loop improves the model over time.", tool:"Excel / email" },
                    { step:"Step 5", desc:"After 6 months of feedback data, retrain the model with labeled examples. The model now knows your office's specific patterns.", tool:"Python, scheduled task" },
                  ].map((s,i) => (
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:10 }}>
                      <div style={{ minWidth:60, background:`${C.blue}18`, borderRadius:6, padding:"4px 8px", textAlign:"center" as const, fontSize:12, fontWeight:700, color:C.blue, height:"fit-content" }}>{s.step}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, color:C.textSub, lineHeight:1.6, marginBottom:2 }}>{s.desc}</div>
                        <Tag label={s.tool} color={C.cyan} />
                      </div>
                    </div>
                  ))}
                </SCard>
              )}

              {analytic === "nlp" && (
                <SCard title="Natural Language Processing for Federal FM Documents" sub="Making OIG reports, contracts, and policy documents machine-readable and actionable">
                  <H>Why NLP Matters for the OSO FM Specialist</H>
                  <P>The FM Specialist's world is full of unstructured text: OIG audit reports (50-100 pages each), contract SOWs, OMB circulars, congressional hearing transcripts, corrective action plans. Manually reading and synthesizing these documents takes hours. NLP techniques can extract the key facts — deadlines, dollar amounts, risk ratings, recommendations — in seconds, and surface them in the FM Specialist's daily workflow.</P>
                  <H>Named Entity Recognition (NER) for OIG Reports</H>
                  <P>NER is an NLP technique that identifies and classifies named entities in text: dates, dollar amounts, organizational names, legal citations, and risk ratings. Applied to OIG-582 (now CLOSED — used here as a worked example), an NER model would automatically extract: finding severity, dollar amounts at risk, deadlines, responsible office, and cited regulations. This structured output can then feed directly into the OIG tracker — no manual entry required.</P>
                  <div style={{ background:C.dim+"44", borderRadius:8, padding:"12px 14px", marginBottom:12, fontFamily:"monospace", fontSize:13, color:C.cyan }}>
                    <div style={{ color:C.muted, marginBottom:5 }}># Extracting key facts from an OIG report using spaCy NER</div>
                    <div>import spacy</div>
                    <div>nlp = spacy.load("en_core_web_trf")  <span style={{color:C.muted}}># transformer-based model</span></div>
                    <div>{"with open('oig_582.txt') as f: text = f.read()"}</div>
                    <div>doc = nlp(text)</div>
                    <div>{"for ent in doc.ents:"}</div>
                    <div>{"    if ent.label_ in ['DATE','MONEY','ORG','LAW']:"}</div>
                    <div>{"        print(ent.text, ent.label_)"}</div>
                    <div style={{ color:C.muted, marginTop:4 }}># Output: "September 30, 2026 DATE", "$382,000 MONEY", "BMCB ORG", etc.</div>
                  </div>
                  <H>Document Similarity for Contract Scope Comparison</H>
                  <P>The OIG-582 finding was partly about using T&M contracts where fixed-price was appropriate. An NLP similarity model can compare a new contract's SOW text against a library of known T&M vs. FFP contracts and predict which type is more appropriate — based on how well the scope is defined, not just the contracting officer's judgment. This directly supports the contract type decision matrix required by OIG-582 Recommendation 2.</P>
                  <H>LLM-Powered Brief Generation</H>
                  <P>Large language models (GPT-4, Claude, Gemini) can generate the monthly OSO Financial Status Brief narrative from structured data inputs. The FM Specialist provides: the burn rate table (numbers), the OIG action status (coded), the GPC compliance status (coded). The LLM generates the narrative prose — the exact language that would go in Section 1 (Executive Summary) of the brief sent to J. Harrison. The FM Specialist reviews and edits; total time drops from 3 hours to 30 minutes.</P>
                  <H>Key Governance Constraint</H>
                  <P><strong style={{color:C.red}}>Critical:</strong> Before using any cloud-based AI/NLP tool with SEC data, confirm: (1) the tool is FedRAMP Authorized at the appropriate impact level, (2) no Controlled Unclassified Information (CUI) or PII is uploaded to non-authorized systems, (3) usage aligns with OMB Memorandum M-24-10 (Advancing Governance, Innovation, and Risk Management for Agency Use of Artificial Intelligence). When in doubt, use open-source models running on SEC-controlled infrastructure.</P>
                </SCard>
              )}

              {analytic === "rpa" && (
                <SCard title="Robotic Process Automation — Eliminating Manual FM Tasks" sub="Which OSO FM processes are prime candidates for automation, and how to build them">
                  <H>What Is RPA?</H>
                  <P>Robotic Process Automation (RPA) uses software "bots" to mimic human interactions with computer systems — logging in, navigating screens, copying data, and filling forms — without changing the underlying systems. For the OSO FM Specialist, RPA can automate any repetitive, rules-based task that currently takes manual effort: pulling Momentum reports, reconciling GPC statements, checking SAM.gov registrations, and compiling monthly burn rate tables.</P>
                  <H>Top OSO FM Tasks for RPA</H>
                  {[
                    { task:"Monthly Momentum Data Pull", time:"3-4 hrs/month", savings:"90% time reduction", desc:"Bot logs into Momentum, navigates to the OSO cost center report, sets the date range, exports to CSV, and emails the file to the FM Specialist. Runs on schedule without human intervention." },
                    { task:"SAM.gov Vendor Registration Check", time:"30 min per contract action", savings:"80% time reduction", desc:"Bot takes a list of vendor names/CAGE codes, queries SAM.gov for each, returns a table of registration status (Active/Expired/Not Found). Eliminates the click-through for each vendor individually." },
                    { task:"GPC Transaction Reconciliation Pre-check", time:"2 hrs/month", savings:"70% time reduction", desc:"Bot downloads SmartPay IOD transaction reports for all 4 cardholders, applies receipt-check and split-purchase rules, outputs a flagged-items list. FM Specialist reviews flags rather than every transaction." },
                    { task:"SF-133 Data Compilation", time:"4 hrs/quarter", savings:"75% time reduction", desc:"Bot pulls Momentum quarterly obligation data by TAS, formats it into the SF-133 template, and pre-populates the OFM submission worksheet. FM Specialist reviews and certifies rather than builds from scratch." },
                    { task:"OIG Action Status Update", time:"1 hr/month", savings:"60% time reduction", desc:"Bot reads the OIG action tracking spreadsheet, checks dates against current date, flags any action where the due date is within 30 days or overdue, and outputs an alert email draft." },
                  ].map((r,i) => (
                    <div key={i} style={{ background:C.dim+"33", borderRadius:8, padding:"11px 13px", marginBottom:10, borderLeft:`3px solid ${C.purple}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontWeight:700, color:C.text, fontSize:15 }}>{r.task}</span>
                        <div style={{ display:"flex", gap:6 }}>
                          <Tag label={`Currently: ${r.time}`} color={C.gold} />
                          <Tag label={r.savings} color={C.green} />
                        </div>
                      </div>
                      <div style={{ fontSize:14, color:C.textSub, lineHeight:1.65 }}>{r.desc}</div>
                    </div>
                  ))}
                  <H>Getting Started Without IT Approval (Low-Code Tools)</H>
                  <P>Microsoft Power Automate (included in Microsoft 365 Government) can automate many of these tasks without traditional IT project approval. The FM Specialist can build a Power Automate flow that: (1) receives the Momentum CSV via email, (2) runs calculations in Excel Online, (3) generates a burn rate table, and (4) sends the formatted result to J. Harrison. No code required. This is the practical entry point for most federal FM offices.</P>
                </SCard>
              )}

              {analytic === "dashboard" && (
                <SCard title="Financial Dashboard Design for Federal FM" sub="Building executive-ready, audit-defensible dashboards that communicate financial health at a glance">
                  <H>The OSO FM Dashboard Hierarchy</H>
                  <P>Effective financial dashboards serve different audiences with different needs. The OSO FM Specialist should maintain three distinct dashboard views:</P>
                  {[
                    { audience:"J. Harrison (Branch Chief)", level:"L1 — Executive", freq:"Monthly", content:"Single-page: total OSO burn rate vs. benchmark, ADA risk status (RED/YELLOW/GREEN), top 3 pending actions, OIG open findings count, GPC compliance status. No tables — charts and traffic lights only.", color:C.red },
                    { audience:"R. Buckley (AD, Operations)", level:"L2 — Management", freq:"Quarterly", content:"Two-page: burn rate by office with projected year-end, OIG corrective action progress bars, object class trend analysis, year-end projection vs. allotment. Some tables with aggregated figures.", color:C.gold },
                    { audience:"FM Specialist (Internal)", level:"L3 — Operational", freq:"Daily/Weekly", content:"Full operational view: obligation detail by office/OC, GPC cardholder status, COR surveillance calendar, pending action queue, raw Momentum reconciliation. All data, fully granular.", color:C.green },
                  ].map((d,i) => (
                    <div key={i} style={{ background:C.dim+"33", borderRadius:8, padding:"11px 13px", marginBottom:10, borderLeft:`3px solid ${d.color}` }}>
                      <div style={{ fontWeight:700, color:d.color, marginBottom:3 }}>{d.level} — {d.audience}</div>
                      <div style={{ fontSize:13, color:C.muted, marginBottom:5 }}>Frequency: {d.freq}</div>
                      <div style={{ fontSize:14, color:C.textSub, lineHeight:1.65 }}>{d.content}</div>
                    </div>
                  ))}
                  <H>Key Design Principles for Federal FM Dashboards</H>
                  {[
                    { principle:"One Number Per KPI", desc:"Each metric card shows exactly one number with one trend indicator. Don't show burn rate AND dollar amount AND percentage change all in the same card — pick the one that matters most to the audience." },
                    { principle:"Traffic Light Risk Coding", desc:"ADA risk, OIG status, and GPC compliance should always use RED/YELLOW/GREEN traffic lights, not custom color schemes. Decision-makers' brains are trained to respond to traffic light patterns — leverage this." },
                    { principle:"Explain the Benchmark", desc:"A 76.9% burn rate means nothing without context. Always show: actual vs. benchmark (75.0%). The delta (+1.9%) tells the real story. Add a one-sentence narrative: 'OSBO-PSE tracking 8 points above benchmark — monitor Q4 contract ceiling.'" },
                    { principle:"Audit Trail in the Data", desc:"Every number on an executive dashboard should be traceable to a source report. Include a data-as-of date, the source system (Momentum, BPPAS, SmartPay), and a run ID. When OIG asks 'where did this number come from?' you need an answer in under 60 seconds." },
                    { principle:"Mobile-First for Leadership", desc:"Branch chiefs and ADs often review briefing materials on mobile devices. Design dashboards that are readable on a phone screen. Key KPIs should be legible without zooming; detail tables are acceptable only on the full-size view." },
                  ].map((p,i) => (
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:9, padding:"8px 0", borderBottom:`1px solid ${C.border}22` }}>
                      <div style={{ minWidth:180, fontWeight:700, color:C.blue, fontSize:14 }}>{p.principle}</div>
                      <div style={{ fontSize:14, color:C.textSub, lineHeight:1.65 }}>{p.desc}</div>
                    </div>
                  ))}
                </SCard>
              )}

              {analytic === "govai" && (
                <SCard title="AI Policy & Governance in Federal Financial Management" sub="OMB M-24-10 · SEC AI Task Force · FISMA constraints · FedRAMP requirements">
                  <H>OMB Memorandum M-24-10 — The Governing Framework</H>
                  <P>OMB Memorandum M-24-10 (March 2024), "Advancing Governance, Innovation, and Risk Management for Agency Use of Artificial Intelligence," is the authoritative federal policy for AI adoption. Key requirements for OSO FM applications: (1) agencies must designate a Chief AI Officer (CAIO), (2) high-impact AI use cases require risk assessment and impact evaluation, (3) AI systems used in consequential decisions must be explainable and auditable, (4) agencies must maintain an inventory of AI use cases. OSO FM analytics tools should be registered in the SEC's AI use case inventory.</P>
                  <H>SEC AI Task Force — Relevance to OSO</H>
                  <P>The SEC's AI Task Force (referenced in the FY2027 CBJ) will "centralize the agency's efforts and enable internal cross-agency and cross-disciplinary collaboration to navigate the AI lifecycle." For OSO FM, this means: (1) proposed AI tools for budget monitoring must go through the Task Force review process, (2) the Task Force may prioritize OSO use cases that reduce administrative burden and improve ADA compliance monitoring, (3) commercially available AI tools (ChatGPT, Claude, Gemini) must be approved before use with SEC financial data.</P>
                  <H>FedRAMP Authorization — Non-Negotiable</H>
                  <P>Any cloud-based analytics or AI tool used with SEC financial data must hold a FedRAMP Authorization at the appropriate impact level (Moderate for most financial data). The FedRAMP Marketplace (marketplace.fedramp.gov) lists authorized products. Key approved tools relevant to OSO FM analytics: Microsoft 365 Government (includes Power BI, Power Automate), Salesforce Government Cloud, ServiceNow, AWS GovCloud services. Tools NOT on this list (including most consumer AI services) may not be used with SEC data without a waiver from the CISO.</P>
                  <H>FISMA Controls That Apply to Analytics Systems</H>
                  <P>OIG-584 (FISMA Level 3 Controls) directly affects what analytics tools the OSO FM Specialist can deploy. Any system processing SEC financial data is subject to NIST SP 800-53 security controls including: access control (AC-2, AC-3), audit logging (AU-2, AU-12), configuration management (CM-6, CM-7), and continuous monitoring (CA-7). This means even a simple Python script processing Momentum data exports must be run on an authorized, controlled workstation — not a personal laptop or cloud notebook without FedRAMP authorization.</P>
                  <H>The Path Forward — What the FM Specialist Can Do Now</H>
                  {[
                    { action:"Use Microsoft Power BI", auth:"FedRAMP Authorized (M365 Gov)", desc:"Build burn rate dashboards in Power BI connected to Excel/SharePoint data sources. No additional authorization needed if your agency uses M365 Government." },
                    { action:"Use Power Automate", auth:"FedRAMP Authorized (M365 Gov)", desc:"Automate Momentum data export processing, GPC reconciliation alerts, and status brief generation workflows within the M365 Government environment." },
                    { action:"Python on SEC workstations", auth:"Permitted with IT approval", desc:"Run anomaly detection and forecasting scripts locally on SEC-authorized hardware. Data never leaves the controlled environment. Coordinate with OIT for Python environment setup." },
                    { action:"Register AI use cases", auth:"OMB M-24-10 requirement", desc:"Document any analytics or AI tool in the SEC's AI use case inventory. Even an Excel macro counts. Demonstrates governance compliance and protects the FM Specialist if questions arise." },
                    { action:"Avoid public AI tools with SEC data", auth:"Prohibited without CISO waiver", desc:"Do not paste Momentum data, contract text, or OIG findings into ChatGPT, Claude.ai, or similar public services. Even 'anonymized' financial data may violate SEC data handling requirements without a FedRAMP-authorized private instance." },
                  ].map((a,i) => (
                    <div key={i} style={{ background:C.dim+"33", borderRadius:8, padding:"10px 13px", marginBottom:8,
                                          borderLeft:`3px solid ${a.auth.includes("Prohibited")? C.red : a.auth.includes("FedRAMP") ? C.green : C.gold}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontWeight:700, color:C.text, fontSize:14 }}>{a.action}</span>
                        <Tag label={a.auth} color={a.auth.includes("Prohibited")? C.red : a.auth.includes("FedRAMP") ? C.green : C.gold} />
                      </div>
                      <div style={{ fontSize:14, color:C.textSub, lineHeight:1.6 }}>{a.desc}</div>
                    </div>
                  ))}
                </SCard>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const NAV = [
  { id:"dashboard",    icon:"📈", label:"Dashboard",             group:"OVERVIEW" },
  { id:"news",         icon:"📡", label:"Live Intelligence",     group:"INTELLIGENCE" },
  { id:"ai",           icon:"🤖", label:"AI FM Analyst",         group:"INTELLIGENCE" },
  { id:"actions",      icon:"⚡",  label:"Actions & Obligations", group:"OPERATIONS" },
  { id:"budget",       icon:"📊",  label:"Budget Execution",      group:"OPERATIONS" },
  { id:"cor",          icon:"🔍",  label:"COR Surveillance",      group:"OPERATIONS" },
  { id:"facilities",   icon:"🏢",  label:"Facility & Fleet",      group:"OPERATIONS" },
  { id:"gpc",          icon:"💳",  label:"GPC Cards",             group:"OPERATIONS" },
  { id:"payroll",      icon:"💵",  label:"Payroll & FTE",         group:"OPERATIONS" },
  { id:"travel",       icon:"✈️",  label:"Travel",                group:"OPERATIONS" },
  { id:"timekeeping",  icon:"⏰", label:"Timekeeping",           group:"OPERATIONS" },
  { id:"oso-form",     icon:"🔭",  label:"FY2028 Formulation",   group:"PLANNING" },
  { id:"oso-oig",      icon:"⚖️",  label:"OIG Tracker",          group:"COMPLIANCE" },
  { id:"toolbox",      icon:"🧰", label:"FM Toolbox",            group:"TOOLS" },
  { id:"guidance",     icon:"📚", label:"Guidance Library",      group:"TOOLS" },
  { id:"briefs",       icon:"📄", label:"Briefs & Reports",      group:"TOOLS" },
  { id:"daily-update", icon:"📰", label:"Daily Update",          group:"TOOLS" },
  { id:"systems",      icon:"🖥️",  label:"Financial Systems",    group:"KNOWLEDGE" },
  { id:"ofm",          icon:"🏦",  label:"OFM Coordination",     group:"KNOWLEDGE" },
  { id:"stakeholders", icon:"🤝",  label:"Stakeholder Map",      group:"KNOWLEDGE" },
  { id:"sops",         icon:"📋",  label:"SOPs & Job Aids",      group:"KNOWLEDGE" },
  { id:"about-app",    icon:"📖", label:"About This App",        group:"KNOWLEDGE" },
  { id:"about-me",     icon:"🙋", label:"About Me",              group:"PROFILE" },
];

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR NAV — defined OUTSIDE root component so React never remounts it
// (defining inside causes scroll-to-top on every page change)
// ═══════════════════════════════════════════════════════════════════════════
function SidebarNavList({ page, onNavigate }: { page: string; onNavigate: (id: string) => void }) {
  const groups = Array.from(new Set(NAV.map(n => n.group)));
  return (
    <nav style={{ flex:1, overflowY:"auto", padding:"6px 0 12px" }}>
      {groups.map((grp, gi) => (
        <div key={grp} style={{ marginTop: gi === 0 ? 0 : 4 }}>
          {/* Group separator + label */}
          {gi > 0 && (
            <div style={{ height:1, background:"rgba(255,255,255,0.08)", margin:"10px 18px 0" }} />
          )}
          <div style={{
            fontSize:10, fontWeight:800, letterSpacing:"0.14em",
            padding: gi > 0 ? "12px 18px 4px" : "10px 18px 4px",
            textTransform:"uppercase" as const,
            color:"rgba(255,255,255,0.75)",     // was 0.35 — much more readable
          }}>{grp}</div>
          {NAV.filter(n => n.group === grp).map(n => {
            const isActive = page === n.id;
            return (
              <button key={n.id} onClick={() => onNavigate(n.id)}
                style={{
                  display:"flex", alignItems:"center", gap:13,
                  width:"100%", padding:"11px 18px",
                  background: isActive ? "rgba(59,130,246,0.22)" : "transparent",
                  border:"none",
                  borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                  borderRight:"none",
                  cursor:"pointer", transition:"background 0.15s",
                }}>
                <span style={{ fontSize:18, flexShrink:0,
                                filter: isActive ? "none" : "brightness(1.1)" }}>{n.icon}</span>
                <span style={{
                  fontSize:14, fontWeight: isActive ? 700 : 400,
                  color: isActive ? "#93c5fd" : "rgba(255,255,255,0.88)",  // was 0.6
                  whiteSpace:"nowrap" as const,
                }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP — updated
// ═══════════════════════════════════════════════════════════════════════════
export default function SECFinancialPortal() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pulse, setPulse] = useState(true);
  const [dark, setDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const C = dark ? DARK : LIGHT;

  // OSO Ops state
  const [osoActions, setOsoActions] = useState<any[]>(INIT_ACTIONS);
  const osoAllotments = INIT_ALLOTMENTS;
  const [osoOig]  = useState<any[]>(INIT_OIG);
  const [osoGpc]  = useState<any[]>(INIT_GPC);
  const [osoCor]  = useState<any[]>(INIT_COR);
  const [osoTime] = useState<any[]>(INIT_TIME);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const groups = Array.from(new Set(NAV.map(n => n.group)));
  const currentPage = NAV.find(n => n.id === page);
  const osoProps = {
    C, actions: osoActions, setActions: setOsoActions,
    allotments: osoAllotments, oig: osoOig, gpc: osoGpc,
    cor: osoCor, timekeeping: osoTime,
    news: NEWS_FEED, navigate: setPage,
  };

  const renderPage = () => {
    switch (page) {
      case "news":         return <PageNews />;
      case "ai":           return <PageAI />;
      case "toolbox":      return <PageToolbox />;
      case "guidance":     return <PageGuidance />;
      // OSO Ops pages
      case "dashboard":    return <PageDashboard    {...osoProps} />;
      case "actions":      return <PageActions       {...osoProps} />;
      case "budget":       return <PageBudget        allotments={osoAllotments} C={C} />;
      case "cor":          return <PageCOR           cor={osoCor}  C={C} />;
      case "facilities":   return <PageFacilityFleet               C={C} />;
      case "gpc":          return <PageGPC           gpc={osoGpc}  C={C} />;
      case "payroll":      return <PagePayroll        C={C} />;
      case "travel":       return <PageTravel         C={C} />;
      case "timekeeping":  return <PageTime          timekeeping={osoTime} C={C} />;
      case "oso-form":     return <OSOPageFormulation C={C} />;
      case "oso-oig":      return <OSOPageOIG        oig={osoOig} C={C} />;
      case "systems":      return <PageSystems       C={C} />;
      case "ofm":          return <PageOFM           C={C} />;
      case "stakeholders": return <PageStakeholders  C={C} />;
      case "sops":         return <PageSOPs          C={C} />;
      case "briefs":       return <PageBriefs        {...osoProps} />;
      case "daily-update": return <PageDailyUpdate news={NEWS_FEED} allotments={osoAllotments} actions={osoActions} C={C} />;
      case "about-app":    return <PageAboutApp C={C} />;
      case "about-me":     return <PageAboutMe C={C} />;
      default:             return <PageDashboard {...osoProps} />;
    }
  };

  // Navigate and close mobile menu
  const navigate = (id: string) => {
    setPage(id);
    setMobileMenuOpen(false);
  };


  return (
    <ThemeContext.Provider value={C}>
    <div style={{ display:"flex", height:"100vh", background:C.bg,
                   color:C.text, fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
                   fontSize:"15px", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />

      {/* ── DISCLAIMER ──────────────────────────────────────── */}
      {!dismissed && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)",
                       display:"flex", alignItems:"center", justifyContent:"center", zIndex:3000,
                       padding: isMobile ? "12px" : "20px",
                       overflowY:"auto" }}>
          <div style={{
            background:C.card, borderRadius:12, maxWidth:560, width:"100%",
            border:`1px solid ${C.border}`,
            /* On mobile: fill most of screen height and scroll internally */
            maxHeight: isMobile ? "calc(100dvh - 24px)" : "90vh",
            display:"flex", flexDirection:"column",
            margin: isMobile ? "0" : "auto",
          }}>
            {/* Header — sticky so title always visible */}
            <div style={{ padding: isMobile ? "16px 18px 12px" : "26px 28px 14px",
                           borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:C.red }}>
                ⚠️ Important Disclaimer
              </div>
            </div>
            {/* Scrollable body */}
            <div style={{ flex:1, overflowY:"auto", padding: isMobile ? "14px 18px" : "18px 28px",
                           WebkitOverflowScrolling:"touch" as any }}>
              <div style={{ fontSize: isMobile ? 13 : 15, color:C.textSub, lineHeight:1.75 }}>
                {DISCLAIMER}
              </div>
            </div>
            {/* Button — sticky at bottom so always reachable */}
            <div style={{ padding: isMobile ? "12px 18px 16px" : "16px 28px 24px",
                           borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
              <button onClick={() => setDismissed(true)}
                style={{ width:"100%", background:"#003087", color:"#fff", border:"none",
                          borderRadius:10, padding: isMobile ? "14px" : "14px",
                          fontSize: isMobile ? 15 : 16, fontWeight:700, cursor:"pointer" }}>
                I Understand — Enter Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE OVERLAY DRAWER ───────────────────────────── */}
      {isMobile && mobileMenuOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:2000, display:"flex" }}>
          {/* Backdrop */}
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)" }}
               onClick={() => setMobileMenuOpen(false)} />
          {/* Drawer */}
          <aside style={{ position:"relative", width:280, background:C.sidebar,
                           display:"flex", flexDirection:"column", zIndex:1, overflowY:"auto" }}>
            {/* Drawer header */}
            <div style={{ padding:"18px 18px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)",
                           display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={() => navigate("dashboard")}
                style={{ background:"none", border:"none", cursor:"pointer", padding:0,
                          display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:9, flexShrink:0,
                                background:"linear-gradient(135deg,#003087,#0047ba)",
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:22, boxShadow:"0 0 12px rgba(0,48,135,0.5)" }}>🦅</div>
                <div style={{ textAlign:"left" as const }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>SEC · OSO</div>
                  <div style={{ fontSize:16, color:"rgba(255,255,255,0.72)" }}>Financial Portal</div>
                </div>
              </button>
              <button onClick={() => setMobileMenuOpen(false)}
                style={{ marginLeft:"auto", background:"none", border:"none", color:"rgba(255,255,255,0.75)",
                          cursor:"pointer", fontSize:22, lineHeight:1 }}>✕</button>
            </div>
            <SidebarNavList page={page} onNavigate={navigate} />
            {/* Live indicator */}
            <div style={{ padding:"14px 18px", borderTop:"1px solid rgba(255,255,255,0.08)",
                           display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                              background: pulse ? "#10b981" : "#10b98144",
                              transition:"background 0.5s" }} />
              <div>
                <div style={{ fontSize:13, color:"#10b981", fontWeight:700, letterSpacing:"0.04em" }}>● LIVE DATA · FY2025–2027</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>SEC CBJ · OMB · OIG · Congress</div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      {!isMobile && (
        <aside style={{
          width: sidebarOpen ? 250 : 56, flexShrink: 0,
          background: C.sidebar, borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column",
          transition: "width 0.25s ease", overflow: "hidden",
        }}>
          {/* Logo row — always visible */}
          {sidebarOpen ? (
            <div style={{ padding:"18px 16px 14px", borderBottom:`1px solid rgba(255,255,255,0.08)`,
                           display:"flex", alignItems:"center", gap:12, minWidth:250 }}>
              <button onClick={() => setPage("dashboard")}
                style={{ background:"none", border:"none", cursor:"pointer", padding:0,
                          display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:8, flexShrink:0,
                                background:"linear-gradient(135deg,#003087,#0047ba)",
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:18, boxShadow:"0 0 12px rgba(0,48,135,0.5)" }}>🦅</div>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#fff", lineHeight:1.2 }}>SEC · OSO</div>
                  <div style={{ fontSize:16, color:"rgba(255,255,255,0.72)", lineHeight:1.2 }}>Financial Portal</div>
                </div>
              </button>
              <button onClick={() => setSidebarOpen(false)}
                style={{ marginLeft:"auto", background:"none", border:"none", flexShrink:0,
                          color:"rgba(255,255,255,0.7)", cursor:"pointer", fontSize:16, padding:"4px" }}>
                ◀
              </button>
            </div>
          ) : (
            <div style={{ height:70, borderBottom:`1px solid rgba(255,255,255,0.08)`,
                           display:"flex", alignItems:"center", justifyContent:"center" }}>
              <button onClick={() => setSidebarOpen(true)}
                style={{ background:"none", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8,
                          width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center",
                          color:"rgba(255,255,255,0.85)", cursor:"pointer", fontSize:16 }}>
                ▶
              </button>
            </div>
          )}

          {/* Nav — only when open */}
          {sidebarOpen && <SidebarNavList page={page} onNavigate={setPage} />}

          {/* Collapsed icon nav */}
          {!sidebarOpen && (
            <nav style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => setPage(n.id)}
                  title={n.label}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center",
                    width:"100%", height:44,
                    background: page === n.id ? "rgba(59,130,246,0.18)" : "none",
                    border:"none",
                    borderRight: page === n.id ? "3px solid #3b82f6" : "3px solid transparent",
                    cursor:"pointer",
                  }}>
                  <span style={{ fontSize:20 }}>{n.icon}</span>
                </button>
              ))}
            </nav>
          )}

          {/* Live indicator */}
          <div style={{ padding:"12px 16px", borderTop:`1px solid rgba(255,255,255,0.08)`,
                         display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0,
                            background: pulse ? "#10b981" : "#10b98144",
                            transition:"background 0.5s" }} />
            {sidebarOpen && (
              <div>
                <div style={{ fontSize:13, color:"#10b981", fontWeight:700, letterSpacing:"0.04em" }}>● LIVE DATA · FY2025–2027</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>SEC CBJ · OMB · OIG · Congress</div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── MAIN AREA ────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Top bar */}
        <header style={{ height:58, borderBottom:`1px solid ${C.border}`,
                           display:"flex", alignItems:"center", justifyContent:"space-between",
                           padding:"0 20px", background:C.surface, flexShrink:0, gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
            {isMobile && (
              <button onClick={() => setMobileMenuOpen(true)}
                style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8,
                          width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center",
                          cursor:"pointer", color:C.text, fontSize:18, flexShrink:0 }}>
                ☰
              </button>
            )}
            <span style={{ fontSize:22, flexShrink:0 }}>{currentPage?.icon}</span>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:18, fontWeight:700, color:C.text,
                             whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {currentPage?.label}
              </div>
              {!isMobile && (
                <div style={{ fontSize:14, color:C.muted }}>
                  U.S. Securities and Exchange Commission · Office of Support Operations
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
            {!isMobile && (
              <span style={{ fontSize:13, background:`${C.gold}22`, color:C.gold,
                              padding:"2px 10px", borderRadius:20, fontWeight:700 }}>⚠️ DEMO</span>
            )}
            {!isMobile && (
              <div style={{ fontSize:13, color:C.muted, fontFamily:"monospace" }}>
                {new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}
              </div>
            )}
            <button onClick={() => setDark(d => !d)}
              style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7,
                        padding:"5px 12px", fontSize:14, cursor:"pointer", color:C.text,
                        display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* Breadcrumb */}
        {!isMobile && (
          <div style={{ padding:"8px 24px", fontSize:14, color:C.muted,
                         borderBottom:`1px solid ${C.dim}`, background:C.bg, flexShrink:0 }}>
            SEC · OSO / Business Management &amp; Continuity Branch ›{" "}
            <span style={{ color:C.blue }}>{currentPage?.label}</span>
          </div>
        )}

        {/* Page content */}
        <main style={{ flex:1, overflowY:"auto", padding: isMobile ? "16px 16px 32px" : "24px 28px 40px" }}>
          {renderPage()}
        </main>

        {/* Footer */}
        <footer style={{ padding: isMobile ? "8px 16px" : "9px 28px",
                           borderTop:`1px solid ${C.border}`,
                           display:"flex", justifyContent: isMobile ? "center" : "space-between",
                           flexWrap:"wrap" as const, gap:4,
                           fontSize:12, color:C.muted, background:C.surface, flexShrink:0 }}>
          {!isMobile && <span>Sources: SEC FY2027 CBJ · OMB A-11/A-123 · ADA 31 U.S.C.§1341 · OIG-482/488/582/584</span>}
          <span style={{ color:C.red, fontWeight:600 }}>⚠️ DEMO · Public data only · Not official SEC tool</span>
          {!isMobile && <span>OSO BMCB · {new Date().toLocaleDateString()}</span>}
        </footer>
      </div>
    </div>
    </ThemeContext.Provider>
  );
}
