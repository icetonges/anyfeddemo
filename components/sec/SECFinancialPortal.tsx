"use client"

import { useState, useEffect, useRef, createContext, useContext } from "react";
import type { ReactNode, CSSProperties } from "react";
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models";
import type { ModelId } from "@/lib/models";
import OSOFinancialPortal from "./OSOOperationsPortal";
import InterviewPrepPortal from "./InterviewPrepPortal";
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
};

const LIGHT = {
  bg:          "#f0f4f8",
  sidebar:     "#e2e8f0",
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
  oig:"OIG Report 582 found OSO used T&M contracts where scope certainty warranted fixed-price vehicles — a risk management gap. Corrective actions: contract type decision matrix, COR surveillance checklists, quarterly ceiling utilization reporting. Three open recommendations remain through Sep 2026.",
  fee:"Section 31 of the Securities Exchange Act authorizes transaction fees on equity trades. Section 6(b) sets the annual rate (currently $7.10/$1M). In FY2025 the rate was $0 — collections exceeded the appropriation. This makes the SEC unique among federal agencies: fee collections fully offset the appropriation.",
  tech:"The SEC's FY2027 AI Task Force will centralize governance for AI adoption across the agency. OSO financial management can leverage AI for: obligation anomaly detection, burn rate forecasting, automated ADA risk scoring, natural-language budget Q&A for stakeholders, and AI-assisted justification drafting.",
};

// ═══════════════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════
const Tip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  const C = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px" }}>
      <div style={{ fontSize:12, color:C.muted, marginBottom:5 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:12, color:p.color||C.text, marginBottom:2 }}>
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
      <div style={{ fontSize:12, color:C.muted, letterSpacing:"0.07em",
                    textTransform:"uppercase", marginBottom:6 }}>{icon} {label}</div>
      <div style={{ fontSize:26, fontWeight:700, color:ac,
                    fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{value}</div>
      {sub   && <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{sub}</div>}
      {delta && <div style={{ fontSize:12, color:positive===false ? C.red : C.green,
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
          <h1 style={{ fontSize:20, fontWeight:700, color:C.text, letterSpacing:"-0.03em", margin:0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize:12, color:C.muted, margin:"3px 0 0" }}>{subtitle}</p>}
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
    <div style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"0.08em",
                  textTransform:"uppercase", marginBottom:14 }}>{children}</div>
  );
}

function Badge({ children, color }: { children: ReactNode; color?: string }) {
  const C = useTheme();
  const bc = color || C.blue;
  return (
    <span style={{ background:`${bc}22`, color:bc, fontSize:12, fontWeight:700,
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
            <div style={{ fontSize:12, color:C.green, fontWeight:600 }}>● Live</div>
            <div style={{ fontSize:12, color:C.muted }}>Data: SEC FY2027 CBJ, April 2026</div>
          </div>
        }
      />

      {/* Alert Banner */}
      <div style={{ background:"rgba(245,158,11,0.08)", border:`1px solid rgba(245,158,11,0.3)`,
                    borderRadius:10, padding:"13px 18px", display:"flex", gap:12, alignItems:"center" }}>
        <span style={{ fontSize:18 }}>⚠️</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.gold }}>
            FY2027 Appropriations Pending — Senate FSGG Markup Scheduled June 2026
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
            SEC's $1.908B request (11% below FY2026 enacted) requires congressional action before Oct 1, 2027.
            OSO planning must account for ±10% variance until enacted level is confirmed.
          </div>
        </div>
        <button onClick={() => navigate("news")}
          style={{ marginLeft:"auto", flexShrink:0, background:C.gold, border:"none",
                   borderRadius:7, padding:"6px 14px", fontSize:12, fontWeight:700,
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
              <div style={{ fontSize:13, fontWeight:700, color:p.color, marginBottom:7 }}>{p.title}</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.55 }}>{p.text}</div>
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
            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:5 }}>{n.label}</div>
            <div style={{ fontSize:12, color:C.muted }}>{n.sub}</div>
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
            <div style={{ fontSize:14, fontWeight:700, color:C.red }}>
              ANTI-DEFICIENCY ACT RISK — Projected Obligations May Exceed Enacted Appropriation
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4, lineHeight:1.6 }}>
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
            <span style={{ fontSize:12, color:C.muted }}>Annual Burn Rate (% of $2,149M enacted)</span>
            <span style={{ fontSize:16, fontWeight:700, color:adaRisk ? C.red : C.blue,
                           fontFamily:"monospace" }}>{burn}%</span>
          </div>
          <input type="range" min={55} max={115} value={burn}
            onChange={e => setBurn(+e.target.value)}
            style={{ width:"100%", accentColor: adaRisk ? C.red : C.blue }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginTop:4 }}>
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
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["OC Code","Object Class","FY25 Actual","FY26 Enacted","FY27 Request","Δ FY26→FY27","FY27 %"].map(h => (
                  <th key={h} style={{ padding:"9px 12px", textAlign: h==="Object Class" ? "left" : "right",
                    color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.05em" }}>{h}</th>
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
                                  fontFamily:"monospace", fontSize:12 }}>{r.code}</td>
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
                        <span style={{ fontSize:12, color:C.muted }}>{r.pct}%</span>
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
              <span style={{ fontSize:20 }}>{b.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:b.color }}>{b.title}</div>
                <div style={{ fontSize:12, color:C.muted }}>{b.cite}</div>
              </div>
            </div>
            {b.points.map((p,j) => (
              <div key={j} style={{ display:"flex", gap:8, marginBottom:7, alignItems:"flex-start" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:b.color,
                               marginTop:5, flexShrink:0 }} />
                <span style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{p}</span>
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
            <div style={{ fontSize:12, color:c.color, fontWeight:700, letterSpacing:"0.08em", marginBottom:3 }}>{c.icon} {c.fy}</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:14 }}>{c.role}</div>
            {c.items.map((item,j) => (
              <div key={j} style={{ display:"flex", gap:8, marginBottom:7, alignItems:"flex-start" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:c.color, marginTop:5, flexShrink:0 }} />
                <span style={{ fontSize:12, color:C.muted }}>{item}</span>
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
            <div style={{ fontSize:12, color:C.muted, marginBottom:16, lineHeight:1.6 }}>
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
                    <span style={{ fontSize:12, color:C.text }}>{s.label}</span>
                    <div style={{ fontSize:12, color:C.muted }}>{s.note}</div>
                  </div>
                  <span style={{ fontSize:15, fontWeight:700, color:s.color,
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
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>FY2028 Submission Preview</div>
            <div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Total Budget Request</div>
              <div style={{ fontSize:30, fontWeight:800, color:C.blue,
                             fontFamily:"monospace" }}>${total.toLocaleString()}M</div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:12,
                           borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:12, color:C.muted }}>vs. FY2027 Request ($1,908M)</span>
              <span style={{ fontSize:13, fontWeight:700,
                              color: delta>0 ? C.orange : C.green }}>
                {delta>=0?"+":""}{delta}M ({delta>=0?"+":""}{(delta/1908*100).toFixed(1)}%)
              </span>
            </div>
            <div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>Resource Composition</div>
              {[
                { label:"Personnel", val:fy28p, color:C.purple },
                { label:"Contracts", val:fy28c, color:C.blue   },
                { label:"IT/Equip",  val:fy28it, color:C.cyan  },
                { label:"Other",     val:fy28o, color:C.gold   },
              ].map((b,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:72, fontSize:12, color:C.muted }}>{b.label}</div>
                  <div style={{ flex:1, background:C.dim, borderRadius:3, height:8 }}>
                    <div style={{ width:`${b.val/total*100}%`, height:"100%",
                                   background:b.color, borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:12, color:b.color, fontFamily:"monospace",
                                  width:44, textAlign:"right" }}>{(b.val/total*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div style={{ background: overCeil ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.08)",
                           border:`1px solid ${overCeil ? C.red : C.green}`,
                           borderRadius:8, padding:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color: overCeil ? C.red : C.green }}>
                {overCeil ? "⚠️ Exceeds projected OMB ceiling — additional justification required" : "✓ Within projected OMB ceiling band"}
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
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
                               fontSize:12, fontWeight:700, color:"#fff" }}>
                  {s.status==="done" ? "✓" : s.status==="active" ? "●" : i+1}
                </div>
                {i < timeline.length-1 && (
                  <div style={{ width:2, height:30, background:C.dim, marginTop:2 }} />
                )}
              </div>
              <div style={{ paddingBottom: i < timeline.length-1 ? 14 : 0 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:12, color:C.gold, fontFamily:"monospace",
                                  background:`${C.gold}15`, padding:"1px 7px",
                                  borderRadius:4 }}>{s.phase}</span>
                  <span style={{ fontSize:13, fontWeight:600,
                                  color: s.status==="active" ? C.blue : C.text }}>{s.task}</span>
                  {s.status==="done" && <Badge color={C.green}>Completed</Badge>}
                  {s.status==="active" && <Badge color={C.blue}>In Progress</Badge>}
                </div>
                <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{s.detail}</div>
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
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Program Office","FY25 Actual","FY26 Enacted","FY27 Request","FTE Δ","% Δ","$/FTE FY27","Mission Share"].map(h => (
                <th key={h} style={{ padding:"8px 12px", textAlign:h==="Program Office"?"left":"right",
                  color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.05em" }}>{h}</th>
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
                  <td style={{ padding:"9px 12px", textAlign:"right", color:C.muted, fontFamily:"monospace", fontSize:12 }}>{p.fte25}</td>
                  <td style={{ padding:"9px 12px", textAlign:"right", color:C.muted, fontFamily:"monospace", fontSize:12 }}>{p.fte26}</td>
                  <td style={{ padding:"9px 12px", textAlign:"right", color:C.blue,  fontFamily:"monospace", fontWeight:600 }}>{p.fte27}</td>
                  <td style={{ padding:"9px 12px", textAlign:"right", fontFamily:"monospace", fontWeight:700,
                                color: delta>0 ? C.green : delta<0 ? C.red : C.muted }}>
                    {delta>=0?"+":""}{delta}
                  </td>
                  <td style={{ padding:"9px 12px", textAlign:"right", fontFamily:"monospace",
                                color: delta>0 ? C.green : delta<0 ? C.red : C.muted }}>
                    {delta>=0?"+":""}{((delta/p.fte26)*100).toFixed(1)}%
                  </td>
                  <td style={{ padding:"9px 12px", textAlign:"right", color:C.gold, fontFamily:"monospace", fontSize:12 }}>
                    ${costPerFte.toLocaleString()}K
                  </td>
                  <td style={{ padding:"9px 12px", textAlign:"right" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
                      <div style={{ width:50, background:C.dim, borderRadius:3, height:5 }}>
                        <div style={{ width:`${parseFloat(share)*4}%`, height:"100%",
                                       background:COLORS[i], borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:12, color:C.muted }}>{share}%</span>
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
                <div style={{ fontSize:12, fontWeight:700, color:C.cyan, marginBottom:3 }}>{f.title}</div>
                <div style={{ fontSize:12, color:C.muted }}>{f.body}</div>
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
  // Start with local fallback; replaced with live API data on mount (newest first)
  const [feed, setFeed] = useState<NewsItem[]>(NEWS_FEED);
  const [feedSource, setFeedSource] = useState<"local"|"db"|"seed">("local");

  useEffect(() => {
    fetch("/api/news-feed")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.news) && data.news.length > 0) {
          setFeed(data.news as NewsItem[]); // DB returns ORDER BY created_at DESC
          setFeedSource(data.source ?? "db");
        }
      })
      .catch(() => { /* silently keep local fallback */ });
  }, []);

  const urgColor: Record<string, string> = { HIGH:C.red, MEDIUM:C.gold, LOW:C.green };
  const catColor: Record<string, string> = {
    "Congressional Action":C.purple, "Budget Action":C.orange,
    "Market Intelligence":C.blue, "SEC Operations":C.cyan,
  };
  const cats = ["ALL","Congressional Action","Budget Action","Market Intelligence","SEC Operations"];
  const visible = filter==="ALL" ? feed : feed.filter(n=>n.cat===filter);
  const srcColor = feedSource === "db" ? C.green : feedSource === "seed" ? C.gold : C.muted;
  const srcLabel = feedSource === "db" ? "Live DB" : feedSource === "seed" ? "API Seed" : "Local";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <PageHeader icon="📡" title="Live Congressional & Market Intelligence"
        subtitle={`${feed.length} items · newest first · history preserved · OSO relevance scored`}
        right={
          <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card,
                         border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 14px" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:srcColor }} />
            <span style={{ fontSize:12, color:srcColor, fontWeight:600 }}>{srcLabel}</span>
            <span style={{ fontSize:12, color:C.muted }}>· {new Date().toLocaleTimeString()}</span>
          </div>
        }
      />

      {/* Stat strip */}
      <div style={{ display:"flex", gap:12 }}>
        {[
          { label:"HIGH Priority Items", value:feed.filter(n=>n.urg==="HIGH").length, color:C.red },
          { label:"Congressional Actions", value:feed.filter(n=>n.cat==="Congressional Action").length, color:C.purple },
          { label:"Budget Actions", value:feed.filter(n=>n.cat==="Budget Action").length, color:C.orange },
          { label:"Market Intelligence", value:feed.filter(n=>n.cat==="Market Intelligence").length, color:C.blue },
        ].map((s,i) => (
          <div key={i} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`,
                                  borderRadius:9, padding:"14px 16px" }}>
            <div style={{ fontSize:24, fontWeight:700, color:s.color, fontFamily:"monospace" }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {cats.map(c => (
          <button key={c} onClick={()=>setFilter(c)}
            style={{ background: filter===c ? C.blue : C.card,
                      border:`1px solid ${filter===c ? C.blue : C.border}`,
                      borderRadius:20, padding:"5px 15px", fontSize:12,
                      cursor:"pointer", color: filter===c ? "#fff" : C.muted,
                      transition:"all 0.2s" }}>{c}</button>
        ))}
      </div>

      {/* News cards — newest on top, all history shown */}
      {visible.map((item, idx) => (
        <div key={`${item.id}-${idx}`}
          style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`,
                    borderLeft:`5px solid ${urgColor[item.urg]}`, padding:"20px 22px" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
                          alignItems:"flex-start", marginBottom:10 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <Badge color={urgColor[item.urg]}>{item.urg} PRIORITY</Badge>
              <Badge color={catColor[item.cat]||C.blue}>{item.cat}</Badge>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
              <span style={{ fontSize:12, color:C.muted }}>{item.time} · {item.src}</span>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                   style={{ fontSize:14, color:C.blue, textDecoration:"none" }} title="Open source">↗</a>
              )}
            </div>
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:8 }}>{item.headline}</div>
          <div style={{ fontSize:12, color:C.textSub, lineHeight:1.7, marginBottom:12 }}>{item.body}</div>
          <div style={{ background:`${C.gold}12`, border:`1px solid ${C.gold}30`,
                          borderRadius:7, padding:"9px 13px", display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.gold, flexShrink:0 }}>💡 OSO IMPACT:</span>
            <span style={{ fontSize:12, color:C.muted, flex:1 }}>{item.impact}</span>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                 style={{ fontSize:12, color:C.blue, textDecoration:"none",
                           fontWeight:600, flexShrink:0, whiteSpace:"nowrap" }}>
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
    { rpt:"OIG-582", title:"T&M Contract Management", div:"OSO/Acquisitions", status:"OPEN", due:"Sep 2026",
      recs:3, detail:"OSO missed opportunities to lower risk by using T&M vehicles where scope was sufficiently defined for fixed-price contracts. COR surveillance gaps identified.", color:C.red },
    { rpt:"OIG-584", title:"FISMA Level 3 Controls", div:"OIT", status:"IN PROGRESS", due:"Dec 2026",
      recs:5, detail:"FISMA audit identified deficiencies in access controls and continuous monitoring for Level 3 systems supporting financial operations.", color:C.gold },
    { rpt:"OIG-585", title:"CAT Data Controls", div:"Trading & Markets", status:"OPEN", due:"Mar 2027",
      recs:5, detail:"Consolidated Audit Trail data access controls and validation procedures require strengthening.", color:C.orange },
    { rpt:"OIG-581", title:"Recruiting Management", div:"OHR", status:"CLOSED", due:"Completed",
      recs:2, detail:"HR recruiting process improvements implemented. All recommendations closed.", color:C.green },
  ];
  const controls = [
    { ctrl:"Budget Formulation Review", type:"Preventive", frequency:"Annual", status:"Effective", owner:"OSO CFO", risk:"LOW" },
    { ctrl:"Obligation Approval Workflow", type:"Preventive", frequency:"Per transaction", status:"Effective", owner:"OSO/Budget", risk:"LOW" },
    { ctrl:"Monthly Obligation Reconciliation", type:"Detective", frequency:"Monthly", status:"Effective", owner:"OSO FM", risk:"LOW" },
    { ctrl:"ADA Threshold Monitoring", type:"Detective", frequency:"Weekly", status:"Needs Improvement", owner:"OSO FM", risk:"MEDIUM" },
    { ctrl:"T&M Contract COR Surveillance", type:"Preventive", frequency:"Monthly", status:"Deficient", owner:"OSO/Acq", risk:"HIGH" },
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
        <KPI label="Open Findings" value="3" sub="OIG-582, 584, 585" delta="Corrective actions in progress" positive={null} accent={C.red} icon="⚠️" />
        <KPI label="In Progress" value="1" sub="OIG-584 FISMA Level 3" delta="Due Dec 2026" positive={null} accent={C.gold} icon="🔄" />
        <KPI label="Closed" value="1" sub="OIG-581 Recruiting" delta="All recommendations met" positive={true} accent={C.green} icon="✅" />
        <KPI label="Highest Risk" value="OIG-582" sub="T&M Contract Management" delta="Due Sep 2026 — OSO direct" positive={false} accent={C.orange} icon="📋" />
      </div>

      {/* OIG Finding Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {OIG_FINDINGS.map((f,i) => (
          <Card key={i} style={{ borderLeft:`4px solid ${f.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:12, fontFamily:"monospace", color:f.color, fontWeight:700 }}>{f.rpt}</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text, marginTop:2 }}>{f.title}</div>
              </div>
              <Badge color={f.status==="CLOSED" ? C.green : f.status==="IN PROGRESS" ? C.gold : C.red}>
                {f.status}
              </Badge>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:10, lineHeight:1.55 }}>{f.detail}</div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:12 }}>
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
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Control Activity","Type","Frequency","Status","Control Owner","Risk Level"].map(h => (
                <th key={h} style={{ padding:"8px 12px", textAlign:"left",
                  color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.05em" }}>{h}</th>
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
function PageAI() {
  const C = useTheme();
  const [messages, setMessages] = useState<{ role: string; content: string; modelUsed?: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL_ID);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Provider display helpers
  const providerLabel: Record<string, string> = { google:"Google", groq:"Groq", anthropic:"Anthropic" };
  const providerOrder: Array<"google" | "groq" | "anthropic"> = ["google", "groq", "anthropic"];

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    const updated = [...messages, { role:"user", content:msg }];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, task: "best", modelId: selectedModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");
      const reply = data.text || "Unable to retrieve response.";
      const usedModel = data.modelUsed as string | undefined;
      setMessages([...updated, { role:"assistant", content:reply, modelUsed: usedModel }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages([...updated, { role:"assistant", content:`Error: ${errMsg}` }]);
    }
    setLoading(false);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  const starters = [
    "What is the Anti-Deficiency Act and how does it apply to SEC?",
    "Explain the Section 31 fee-offset mechanism in detail.",
    "Walk me through the FY2028 OMB A-11 formulation cycle.",
    "What are OSO's top financial management risks for FY2026?",
    "How does the $145M carryover affect the FY2027 request?",
    "What corrective actions are needed for OIG Report 582?",
  ];

  const selectedMeta = MODELS.find(m => m.id === selectedModel);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 160px)" }}>
      <PageHeader icon="🤖" title="AI Financial Management Analyst"
        subtitle="Expert SEC OSO knowledge · OMB A-11 · Appropriations Law · ADA · CBJ FY2027 · chain-of-LLMs fallback" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:16, flex:1, minHeight:0 }}>
        {/* Chat area */}
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          <div style={{ flex:1, overflowY:"auto", background:C.surface, borderRadius:12,
                         border:`1px solid ${C.border}`, padding:20,
                         display:"flex", flexDirection:"column", gap:14,
                         minHeight:0, marginBottom:14 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted }}>
                <div style={{ fontSize:36, marginBottom:14 }}>🏛️</div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:8 }}>
                  SEC OSO Financial Intelligence
                </div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.7, maxWidth:480, margin:"0 auto" }}>
                  Ask any question about SEC budget mechanics, appropriations law, OMB Circular A-11,
                  ADA compliance, FY2027 CBJ data, OIG findings, or OSO financial management operations.
                </div>
              </div>
            ) : messages.map((m,i) => (
              <div key={i} style={{
                alignSelf: m.role==="user" ? "flex-end" : "flex-start",
                maxWidth:"82%",
                background: m.role==="user" ? `${C.blue}18` : `${C.purple}12`,
                border:`1px solid ${m.role==="user" ? `${C.blue}40` : `${C.purple}30`}`,
                borderRadius:10, padding:"12px 16px"
              }}>
                <div style={{ fontSize:12, color:C.muted, marginBottom:5, letterSpacing:"0.07em",
                               display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
                  <span>{m.role==="user" ? "YOU" : "AI ANALYST"}</span>
                  {m.role === "assistant" && m.modelUsed && (
                    <span style={{ fontSize:12, color:C.blue, fontFamily:"monospace",
                                    background:`${C.blue}15`, padding:"1px 7px", borderRadius:4 }}>
                      {m.modelUsed}
                    </span>
                  )}
                </div>
                <div style={{ fontSize:13, color:C.text, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf:"flex-start", background:`${C.purple}12`,
                             border:`1px solid ${C.purple}30`, borderRadius:10, padding:"12px 16px" }}>
                <div style={{ fontSize:12, color:C.muted, marginBottom:5 }}>AI ANALYST · {selectedModel}</div>
                <div style={{ fontSize:13, color:C.purple }}>Analyzing SEC financial data...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display:"flex", gap:10 }}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
              placeholder="Ask about SEC budget, ADA, OMB A-11, OIG findings, fee offset mechanism..."
              style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                        padding:"12px 16px", color:C.text, fontSize:13, outline:"none",
                        fontFamily:"inherit" }} />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ background:`linear-gradient(135deg,${C.blue},${C.purple})`,
                        border:"none", borderRadius:10, padding:"12px 22px",
                        color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer",
                        opacity: loading || !input.trim() ? 0.5 : 1 }}>
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>

          {/* Model selector */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted,
                            letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>
              Model
            </div>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value as ModelId)}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.borderAccent}`,
                        borderRadius:8, padding:"8px 10px", color:C.text, fontSize:12,
                        cursor:"pointer", outline:"none", fontFamily:"inherit" }}
            >
              {providerOrder.map(prov => (
                <optgroup key={prov} label={`── ${providerLabel[prov]} ──`}>
                  {MODELS.filter(m => m.provider === prov).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.isDefault ? " ★" : ""}{m.badge ? ` [${m.badge}]` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selectedMeta && (
              <div style={{ marginTop:8, fontSize:12, color:C.muted, lineHeight:1.5 }}>
                {selectedMeta.description}
                <div style={{ marginTop:4, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ color:C.textSub }}>ctx: {selectedMeta.contextWindow}</span>
                  {selectedMeta.isFree
                    ? <span style={{ color:C.green }}>Free</span>
                    : <span style={{ color:C.gold }}>${selectedMeta.inputPricePer1M}/1M in</span>}
                </div>
              </div>
            )}
            <div style={{ marginTop:8, fontSize:12, color:C.muted, lineHeight:1.5,
                           borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
              If this model fails, the <span style={{ color:C.blue }}> best</span> chain runs automatically as fallback.
            </div>
          </div>

          {/* Quick questions */}
          <div style={{ fontSize:12, fontWeight:700, color:C.muted,
                          letterSpacing:"0.08em", textTransform:"uppercase" }}>Quick Questions</div>
          {starters.map((q,i) => (
            <button key={i} onClick={()=>{ setInput(q); }}
              style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8,
                        padding:"11px 13px", fontSize:12, color:C.textSub, cursor:"pointer",
                        textAlign:"left", lineHeight:1.5, transition:"border-color 0.2s" }}>
              {q}
            </button>
          ))}

          {/* Knowledge base */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
                          borderRadius:8, padding:"12px 14px" }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:6, fontWeight:700 }}>KNOWLEDGE BASE</div>
            {Object.entries(AI_KNOWLEDGE).map(([k]) => (
              <div key={k} style={{ fontSize:12, color:C.muted, marginBottom:4 }}>
                ● {k.charAt(0).toUpperCase()+k.slice(1)}
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
              <div style={{ fontSize:12, fontWeight:700, color: active===i ? "#fff" : C.text }}>{t.title}</div>
              <div style={{ fontSize:12, color: active===i ? "rgba(255,255,255,0.6)" : C.muted, marginTop:2 }}>{t.cite}</div>
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
              <div style={{ fontSize:12, color:C.blue }}>{tp.cite}</div>
            </div>
          </div>
          {tp.sections.map((s,i) => (
            <Card key={i}>
              <div style={{ fontSize:13, fontWeight:700, color:C.cyan, marginBottom:10 }}>{s.head}</div>
              <div style={{ fontSize:13, color:C.textSub, lineHeight:1.75 }}>{s.body}</div>
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
const NAV = [
  { id:"home",        icon:"🏛️", label:"Executive Overview",     group:"OVERVIEW" },
  { id:"execution",   icon:"⚡", label:"Budget Execution",        group:"FINANCIAL OPS" },
  { id:"formulation", icon:"🔭", label:"Planning & Formulation",  group:"FINANCIAL OPS" },
  { id:"programs",    icon:"🎯", label:"Program Analysis",        group:"FINANCIAL OPS" },
  { id:"oig",         icon:"🔍", label:"OIG & Internal Controls", group:"COMPLIANCE" },
  { id:"news",        icon:"📡", label:"Live Intelligence",       group:"INTELLIGENCE" },
  { id:"ai",          icon:"🤖", label:"AI FM Analyst",           group:"TOOLS" },
  { id:"guidance",    icon:"📚", label:"Guidance Library",        group:"TOOLS" },
  { id:"oso-ops",     icon:"🏢", label:"OSO Ops Portal",          group:"TOOLS" },
  { id:"interview",   icon:"🎤", label:"Interview Prep",          group:"TOOLS" },
];

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
export default function SECFinancialPortal() {
  const [page, setPage]             = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pulse, setPulse]           = useState(true);
  const [dark, setDark]             = useState(true);
  const [isMobile, setIsMobile]     = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const C = dark ? DARK : LIGHT;

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const groups = Array.from(new Set(NAV.map(n=>n.group)));
  const currentPage = NAV.find(n=>n.id===page);

  const navigate = (id: string) => {
    setPage(id);
    setMobileNavOpen(false);
  };

  const renderPage = () => {
    switch(page) {
      case "home":        return <PageHome navigate={setPage} />;
      case "execution":   return <PageExecution />;
      case "formulation": return <PageFormulation />;
      case "programs":    return <PagePrograms />;
      case "oig":         return <PageOIG />;
      case "news":        return <PageNews />;
      case "ai":          return <PageAI />;
      case "guidance":    return <PageGuidance />;
      case "oso-ops":     return <OSOFinancialPortal />;
      case "interview":   return <InterviewPrepPortal />;
      default:            return <PageHome navigate={setPage} />;
    }
  };

  return (
    <ThemeContext.Provider value={C}>
    <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row",
                   height:"100vh", background:C.bg,
                   color:C.text, fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
                   overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      {!isMobile && (
        <aside style={{
          width: sidebarOpen ? 240 : 60, flexShrink:0,
          background:C.sidebar, borderRight:`1px solid ${C.border}`,
          display:"flex", flexDirection:"column",
          transition:"width 0.25s ease", overflow:"hidden",
        }}>
          {/* Logo */}
          <div style={{ padding:"18px 16px 14px", borderBottom:`1px solid ${C.border}`,
                         display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:8, flexShrink:0,
                            background:"linear-gradient(135deg,#003087,#0047ba)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:18, boxShadow:"0 0 12px rgba(0,48,135,0.5)" }}>🦅</div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, lineHeight:1.2 }}>SEC</div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.2 }}>Financial Portal</div>
              </div>
            )}
            <button onClick={()=>setSidebarOpen(o=>!o)}
              style={{ marginLeft:"auto", background:"none", border:"none",
                        color:C.muted, cursor:"pointer", fontSize:14, flexShrink:0 }}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>

          {/* Nav Groups */}
          <nav style={{ flex:1, overflowY:"auto", padding:"10px 0" }}>
            {groups.map(grp => (
              <div key={grp}>
                {sidebarOpen && (
                  <div style={{ fontSize:12, color:C.muted, fontWeight:700,
                                 letterSpacing:"0.1em", padding:"12px 16px 4px" }}>{grp}</div>
                )}
                {NAV.filter(n=>n.group===grp).map(n => (
                  <button key={n.id} onClick={()=>navigate(n.id)}
                    style={{
                      display:"flex", alignItems:"center", gap:12,
                      width:"100%", padding: sidebarOpen ? "10px 16px" : "10px 0",
                      justifyContent: sidebarOpen ? "flex-start" : "center",
                      background: page===n.id ? `${C.blue}18` : "none",
                      border:"none",
                      borderRight: page===n.id ? `3px solid ${C.blue}` : "3px solid transparent",
                      cursor:"pointer", transition:"all 0.15s",
                    }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>{n.icon}</span>
                    {sidebarOpen && (
                      <span style={{ fontSize:12, fontWeight: page===n.id ? 600 : 400,
                                      color: page===n.id ? C.blue : C.muted,
                                      whiteSpace:"nowrap" }}>{n.label}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Live indicator */}
          <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}`,
                         display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%",
                            background: pulse ? C.green : `${C.green}44`,
                            transition:"background 0.5s", flexShrink:0 }} />
            {sidebarOpen && (
              <div>
                <div style={{ fontSize:12, color:C.green, fontWeight:600 }}>Live · FY2026</div>
                <div style={{ fontSize:12, color:C.muted }}>CBJ April 2026</div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── MAIN AREA ────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column",
                     overflow:"hidden", minWidth:0 }}>

        {/* ── HEADER ── */}
        {isMobile ? (
          /* Mobile header: logo + page title + dark toggle + hamburger */
          <header style={{ flexShrink:0, background:C.surface,
                             borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center",
                           justifyContent:"space-between",
                           padding:"0 14px", height:52 }}>
              {/* Left: logo + current page */}
              <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                <div style={{ width:30, height:30, borderRadius:7, flexShrink:0,
                                background:"linear-gradient(135deg,#003087,#0047ba)",
                                display:"flex", alignItems:"center",
                                justifyContent:"center", fontSize:16 }}>🦅</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text,
                                 whiteSpace:"nowrap", overflow:"hidden",
                                 textOverflow:"ellipsis" }}>
                    {currentPage?.icon} {currentPage?.label}
                  </div>
                  <div style={{ fontSize:11, color:C.muted }}>SEC Financial Portal</div>
                </div>
              </div>
              {/* Right: dark toggle + hamburger */}
              <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                <button onClick={() => setDark(d => !d)}
                  style={{ background:"none", border:`1px solid ${C.border}`,
                            borderRadius:7, padding:"5px 10px",
                            fontSize:16, cursor:"pointer", color:C.text }}>
                  {dark ? "☀️" : "🌙"}
                </button>
                <button onClick={() => setMobileNavOpen(o => !o)}
                  style={{ background: mobileNavOpen ? `${C.blue}22` : "none",
                            border:`1px solid ${mobileNavOpen ? C.blue : C.border}`,
                            borderRadius:7, padding:"5px 12px",
                            fontSize:18, cursor:"pointer", color: mobileNavOpen ? C.blue : C.text,
                            fontWeight:700, lineHeight:1 }}>
                  {mobileNavOpen ? "✕" : "☰"}
                </button>
              </div>
            </div>

            {/* Mobile nav dropdown — slides down from header */}
            {mobileNavOpen && (
              <div style={{ borderTop:`1px solid ${C.border}`,
                             maxHeight:"75vh", overflowY:"auto",
                             background:C.sidebar }}>
                {groups.map(grp => (
                  <div key={grp}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.muted,
                                   letterSpacing:"0.12em", textTransform:"uppercase",
                                   padding:"14px 18px 5px" }}>{grp}</div>
                    {NAV.filter(n=>n.group===grp).map(n => (
                      <button key={n.id} onClick={() => navigate(n.id)}
                        style={{ display:"flex", alignItems:"center", gap:14,
                                  width:"100%", padding:"14px 20px",
                                  background: page===n.id ? `${C.blue}20` : "transparent",
                                  border:"none",
                                  borderLeft: page===n.id ? `4px solid ${C.blue}` : "4px solid transparent",
                                  cursor:"pointer", textAlign:"left" }}>
                        <span style={{ fontSize:22, flexShrink:0 }}>{n.icon}</span>
                        <span style={{ fontSize:15, fontWeight: page===n.id ? 700 : 400,
                                        color: page===n.id ? C.blue : C.text }}>
                          {n.label}
                        </span>
                        {page===n.id && (
                          <span style={{ marginLeft:"auto", color:C.blue, fontSize:16 }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
                {/* Live indicator at bottom of nav */}
                <div style={{ padding:"14px 20px", borderTop:`1px solid ${C.border}`,
                               display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%",
                                  background: pulse ? C.green : `${C.green}44`,
                                  transition:"background 0.5s" }} />
                  <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>Live · FY2026 · CBJ April 2026</span>
                </div>
              </div>
            )}
          </header>
        ) : (
          /* Desktop header */
          <header style={{ height:54, borderBottom:`1px solid ${C.border}`,
                             display:"flex", alignItems:"center", justifyContent:"space-between",
                             padding:"0 28px", background:C.surface, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16 }}>{currentPage?.icon}</span>
              <div>
                <span style={{ fontSize:14, fontWeight:600, color:C.text }}>
                  {currentPage?.label}
                </span>
                <span style={{ fontSize:12, color:C.muted, marginLeft:10 }}>
                  U.S. Securities and Exchange Commission · Office of Support Operations
                </span>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              {["FY26 Exec","FY27 Pending","FY28 Form"].map((lbl,i) => (
                <span key={i} style={{ fontSize:12, background:C.card,
                                        border:`1px solid ${C.border}`, borderRadius:6,
                                        padding:"3px 10px",
                                        color:[C.green,C.gold,C.purple][i] }}>{lbl}</span>
              ))}
              <div style={{ fontSize:12, color:C.muted, fontFamily:"monospace" }}>
                {new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}
              </div>
              <button onClick={() => setDark(d => !d)}
                style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7,
                          padding:"4px 14px", fontSize:12, cursor:"pointer", color:C.text,
                          display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                {dark ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>
          </header>
        )}

        {/* Breadcrumb — desktop only */}
        {!isMobile && (
          <div style={{ padding:"8px 28px", fontSize:12, color:C.muted,
                         borderBottom:`1px solid ${C.dim}`, background:C.bg, flexShrink:0 }}>
            SEC · OSO / Business Management &amp; Continuity Branch ›{" "}
            <span style={{ color:C.blue }}>{currentPage?.label}</span>
          </div>
        )}

        {/* Page content */}
        <main style={{ flex:1, overflowY:"auto",
                         padding: isMobile ? "0" : "28px 28px 40px" }}>
          {renderPage()}
        </main>

        {/* Footer — desktop only */}
        {!isMobile && (
          <footer style={{ padding:"9px 28px", borderTop:`1px solid ${C.border}`,
                             display:"flex", justifyContent:"space-between",
                             fontSize:12, color:C.muted, background:C.surface, flexShrink:0 }}>
            <span>Sources: SEC FY2027 CBJ (Apr 2026) · OMB Circular A-11 · ADA 31 U.S.C.§1341 · Consolidated Appropriations Act FY2026</span>
            <span>OSO Business Management &amp; Continuity Branch · FY2026 Execution · Data: {new Date().toLocaleDateString()}</span>
          </footer>
        )}
      </div>
    </div>
    </ThemeContext.Provider>
  );
}
