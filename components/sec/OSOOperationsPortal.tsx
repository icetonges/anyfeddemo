// @ts-nocheck
"use client"
import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────
// ⚠️  DISCLAIMER — displayed in-app and in footer
// ─────────────────────────────────────────────────────────────────────
const DISCLAIMER = `⚠️ DISCLAIMER: This application was developed for career preparation and job-search purposes. All data, figures, names, organizational structures, and operational assumptions contained herein are based solely on publicly available information (SEC.gov, USAJOBS, SEC OIG reports, and SEC Congressional Budget Justifications). No non-public, proprietary, or agency-internal data has been used. Reasonable assumptions have been made where public information is incomplete. This tool does not represent official SEC policy, operations, or endorsement. It is a demonstration prototype for interview preparation purposes only.`;

// ─────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM — Government precision meets intelligence dashboard
// ─────────────────────────────────────────────────────────────────────
const D = {
  // Base
  bg:        "#f4f5f7",
  sidebar:   "#0a1628",
  sidebarHi: "#132240",
  card:      "#ffffff",
  border:    "#dde1e9",
  // Brand
  navy:      "#003087",
  blue:      "#0055a5",
  skyBlue:   "#2e7ee5",
  // Status
  green:     "#0a7a47",
  greenBg:   "#eaf5ee",
  red:       "#c0392b",
  redBg:     "#fdecea",
  gold:      "#b8860b",
  goldBg:    "#fef9e7",
  orange:    "#d4570a",
  orangeBg:  "#fef0e8",
  purple:    "#5b2d8e",
  purpleBg:  "#f3eef9",
  // Text
  text:      "#1a2332",
  textSub:   "#4a5568",
  muted:     "#718096",
  dim:       "#a0aec0",
  // Accent
  accent:    "#e8edf5",
};

const urgColor = { HIGH: D.red, MEDIUM: D.gold, LOW: D.green };
const urgBg    = { HIGH: D.redBg, MEDIUM: D.goldBg, LOW: D.greenBg };

// ─────────────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────────────
const INIT_ACTIONS = [
  { id:1, type:"OBLIGATION", ref:"OSO-OBL-001", desc:"FOIA Research Contract — Option Year 3", vendor:"Apex Tech Solutions", amount:245000, oc:"25.0", office:"OFS", status:"APPROVED", created:"2026-10-05", due:"2026-10-15", adaRisk:"LOW", cor:"C. Smith" },
  { id:2, type:"OBLIGATION", ref:"OSO-OBL-002", desc:"Security Guard Services Q1 FY27 — T&M", vendor:"Patriot Security Inc", amount:382000, oc:"25.0", office:"OSBO-PSE", status:"PENDING REVIEW", created:"2026-10-08", due:"2026-10-20", adaRisk:"MEDIUM", cor:"M. Johnson", note:"OIG-582: T&M — document scope justification before award" },
  { id:3, type:"OBLIGATION", ref:"OSO-OBL-003", desc:"Records Management System — Annual License", vendor:"FileNet Gov Solutions", amount:95500, oc:"25.0", office:"OAMR", status:"APPROVED", created:"2026-10-01", due:"2026-10-10", adaRisk:"LOW", cor:"A. Davis" },
  { id:4, type:"OBLIGATION", ref:"OSO-OBL-004", desc:"COOP Alternate Site — Q1 Lease Payment", vendor:"GSA (3rd Party)", amount:58000, oc:"23.0", office:"BMCB", status:"APPROVED", created:"2026-10-01", due:"2026-10-05", adaRisk:"LOW", cor:"N/A" },
  { id:5, type:"OBLIGATION", ref:"OSO-OBL-005", desc:"Janitorial Services HQ — Month of October", vendor:"CleanFed Corp", amount:42000, oc:"25.0", office:"OSBO-FO", status:"PENDING REVIEW", created:"2026-10-10", due:"2026-10-18", adaRisk:"LOW", cor:"T. Brown" },
  { id:6, type:"GPC PURCHASE", ref:"GPC-2027-001", desc:"Office Supplies — FOIA Research Branch 1", vendor:"Staples Adv", amount:1240, oc:"26.0", office:"OFS", status:"RECONCILED", created:"2026-10-03", due:"2026-10-08", adaRisk:"LOW", cor:"N/A", cardholder:"C. Mallon" },
  { id:7, type:"GPC PURCHASE", ref:"GPC-2027-002", desc:"Emergency UPS Battery Replacement — Server Room", vendor:"APC Inc", amount:3800, oc:"31.0", office:"OSBO-FSS", status:"PENDING RECONCILE", created:"2026-10-09", due:"2026-10-14", adaRisk:"LOW", cor:"N/A", cardholder:"J. Printis" },
  { id:8, type:"COR ACTION", ref:"COR-2027-001", desc:"Monthly T&M Ceiling Utilization Review — Patriot Security", vendor:"Patriot Security Inc", amount:382000, oc:"25.0", office:"OSBO-PSE", status:"OVERDUE", created:"2026-10-01", due:"2026-10-07", adaRisk:"HIGH", cor:"M. Johnson", note:"OIG-582 corrective action — monthly COR log required" },
  { id:9, type:"BUDGET FORMULATION", ref:"FORM-2028-001", desc:"FY2028 Budget Call — FOIA Services Submission", vendor:"N/A", amount:0, oc:"ALL", office:"OFS", status:"IN PROGRESS", created:"2026-10-05", due:"2026-10-31", adaRisk:"LOW", cor:"N/A" },
  { id:10, type:"BUDGET FORMULATION", ref:"FORM-2028-002", desc:"FY2028 Budget Call — Security & Building Operations", vendor:"N/A", amount:0, oc:"ALL", office:"OSBO", status:"NOT STARTED", created:"2026-10-05", due:"2026-10-31", adaRisk:"MEDIUM", cor:"N/A" },
];

const INIT_ALLOTMENTS = [
  { office:"OFS",      label:"FOIA Services",                 fy27:4850000,  ytd:387200,  months:1 },
  { office:"OSBO-PSE", label:"Physical Security & Emergency", fy27:2400000,  ytd:96000,   months:1 },
  { office:"OSBO-PS",  label:"Personnel Security",            fy27:680000,   ytd:54400,   months:1 },
  { office:"OSBO-CL",  label:"Construction & Leasing",        fy27:1200000,  ytd:100000,  months:1 },
  { office:"OSBO-FO",  label:"Facilities Operations",         fy27:890000,   ytd:84050,   months:1 },
  { office:"OSBO-FSS", label:"Facilities Systems & Services", fy27:540000,   ytd:45000,   months:1 },
  { office:"OAMR",     label:"Admin & Mission Resilience",    fy27:620000,   ytd:52000,   months:1 },
  { office:"BMCB",     label:"Business Mgmt & Continuity",    fy27:380000,   ytd:32000,   months:1 },
];

const INIT_OIG = [
  { id:"OIG-582", title:"T&M Contract Management", status:"OPEN", due:"2026-09-30", recs:3, closed:0, priority:"HIGH",
    actions:[
      { id:"A1", text:"Quarterly T&M ceiling utilization dashboard", status:"IN PROGRESS", owner:"FM Specialist" },
      { id:"A2", text:"Contract type decision matrix for new acquisitions", status:"NOT STARTED", owner:"FM Spec + Acquisitions" },
      { id:"A3", text:"COR surveillance log template and SOPs", status:"NOT STARTED", owner:"COR Network" },
    ]},
  { id:"OIG-584", title:"FISMA Level 3 Controls (Financial Systems)", status:"IN PROGRESS", due:"2026-12-31", recs:5, closed:2, priority:"MEDIUM",
    actions:[
      { id:"B1", text:"Zero trust architecture compliance milestones", status:"IN PROGRESS", owner:"OIT" },
      { id:"B2", text:"Vulnerability management remediation", status:"IN PROGRESS", owner:"OIT" },
    ]},
];

const INIT_GPC = [
  { id:"GPC-001", cardholder:"Carmen Mallon (OFS-R1)", limit:2500, ytdSpend:1240, pending:0, lastRecon:"2026-10-08", status:"CURRENT" },
  { id:"GPC-002", cardholder:"Joyce Printis (OSBO-FSS)", limit:10000, ytdSpend:3800, pending:3800, lastRecon:"2026-10-01", status:"PENDING" },
  { id:"GPC-003", cardholder:"Mark Hochberg (OSBO-FO)", limit:5000, ytdSpend:0, pending:0, lastRecon:"2026-10-01", status:"CURRENT" },
  { id:"GPC-004", cardholder:"Aaron Taylor (OFS-R3)", limit:2500, ytdSpend:420, pending:0, lastRecon:"2026-10-06", status:"CURRENT" },
];

const INIT_COR = [
  { id:"COR-001", officer:"M. Johnson", contract:"Patriot Security Guard Services", vendor:"Patriot Security Inc", ceiling:1528000, ytdOblig:382000, utilPct:25.0, lastLog:"2026-09-30", nextDue:"2026-10-31", status:"OVERDUE", oig582:true },
  { id:"COR-002", officer:"C. Smith", contract:"FOIA Processing Support Services", vendor:"Apex Tech Solutions", ceiling:245000, ytdOblig:61250, utilPct:25.0, lastLog:"2026-10-09", nextDue:"2026-10-31", status:"CURRENT", oig582:false },
  { id:"COR-003", officer:"A. Davis", contract:"Records Management System License", vendor:"FileNet Gov Solutions", ceiling:95500, ytdOblig:23875, utilPct:25.0, lastLog:"2026-10-08", nextDue:"2026-10-31", status:"CURRENT", oig582:false },
  { id:"COR-004", officer:"T. Brown", contract:"Janitorial Services HQ", vendor:"CleanFed Corp", ceiling:504000, ytdOblig:42000, utilPct:8.3, lastLog:"2026-10-10", nextDue:"2026-10-31", status:"CURRENT", oig582:true },
];

const INIT_TIMEKEEPING = [
  { name:"Allotment Tracking & Burn Rate Review", hrs:8, cat:"BUDGET EXECUTION", week:"Oct 7-11" },
  { name:"FY2028 Budget Call Coordination (OFS)", hrs:6, cat:"FORMULATION", week:"Oct 7-11" },
  { name:"OIG-582 Corrective Action — Dashboard Build", hrs:10, cat:"INTERNAL CONTROLS", week:"Oct 7-11" },
  { name:"GPC Reconciliation Review", hrs:2, cat:"COMPLIANCE", week:"Oct 7-11" },
  { name:"Monthly Financial Status Report Draft", hrs:6, cat:"REPORTING", week:"Oct 7-11" },
  { name:"Stakeholder: OSBO Budget Q&A (K. Taylor)", hrs:2, cat:"ADVISORY", week:"Oct 7-11" },
  { name:"COOP Exercise Cost Planning", hrs:4, cat:"COOP", week:"Oct 7-11" },
  { name:"Admin / Email / Meetings", hrs:2, cat:"ADMIN", week:"Oct 7-11" },
];

const INIT_BRIEFS = [
  { id:"BR-001", type:"Monthly Financial Status", status:"DRAFT", created:"2026-10-10", dueDate:"2026-10-15", audience:"Brian Williams / William Buckley", pages:2 },
  { id:"BR-002", type:"OIG-582 Corrective Action Progress", status:"NOT STARTED", created:"2026-10-10", dueDate:"2026-10-31", audience:"Brian Williams / OIG Liaison", pages:1 },
  { id:"BR-003", type:"FY2028 Budget Call Summary", status:"NOT STARTED", created:"2026-10-10", dueDate:"2026-11-07", audience:"William Buckley / OFM", pages:3 },
];

// ─────────────────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────────────────
const fmt$ = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toLocaleString()}`;
const fmtFull = (n) => `$${n.toLocaleString()}`;

function Badge({ label, color="navy", small }) {
  const colorMap = {
    red:    { bg: D.redBg,    text: D.red    },
    green:  { bg: D.greenBg,  text: D.green  },
    gold:   { bg: D.goldBg,   text: D.gold   },
    orange: { bg: D.orangeBg, text: D.orange },
    navy:   { bg: D.accent,   text: D.navy   },
    purple: { bg: D.purpleBg, text: D.purple },
    gray:   { bg: "#f0f2f5",  text: D.muted  },
  };
  const c = colorMap[color] || colorMap.navy;
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 4,
                   padding: small ? "1px 7px" : "2px 9px",
                   fontSize: small ? 10 : 11, fontWeight: 700,
                   letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{label}</span>
  );
}

function KPI({ label, value, sub, color, trend }) {
  const ac = color || D.navy;
  return (
    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 10,
                  padding: "18px 20px", flex: 1, minWidth: 150,
                  borderTop: `3px solid ${ac}` }}>
      <div style={{ fontSize: 11, color: D.muted, fontWeight: 600,
                    letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: ac,
                    fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: D.muted, marginTop: 5 }}>{sub}</div>}
      {trend && <div style={{ fontSize: 11, marginTop: 4, color: trend.startsWith("+") ? D.green : D.red }}>{trend}</div>}
    </div>
  );
}

function SectionHead({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${D.border}` }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: D.text }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: D.card, border: `1px solid ${D.border}`,
                  borderRadius: 10, padding: "20px 22px", ...style }}>{children}</div>
  );
}

function Th({ children, right }) {
  return <th style={{ padding: "9px 12px", textAlign: right ? "right" : "left",
                       color: D.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                       background: "#f8f9fb", borderBottom: `1px solid ${D.border}`,
                       whiteSpace: "nowrap" }}>{children}</th>;
}
function Td({ children, right, mono, bold, color }) {
  return <td style={{ padding: "9px 12px", textAlign: right ? "right" : "left",
                       color: color || D.text, fontSize: 12, fontFamily: mono ? "'IBM Plex Mono',monospace" : "inherit",
                       fontWeight: bold ? 700 : 400, borderBottom: `1px solid #f0f2f5` }}>{children}</td>;
}

function BurnBar({ pct, risk }) {
  const bar = Math.min(pct, 100);
  const clr = pct > 90 ? D.red : pct > 75 ? D.gold : D.green;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, background: "#e8edf5", borderRadius: 4, height: 7, overflow: "hidden" }}>
          <div style={{ width: `${bar}%`, height: "100%", background: clr, borderRadius: 4,
                         transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 11, color: clr, fontWeight: 700, fontFamily: "monospace",
                       minWidth: 36, textAlign: "right" }}>{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MODAL — Add/Edit actions
// ─────────────────────────────────────────────────────────────────────
function ActionModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    type:"OBLIGATION", ref:"", desc:"", vendor:"N/A", amount:0,
    oc:"25.0", office:"OFS", status:"PENDING REVIEW",
    created: new Date().toISOString().slice(0,10),
    due:"", adaRisk:"LOW", cor:"", note:""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
                  display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background: D.card, borderRadius: 12, width: 620, maxHeight: "85vh",
                    overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ background: D.navy, color: "#fff", padding: "16px 22px",
                      borderRadius: "12px 12px 0 0", display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{initial ? "Edit Action" : "New Action / Obligation"}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff",
                                              fontSize:18, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding: "22px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          {[
            ["Action Type", "type", ["OBLIGATION","GPC PURCHASE","COR ACTION","BUDGET FORMULATION","INTERNAL CONTROL","BRIEF/REPORT"]],
            ["Reference #", "ref", "text"],
            ["Description", "desc", "text"],
            ["Vendor / Contractor", "vendor", "text"],
            ["Amount ($)", "amount", "number"],
            ["Object Class", "oc", ["11.0","12.0","23.0","24.0","25.0","26.0","31.0","32.0","ALL"]],
            ["OSO Office", "office", ["OFS","OSBO-PSE","OSBO-PS","OSBO-CL","OSBO-FO","OSBO-FSS","OAMR","BMCB","ALL"]],
            ["Status", "status", ["PENDING REVIEW","APPROVED","RECONCILED","PENDING RECONCILE","IN PROGRESS","NOT STARTED","OVERDUE","CLOSED"]],
            ["ADA Risk", "adaRisk", ["LOW","MEDIUM","HIGH"]],
            ["Due Date", "due", "date"],
            ["COR Officer", "cor", "text"],
            ["Notes / Flags", "note", "textarea"],
          ].map(([label, key, type]) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: D.muted,
                               display:"block", marginBottom: 4, letterSpacing:"0.05em" }}>{label}</label>
              {Array.isArray(type) ? (
                <select value={form[key]} onChange={e => set(key, e.target.value)}
                  style={{ width:"100%", padding:"8px 10px", borderRadius:6, border:`1px solid ${D.border}`,
                           fontSize:12, color:D.text, background:"#fff" }}>
                  {type.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : type === "textarea" ? (
                <textarea value={form[key]} onChange={e => set(key, e.target.value)} rows={3}
                  style={{ width:"100%", padding:"8px 10px", borderRadius:6, border:`1px solid ${D.border}`,
                           fontSize:12, color:D.text, resize:"vertical", fontFamily:"inherit" }} />
              ) : (
                <input type={type} value={form[key]} onChange={e => set(key, type==="number" ? +e.target.value : e.target.value)}
                  style={{ width:"100%", padding:"8px 10px", borderRadius:6, border:`1px solid ${D.border}`,
                           fontSize:12, color:D.text }} />
              )}
            </div>
          ))}
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={() => onSave(form)}
              style={{ flex:1, background:D.navy, color:"#fff", border:"none", borderRadius:7,
                       padding:"10px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {initial ? "Save Changes" : "Add Action"}
            </button>
            <button onClick={onClose}
              style={{ flex:1, background:"#f0f2f5", color:D.muted, border:"none", borderRadius:7,
                       padding:"10px", fontSize:13, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BRIEF GENERATOR
// ─────────────────────────────────────────────────────────────────────
function BriefGenerator({ allotments, actions, oig, gpc, cor }) {
  const [type, setType] = useState("monthly");
  const [preview, setPreview] = useState(false);

  const totalAllotment = allotments.reduce((s,a) => s+a.fy27, 0);
  const totalYTD       = allotments.reduce((s,a) => s+a.ytd,  0);
  const burnPct        = (totalYTD/totalAllotment*100).toFixed(1);
  const highRisk       = actions.filter(a => a.adaRisk==="HIGH");
  const pending        = actions.filter(a => a.status==="PENDING REVIEW" || a.status==="PENDING RECONCILE");
  const overdue        = actions.filter(a => a.status==="OVERDUE");
  const oigOpen        = oig.filter(o => o.status !== "CLOSED");
  const gpcPending     = gpc.filter(g => g.status === "PENDING");

  const briefs = {
    monthly: {
      title: "OSO MONTHLY FINANCIAL STATUS BRIEF",
      to: "Brian Williams, Chief — Business Management & Continuity Branch",
      cc: "William Buckley, AD — Office of Administration & Mission Resilience",
      from: "Financial Management Specialist, BMCB",
      date: new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),
      classification: "FOR OFFICIAL USE ONLY (FOUO)",
      purpose: "Provides monthly financial status overview for the Office of Support Operations (OSO) covering obligations, execution burn rate, GPC card activity, COR surveillance status, and ADA risk assessment.",
      sections: [
        {
          head:"1. BUDGET EXECUTION SUMMARY",
          body: `FY2027 OSO Allotment: ${fmt$(totalAllotment)} | YTD Obligations: ${fmt$(totalYTD)} | Burn Rate: ${burnPct}% (Month 1 of 12)\n\nExecution is tracking within planned parameters. Monthly burn rate of ${burnPct}% against a 1/12 (8.3%) baseline indicates normal Q1 cadence. No Anti-Deficiency Act (ADA) violations detected. ADA risk assessment: ${highRisk.length > 0 ? "ELEVATED — "+highRisk.length+" items flagged" : "LOW — no violations projected at current burn rate"}.`
        },
        {
          head:"2. PENDING OBLIGATIONS",
          body: `${pending.length} obligation actions pending approval. ${overdue.length} item(s) overdue for action. Priority items:\n${pending.slice(0,3).map(a => `• ${a.ref}: ${a.desc} — ${fmt$(a.amount)} (${a.office})`).join("\n")}\n\nAll pending obligations should be resolved by ${new Date(Date.now()+7*86400000).toLocaleDateString()} to maintain execution pace.`
        },
        {
          head:"3. OIG CORRECTIVE ACTION STATUS",
          body: `${oigOpen.length} open OIG finding(s) active. OIG Report 582 (T&M Contract Management) remains highest priority — 3 open recommendations, 0 closed. Quarterly ceiling utilization dashboard is IN PROGRESS (FM Specialist). Contract type decision matrix and COR surveillance SOPs NOT STARTED. Target closure: September 30, 2026.`
        },
        {
          head:"4. GPC PROGRAM STATUS",
          body: `${gpc.length} active purchase card accounts. ${gpcPending.length} card(s) with pending reconciliation. Total YTD spend: ${fmt$(gpc.reduce((s,g)=>s+g.ytdSpend,0))}. All transactions within single-purchase and monthly limits. ${gpcPending.length > 0 ? "ACTION REQUIRED: Reconcile pending transactions within 5 business days per GSA SmartPay policy." : "Reconciliation current."}`
        },
        {
          head:"5. COR SURVEILLANCE",
          body: `${cor.length} active contract(s) with designated CORs. ${cor.filter(c=>c.status==="OVERDUE").length} COR log(s) OVERDUE — immediate action required for OIG-582 compliance. ${cor.filter(c=>c.oig582).length} contract(s) flagged for OIG-582 T&M scope review.`
        },
        {
          head:"6. MANAGEMENT ACTIONS REQUIRED",
          body: `1. Approve/deny ${pending.length} pending obligation(s) by ${new Date(Date.now()+7*86400000).toLocaleDateString()}\n2. Direct COR M. Johnson to submit overdue T&M surveillance log — OIG-582 compliance\n3. Review and approve Draft GPC reconciliation for Printis (OSBO-FSS): ${fmt$(3800)}\n4. Confirm FY2028 Budget Call deadline for OSBO (currently NOT STARTED — due Oct 31)`
        }
      ]
    },
    onepager: {
      title: "OSO FINANCIAL SNAPSHOT — ONE PAGER",
      to: "William Buckley / Olivier Girod",
      from: "BMCB Financial Management",
      date: new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),
      classification: "FOR OFFICIAL USE ONLY (FOUO)",
      purpose: "At-a-glance financial health of OSO. FY2027 Q1.",
      sections: [
        { head:"STATUS: ✅ EXECUTING WITHIN LIMITS", body:`Burn: ${burnPct}% | ADA Risk: ${highRisk.length > 0 ? "⚠️ ELEVATED" : "✅ LOW"} | OIG-582: 🟡 IN PROGRESS` },
        { head:"KEY NUMBERS", body:`Allotment: ${fmt$(totalAllotment)} | Obligated: ${fmt$(totalYTD)} | Remaining: ${fmt$(totalAllotment-totalYTD)}\nPending actions: ${pending.length} | Overdue: ${overdue.length} | GPC pending recon: ${gpcPending.length}` },
        { head:"TOP RISK", body:`OIG-582 corrective actions — COR surveillance log for security guard contract OVERDUE. Escalation risk if not closed by Oct 31. FM Specialist tracking.` },
        { head:"NEXT STEPS", body:`(1) Close ${pending.length} pending obligations this week\n(2) OSBO budget call submission — due Oct 31\n(3) COR log compliance — urgent` }
      ]
    },
    oig582: {
      title: "OIG REPORT 582 — CORRECTIVE ACTION STATUS UPDATE",
      to: "Brian Williams, Chief BMCB | OIG Liaison Office",
      from: "Financial Management Specialist, BMCB",
      date: new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),
      classification: "FOR OFFICIAL USE ONLY (FOUO)",
      purpose: "Status update on corrective actions for OIG Report No. 582 — 'The SEC Missed Opportunities to Lower Contract Risk and More Effectively Manage Time-and-Materials Contracts' (August 26, 2024). OSO is the primary responsible office for three open recommendations.",
      sections: [
        { head:"RECOMMENDATION STATUS", body:`Rec 1: Quarterly T&M Ceiling Utilization Dashboard — IN PROGRESS (owner: FM Specialist)\nRec 2: Contract Type Decision Matrix — NOT STARTED (owner: FM Spec + Office of Acquisitions)\nRec 3: COR Surveillance Log SOPs — NOT STARTED (owner: COR Network / BMCB)` },
        { head:"T&M CONTRACTS IN SCOPE", body:`Contract 1: Patriot Security Guard Services — ceiling $1,528,000 | YTD: $382,000 (25.0%) | COR: M. Johnson | Log STATUS: OVERDUE\nContract 2: CleanFed Corp Janitorial — ceiling $504,000 | YTD: $42,000 (8.3%) | COR: T. Brown | Log STATUS: CURRENT` },
        { head:"IMMEDIATE ACTIONS", body:`1. M. Johnson COR log submission required immediately — OIG may test this in next audit cycle\n2. FM Specialist to complete dashboard prototype by Oct 31\n3. Schedule Acquisitions coordination meeting for contract type matrix\n4. Briefing to William Buckley on status by Nov 15` },
        { head:"TARGET CLOSURE", body:`All three recommendations targeting closure by September 30, 2026 (extended target given FY2027 start). Sustainable corrective actions — not one-time fixes — required for OIG closure.` }
      ]
    }
  };

  const B = briefs[type];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHead title="Brief & Document Generator"
        sub="One-pager, Monthly Status, OIG Corrective Action Update — print or export"
        action={
          <div style={{ display:"flex", gap:8 }}>
            {[["monthly","Monthly Status"],["onepager","One-Pager"],["oig582","OIG-582 Update"]].map(([v,l]) => (
              <button key={v} onClick={() => { setType(v); setPreview(false); }}
                style={{ background: type===v ? D.navy : "#f0f2f5",
                         color: type===v ? "#fff" : D.muted, border:"none", borderRadius:6,
                         padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer" }}>{l}</button>
            ))}
          </div>
        }
      />

      <div style={{ background:"#f8f9fb", border:`1px solid ${D.border}`, borderRadius:10 }}>
        {/* Brief Header */}
        <div style={{ background: D.navy, color:"#fff", borderRadius:"10px 10px 0 0", padding:"22px 28px" }}>
          <div style={{ fontSize:10, letterSpacing:"0.15em", opacity:0.7, marginBottom:4 }}>SECURITIES AND EXCHANGE COMMISSION</div>
          <div style={{ fontSize:16, fontWeight:800, letterSpacing:"-0.01em", marginBottom:12 }}>{B.title}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, fontSize:11, opacity:0.85 }}>
            <div><span style={{ opacity:0.65 }}>TO: </span>{B.to}</div>
            {B.cc && <div><span style={{ opacity:0.65 }}>CC: </span>{B.cc}</div>}
            <div><span style={{ opacity:0.65 }}>FROM: </span>{B.from}</div>
            <div><span style={{ opacity:0.65 }}>DATE: </span>{B.date}</div>
          </div>
          <div style={{ marginTop:10, background:"rgba(255,255,255,0.15)", borderRadius:5,
                         padding:"6px 12px", fontSize:10, fontWeight:700, letterSpacing:"0.08em",
                         display:"inline-block" }}>{B.classification}</div>
        </div>

        {/* Purpose */}
        <div style={{ padding:"16px 28px", background:"#eff1f5", borderBottom:`1px solid ${D.border}`,
                       fontSize:12, color:D.textSub, fontStyle:"italic" }}>
          <strong style={{ color:D.text, fontStyle:"normal" }}>PURPOSE: </strong>{B.purpose}
        </div>

        {/* Sections */}
        <div style={{ padding:"20px 28px", display:"flex", flexDirection:"column", gap:18 }}>
          {B.sections.map((s,i) => (
            <div key={i}>
              <div style={{ fontSize:11, fontWeight:800, color:D.navy, letterSpacing:"0.06em",
                             marginBottom:7, borderLeft:`3px solid ${D.navy}`, paddingLeft:10 }}>{s.head}</div>
              <div style={{ fontSize:12, color:D.text, lineHeight:1.75, whiteSpace:"pre-line",
                             paddingLeft:10 }}>{s.body}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 28px", borderTop:`1px solid ${D.border}`, background:"#f8f9fb",
                       borderRadius:"0 0 10px 10px", fontSize:10, color:D.muted, display:"flex",
                       justifyContent:"space-between" }}>
          <span>OSO / BMCB Financial Management · SEC.gov</span>
          <span style={{ fontStyle:"italic", color:"#e57373" }}>⚠️ Demo only — public data + reasonable assumptions</span>
        </div>
      </div>

      <div style={{ background:D.goldBg, border:`1px solid ${D.gold}`, borderRadius:8,
                     padding:"10px 16px", fontSize:11, color:D.gold }}>
        💡 To print or save as PDF: press <strong>Ctrl+P</strong> → Save as PDF. For Word export, copy the brief content into a Word doc using the template in the FY guidance library.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PAGE COMPONENTS
// ─────────────────────────────────────────────────────────────────────

function PageDashboard({ actions, allotments, oig, gpc, cor }) {
  const totalAllotment = allotments.reduce((s,a) => s+a.fy27, 0);
  const totalYTD       = allotments.reduce((s,a) => s+a.ytd,  0);
  const burnPct        = (totalYTD/totalAllotment*100);
  const highRisk       = actions.filter(a => a.adaRisk==="HIGH");
  const pending        = actions.filter(a => a.status==="PENDING REVIEW" || a.status==="PENDING RECONCILE");
  const overdue        = actions.filter(a => a.status==="OVERDUE");
  const oigOpen        = oig.filter(o => o.status !== "CLOSED");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      {/* ADA Risk Alert */}
      {highRisk.length > 0 && (
        <div style={{ background:D.redBg, border:`1px solid ${D.red}`, borderRadius:10,
                       padding:"13px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
          <span style={{ fontSize:20 }}>🚨</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:D.red }}>
              ADA RISK FLAG — {highRisk.length} item(s) require immediate action
            </div>
            <div style={{ fontSize:12, color:D.textSub, marginTop:3 }}>
              {highRisk.map(a => `${a.ref}: ${a.desc}`).join(" · ")}. Review before obligating. 31 U.S.C.§1341 applies.
            </div>
          </div>
        </div>
      )}

      {/* OIG-582 Alert */}
      {overdue.length > 0 && (
        <div style={{ background:D.goldBg, border:`1px solid ${D.gold}`, borderRadius:10,
                       padding:"12px 18px", display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <div style={{ fontSize:12, color:D.gold, fontWeight:600 }}>
            {overdue.length} overdue action(s) — including OIG-582 COR surveillance log.
            Immediate action required to stay within corrective action timeline.
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <KPI label="FY27 OSO Allotment" value={fmt$(totalAllotment)} sub="Agency Dir & Admin Support slice" color={D.navy} />
        <KPI label="YTD Obligations" value={fmt$(totalYTD)} sub={`${burnPct.toFixed(1)}% burn — Month 1`} color={burnPct > 90 ? D.red : D.green} />
        <KPI label="Pending Actions" value={pending.length} sub="Require approval or review" color={pending.length > 3 ? D.orange : D.blue} />
        <KPI label="ADA Risk Items" value={highRisk.length} sub="Flagged for immediate review" color={highRisk.length > 0 ? D.red : D.green} />
        <KPI label="Open OIG Findings" value={oigOpen.length} sub="OIG-582 (HIGH), OIG-584 (MED)" color={D.gold} />
        <KPI label="GPC Pending Recon" value={gpc.filter(g=>g.status==="PENDING").length} sub="Reconcile within 5 business days" color={D.purple} />
      </div>

      {/* Allotment Burn Rates + Recent Actions side by side */}
      <div style={{ display:"grid", gridTemplateColumns:"1.1fr 1fr", gap:16 }}>
        <Card>
          <SectionHead title="Allotment Burn Rate by OSO Office"
            sub="FY2027 · Month 1 of 12 · Expected: 8.3%" />
          {allotments.map((a,i) => {
            const pct = a.ytd / a.fy27 * 100;
            return (
              <div key={i} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:D.text, fontWeight:500 }}>{a.label}</span>
                  <span style={{ fontSize:11, color:D.muted, fontFamily:"monospace" }}>
                    {fmt$(a.ytd)} / {fmt$(a.fy27)}
                  </span>
                </div>
                <BurnBar pct={pct} />
              </div>
            );
          })}
        </Card>

        <Card>
          <SectionHead title="Recent & Pending Actions"
            sub="Last 5 · Sorted by priority" />
          {[...actions].sort((a,b) => {
            const p = {HIGH:0,MEDIUM:1,LOW:2};
            return p[a.adaRisk]-p[b.adaRisk];
          }).slice(0,6).map((a,i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start",
                                   marginBottom:10, paddingBottom:10,
                                   borderBottom: i<5 ? `1px solid #f0f2f5` : "none" }}>
              <div style={{ width:3, height:42, borderRadius:2, flexShrink:0,
                             background: urgColor[a.adaRisk] || D.muted, marginTop:2 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:D.text,
                               overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.desc}</div>
                <div style={{ fontSize:10, color:D.muted, marginTop:2 }}>
                  {a.ref} · {a.office} · {fmt$(a.amount)}
                </div>
              </div>
              <Badge label={a.status} color={
                a.status==="APPROVED"?"green":a.status==="OVERDUE"?"red":
                a.status==="CLOSED"?"gray":"gold"} small />
            </div>
          ))}
        </Card>
      </div>

      {/* OIG Summary + GPC Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <SectionHead title="OIG Corrective Action Tracker" sub="Open findings affecting OSO financial management" />
          {oig.map((o,i) => (
            <div key={i} style={{ marginBottom:14, background:"#f8f9fb", borderRadius:8,
                                   padding:"12px 14px", border:`1px solid ${D.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ fontSize:12, fontWeight:700, color:D.text }}>{o.id}: {o.title}</div>
                <Badge label={o.status} color={o.status==="OPEN"?"red":o.status==="IN PROGRESS"?"gold":"green"} small />
              </div>
              <div style={{ fontSize:11, color:D.muted, marginBottom:6 }}>
                Due: {o.due} · Recs: {o.recs} open / {o.closed} closed
              </div>
              <div style={{ width:"100%", background:"#e8edf5", borderRadius:3, height:5 }}>
                <div style={{ width:`${o.closed/o.recs*100}%`, height:"100%",
                               background: o.status==="OPEN" ? D.red : D.gold, borderRadius:3 }} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionHead title="GPC Card Status" sub="GSA SmartPay · Reconcile within 5 business days" />
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <Th>Cardholder</Th>
                <Th right>YTD Spend</Th>
                <Th right>Limit</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {gpc.map((g,i) => (
                <tr key={i}>
                  <Td>{g.cardholder}</Td>
                  <Td right mono>{fmt$(g.ytdSpend)}</Td>
                  <Td right mono>{fmt$(g.limit)}</Td>
                  <Td><Badge label={g.status} color={g.status==="CURRENT"?"green":g.status==="PENDING"?"gold":"red"} small /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function PageActions({ actions, setActions }) {
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const types = ["ALL","OBLIGATION","GPC PURCHASE","COR ACTION","BUDGET FORMULATION"];
  const visible = filter === "ALL" ? actions : actions.filter(a => a.type === filter);

  const save = (form) => {
    if (form.id) setActions(prev => prev.map(a => a.id===form.id ? form : a));
    else setActions(prev => [...prev, { ...form, id: Date.now() }]);
    setModal(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {modal && <ActionModal initial={modal==="new" ? null : modal} onSave={save} onClose={()=>setModal(null)} />}
      <SectionHead title="Action & Obligation Tracker"
        sub="All OSO financial actions — obligations, GPC, COR reviews, formulation tasks"
        action={
          <button onClick={()=>setModal("new")}
            style={{ background:D.navy, color:"#fff", border:"none", borderRadius:7,
                     padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            + New Action
          </button>
        }
      />
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {types.map(t => (
          <button key={t} onClick={()=>setFilter(t)}
            style={{ background:filter===t?D.navy:"#f0f2f5", color:filter===t?"#fff":D.muted,
                     border:"none", borderRadius:20, padding:"5px 14px", fontSize:11,
                     fontWeight:700, cursor:"pointer" }}>{t}</button>
        ))}
      </div>
      <Card style={{ padding:0 }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <Th>Ref #</Th><Th>Type</Th><Th>Description</Th><Th>Office</Th>
                <Th right>Amount</Th><Th>OC</Th><Th>ADA</Th><Th>Due</Th>
                <Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a,i) => (
                <tr key={a.id} style={{ background: a.adaRisk==="HIGH" ? "#fff5f5" : i%2===0?"#fff":"#fafbfc" }}>
                  <Td mono>{a.ref}</Td>
                  <Td><Badge label={a.type} color={
                    a.type==="OBLIGATION"?"navy":a.type==="GPC PURCHASE"?"purple":
                    a.type==="COR ACTION"?"orange":"gray"} small /></Td>
                  <Td>
                    <div style={{ maxWidth:220 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:D.text }}>{a.desc}</div>
                      {a.note && <div style={{ fontSize:10, color:D.orange, marginTop:2 }}>⚠ {a.note.slice(0,60)}</div>}
                    </div>
                  </Td>
                  <Td>{a.office}</Td>
                  <Td right mono bold>{a.amount > 0 ? fmt$(a.amount) : "—"}</Td>
                  <Td mono>{a.oc}</Td>
                  <Td><Badge label={a.adaRisk} color={a.adaRisk==="HIGH"?"red":a.adaRisk==="MEDIUM"?"gold":"green"} small /></Td>
                  <Td><span style={{ fontSize:11, color: new Date(a.due)<new Date() && a.status!=="APPROVED" && a.status!=="CLOSED" ? D.red : D.muted }}>{a.due}</span></Td>
                  <Td><Badge label={a.status} color={
                    a.status==="APPROVED"?"green":a.status==="OVERDUE"?"red":
                    a.status==="CLOSED"?"gray":a.status==="IN PROGRESS"?"navy":"gold"} small /></Td>
                  <Td>
                    <button onClick={()=>setModal(a)}
                      style={{ background:"none", border:"none", color:D.blue, fontSize:11,
                               cursor:"pointer", fontWeight:600 }}>Edit</button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PageBudget({ allotments, setAllotments }) {
  const total = allotments.reduce((s,a)=>s+a.fy27,0);
  const ytd   = allotments.reduce((s,a)=>s+a.ytd,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <SectionHead title="OSO Budget Execution"
        sub={`FY2027 Allotments by Office · Total: ${fmt$(total)} · YTD: ${fmt$(ytd)} (${(ytd/total*100).toFixed(1)}%)`} />
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <KPI label="Total OSO Allotment" value={fmt$(total)} sub="FY2027" color={D.navy} />
        <KPI label="YTD Obligated" value={fmt$(ytd)} sub={`${(ytd/total*100).toFixed(1)}% burn`} color={D.green} />
        <KPI label="Remaining Authority" value={fmt$(total-ytd)} sub="Available for obligation" color={D.blue} />
        <KPI label="Projected EOY" value={fmt$(ytd*12)} sub="At current burn rate" color={ytd*12>total?D.red:D.green} />
      </div>

      <Card>
        <SectionHead title="Allotment Detail by Office" sub="Monthly tracking table · Update YTD obligations after each UFMS reconciliation" />
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <Th>OSO Office</Th><Th>Code</Th><Th right>FY27 Allotment</Th>
              <Th right>YTD Obligated</Th><Th right>Remaining</Th>
              <Th>Burn Rate</Th><Th>ADA Status</Th>
            </tr>
          </thead>
          <tbody>
            {allotments.map((a,i) => {
              const pct = a.ytd/a.fy27*100;
              const remaining = a.fy27 - a.ytd;
              return (
                <tr key={i} style={{ background: pct>95?"#fff5f5":i%2===0?"#fff":"#fafbfc" }}>
                  <Td bold>{a.label}</Td>
                  <Td mono>{a.office}</Td>
                  <Td right mono>{fmtFull(a.fy27)}</Td>
                  <Td right mono color={pct>90?D.red:D.text}>{fmtFull(a.ytd)}</Td>
                  <Td right mono>{fmtFull(remaining)}</Td>
                  <Td><BurnBar pct={pct} /></Td>
                  <Td><Badge label={pct>95?"ADA RISK":pct>90?"MONITOR":"ON TRACK"}
                    color={pct>95?"red":pct>90?"gold":"green"} small /></Td>
                </tr>
              );
            })}
            <tr style={{ background:"#eff1f5", fontWeight:700 }}>
              <Td bold>TOTAL</Td><Td>—</Td>
              <Td right mono bold>{fmtFull(total)}</Td>
              <Td right mono bold>{fmtFull(ytd)}</Td>
              <Td right mono bold>{fmtFull(total-ytd)}</Td>
              <Td><BurnBar pct={ytd/total*100} /></Td>
              <Td><Badge label="ON TRACK" color="green" small /></Td>
            </tr>
          </tbody>
        </table>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <SectionHead title="Object Class Distribution" sub="FY2027 OSO budget composition (estimated)" />
          {[
            {oc:"11.0 + 12.0", label:"Personnel Comp & Benefits", pct:62, color:D.navy},
            {oc:"25.0",         label:"Other Contractual Services", pct:22, color:D.blue},
            {oc:"23.0",         label:"Rent, Comm & Utilities",     pct:8,  color:D.gold},
            {oc:"31.0",         label:"Equipment",                  pct:4,  color:D.orange},
            {oc:"Other",        label:"Travel, Supplies, etc.",     pct:4,  color:D.muted},
          ].map((r,i) => (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:D.text }}><span style={{ color:D.muted, fontFamily:"monospace", marginRight:8 }}>{r.oc}</span>{r.label}</span>
                <span style={{ fontSize:11, color:r.color, fontWeight:700 }}>{r.pct}%</span>
              </div>
              <div style={{ background:"#e8edf5", borderRadius:3, height:6 }}>
                <div style={{ width:`${r.pct}%`, height:"100%", background:r.color, borderRadius:3 }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize:10, color:D.muted, marginTop:8, fontStyle:"italic" }}>
            * Estimates based on SEC FY2027 CBJ p.7 agency-wide ratios · Reasonable assumption
          </div>
        </Card>

        <Card>
          <SectionHead title="Year-End Checklist" sub="ADA compliance & bona fide need discipline" />
          {[
            ["Sept 1", "Discretionary obligation freeze (non-mission-critical)", "pending"],
            ["Sept 15", "Final obligation entries — all offices confirm needs", "pending"],
            ["Sept 25", "Unliquidated obligation review — deobligate where possible", "pending"],
            ["Sept 28", "Final UFMS reconciliation before year-end close", "pending"],
            ["Sept 30", "Certify year-end obligations to OFM", "pending"],
            ["Oct 31", "Final UFMS year-end close", "pending"],
          ].map(([date,task,status],i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:10, color:D.muted, fontFamily:"monospace", minWidth:55 }}>{date}</span>
              <div style={{ width:14, height:14, borderRadius:3, border:`2px solid ${D.border}`,
                             flexShrink:0, background: status==="done"?D.green:"transparent" }} />
              <span style={{ fontSize:12, color:D.text }}>{task}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function PageCOR({ cor, setCor }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHead title="COR Surveillance Tracker"
        sub="OIG Report 582 Corrective Action — Monthly T&M Ceiling Utilization & Surveillance Log Compliance" />
      <div style={{ background:D.redBg, border:`1px solid ${D.red}`, borderRadius:8, padding:"11px 16px",
                     fontSize:12, color:D.red, fontWeight:600 }}>
        🔴 OIG-582 ACTIVE — Quarterly ceiling utilization reports and monthly COR surveillance logs are required for all T&M contracts. Failure to maintain these records may result in OIG finding escalation.
      </div>
      <Card style={{ padding:0 }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <Th>COR Officer</Th><Th>Contract</Th><Th>Vendor</Th>
                <Th right>Contract Ceiling</Th><Th right>YTD Obligated</Th><Th>Utilization</Th>
                <Th>Last Log</Th><Th>Next Due</Th><Th>OIG-582</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {cor.map((c,i) => (
                <tr key={i} style={{ background: c.status==="OVERDUE"?"#fff5f5": i%2===0?"#fff":"#fafbfc" }}>
                  <Td bold>{c.officer}</Td>
                  <Td><div style={{ maxWidth:180, fontSize:11 }}>{c.contract}</div></Td>
                  <Td><div style={{ maxWidth:130, fontSize:11 }}>{c.vendor}</div></Td>
                  <Td right mono>{fmt$(c.ceiling)}</Td>
                  <Td right mono>{fmt$(c.ytdOblig)}</Td>
                  <Td><BurnBar pct={c.utilPct} /></Td>
                  <Td><span style={{ fontSize:11, fontFamily:"monospace" }}>{c.lastLog}</span></Td>
                  <Td><span style={{ fontSize:11, fontFamily:"monospace" }}>{c.nextDue}</span></Td>
                  <Td>{c.oig582 && <Badge label="OIG-582" color="red" small />}</Td>
                  <Td><Badge label={c.status} color={c.status==="OVERDUE"?"red":"green"} small /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionHead title="OIG-582 Required Documentation Checklist" sub="Per recommendation — maintain for each T&M contract" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
          {[
            { contract:"Patriot Security Guard Services", items:[
              ["Monthly COR Surveillance Log", "OVERDUE — Submit immediately"],
              ["Q1 Ceiling Utilization Report", "NOT STARTED — Due Oct 31"],
              ["Contract Type Justification (T&M)", "ON FILE — FY2026"],
              ["COR Appointment Letter", "CURRENT"],
            ]},
            { contract:"CleanFed Corp Janitorial", items:[
              ["Monthly COR Surveillance Log", "CURRENT — Oct 10"],
              ["Q1 Ceiling Utilization Report", "NOT STARTED — Due Oct 31"],
              ["Contract Type Justification (T&M)", "IN PROGRESS"],
              ["COR Appointment Letter", "CURRENT"],
            ]},
          ].map((b,bi) => (
            <div key={bi}>
              <div style={{ fontSize:12, fontWeight:700, color:D.navy, marginBottom:10 }}>{b.contract}</div>
              {b.items.map(([doc,status],si) => {
                const isOverdue = status.includes("OVERDUE");
                const isMissing = status.includes("NOT STARTED");
                return (
                  <div key={si} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                                          padding:"7px 0", borderBottom:`1px solid #f0f2f5` }}>
                    <span style={{ fontSize:12, color:D.text }}>{doc}</span>
                    <span style={{ fontSize:11, fontWeight:600,
                                    color: isOverdue?D.red:isMissing?D.gold:D.green }}>
                      {isOverdue?"🔴":isMissing?"🟡":"✅"} {status}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PageGPC({ gpc, setGpc }) {
  const total = gpc.reduce((s,g)=>s+g.ytdSpend,0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHead title="Government Purchase Card (GPC) Program"
        sub="GSA SmartPay · FAR 13.301 · OMB A-123 Appendix B · 5-day reconciliation requirement" />
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <KPI label="Active Cards" value={gpc.length} sub="OSO program" color={D.navy} />
        <KPI label="YTD Total Spend" value={fmt$(total)} sub="All cardholders combined" color={D.blue} />
        <KPI label="Pending Reconciliation" value={gpc.filter(g=>g.status==="PENDING").length} sub="Must reconcile within 5 biz days" color={D.gold} />
        <KPI label="Policy Status" value="COMPLIANT" sub="No split purchase violations" color={D.green} />
      </div>
      <Card>
        <SectionHead title="Purchase Card Account Status" sub="Updated after each billing cycle close" />
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <Th>Card ID</Th><Th>Cardholder</Th><Th right>Limit</Th>
              <Th right>YTD Spend</Th><Th right>Pending $</Th><Th>% of Limit</Th>
              <Th>Last Recon</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {gpc.map((g,i) => (
              <tr key={i} style={{ background:g.status==="PENDING"?"#fef9e7":i%2===0?"#fff":"#fafbfc" }}>
                <Td mono>{g.id}</Td>
                <Td>{g.cardholder}</Td>
                <Td right mono>{fmt$(g.limit)}</Td>
                <Td right mono>{fmt$(g.ytdSpend)}</Td>
                <Td right mono color={g.pending>0?D.gold:D.muted}>{g.pending > 0 ? fmt$(g.pending) : "—"}</Td>
                <Td><BurnBar pct={g.ytdSpend/g.limit*100} /></Td>
                <Td><span style={{ fontSize:11, fontFamily:"monospace" }}>{g.lastRecon}</span></Td>
                <Td><Badge label={g.status} color={g.status==="CURRENT"?"green":g.status==="PENDING"?"gold":"red"} small /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <SectionHead title="GPC Policy Reference" sub="Key compliance requirements for OSO cardholders" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
          {[
            { icon:"💳", title:"Single Purchase Limit", body:"$10,000 for most cardholders. Above this requires contracting action through Office of Acquisitions." },
            { icon:"📅", title:"Reconciliation Window", body:"Within 5 business days of billing cycle close. Failure to reconcile = compliance finding under OMB A-123." },
            { icon:"🚫", title:"Split Purchase Prohibition", body:"Splitting purchases to stay under limits is prohibited (FAR 13.301(b)). Document each transaction independently." },
            { icon:"📋", title:"Required Documentation", body:"Receipt + description of business purpose + accounting classification code + supervisor approval for purchases over $2,500." },
            { icon:"🔍", title:"Monthly Review", body:"FM Specialist reviews all cardholder accounts monthly. Delinquent accounts reported to Brian Williams and OFM." },
            { icon:"⚠️", title:"Misuse Reporting", body:"Any suspected misuse reported immediately to OIG and OS supervisor. Zero tolerance per GSA SmartPay terms." },
          ].map((r,i) => (
            <div key={i} style={{ background:"#f8f9fb", borderRadius:8, padding:"14px 14px" }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{r.icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:D.navy, marginBottom:5 }}>{r.title}</div>
              <div style={{ fontSize:11, color:D.muted, lineHeight:1.55 }}>{r.body}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PageTime({ timekeeping, setTimekeeping }) {
  const totalHrs = timekeeping.reduce((s,t)=>s+t.hrs,0);
  const catColors = { "BUDGET EXECUTION":D.navy,"FORMULATION":D.blue,"INTERNAL CONTROLS":D.red,
                       "COMPLIANCE":D.gold,"REPORTING":D.purple,"ADVISORY":D.green,"COOP":D.orange,"ADMIN":D.muted };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHead title="Timekeeping & Workload Tracker"
        sub="Weekly activity log for BMCB Financial Management Specialist" />
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <KPI label="Total Hours This Week" value={`${totalHrs}h`} sub="Oct 7-11, 2026" color={D.navy} />
        <KPI label="Mission-Critical (ADA/OIG)" value={`${timekeeping.filter(t=>t.cat==="BUDGET EXECUTION"||t.cat==="INTERNAL CONTROLS").reduce((s,t)=>s+t.hrs,0)}h`} sub="Highest-risk priorities" color={D.red} />
        <KPI label="Formulation" value={`${timekeeping.filter(t=>t.cat==="FORMULATION").reduce((s,t)=>s+t.hrs,0)}h`} sub="FY2028 budget call" color={D.blue} />
        <KPI label="Reporting" value={`${timekeeping.filter(t=>t.cat==="REPORTING"||t.cat==="COMPLIANCE").reduce((s,t)=>s+t.hrs,0)}h`} sub="Status briefs + GPC" color={D.purple} />
      </div>
      <Card>
        <SectionHead title="Weekly Activity Log — Oct 7-11, 2026" />
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr><Th>Activity</Th><Th>Category</Th><Th right>Hours</Th><Th>% of Week</Th></tr>
          </thead>
          <tbody>
            {timekeeping.map((t,i) => (
              <tr key={i} style={{ background:i%2===0?"#fff":"#fafbfc" }}>
                <Td>{t.name}</Td>
                <Td><Badge label={t.cat} color={
                  t.cat==="BUDGET EXECUTION"?"navy":t.cat==="FORMULATION"?"navy":
                  t.cat==="INTERNAL CONTROLS"?"red":t.cat==="COMPLIANCE"?"gold":
                  t.cat==="REPORTING"?"purple":t.cat==="ADVISORY"?"green":
                  t.cat==="COOP"?"orange":"gray"} small /></Td>
                <Td right mono bold>{t.hrs}</Td>
                <Td>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:80, background:"#e8edf5", borderRadius:3, height:5 }}>
                      <div style={{ width:`${t.hrs/totalHrs*100}%`, height:"100%",
                                     background:catColors[t.cat]||D.muted, borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:11, color:D.muted }}>{(t.hrs/totalHrs*100).toFixed(0)}%</span>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <SectionHead title="Triage Priority Framework" sub="How to prioritize when everything arrives at once" />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            { priority:"P1 — IMMEDIATE", color:D.red, items:["ADA risk identified","OIG finding overdue","Potential obligation violation","Year-end obligation deadline"], hrs:"Same day" },
            { priority:"P2 — THIS WEEK", color:D.gold, items:["Brian Williams ad-hoc request","Pending obligation approvals","GPC reconciliation due","COR log submission needed"], hrs:"1-3 business days" },
            { priority:"P3 — THIS MONTH", color:D.blue, items:["Monthly financial status brief","Formulation data collection","OIG corrective action work","Allotment tracking update"], hrs:"Monthly cycle" },
            { priority:"P4 — THIS QUARTER", color:D.green, items:["FY2028 budget call coordination","Internal control review","Process improvement projects","Training and documentation"], hrs:"Quarterly cycle" },
          ].map((p,i) => (
            <div key={i} style={{ background:"#f8f9fb", borderRadius:8, padding:"14px",
                                   borderTop:`3px solid ${p.color}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:p.color, marginBottom:8 }}>{p.priority}</div>
              <div style={{ fontSize:10, color:D.muted, marginBottom:6 }}>Target: {p.hrs}</div>
              {p.items.map((item,j) => (
                <div key={j} style={{ fontSize:11, color:D.text, marginBottom:4,
                                       display:"flex", gap:6, alignItems:"flex-start" }}>
                  <span style={{ color:p.color, marginTop:1 }}>▸</span>{item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PageFormulation({ actions }) {
  const formItems = actions.filter(a => a.type === "BUDGET FORMULATION");
  const fy28Timeline = [
    { phase:"Spring 2026", task:"OMB A-11 + DOGE guidance", status:"COMPLETE", detail:"10% efficiency targets embedded" },
    { phase:"Oct 2026", task:"OSO internal budget call — OPEN", status:"ACTIVE", detail:"FM Specialist coordinates across OFS, OSBO, OAMR" },
    { phase:"Oct 31, 2026", task:"Office submissions due to BMCB", status:"ACTIVE", detail:"OFS on track · OSBO NOT STARTED" },
    { phase:"Nov 2026", task:"BMCB consolidates and reviews", status:"PENDING", detail:"FM Specialist compiles, validates, reconciles" },
    { phase:"Dec 2026", task:"OSO submission to OFM", status:"PENDING", detail:"William Buckley signs; OFM review begins" },
    { phase:"Feb 2027", task:"President's Budget to Congress", status:"PENDING", detail:"SEC FY2028 CBJ submitted" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHead title="FY2028 Budget Formulation Workspace"
        sub="OSO internal budget call coordination · OMB A-11 cycle · FM Specialist manages" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <SectionHead title="FY2028 Budget Call Status" sub="By OSO office — submissions due Oct 31, 2026" />
          {[
            { office:"OFS — FOIA Services", status:"IN PROGRESS", owner:"Ray McInerney", pct:40, note:"Personnel needs submitted; contract data pending" },
            { office:"OSBO — Security & Building Ops", status:"NOT STARTED", owner:"Katherine Taylor", pct:0, note:"⚠️ Not started — follow up required this week" },
            { office:"OAMR — Records Management", status:"IN PROGRESS", owner:"William Buckley", pct:60, note:"Records system license renewal documented" },
            { office:"BMCB — Business Mgmt & Continuity", status:"IN PROGRESS", owner:"Brian Williams", pct:70, note:"COOP exercise costs estimated; GPC admin costs pending" },
          ].map((r,i) => (
            <div key={i} style={{ marginBottom:14, background:"#f8f9fb", borderRadius:8,
                                   padding:"12px 14px", border:`1px solid ${D.border}`,
                                   borderLeft:`3px solid ${r.status==="NOT STARTED"?D.red:r.status==="IN PROGRESS"?D.gold:D.green}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:700, color:D.text }}>{r.office}</div>
                <Badge label={r.status} color={r.status==="NOT STARTED"?"red":r.status==="IN PROGRESS"?"gold":"green"} small />
              </div>
              <div style={{ fontSize:11, color:D.muted, marginBottom:6 }}>Owner: {r.owner}</div>
              <div style={{ background:"#e8edf5", borderRadius:3, height:5, marginBottom:5 }}>
                <div style={{ width:`${r.pct}%`, height:"100%",
                               background:r.status==="NOT STARTED"?D.red:D.gold, borderRadius:3 }} />
              </div>
              <div style={{ fontSize:10, color:r.note.includes("⚠️")?D.red:D.muted }}>{r.note}</div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionHead title="A-11 Timeline — FY2028 Milestones" />
          {fy28Timeline.map((s,i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start",
                                   marginBottom: i<fy28Timeline.length-1?0:0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
                               background:s.status==="COMPLETE"?D.green:s.status==="ACTIVE"?D.blue:D.border,
                               display:"flex", alignItems:"center", justifyContent:"center",
                               fontSize:11, color:"#fff", fontWeight:700 }}>
                  {s.status==="COMPLETE"?"✓":s.status==="ACTIVE"?"●":i+1}
                </div>
                {i<fy28Timeline.length-1 && <div style={{ width:2, height:26, background:D.border, margin:"2px 0" }} />}
              </div>
              <div style={{ paddingBottom:16 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:10, color:D.muted, fontFamily:"monospace",
                                  background:"#f0f2f5", padding:"1px 7px", borderRadius:3 }}>{s.phase}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:s.status==="ACTIVE"?D.blue:D.text }}>{s.task}</span>
                </div>
                <div style={{ fontSize:11, color:D.muted, marginTop:2 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SectionHead title="Budget Call Template — OSO Office Submission" sub="FM Specialist sends this to each office head at budget call open" />
        <div style={{ background:"#f8f9fb", border:`1px dashed ${D.border}`, borderRadius:8, padding:"18px 20px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:D.navy, marginBottom:10, letterSpacing:"0.05em" }}>
            TEMPLATE: OSO FY2028 BUDGET CALL SUBMISSION FORM
          </div>
          {[
            ["Office Name / Code", ""],
            ["Submitting Official", ""],
            ["Personnel Requirements", "FTE count · GS levels · any changes from FY2027"],
            ["Non-Personnel Requirements", "Contracts (vendor, amount, OC, T&M or fixed-price?) · Equipment · Other"],
            ["Special/New Requirements", "Any new programs, COOP needs, or one-time costs"],
            ["FY2027 vs FY2028 Delta", "$ and % change · rationale for any increase >5%"],
            ["DOGE Efficiency Savings", "What efficiency actions reduce costs? Target: 10% per OMB guidance"],
            ["Submission Date", ""],
          ].map(([label, note], i) => (
            <div key={i} style={{ display:"flex", gap:16, alignItems:"flex-start",
                                   padding:"8px 0", borderBottom:`1px solid #eef0f4` }}>
              <span style={{ fontSize:12, fontWeight:600, color:D.text, minWidth:200 }}>{label}:</span>
              <span style={{ fontSize:11, color:D.muted, fontStyle:"italic" }}>{note || "— enter data —"}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PageOIG({ oig, setOig }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHead title="OIG Finding Tracker & Corrective Action Management"
        sub="FMFIA / OMB A-123 · Open recommendations require documented closure packages" />
      {oig.map((finding,fi) => (
        <Card key={fi} style={{ borderLeft:`4px solid ${finding.priority==="HIGH"?D.red:D.gold}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:D.text }}>{finding.id}: {finding.title}</div>
              <div style={{ fontSize:11, color:D.muted, marginTop:2 }}>
                Due: {finding.due} · {finding.recs} recommendations · {finding.closed} closed
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Badge label={finding.priority + " PRIORITY"} color={finding.priority==="HIGH"?"red":"gold"} />
              <Badge label={finding.status} color={finding.status==="OPEN"?"red":finding.status==="IN PROGRESS"?"gold":"green"} />
            </div>
          </div>
          <div style={{ marginBottom:10, background:"#e8edf5", borderRadius:4, height:8 }}>
            <div style={{ width:`${finding.closed/finding.recs*100}%`, height:"100%",
                           background:finding.status==="OPEN"?D.red:D.gold, borderRadius:4 }} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {finding.actions.map((a,ai) => (
              <div key={ai} style={{ display:"flex", gap:12, alignItems:"center",
                                      background:"#f8f9fb", borderRadius:7, padding:"10px 14px" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0,
                               background:a.status==="CLOSED"?D.green:a.status==="IN PROGRESS"?D.gold:D.muted }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:D.text }}>{a.text}</div>
                  <div style={{ fontSize:11, color:D.muted }}>Owner: {a.owner}</div>
                </div>
                <Badge label={a.status} color={a.status==="CLOSED"?"green":a.status==="IN PROGRESS"?"gold":"gray"} small />
              </div>
            ))}
          </div>
        </Card>
      ))}
      <Card>
        <SectionHead title="OIG Corrective Action Closure Requirements" sub="What OIG auditors need to close a recommendation" />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {[
            { icon:"📋", title:"Written Corrective Action Plan", body:"Submitted within 45 days of report. Includes responsible official, timeframes, and milestones. Must be agreed-upon by OIG." },
            { icon:"📊", title:"Implementation Evidence", body:"Actual evidence the control is operating: completed logs, dashboard screenshots, signed SOPs, training records. Not just the policy rewrite." },
            { icon:"🔄", title:"Sustainability Demonstration", body:"OIG wants to see the control will continue without manual intervention. Automated reports, embedded workflows, and SOPs are preferred over manual checklists." },
            { icon:"📝", title:"Closure Package Format", body:"Organized by recommendation number. Each rec gets: (1) agreed action, (2) what was done, (3) evidence attached, (4) date completed." },
            { icon:"✅", title:"OIG Verification", body:"OIG may conduct follow-up testing to verify the control is operating as described. Be ready for unannounced documentation requests." },
            { icon:"⚠️", title:"Material Weakness Risk", body:"If same finding recurs in next audit cycle, OIG may escalate to FMFIA material weakness — requiring reporting to agency head, OMB, and Congress." },
          ].map((r,i) => (
            <div key={i} style={{ background:"#f8f9fb", borderRadius:8, padding:"14px" }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{r.icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:D.navy, marginBottom:5 }}>{r.title}</div>
              <div style={{ fontSize:11, color:D.muted, lineHeight:1.55 }}>{r.body}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────
export default function OSOFinancialPortal() {
  const [page, setPage]           = useState("dashboard");
  const [actions, setActions]     = useState(INIT_ACTIONS);
  const [allotments]              = useState(INIT_ALLOTMENTS);
  const [oig, setOig]             = useState(INIT_OIG);
  const [gpc, setGpc]             = useState(INIT_GPC);
  const [cor, setCor]             = useState(INIT_COR);
  const [timekeeping, setTime]    = useState(INIT_TIMEKEEPING);
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false);

  const nav = [
    { id:"dashboard",   icon:"⊞",  label:"Dashboard",         group:"OVERVIEW" },
    { id:"actions",     icon:"⚡",  label:"Actions & Obligations", group:"OPERATIONS" },
    { id:"budget",      icon:"📊",  label:"Budget Execution",  group:"OPERATIONS" },
    { id:"cor",         icon:"🔍",  label:"COR Surveillance",  group:"OPERATIONS" },
    { id:"gpc",         icon:"💳",  label:"GPC Cards",         group:"OPERATIONS" },
    { id:"timekeeping", icon:"⏱",  label:"Timekeeping",       group:"OPERATIONS" },
    { id:"formulation", icon:"🔭",  label:"FY2028 Formulation",group:"PLANNING" },
    { id:"oig",         icon:"⚖️",  label:"OIG Tracker",       group:"COMPLIANCE" },
    { id:"briefs",      icon:"📄",  label:"Briefs & Reports",  group:"TOOLS" },
  ];
  const groups = [...new Set(nav.map(n=>n.group))];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:D.bg,
                   fontFamily:"'IBM Plex Sans','Segoe UI',system-ui,sans-serif",
                   color:D.text, fontSize:13 }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />

      {/* Disclaimer Modal */}
      {!disclaimerDismissed && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,30,80,0.85)",
                       display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
          <div style={{ background:"#fff", borderRadius:12, maxWidth:560, padding:"28px 32px",
                         boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize:18, fontWeight:800, color:D.red, marginBottom:12 }}>⚠️ Important Disclaimer</div>
            <div style={{ fontSize:13, color:D.textSub, lineHeight:1.75, marginBottom:20 }}>{DISCLAIMER}</div>
            <button onClick={()=>setDisclaimerDismissed(true)}
              style={{ width:"100%", background:D.navy, color:"#fff", border:"none", borderRadius:8,
                       padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
              I Understand — Enter Application
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{ width:220, flexShrink:0, background:D.sidebar, display:"flex",
                        flexDirection:"column", overflow:"hidden" }}>
        {/* Logo */}
        <div style={{ padding:"20px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:2 }}>
            <div style={{ width:32, height:32, borderRadius:7, background:D.navy,
                           border:"1px solid rgba(255,255,255,0.2)",
                           display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🦅</div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#fff" }}>OSO · BMCB</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)" }}>Financial Management</div>
            </div>
          </div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:8,
                         fontStyle:"italic" }}>Demo · Public data only</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", padding:"10px 0" }}>
          {groups.map(grp => (
            <div key={grp}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontWeight:700,
                             letterSpacing:"0.12em", padding:"12px 18px 4px" }}>{grp}</div>
              {nav.filter(n=>n.group===grp).map(n => (
                <button key={n.id} onClick={()=>setPage(n.id)}
                  style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                             padding:"9px 18px", background:page===n.id?"rgba(255,255,255,0.1)":"none",
                             border:"none", borderRight:page===n.id?`3px solid #fff`:"3px solid transparent",
                             cursor:"pointer", transition:"all 0.15s", textAlign:"left" }}>
                  <span style={{ fontSize:14 }}>{n.icon}</span>
                  <span style={{ fontSize:12, fontWeight:page===n.id?600:400,
                                  color:page===n.id?"#fff":"rgba(255,255,255,0.6)" }}>{n.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom status */}
        <div style={{ padding:"12px 18px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>
            FY2027 Q1<br/>
            <span style={{ color:"rgba(16,185,129,0.8)" }}>● No ADA violations</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <header style={{ background:"#fff", borderBottom:`1px solid ${D.border}`,
                           padding:"0 28px", height:52, display:"flex",
                           alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:14, fontWeight:700, color:D.text }}>
              {nav.find(n=>n.id===page)?.label}
            </span>
            <span style={{ fontSize:11, color:D.muted }}>
              · SEC Office of Support Operations · BMCB Financial Management
            </span>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:10, background:D.goldBg, color:D.gold, padding:"3px 10px",
                            borderRadius:20, fontWeight:700 }}>⚠️ DEMO · PUBLIC DATA</span>
            <span style={{ fontSize:10, color:D.muted, fontFamily:"monospace" }}>
              {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
            </span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:"auto", padding:"24px 28px 40px" }}>
          {page==="dashboard"   && <PageDashboard actions={actions} allotments={allotments} oig={oig} gpc={gpc} cor={cor} />}
          {page==="actions"     && <PageActions actions={actions} setActions={setActions} />}
          {page==="budget"      && <PageBudget allotments={allotments} setAllotments={()=>{}} />}
          {page==="cor"         && <PageCOR cor={cor} setCor={setCor} />}
          {page==="gpc"         && <PageGPC gpc={gpc} setGpc={setGpc} />}
          {page==="timekeeping" && <PageTime timekeeping={timekeeping} setTimekeeping={setTime} />}
          {page==="formulation" && <PageFormulation actions={actions} />}
          {page==="oig"         && <PageOIG oig={oig} setOig={setOig} />}
          {page==="briefs"      && <BriefGenerator allotments={allotments} actions={actions} oig={oig} gpc={gpc} cor={cor} />}
        </main>

        {/* Footer */}
        <footer style={{ background:"#fff", borderTop:`1px solid ${D.border}`,
                           padding:"8px 28px", display:"flex", justifyContent:"space-between",
                           fontSize:9, color:D.dim, flexShrink:0 }}>
          <span>SEC OSO · Business Management & Continuity Branch · Financial Management · FY2027</span>
          <span style={{ color:"#e57373", fontWeight:600 }}>
            ⚠️ DEMO PROTOTYPE · PUBLIC DATA ONLY · NOT OFFICIAL SEC TOOL
          </span>
          <span>Sources: SEC.gov · OIG · CBJ FY2027 · USAJOBS #862266600 · Reasonable assumptions</span>
        </footer>
      </div>
    </div>
  );
}
