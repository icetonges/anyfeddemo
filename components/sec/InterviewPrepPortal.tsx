// @ts-nocheck
"use client"

import { useState, useEffect, useRef, createContext, useContext } from "react";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  bg:      "#060d1a",
  panel:   "#0b1628",
  card:    "#0f1e35",
  cardHi:  "#132540",
  border:  "rgba(255,255,255,0.06)",
  borderA: "rgba(59,130,246,0.5)",
  // brand
  gold:    "#f5a623",
  goldD:   "#c8841a",
  blue:    "#3b82f6",
  blueD:   "#1d4ed8",
  cyan:    "#22d3ee",
  green:   "#10b981",
  red:     "#ef4444",
  purple:  "#a78bfa",
  // text
  text:    "#f0f4f8",
  sub:     "#c8ddf2",
  muted:   "#96b4cc",
  dim:     "rgba(255,255,255,0.09)",
};


// ─── MOBILE CONTEXT ──────────────────────────────────────────────────────────
const MobileCtx = createContext(false);
const useMobile = () => useContext(MobileCtx);

// ─── DATA: FULL JOB ANNOUNCEMENT (verbatim from USAJOBS #862266600) ───────────
const JOB = {
  title: "Financial Management Specialist",
  grade: "SK-0501-14",
  org: "Office of Support Operations (OSO) — Business Management & Continuity Branch (BMCB)",
  location: "100 F Street NE, Washington, DC 20549",
  hiringManager: "Brian Williams, Chief, Business Management & Continuity Branch",
  chain: "Brian Williams → William Buckley (AD, OAMR) → Olivier Girod (OSO Director)",
  summary: "The Office of Support Operations (OSO) Business Management and Continuity Branch is looking for a dynamic professional to enhance its financial management program. The branch ensures the most efficient and effective business practices are followed throughout the organization and serves as a conduit for OSO offices to plan, manage, and execute mission requirements.",
  duties: [
    "Serves as a Financial Management Specialist, ensuring accurate budget planning, formulation, tracking (controls), and execution to meet organizational objectives.",
    "Determines financial management information needs, coordinates with organizational stakeholders, makes recommendations, and develops and monitors financial systems and programs to assist the assigned organization's managers in fulfilling their financial responsibilities.",
    "Analyzes, interprets, compiles, and summarizes the assigned organization's budget and program guidance.",
    "Monitors a variety of financial and statistical trends and prepares management financial reports for senior managers to inform them of negative or positive financial trends or conditions portrayed in financial records.",
    "Develops and prepares guidance, reports, briefings or analysis in response to requests for budget or financial information.",
    "Interacts and interfaces with programming and budgeting analysts, resource managers, agency professionals in support of budget justification and submission.",
  ],
  specializedExperience: [
    "Analyzing financial management operations, programs, and internal controls relating to budget formulation and execution",
    "Providing financial/budget guidance and assistance to stakeholders",
    "Compiling financial data from a variety of sources to solve financial issues",
    "Managing projects and identifying challenges related to financial management",
  ],
  competencies: [
    {
      name: "Financial Management",
      def: "Implements and/or advises on all financial aspects of the organization and the agency overall.",
      color: T.gold,
      icon: "💰",
    },
    {
      name: "Financial Data Analysis and Reporting",
      def: "Conducts studies and analysis of financial data; reports out on study findings.",
      color: T.blue,
      icon: "📊",
    },
    {
      name: "Internal Controls and Compliance",
      def: "Implements and/or advises on internal controls and compliance in accordance with advancements in the field and/or federal regulation and guidance; Conducts routine internal control reviews.",
      color: T.cyan,
      icon: "⚖️",
    },
    {
      name: "Workload Management",
      def: "Effectively prioritizes workload in a way that accommodates unforeseen developments and achieves successful outcomes.",
      color: T.purple,
      icon: "⏱️",
    },
  ],
  accomplishmentFormat: [
    "Competency Title",
    "Position title and dates from your resume",
    "Describe the situation (challenge faced / problem solved)",
    "Describe the specific actions you took",
    "State the outcome, results, or long-term impact",
    "Name and email of someone who can verify this information",
    "LIMIT: 300 words maximum — text beyond this will NOT be considered",
  ],
  ratings: [
    { label: "Highly Qualified", desc: "Meets minimum requirements + extensive skills and experience in most job-related competencies.", color: T.green },
    { label: "Well Qualified", desc: "Meets minimum requirements + moderate amount of skills and experience in most competencies.", color: T.gold },
    { label: "Qualified", desc: "Meets minimum requirements, but limited experience in several competencies.", color: T.sub },
  ],
  criticalWarnings: [
    "Failure to submit Accomplishment Record = automatic IFFM (ineligible). No exceptions.",
    "Resume strictly limited to 2 pages. Pages beyond page 2 will not be reviewed.",
    "Each competency narrative: strictly 300 words MAX. Beyond this = not considered.",
    "One specific, relevant example per competency. Cannot reuse the same story.",
    "Your resume AND accomplishment record must both support the same claims.",
    "Do not include photos/pictures in your resume.",
    "Each narrative must include a verifiable contact — they may actually call.",
  ],
};

// ─── DATA: INTERVIEW QUESTIONS WITH STAR COACHING ────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    category: "OPENING",
    competency: null,
    color: T.gold,
    q: "Tell me about yourself and why you're interested in this role.",
    intent: "Panel calibrates your self-awareness, communication quality, and whether you actually understand what this job IS. Common failure: candidates describe a CFO-level job. This is OSO's internal FM function for a support office.",
    keyPoints: [
      "Open with your FM identity, not your history — what you DO, not where you've been",
      "Pivot immediately to OSO specifically: FOIA, security, facilities, records management",
      "Name Brian Williams' priorities: financial discipline + verifying OIG-582 corrective actions are still running (the finding was closed early 2025 — sustainability is now the question)",
      "Close with 'enhance' — the exact word from the announcement — and what that means to you",
    ],
    starModel: null,
    modelAnswer: `"I'm a federal financial management professional with 15 years of experience across the full budget lifecycle — formulation, execution, internal controls, audit readiness, and year-end close. I started as a finance specialist in the U.S. Army, earned my CPA foundation through a B.S. in Accounting and an MBA, and have spent the last decade in increasingly senior civilian FM roles at DoD — most recently as a GS-15 Portfolio Manager at the OSD Comptroller's office, where I oversee analytics and reconciliation across a $338B execution portfolio.

What drew me specifically to this role is the word 'enhance' in the announcement. That word tells me the financial management program needs building, not just maintaining — and that is the work I do best. At the DoD OIG, I walked into an FM function that had been vacant for months and built it from the ground up: automated spend plan models, burn rate dashboards, internal control frameworks. That experience is directly transferable to what OSO/BMCB needs.

I understand this is not an agency-wide strategy position. It is OSO's internal financial hub — serving Ray McInerney's FOIA operation, Katherine Taylor's security and facilities team, and the records management branches with clean, reliable financial support. That is exactly the kind of mission-focused, hands-on FM work I find most valuable.

I also came in knowing about OIG Report 582. I spent three years at the DoD Office of Inspector General, which means I understand how OIG findings are structured, what closure evidence looks like, and what 'sustainable corrective action' means to an auditor. Closing Report 582 with a T&M ceiling utilization dashboard and COR surveillance protocol would be one of my first concrete deliverables — not a threat, a tractable problem I know how to solve."`,
    traps: [
      "Talking about CFO-level policy strategy — wrong scope",
      "Generic 'passion for public service' opener with no specifics",
      "Showing off knowledge of SEC's $2.1B budget when your job is a slice of $320M",
    ],
  },
  {
    id: 2,
    category: "COMPETENCY 1",
    competency: "Financial Management",
    color: T.gold,
    q: "Describe a specific example where you implemented or advised on all financial aspects of an organization.",
    intent: "Panel scores this against: 'Implements and/or advises on all financial aspects of the organization and the agency overall.' They want FULL lifecycle — formulation through year-end — not just one task. They want to see you as the FM hub, not a supporting player.",
    keyPoints: [
      "'All financial aspects' = formulation + execution + controls + reporting + stakeholder advisory",
      "The organization should be similar in type to OSO: a support/admin office with multiple internal clients",
      "Quantify: dollar value of portfolio, number of offices/stakeholders served, ADA-clean track record",
      "Name the financial systems you used — 'I used [system] to do X' is more credible than abstract claims",
      "Connect to OSO: 'At OSO's scale, the same approach applies — here's what I'd build for Brian Williams'",
    ],
    starModel: {
      situation: "Describe the organization — size, structure, how complex the financial environment was. What was missing or broken before you?",
      task: "What was your exact scope of responsibility? Were you the sole FM? Supervising? Advisory role?",
      action: "Walk through the lifecycle: How did you run formulation? What tracking systems did you build? How did you serve office heads who weren't budget people? How did you handle year-end?",
      result: "Quantify: ADA violations (zero), carryover projection accuracy, stakeholder satisfaction, process improvements built. Name the OIG finding you helped close if applicable.",
    },
    modelAnswer: `"As the Budget Analyst for the 8th Army G8, U.S. Army Korea, I managed the full FM lifecycle for a $45M annual portfolio supporting eight program offices and 500+ personnel — from the annual budget call through September 30 year-end execution.

When I arrived, each program office tracked its own obligations independently in spreadsheets with no central visibility. My first action was to build a unified tracking system in GFEBS — pulling execution data weekly by cost center and fund type, creating burn rate alerts at the 80% and 92% allotment thresholds, and producing a monthly Status of Fund report for my supervisor, Ms. Sun Madaio, by the 8th of every month.

For formulation, I ran the internal budget call — distributed templates to each office, collected submissions, reconciled them against prior-year GFEBS actuals, and delivered the consolidated package two weeks ahead of the Army's internal deadline. I documented cost drivers in enough detail that our priority requirements survived the command review without modification.

For stakeholder advisory, I made myself the first call for every financial question — fund code guidance, obligation timing decisions, September year-end positioning. I built a desk reference from the most common questions so program officers could get routine answers without waiting for me.

Result: Zero ADA violations across my entire tenure. Managed 900+ personnel actions and reduced payroll processing time to 1 working day. Reduced payroll excess by 65% through proactive execution monitoring. Year-end obligations consistently closed within 2% of projection. Ms. Sun Madaio can verify: DSN 315-723-6761."`,
    traps: [
      "Describing a single task (building a spreadsheet) rather than full lifecycle",
      "Forgetting to name specific financial systems — vague = unverifiable",
      "Claiming credit for work done by a team without specifying your role",
      "Going over 300 words in the Accomplishment Record version",
    ],
  },
  {
    id: 3,
    category: "COMPETENCY 2",
    competency: "Financial Data Analysis and Reporting",
    color: T.blue,
    q: "Give me an example of a time you conducted a study or analysis of financial data and reported findings to management.",
    intent: "Panel scores this against: 'Conducts studies and analysis of financial data; reports out on study findings.' Key word: STUDY. This isn't just running a report — it's identifying a question, pulling data, drawing conclusions, and changing management behavior. The reporting must actually influence a decision.",
    keyPoints: [
      "'Study' implies something more than routine reporting — an analytical investigation",
      "The finding must have been non-obvious — something management didn't already know",
      "Management must have acted on your analysis — the 'so what' is mandatory",
      "OSO-relevant angle: anomaly in obligation data, COR surveillance gap, OC coding pattern, burn rate divergence",
      "Name the data sources you pulled from — Momentum, BPPAS, SmartPay, SAM.gov, etc.",
    ],
    starModel: {
      situation: "What triggered the analysis? A routine review? An anomaly you spotted? An OIG finding? A leadership question?",
      task: "What was the specific analytical question? What did you need to find out?",
      action: "What data did you pull, from where? How did you structure the analysis? How did you present findings?",
      result: "What management decision or action resulted? What would NOT have happened without your analysis?",
    },
    modelAnswer: `"During FY2018 year-end execution at the DoD Office of Inspector General, the CFO's office flagged an unexpected $10M abnormal balance in one of the agency's appropriation accounts. No one knew the root cause. I was assigned to investigate.

I pulled all obligation and disbursement transaction data from STANFINS for the relevant account — over 700,000 transaction lines covering the full fiscal year. I structured the analysis in Python, grouping by transaction type, cost element, and posting date, looking for anomalous patterns against the prior-year baseline.

The root cause was a retroactive FY2018 pay raise adjustment that had posted across 180,000+ transaction lines with incorrect accounting codes, misaligning $10M in labor costs and 130,000 labor hours between object classes. The error had compounded through multiple payroll cycles without triggering any automated exception report.

I documented the root cause, the full dollar impact by object class, and a three-step correction plan. I briefed the CFO within 48 hours of identifying it. Management authorized the correction immediately. I then worked with the payroll office to manually adjust all 180,000 affected transaction lines and validate the corrected balances against STANFINS.

The correction was fully implemented before year-end close, preventing what would have been a material misstatement in the agency's financial statements.

For OSO, I would apply the same analytical approach to the T&M ceiling utilization monitoring that OIG Report 582 requires — the data lives in Momentum and SAM.gov, and building the query infrastructure to surface anomalies before they become findings is exactly this kind of work. Ms. Nicole Dortch can verify: nicole.p.dortch.civ@mail.mil / 202-508-0612."`,
    traps: [
      "Describing routine monthly reporting rather than a specific analytical investigation",
      "Not identifying what management DID with the finding — must close the loop",
      "Vague data sources — 'I looked at the data' without naming systems",
      "Missing the OIG connection — the panel will be thinking about 582",
    ],
  },
  {
    id: 4,
    category: "COMPETENCY 3",
    competency: "Internal Controls and Compliance",
    color: T.cyan,
    q: "Tell me about a time you implemented or advised on internal controls and conducted a routine internal control review.",
    intent: "Panel scores this against: 'Implements and/or advises on internal controls and compliance... Conducts routine internal control reviews.' This competency is directly about OIG findings — specifically OIG-582. They want to know if you can build controls that satisfy auditors, not just rewrite policies.",
    keyPoints: [
      "Distinguish control design from control implementation — they want both",
      "Name the regulatory framework: OMB A-123, FMFIA, PIIA — shows you know the scaffolding",
      "The corrective action must be SUSTAINABLE — OIG looks for recurrence",
      "Best story here: an OIG finding you closed, or an internal control review you led",
      "OSO connection: verify OIG-582 corrective actions are still operational — the finding was closed before April 2025, but sustained controls are the real measure",
    ],
    starModel: {
      situation: "What triggered the control review? OIG finding? Annual FMFIA? Proactive review?",
      task: "What control gap did you identify or inherit? What was the risk if it continued?",
      action: "How did you design the corrective control? What made it sustainable (automated, embedded, not manual)? How did you document it for audit purposes?",
      result: "Did the OIG close the finding? Was the control still operating at the next audit? What was the measurable improvement?",
    },
    modelAnswer: `"At the 18th MP Brigade, 21st TSC G8, U.S. Army Europe, I managed the Government Travel Card program for 1,100 individual accounts. When I took over, the GTC delinquency rate was running above the command threshold and an internal MICP review had flagged the oversight process as a control weakness.

I mapped the existing process end-to-end and identified two root causes: (1) no systematic tracking of which accounts were approaching the delinquency threshold until after they crossed it, and (2) supervisory review was happening after delinquency had already been reported up the chain — too late to prevent the violation.

My corrective action had three components. First, I built a weekly monitoring tool in Excel that pulled DTS and GTC data by account holder, calculated days-outstanding, and automatically flagged accounts approaching the 60-day threshold before they became delinquent. Second, I established a tiered notification protocol — account holders received a written reminder at day 30, supervisors were notified at day 45. Third, I redesigned the monthly compliance report to show account-by-account status rather than aggregate statistics, so commanders could identify problem accounts by name.

The result: delinquency rate dropped 40% within two review cycles. The control was sustainable because it ran from automated data pulls, not manual tracking. When the MICP reviewer returned for the follow-on assessment, the dashboard was still running and the trend data showed consistent improvement.

I also managed the GPC cardholder program, internal control reporting under MICP, and COR duties at the DoD OIG — monitoring contractor cost, schedule, and performance compliance on technical services contracts. In all three programs, the architecture was the same: automated monitoring that surfaces exceptions before they become findings, documented to OIG closure package standards.

For OIG-582, that is exactly the corrective action architecture I would build for OSO. Lt. Gen. Donna W. Martin can verify: donna.w.martin.mil@mail.mil."`,
    traps: [
      "Describing a policy rewrite rather than a control that actually operates",
      "Not naming the regulatory framework (OMB A-123, FMFIA)",
      "Missing sustainability — one-time fixes don't satisfy OIG",
      "Not connecting to OIG-582 — the panel is thinking about it whether you mention it or not",
    ],
  },
  {
    id: 5,
    category: "COMPETENCY 4",
    competency: "Workload Management",
    color: T.purple,
    q: "Describe a situation where you had to manage multiple competing priorities and accommodate unforeseen developments.",
    intent: "Panel scores this against: 'Effectively prioritizes workload in a way that accommodates unforeseen developments and achieves successful outcomes.' In a one-person FM function like OSO/BMCB, this is existential. The panel knows the job involves simultaneous formulation + execution + OIG response + stakeholder advisory. They need to know you can triage without dropping anything.",
    keyPoints: [
      "The scenario must involve GENUINE competing deadlines — not just a busy week",
      "Triage framework matters: show you categorized by consequence, not by loudness",
      "Nothing dropped — all threads resolved — is the mandatory outcome",
      "OSO-relevant: September year-end + OIG response + formulation + stakeholder request simultaneously",
      "The 'unforeseen development' is critical — something that arrived unexpectedly mid-execution",
    ],
    starModel: {
      situation: "Set the scene: what was already on your plate when the new thing arrived? Be specific about what each thread was and its deadline.",
      task: "What was the risk profile of each item? What happened if each one was dropped?",
      action: "How did you triage? What did you prioritize first and why? What did you delegate, defer, or compress? What communication did you make to stakeholders?",
      result: "Every thread resolved without missed deadlines. What did you do differently next time to prevent the collision?",
    },
    modelAnswer: `"In September 2019 at the DoD Office of Inspector General, I was simultaneously managing year-end obligation closeout for the agency's $125M operating budget when four demands landed in the same week.

First, the CFO assigned an ad-hoc data call: analyze over 700,000 transaction lines to investigate an abnormal $10M balance before the year-end financial statements were finalized — with a 48-hour turnaround. Second, an OIG audit team requested three years of contract files for a COR surveillance review — 10 business day response required. Third, a program manager flagged a potential ADA risk: an $87,000 September obligation that might exceed the quarterly apportionment for one cost center. Fourth, my supervisor, Ms. Nicole Dortch, needed the year-end execution summary for her CFO briefing that Friday.

I triaged by legal consequence first. The ADA risk took priority — I spent four hours reconciling STANFINS data against the apportionment authority, confirmed the obligation was within bounds, and documented the analysis contemporaneously with a written memo to Ms. Dortch. That closed the ADA issue with no escalation.

For the CFO's $10M data call, I ran the Python analysis overnight using the transaction extract I had already staged for year-end close. The analysis structure I had built for routine monitoring became the same structure I used for the ad-hoc investigation. The CFO had the root cause and correction plan on her desk in 36 hours — 12 hours early.

For the OIG contract file request, I knew exactly what was in each file location. I assigned the physical retrieval to a colleague, reserved two hours on day 3 to review and certify the package, and submitted on day 7 with three days to spare.

For Ms. Dortch's briefing, I compressed prep time by reusing the year-end dashboard I had maintained all year — the obligation tracking system ran without constant manual input, which freed me to format the executive summary while the closeout data updated itself.

Result: Zero ADA violations. CFO data call delivered 12 hours early. OIG file request submitted on time. Year-end obligations closed within 0.3% of projection. Ms. Dortch's briefing delivered on schedule. Ms. Nicole Dortch can verify: nicole.p.dortch.civ@mail.mil / 202-508-0612."`,
    traps: [
      "Scenario where everything worked out because you worked late — not a system, just endurance",
      "Not quantifying the stakes — the panel needs to feel the pressure",
      "Not explaining the triage logic — 'I prioritized by importance' without showing the framework",
      "Missing the 'unforeseen development' — the scenario must include something that arrived unexpectedly",
    ],
  },
  {
    id: 6,
    category: "SITUATION",
    competency: null,
    color: T.red,
    q: "OIG Report 582 cited T&M contract management weaknesses. What do you know about it and what would you do about it in this role?",
    intent: "This is a knowledge test and a work planning test simultaneously. The panel knows you've seen this in the MPC. They want to know if you understand what OSO's corrective action obligation actually is — and whether you've thought about HOW to close it.",
    keyPoints: [
      "Name the report correctly: 'The SEC Missed Opportunities to Lower Contract Risk and More Effectively Manage Time-and-Materials Contracts,' August 26, 2024",
      "Know the three types of corrective actions needed: ceiling utilization dashboard, contract type decision matrix, COR surveillance SOPs",
      "Know which OSO contracts are exposed: security guard services (Patriot Security type), janitorial (CleanFed type)",
      "Know the current status: all three Report 582 recommendations were CLOSED before April 2025 — demonstrating research rigor",
      "Shift from 'closing' to 'sustaining' — a closed finding that reverts is harder to defend than an open one",
    ],
    modelAnswer: `"OIG Report 582 — 'The SEC Missed Opportunities to Lower Contract Risk and More Effectively Manage Time-and-Materials Contracts' — was issued August 26, 2024. The finding: OSO used T&M contract types where scope was sufficiently defined to support fixed-price vehicles, and COR surveillance of existing T&M contracts was inadequate.

I want to be precise about the current status, because this matters for how I'd approach the role. Based on the SEC OIG's Semiannual Report covering April through September 2025, all three Report 582 recommendations are closed — they do not appear on Table 2, which lists every open corrective action. The December 2025 Management and Performance Challenges report does not flag Report 582 as an outstanding concern. OSO implemented the corrective actions and OIG concurred with closure before April 2025.

That is actually the more interesting situation to walk into, and it changes my 90-day framing.

A closed OIG finding is not the same as a solved problem. Corrective actions can atrophy. The monitoring infrastructure built to close a finding can be abandoned six months after OIG concurs — and the next OIG review of T&M contracts will look not just at whether controls were implemented, but whether they're still running. A finding that reverts after closure is harder to defend than one that was never closed.

So my 90-day priority around this is sustainability verification, not remediation. In the first 30 days I would pull the corrective action documentation for all three recommendations — the COR surveillance log template, the T&M ceiling utilization dashboard, the contract type decision matrix — and verify whether each control is actually still running. Not whether it was built. Whether it is running now.

If the controls are operational and documented: my job is to maintain them, enhance them, and make sure they run automatically rather than depending on manual effort. If any have atrophied: I treat it as a new internal control gap that I document and address before OIG finds it in the next review cycle.

I have perspective on this that most candidates won't: I spent three years at the DoD Office of Inspector General. I have seen what happens when agencies close findings by building controls that work for the follow-on review and then stop running. OSO did the harder part — getting to closure. I would make sure that work lasts."`,
    traps: [
      "Not knowing the report's title and date",
      "Vague corrective actions — 'I'd improve the process' without specifics",
      "Not knowing the finding was actually closed — saying it's still open when it isn't signals you haven't done current research",
      "Missing the sustainability requirement — OIG tests for recurrence",
    ],
  },
  {
    id: 7,
    category: "SITUATION",
    competency: null,
    color: T.gold,
    q: "This position is described as 'enhancing' the financial management program. What does that word tell you, and what would you prioritize in your first 90 days?",
    intent: "Panel is literally asking: do you know what you're walking into, and can you hit the ground running? 'Enhance' is a deliberate word choice — it implies a gap. They want a candidate who assessed the gap intelligently, not one who arrives with a generic improvement plan.",
    keyPoints: [
      "'Enhance' = the program currently exists but needs building — not a backfill",
      "First 30 days: listen, map the current state, don't fix what you don't understand yet",
      "First 60 days: baseline financial dashboard, OIG-582 sustainability verification, GPC audit",
      "First 90 days: first monthly financial status brief delivered, formulation season supported",
      "Frame around Brian Williams' needs: reliable visibility, OIG compliance, budget call support",
    ],
    modelAnswer: `"'Enhance' tells me three things. I'm not backfilling a departure — I'm building something. The current program has identified gaps. And the panel expects a candidate who arrives with a methodology for finding those gaps, not a predetermined answer.

I have done exactly this before. When I joined the DoD OIG Financial Management Office in September 2017, the FM function had been understaffed for months. There was no current-year spend plan, no systematic burn rate monitoring, and no documented internal control framework for several program areas. I spent the first 30 days in pure assessment mode: pulled STANFINS data for six months of execution history, mapped obligation patterns by cost center and object class, reviewed every open OIG recommendation affecting the FM function, and sat down with each program office head to understand their financial pain points. I did not touch anything until I understood what existed.

By day 45 I had built the baseline infrastructure: an automated spend plan model in Excel VBA that pulled STANFINS actuals weekly and projected year-end positions, a burn rate dashboard that flagged offices approaching 80% of their allotment, and a monthly financial status brief format I delivered to Ms. Nicole Dortch by the 10th of every month. By day 90 I had submitted a corrective action package on the one open internal control finding I had inherited.

I would apply the identical sequence at OSO. Days 1-30: assessment mode — sit with Brian Williams, pull six months of Momentum data, review every open OIG corrective action, meet each office head. Days 31-60: build the baseline — OSO allotment dashboard, first financial status brief to Williams and Buckley, OIG-582 Corrective Action Plan submitted if not already in place. Days 61-90: first deliverables — T&M ceiling utilization report, formulation package underway, progress brief to leadership.

Success at 12 months: Brian Williams has reliable financial visibility he did not have before, OIG-582 is closed or on track, and the FY2028 formulation package required no rework at OFM."`,
    traps: [
      "Arriving with a solution before understanding the problem",
      "Focusing on agency-wide budget strategy rather than OSO's internal function",
      "Not mentioning OIG-582 — it's the most concrete 'enhance' opportunity available",
      "Being vague about what 'first 90 days' means — the panel wants a plan",
    ],
  },
  {
    id: 8,
    category: "SITUATION",
    competency: null,
    color: T.cyan,
    q: "How would you work with FOIA Services and Security & Building Operations — office heads who are not budget people — to get the financial data you need?",
    intent: "Panel is testing your advisory and relationship skills. Non-financial managers resist financial process overhead. The candidate who makes the FM function invisible to them — who removes friction rather than creating it — wins this question.",
    keyPoints: [
      "Understand their primary job first: McInerney processes 13,250 FOIA requests; Taylor manages physical security across all SEC facilities",
      "Your job is to serve them, not burden them — make the financial process invisible",
      "Pre-populate templates with prior-year data so they're correcting, not starting from scratch",
      "Quarterly 30-minute conversations to capture planned activities before they become financial surprises",
      "Be the person who gives fast, clear answers — not the person who creates complexity",
    ],
    modelAnswer: `"The starting point is recognizing that Ray McInerney is processing 13,250 FOIA requests and Katherine Taylor is managing physical security across the SEC's entire facility footprint. Their primary job is not budget forms. If I make the financial management process feel like overhead to them, I've already failed.

My approach has three elements. First, I do the heavy lifting. I pre-populate every submission template with prior-year data, so they're reviewing and correcting rather than building from scratch. I pull the data I need from Momentum and BPPAS rather than asking them to report it. I show up to their quarterly planning meeting already knowing their upcoming contract renewals and facility projects from the SAM.gov data — so the conversation is about confirming my understanding, not extracting new information.

Second, I establish myself as the person who removes obstacles, not creates them. If Katherine Taylor's office needs to know whether a building repair can be obligated against the current allotment, she gets a clear answer from me within the business day. If the answer is no, I tell her why and what the options are. Financial management should feel like a service, not a gate.

Third, I schedule one standing 30-minute quarterly conversation with each office head — not to interrogate them about budget details, but to understand what they're planning that I might not know about. New contractor, changed staffing plan, upcoming facility project. That's where financial intelligence actually lives.

The measure of success: when budget season arrives, Ray McInerney and Katherine Taylor engage proactively with me rather than avoiding the process — because I've made it worth their time all year."`,
    traps: [
      "Describing a top-down process where office heads submit data to you",
      "Not acknowledging their actual missions — generic stakeholder language",
      "Missing the specific intelligence opportunities in each office's work",
      "Making it sound like financial reporting is the goal rather than financial management",
    ],
  },
  {
    id: 9,
    category: "SITUATION",
    competency: null,
    color: T.purple,
    q: "You discover in August that one of OSO's offices is projected to exceed its allotment by September 30. Walk me through your response.",
    intent: "This is a pure technical and judgment test. The panel wants to see that you understand the ADA cascade and won't manage this quietly. The response must be immediate, parallel-tracked, and properly escalated — not sequential.",
    keyPoints: [
      "Step 1: Verify — reconcile Momentum data, confirm it's not a data error",
      "Step 2: Notify Brian Williams immediately — same day, in writing",
      "Step 3: Notify OFM — they need to know before you have a solution",
      "Step 4: Identify legal corrective options (de-obligation, OMB reapportionment, obligation freeze)",
      "Step 5: If a violation has already occurred — simultaneous reporting to OIG, agency head, OMB, Congress per 31 U.S.C. §1351",
      "What you do NOT do: manage it quietly, wait to see if it resolves, go directly to solution without notifying leadership",
    ],
    modelAnswer: `"Immediately, and in this sequence.

Step one: Verify the data before I act. I reconcile Momentum obligations against the OSO allotment by cost center and by OMB apportionment category. ADA analysis requires precision — I need to confirm this is a real risk, not a timing difference or a system entry error. This takes four hours maximum.

Step two: Notify Brian Williams. The moment the risk is confirmed — not after I've identified a solution — Brian Williams gets a written notification with my analysis: current obligation pace, projected September 30 position, confidence interval, and the legal risk if the projection materializes.

Step three: Notify OFM Planning & Budget. OFM needs to know simultaneously with Brian Williams. They hold the apportionment and can request a reapportionment from OMB if needed. That process takes time I don't have if I wait.

Step four: Identify the legal corrective options. There are exactly three: request a reapportionment from OMB — time-sensitive given we're in August — impose an obligation freeze on non-mission-critical items immediately, and accelerate de-obligation of any unneeded open obligations. I prepare the analysis of each option's feasibility and cost for Brian Williams to decide.

Step five is the one most people miss: if the violation has already occurred rather than being projected, 31 U.S.C. §1351 requires simultaneous reporting — not sequential — to the OIG, the agency head, OMB, and Congress. That reporting cannot wait for a corrective plan. I make that clear.

What I do not do: manage this quietly, delay notification until I have a fix, or assume the projection will self-correct. ADA violations are reported, not resolved and forgotten."`,
    traps: [
      "Going directly to corrective options without proper notification chain",
      "Not knowing that reporting must be simultaneous under §1351",
      "Treating this as a financial problem rather than a legal one",
      "Suggesting 'monitoring closely' rather than immediate escalation",
    ],
  },
  // ── BEHAVIORAL QUESTIONS ─────────────────────────────────────────────────────
  {
    id: 11,
    category: "BEHAVIORAL",
    competency: null,
    color: T.green,
    q: "Tell me about a time you had to inform a supervisor or manager about a financial problem — an error, a shortfall, or a compliance risk — they didn't already know about.",
    intent: "Tests professional courage and disclosure instincts. Brian Williams needs someone who surfaces financial problems immediately — before they become violations, before OIG finds them. The failure mode this question hunts for: candidates who 'solved the problem first' and only then told leadership. In federal FM, that creates concealment risk. Notify first. Fix second. The panel is checking: does this person manage problems quietly, or do they surface them fast?",
    keyPoints: [
      "The disclosure must be IMMEDIATE — same day, in writing, before you have a full solution",
      "Frame the problem clearly: what is at risk legally (ADA? Improper payment? OIG escalation?)",
      "Bring a preliminary analysis and options — not just the bad news",
      "OSO connection: Maps directly to the ADA risk protocol — notify Brian Williams, notify OFM, simultaneously",
      "Bonus points: if you can describe a specific written notification memo, it shows maturity",
    ],
    starModel: {
      situation: "What was the financial problem? What were the stakes if it continued? How did you discover it — routine monitoring, anomaly detection, or someone told you?",
      task: "What was your obligation at that point? Were you required to report it? What was the timeline pressure?",
      action: "How did you structure the notification? Written or verbal — and why? What did you include? Did you bring options, or just the problem? How did the supervisor react?",
      result: "What happened after the disclosure? Was the problem resolved? What would have happened if you'd waited? What control did you add afterward?",
    },
    modelAnswer: `"During FY2019 Q3 at the DoD OIG, I discovered during my monthly STANFINS reconciliation that an obligation I had processed in Q2 had been posted to the wrong cost element — an equipment classification under OC 31.0 rather than the correct contractual services code under OC 25.0. The dollar amount was $62,000. The error had been sitting for eight weeks.

The stakes were real: if it remained miscoded into year-end, OC 31.0 would appear over-obligated against plan while OC 25.0 showed available authority. More seriously, it was a potential purpose statute exposure — an obligation coded against an object class for which those specific funds had not been planned.

I did not fix it and then tell my supervisor. The same morning I found it I walked into Ms. Nicole Dortch's office with a one-page memo: what happened, when it happened, the legal exposure under 31 U.S.C. §1301(a), and three correction options — a manual journal entry adjustment, a de-obligation and re-obligation against the correct account, or escalation to the OIG accounting shop. I recommended option two and explained the rationale.

Ms. Dortch authorized the correction immediately. We submitted the de-obligation and re-obligation through STANFINS within 48 hours and documented the error in the internal controls log with a root cause note.

What I changed: I added an end-of-quarter OC mapping check to my standard close process — a 30-minute Python query that flags any obligation whose OC code differs from the object class specified in the underlying contract or purchase document. That check runs quarterly and has caught three similar discrepancies since.

What I will never do is fix the error and then tell the supervisor after the fact. The notification is step one. The correction is step two. Ms. Nicole Dortch can verify: nicole.p.dortch.civ@mail.mil / 202-508-0612."`,
    traps: [
      "Saying you 'solved the problem first and then briefed leadership' — that's the wrong sequence in federal FM",
      "Choosing a trivial problem (a late report, a formatting error) — the stakes need to be real",
      "Not describing a written notification — verbal-only doesn't create a paper trail",
      "Missing the control you added afterward — disclosure without improvement is incomplete",
    ],
  },
  {
    id: 12,
    category: "BEHAVIORAL",
    competency: null,
    color: T.green,
    q: "Describe a specific financial management process you identified as broken or inefficient and then improved. What was it, what did you change, and how do you know it worked?",
    intent: "The 'enhance' mandate in this announcement is a direct request for this exact competency. They're not looking for someone to maintain the status quo — they need someone who diagnoses gaps and builds infrastructure. The sustainability criterion is critical: a fix that requires you to run it manually every week is not a fix. The panel is asking: can you see what's broken, design a fix, implement it, and prove it's working — and does it keep working after you stop watching it?",
    keyPoints: [
      "The process must have been genuinely broken — causing risk or failure, not just mildly inconvenient",
      "Your improvement must be SUSTAINABLE — it runs without you, automated where possible",
      "Quantify before vs. after: compliance rate, time saved, error rate, ADA near-misses prevented",
      "OSO connection: Frame what you'd improve first at OSO — the reporting cadence, COR surveillance logs, GPC reconciliation workflow",
      "Gold standard: if the improvement closed an OIG finding, lead with that",
    ],
    starModel: {
      situation: "What was the process? Why was it broken — what failure mode was it creating? Who was affected? How long had it been that way before you arrived?",
      task: "What was your mandate? Were you assigned to fix it, or did you take initiative? What constraints did you have (system access, budget, authority)?",
      action: "What did you diagnose first? How did you design the fix? What resistance did you encounter? How did you make it sustainable — what specifically prevents it from reverting?",
      result: "What changed, measurably? Is the improved process still running? Did it prevent a specific incident or close an audit finding?",
    },
    modelAnswer: `"When I joined the DoD OIG Financial Management Office in September 2017, there was no standardized financial status report for program offices. Budget data lived in STANFINS, but the only way program managers got visibility into their execution was to ask the FM office directly — an ad-hoc, unpredictable process that meant most managers didn't monitor their spending until September.

The failure mode was documented: twice in the previous 18 months, September obligations had been submitted that the FM office wasn't aware of — both close enough to the allotment ceiling to require emergency de-obligation of other items to avoid ADA exposure.

I diagnosed two root problems: there was no automated data pull from STANFINS, so any report required hours of manual work, and there was no committed delivery date, so program managers had learned they couldn't rely on getting regular updates.

My fix had three parts. First, I wrote a Python script that automated the STANFINS data extract — pulling obligation actuals by cost center, OC, and fund type in under five minutes and staging them in a structured Excel template. Second, I built an Excel VBA tool that populated the monthly dashboard from the staged data automatically — burn rates, allotment balance by office, ADA threshold indicators. Third, I committed in writing to Ms. Nicole Dortch and each program office head: the monthly Status of Fund report delivered by the 10th of every month, every month.

Within three months, two program offices were proactively sending me their anticipated September obligations in July rather than waiting until September. By year-end: zero surprise obligations. The automated report ran monthly for the remaining two years of my tenure without a single missed deadline.

I also developed a scenario-driven spend plan model that let program managers run what-if scenarios against their remaining allotment. That model was still in use after I left. Ms. Nicole Dortch can verify: nicole.p.dortch.civ@mail.mil / 202-508-0612."`,
    traps: [
      "Describing an improvement that still requires manual intervention — 'I do it faster now' is not a process improvement",
      "Not quantifying the before state — what was the failure rate or compliance gap?",
      "Choosing a cosmetic improvement (made it prettier) rather than a functional one (prevented a failure)",
      "Not addressing sustainability — what happens when you're not there to run it?",
    ],
  },
  {
    id: 13,
    category: "BEHAVIORAL",
    competency: null,
    color: T.cyan,
    q: "Tell me about a time you joined a new organization or role and had to get up to speed on unfamiliar financial systems or processes quickly. What was your approach and how long before you were operating independently?",
    intent: "OSO is hiring someone who will land in an unfamiliar financial environment — Momentum, BPPAS, SEC-R 14-1 — with no transition documentation and be expected to deliver fast. The panel isn't impressed by 'I shadowed the previous person.' They want to see a systematic knowledge-acquisition method: how do you find the authoritative source? How do you build a mental model of a new system fast? And critically — how do you know when you know enough to act independently without asking permission for every transaction?",
    keyPoints: [
      "Show your knowledge-acquisition process: authoritative documents FIRST (regulations, SOPs, system manuals), then colleagues",
      "Identify what you need to know to be operationally useful on day 1 vs. day 30 vs. day 90 — sequence matters",
      "Name the specific gap you had and exactly how you closed it — vague 'I learned a lot' is not an answer",
      "OSO connection: Day one at SEC means pulling SEC-R 14-1, reviewing OIG-488, running your first Momentum query — show you've already planned this",
      "Be specific about the timeline: 'By week 3 I was processing obligations independently; by week 6 I had mapped the full allotment structure'",
    ],
    starModel: {
      situation: "What was the new environment? What was unfamiliar — the system, the regulatory framework, the org structure? What was at risk during the learning period if you got something wrong?",
      task: "What did you need to be able to do, and by when? What was the first concrete test of your competence?",
      action: "What sources did you start with? How did you find what you didn't know you didn't know? How did you handle your first transactions during the learning curve — how did you check your own work?",
      result: "How quickly were you operating independently? What was the specific measure — first clean obligation, first report produced, first month-end close?",
    },
    modelAnswer: `"When I joined the DoD OIG Financial Management Office in September 2017, the position had been understaffed for several months. There was no transition documentation, no current-year spend plan, and no one to onboard me — the previous analyst had moved to a different office. Ms. Nicole Dortch handed me STANFINS system access and told me I needed to produce the Q1 close package in three weeks.

My first action was not to ask how the system worked. It was to find the authoritative documentation. I pulled the DoD OIG's administrative control of funds policy, the DFAS financial management regulation, the STANFINS system user guide, and the agency's internal budget execution SOP. I read all four in the first two days. I wanted to understand the rules before I learned the shortcuts.

By day three I had mapped the agency's chart of accounts — every cost center, every fund type, every program office owner. By day five I had run my first STANFINS query and reconciled the output against the prior month's close package to understand what 'normal' looked like before anything changed under my watch.

Two things I could not learn from documentation: the agency's GPC approval routing and the exact timing of the DFAS allotment release. I sat with the GPC program manager for 45 minutes and the DFAS liaison for 30 minutes, took structured notes, wrote an SOP for myself, and emailed it back to both for accuracy review. Each corrected one item. Those corrections went into the final SOP that I later formalized for the office.

By week three I was processing obligations independently. By week six I had produced the Q1 close package without assistance and delivered it two days early. Ms. Dortch noted it was the first fully on-time close in over a year.

For OSO, day one means pulling SEC-R 14-1, reviewing OIG-488 to understand the Momentum and BPPAS architecture, and running a six-month obligation history before anyone tells me what it looks like. That approach has worked every time I've entered a new financial environment. Ms. Nicole Dortch can verify: nicole.p.dortch.civ@mail.mil / 202-508-0612."`,
    traps: [
      "Describing onboarding as passive — 'I shadowed the previous person' or 'my supervisor walked me through it'",
      "Not naming specific sources — vague 'I researched everything' without naming what you read",
      "Not being specific about the timeline — 'it took a while' is not useful to the panel",
      "Forgetting the OSO connection: show you've already planned what day one at SEC looks like",
    ],
  },
  {
    id: 14,
    category: "BEHAVIORAL",
    competency: null,
    color: T.purple,
    q: "Describe a time you disagreed with a supervisor, contracting officer, or stakeholder about a financial or compliance decision. How did you handle it and what was the outcome?",
    intent: "Tests professional integrity in a compliance-sensitive environment. At some point in this role, someone will ask you to obligate against an exhausted allotment, delay ADA reporting, skip a COR surveillance log, or accept an undocumented contract modification. The panel needs to know you'll push back professionally — grounded in policy, not personality — and that you'll do it in a way that preserves the relationship. The failure modes: candidates who 'followed orders' on compliance issues, and candidates who describe a preference disagreement rather than a legal/compliance one.",
    keyPoints: [
      "The disagreement must be on a COMPLIANCE or LEGAL issue — not a preference or stylistic question",
      "Your pushback must be grounded in specific law or regulation — cite the statute or circular, not just 'I knew it wasn't right'",
      "You resolved it at the lowest level possible — escalation was available but not needed",
      "The relationship survived — you can still name this person as a reference",
      "OSO connection: The most likely scenario is a program manager asking you to obligate against an exhausted allotment, or a COR who wants to skip the T&M surveillance log",
    ],
    starModel: {
      situation: "What was the disagreement? What was the compliance or legal issue at stake? Who was the other party and what were they asking you to do?",
      task: "What were you being asked to do, and why was it a problem? What was your specific obligation — were you required to refuse, or was this a judgment call?",
      action: "How did you push back? In writing? Did you cite specific law or policy? Did you offer an alternative that achieved their legitimate goal without the compliance risk?",
      result: "What was decided? If you prevailed, how? If you didn't, what happened next? Did you escalate, and to whom? Is the relationship intact?",
    },
    modelAnswer: `"In September 2016 at the 8th Army G8, U.S. Army Korea, a program manager came to me on September 22nd requesting that I obligate $120,000 in contract services against a cost center that had $18,000 remaining in its FY2016 allotment. The contracting officer had already sent a verbal commitment to the vendor. The program manager said the command had 'always carried these over to the new fiscal year' when allotments ran short in September.

I understood the operational pressure — it was a legitimate maintenance services requirement. The approach was the problem.

I told her directly, verbally first and then in writing within the hour: I could not obligate in excess of the current allotment, regardless of verbal command commitment or expectation of future-year funding. I cited 31 U.S.C. §1341(a)(1). A verbal authorization from a commander does not create legal appropriation authority. An obligation against funding that does not currently exist is a federal law violation, not a financial planning risk.

I also laid out what I could do: obligate up to the $18,000 currently available immediately, prepare an emergency allotment modification request to Army G8 that same day if there was unobligated balance available elsewhere in the command's portfolio, and document the full situation for the commanding officer's awareness.

The program manager pushed back — 'this is how we've always done it.' I stayed calm, repeated my position, and offered to brief the G8 chief together to confirm the modification request authority. She agreed.

In that meeting, the G8 chief immediately understood the ADA exposure when I stated it in statutory terms. He authorized the modification request. We obligated the $18,000 that day. The modification cleared three days later, and we obligated the remaining $102,000 against the confirmed additional allotment.

That program manager has checked allotment status with me before making any vendor commitments since. Ms. Sun Madaio can verify: DSN 315-723-6761."`,
    traps: [
      "Describing a preference disagreement ('they wanted a different report format') rather than a compliance issue",
      "Not citing the specific law or regulation — 'I knew it wasn't right' is not professional pushback",
      "A situation where you eventually gave in on the compliance issue — the line must hold",
      "Damaging the relationship in the process — the story should end with the relationship intact and the person now following better practices",
    ],
  },
  {
    id: 15,
    category: "BEHAVIORAL",
    competency: null,
    color: T.red,
    q: "Tell me about a financial management error or mistake you made. How did you discover it, what did you do about it, and what did you change afterward?",
    intent: "A trap version of a self-awareness question. Weak candidates say 'I've never made a significant error' — disqualifying, because it signals either lack of self-awareness or lack of responsibility. Strong candidates describe a real error with real stakes, disclose it immediately, correct it systematically, and build a control to prevent recurrence. What the panel is actually assessing: your disclosure instincts, your accountability culture, and whether you learn from failure rather than bury it. The 'what I changed afterward' is where most candidates leave points on the table.",
    keyPoints: [
      "The error must be REAL — not trivial. It should have had potential compliance, financial, or operational consequences",
      "You disclosed it IMMEDIATELY — not after you fixed it, and not only when discovered by someone else",
      "The correction is documented — paper trail, written notification to supervisor",
      "The control you built afterward is the proof that you learn from errors, not just survive them",
      "Do NOT say 'I work too hard' or 'I'm a perfectionist' — that's not an error, and the panel will lose respect for the answer",
    ],
    starModel: {
      situation: "What was the error? When and how did you discover it — routine review, external flag, or someone told you? How long had it been outstanding?",
      task: "What were the stakes? What would have happened if it hadn't been caught — ADA violation? Improper payment? OIG finding?",
      action: "What did you do first — notify or fix? Who did you notify, how quickly, and how? How did you correct it? What was the documentation trail?",
      result: "What was the outcome? What control did you build to prevent recurrence? Is that control still running today?",
    },
    modelAnswer: `"In early FY2015 at the 8th Army G8, I processed a payroll update for a military contractor position that I applied to the wrong fund code — Operations and Maintenance, Army (OMA) instead of the correct Other Procurement, Army (OPA) account. The amount was $43,000 in labor charges across a two-month period. The error had propagated through two GFEBS payroll cycles before I identified it.

I discovered it during my monthly GFEBS reconciliation when OMA showed an unexpected variance against the spend plan while OPA was underrunning. I pulled the transaction detail and confirmed the misposting — my error in applying the fund code during the initial setup.

My first call was to Ms. Sun Madaio — same morning, before I had the full correction documented. I walked into her office with a one-page summary: what the error was, which two accounts were affected, the dollar amount, and two correction options — a GFEBS journal voucher or a de-obligation/re-obligation. I recommended the journal voucher and explained why.

Ms. Madaio authorized the correction immediately. I initiated the GFEBS journal voucher the same day through the Resource Management accounting team, documenting the original posting, the correct fund code, and the regulatory basis for the reclassification. The correction posted within 48 hours. I then reconciled both accounts to confirm the balances aligned with the spend plan.

What I changed: I added a fund code verification step to my new contractor position setup checklist — a 60-second cross-check of the fund code against the approved program budget before any payroll entry goes into GFEBS. That check has caught two setup errors since before they posted.

The fix was step two. The notification was step one. Ms. Sun Madaio can verify: DSN 315-723-6761."`,
    traps: [
      "Choosing a trivial error ('I submitted a report an hour late') — the stakes need to matter",
      "Describing fixing it before telling anyone — disclose first, fix second",
      "No control built afterward — disclosure without prevention just means you got lucky",
      "Being overly self-flagellating — own it, fix it, move on; the panel doesn't want an apology tour",
    ],
  },
  // ── MULTI-PART SCENARIO QUESTIONS ────────────────────────────────────────────
  {
    id: 16,
    category: "MULTI-PART",
    competency: null,
    color: T.gold,
    q: "You've been in the role 60 days. Brian Williams asks you to brief him on OSO's financial health before he meets with William Buckley next week. Walk me through: (a) what data you'd pull and from where, (b) how you'd structure the brief, and (c) what you'd do if, while preparing it, you discovered one office was trending toward an ADA violation by September 30.",
    intent: "A three-part scenario testing data literacy, communication skill, and crisis response protocol simultaneously. The panel is watching whether you treat part (c) as part of the briefing prep — it is not. An ADA trend is a parallel-track emergency, not a slide in a deck. Candidates who answer part (c) as 'I'd put it in the red section of the brief' have failed the most important part of the question. The ADA notification runs before the brief is finished, not after.",
    keyPoints: [
      "Part (a): Momentum obligations by cost center and OC, apportionment authority, open COR logs, GPC reconciliation status — name the sources specifically",
      "Part (b): Lead with the headline (one sentence on overall health), then risks, then forward look — brief is two pages max",
      "Part (c) is NOT a section in the brief — it is an IMMEDIATE parallel notification to Brian Williams and OFM before you finish the brief",
      "The brief and the ADA notification are two simultaneous actions — not sequential",
      "Always include an OIG-582 status section — Buckley will ask about it",
    ],
    starModel: null,
    modelAnswer: `"I'll take each part in order.

PART (a) — DATA PULL:

My Momentum pull covers the last 60 days of obligations by cost center and object class, with a year-to-date summary against each office's allotment. I want: total obligated vs. allotment by office, burn rate by month compared to prior-year pace, and any large open obligations that haven't cleared. I pull the current apportionment balance from OFM to confirm our authority ceiling. I pull GPC reconciliation status — how many accounts are current, how many are past the 5-day window. And I pull the COR surveillance log status from the T&M dashboard, because Brian Williams is going to hear about OIG-582 from Buckley if I don't put it in front of him first.

PART (b) — STRUCTURE:

The brief leads with a headline: one sentence — 'OSO's FY2027 financial position is [healthy/at risk] as of [date] — here's what requires your attention before your meeting with Buckley.' That sentence tells Brian Williams whether to be worried before he reads a single number.

Then: a RAG status by office (obligations vs. allotment — green, yellow, red), a GPC compliance summary, an OIG-582 corrective action status update because Buckley will ask, and a one-paragraph forward look on what's coming in the next 30 days.

Two pages maximum. Appendix with transaction detail for reference. Brian Williams doesn't read appendices in prep for a meeting.

PART (c) — ADA TREND:

This is not a brief section. This is a separate, immediate action.

The moment I identify the ADA trend, I stop brief prep. I run the four-hour verification: reconcile Momentum obligations against the apportionment by cost center, confirm it's a real trajectory and not a timing artifact or data error. If confirmed, Brian Williams gets a written notification the same day — before the brief is finished, before the Buckley meeting, before I have a full corrective plan. Simultaneously, I notify OFM Planning & Budget, because they hold the apportionment and may be able to act on a reapportionment request faster than I can execute a de-obligation.

The brief and the ADA notification run in parallel. I do not wait to surface this in the Buckley meeting. Brian Williams hears it from me first, in writing, with three corrective options.

For context on what I would bring to this role: at the OSD Comptroller I currently oversee execution analytics across $338B in obligations and 20 general ledgers using the ADVANA platform. Building the Momentum-based OSO execution dashboard is a smaller-scale version of infrastructure I have already built at enterprise level. The OSO version gets built faster. Ms. Kate Sieve can verify: 703-697-4649."`,
    traps: [
      "Treating part (c) as a section in the brief — 'I'd flag it in the red section' is the wrong answer",
      "Running the ADA response sequentially after finishing the brief — notify first, brief second",
      "Not naming specific data sources in part (a) — 'I'd look at the financial data' is too vague",
      "A brief format that buries the headline — starting with methodology before the bottom line",
      "Forgetting to include OIG-582 status — Buckley will ask about it",
    ],
  },
  {
    id: 17,
    category: "MULTI-PART",
    competency: null,
    color: T.cyan,
    q: "OSO is about to exercise the next option year on its physical security guard services contract — a T&M vehicle, $2.4M annually. The COR tells you the contractor has been consistently running 15% under the ceiling. Walk me through: (a) the financial analysis you'd run before the option is exercised, (b) what questions you'd raise with the contracting officer, and (c) how this connects to OIG-582 and what your documentation obligation is.",
    intent: "An OSO-specific knowledge test embedded in a scenario. Physical security guard services (Katherine Taylor's OSBO-PSE portfolio) is the largest T&M contract exposure in OSO — the exact scenario OIG-582 was written about. The panel wants to see integrated knowledge: ceiling utilization analysis, contract type conversion logic, and OIG corrective action documentation. A candidate who gives a generic contract management answer without naming OIG-582, OSBO-PSE, or Katherine Taylor has missed the OSO-specific hook entirely.",
    keyPoints: [
      "Part (a): Utilization rate by period, ceiling vs. actual, projected need for next option year — if 15% under for 2+ years, the IGCE should be lower, not rolled forward",
      "Part (b): Key CO question is whether scope is now definable enough for a fixed-price conversion — that's OIG-582 Rec 2 in action",
      "Part (c): This IS an OIG-582 corrective action deliverable — a pre-option ceiling utilization review is Rec 1 operationalized",
      "Document everything: the analysis, the CO conversation, the decision made, your recommendation — that's the audit trail OIG needs",
      "Connect to Katherine Taylor: OSBO-PSE manages the physical security portfolio — she's your client for this contract",
    ],
    starModel: null,
    modelAnswer: `"I'll work through each part.

PART (a) — FINANCIAL ANALYSIS:

Before any option exercise on a T&M contract, I run a ceiling utilization analysis. For this contract: pull obligation data from Momentum and SAM.gov for every period of performance — ceiling, actual invoiced, de-obligated at closeout. If the contractor has been running 15% under consistently, I want to know if that's systematic (ceiling chronically over-estimated) or situational (varies by period).

I also pull labor hour burn rate from the COR surveillance logs — for guard services, hours are the cost driver. If authorized hours are consistently underutilized, the IGCE for the next option year should reflect a lower ceiling, not just roll forward the prior year's number uncritically.

Output: a one-page utilization summary — prior-year ceiling, actual spend, utilization rate, projected requirement, and a recommended ceiling adjustment.

PART (b) — QUESTIONS FOR THE CONTRACTING OFFICER:

First question: given [N] years of consistent, predictable performance and a stable statement of work, can we support a conversion to fixed-price or fixed-price-with-economic-price-adjustment? For guard services, hours are schedulable, rates are known, scope is stable. That's a strong case for conversion — and it's exactly what OIG-582 Rec 2 requires us to evaluate.

Second: if we're staying T&M, does the CO's IGCE reflect actual utilization history or is it a roll-forward of the prior ceiling?

Third: what does the COR's surveillance log data show about hours actually performed versus authorized?

PART (c) — OIG-582 CONNECTION AND DOCUMENTATION:

This scenario is directly within the T&M contract management framework that OIG-582 established — the finding was closed by early 2025, but the controls it required are exactly what I'm applying here. A pre-option ceiling utilization analysis, a contract type conversion assessment, and documented decision-making — these are the controls OSO built to close 582. My job is to ensure they're still running and applied consistently.

That package is the auditable evidence OIG needs for Rec 1 closure. If we exercise the option without a scope-conversion analysis, I document that fixed-price conversion was evaluated and why it was determined not feasible at this time — signed by the CO. That's the Rec 2 contract type justification matrix. Both documents together are the T&M contract management evidence package — the type of documentation that closed OIG-582 and that needs to be maintained to prevent a recurrence finding.

For context: I have performed COR duties myself at the DoD OIG. I understand the COR surveillance log requirement from the practitioner side. Whether the controls built for OIG-582 are still running or need to be rebuilt, I have hands-on experience with this work. Ms. Nicole Dortch can verify: nicole.p.dortch.civ@mail.mil / 202-508-0612."`,
    traps: [
      "Generic contract management answer with no OSO-specific context — the panel wants to hear 'Katherine Taylor's OSBO-PSE' and 'OIG-582'",
      "Not addressing fixed-price conversion — that's the core OIG finding and it must come up in part (b)",
      "Treating documentation as optional — the audit trail IS the corrective action",
      "Rolling forward last year's ceiling uncritically — that's exactly the problem OIG identified",
    ],
  },
  // ── GENERIC / KNOWLEDGE CHECK QUESTIONS ──────────────────────────────────────
  {
    id: 18,
    category: "GENERIC",
    competency: null,
    color: T.blue,
    q: "Walk me through the federal budget formulation cycle — from internal agency planning through congressional action — and describe your specific role within it.",
    intent: "A baseline competency check, often asked early as a warm-up to calibrate your level before the behavioral questions. They want to hear specific terminology: OMB A-11, budget call, passback, apportionment, SF-132, GTAS. A candidate who can't describe the full cycle fluently is not an SK-14. What makes an answer stand out: connecting the macro cycle to OSO's specific position within it — you are an internal client of OFM, not the OMB submitter. Show you know the difference.",
    keyPoints: [
      "Know all phases: agency internal formulation → OMB submission → passback → President's Budget → congressional action → enacted appropriation → apportionment → allotment",
      "Know the instruments: OMB A-11, SF-132 (apportionment request), SF-133 (execution report), GTAS submission",
      "Know OSO's position in this cycle: OSO submits to OFM (Caryn Kauffman), not directly to OMB — you manage the INTERNAL budget call",
      "Know that at any point you're running THREE fiscal years simultaneously: executing current, defending next year request, beginning formulation for year after",
      "Know the SEC-specific timing: OFM budget call goes out in Q4; President's Budget submitted to Congress in February",
    ],
    starModel: null,
    modelAnswer: `"I have worked every phase of the federal budget cycle across a 15-year career, from the internal budget call at the Army command level to OMB submission defense and congressional testimony support at the OSD Comptroller.

The cycle runs 18 to 24 months — at any given point we are simultaneously executing the current year, defending next year's request, and building formulation for the year after. Those three fiscal years run in parallel every day.

The cycle begins with OMB's Spring Guidance — typically March or April — which sets economic assumptions and policy parameters for the upcoming budget. Agencies then run internal budget calls: distributing submission templates to program offices and support organizations, collecting requirements, reconciling against prior-year actuals, and building cost justifications. At the OSD Comptroller I have been on the receiving end of those submissions from all Military Departments and Defense Agencies — I reviewed 40+ budget justification packages and issued Program Budget Decisions that directly shaped what went into the President's Budget.

The agency submission goes to OMB in September. OMB's Budget Examiners conduct their review, and the passback — typically November or December — returns OMB's marks: cuts, additions, and policy adjustments. Agencies can appeal through the Director's Review process but the OMB mark generally stands. I have coordinated reclama submissions and issue papers during that process at the DoD Comptroller.

The President's Budget submits to Congress in February. Congress acts through the appropriations process — committee markups, floor votes, conference — and enacts either a full appropriation or a continuing resolution. Once enacted, OMB apportions the funds via SF-132 by program, project, and activity. The CFO allots funds to program and support offices, and that allotment letter is the execution ceiling.

At OSO my role sits at the internal budget call level — submitting to OFM, not OMB. My job is to run the internal call for OSO's component offices, reconcile their submissions against prior-year BPPAS actuals, and deliver a clean package to OFM by the October 31st deadline.

Execution against the allotment is governed by 31 U.S.C. §1341. If obligations approach the apportionment, I notify Brian Williams and OFM immediately. If a violation has already occurred, §1351 requires simultaneous reporting to OIG, the agency head, OMB, and Congress. I know both statutes well — I have cited both in actual budget execution situations."`,
    traps: [
      "Describing only the OMB/congressional phase without the agency internal phase — the internal budget call is your actual job",
      "Not mentioning the apportionment step — that's the link between enacted appropriation and your execution authority",
      "Confusing OSO's role: OSO submits to OFM, not directly to OMB",
      "Leaving out execution — formulation is half the cycle; execution is where the legal risk lives",
      "Not knowing the key instruments by name: OMB A-11, SF-132, SF-133, GTAS",
    ],
  },

  // ── PAST SEC INTERVIEW QUESTIONS (Richard Bak Feb 2020 / Stephanie Lilly Feb 2020) ─
  {
    id: 19,
    category: "PAST · GENERIC",
    competency: null,
    color: T.gold,
    q: "What is your understanding of budget execution and formulation, and what is the difference between them?",
    intent: "Asked by Richard Bak (Feb 2020) — often the very first substantive question, used to calibrate your level before behavioral examples. Weak answers conflate the two phases or only describe one. Strong answers define each precisely, explain the relationship between them, and connect both to this specific role. The OSO angle: you are running the internal budget call (formulation) AND managing the allotment against obligations (execution) simultaneously.",
    keyPoints: [
      "Formulation = building the future-year funding request: internal budget call, cost basis, OMB submission, congressional justification via CBJ",
      "Execution = managing and obligating enacted funds in the current year against the apportioned allotment",
      "Critical link: formulation accuracy determines execution flexibility — over/under-estimates create ADA pressure or carryover risk",
      "ADA elevates execution to a legal function, not just a tracking function — 31 U.S.C. §1341",
      "OSO context: formulation = running OSO's internal budget call for OFM; execution = managing OSO office obligations against the allotment letter",
    ],
    starModel: null,
    modelAnswer: `"Formulation and execution are the two halves of the federal budget lifecycle, and I have worked both sides at every grade level from GS-11 to GS-15.

Formulation is the forward-looking phase: building the funding request for a future fiscal year. At the OSD Comptroller's office I reviewed over 40 sets of Service and Agency budget justification materials, issued Program Budget Decisions, and coordinated directly with OMB and congressional staff. The work is analytical and political simultaneously — you are building a defensible case for every dollar while anticipating what OMB will cut at passback and what Congress will modify in markup. At the internal level, formulation means running the budget call, reconciling submissions against prior-year actuals, and delivering a consolidated package that can withstand a department-level review. I have done that at the Army command level at the 8th Army G8.

Execution is the current-year phase: managing and obligating enacted funds against the apportioned allotment. At the DoD OIG I managed the agency's full execution cycle — obligation tracking by cost center and object class, monthly Status of Fund reporting, year-end closeout, and the internal controls that kept us ADA-compliant. At my current OSD Comptroller role I oversee $338B in execution analytics across 20 general ledgers.

The critical relationship between the two: formulation accuracy determines execution flexibility. An overestimated requirement produces carryover risk. An underestimated one produces September ADA pressure. My execution monitoring at the DoD OIG fed directly into the next year's formulation build — that feedback loop is what separates good budget management from reactive fire-fighting.

At OSO I would be running both simultaneously: executing FY2027 against the allotment while building the FY2028 budget call. The functions are inseparable and I am prepared for both."`,
    traps: [
      "Describing only formulation and skipping execution entirely",
      "Treating execution as 'just spending the money' without mentioning ADA compliance",
      "Not connecting formulation accuracy to execution outcomes — they're linked",
      "Missing OSO's specific role: OSO submits to OFM, not directly to OMB",
    ],
  },
  {
    id: 20,
    category: "PAST · PREFERENCE",
    competency: null,
    color: T.gold,
    q: "Between formulation and execution, which do you prefer — and why?",
    intent: "Asked by Richard Bak (Feb 2020). A self-awareness question that also tests honest self-assessment. There is no wrong answer, but 'I enjoy both equally' is the wrong answer — it reads as evasive. The panel wants genuine opinions backed by experience. They're also confirming your preference isn't incompatible with what the job actually requires. OSO/BMCB needs someone comfortable in execution day-to-day, with formulation season layered on top in Q4.",
    keyPoints: [
      "Give a REAL preference — 'I love both equally' signals you haven't thought about it",
      "Support your preference with a specific reason grounded in your actual work",
      "Immediately affirm competence in the non-preferred function",
      "If execution: connect to real-time problem-solving, ADA vigilance, stakeholder service under pressure",
      "If formulation: connect to analytical rigor, cost justification, strategic planning — then note OSO requires both equally",
    ],
    starModel: null,
    modelAnswer: `"Honest answer: I prefer execution — but my formulation record is where I've had the highest-visibility impact.

The reason I prefer execution is consequence timing. In formulation, the cost of an error is measured in months — you submit an inaccurate estimate in October and find out at the OMB passback in December whether it holds up. In execution, the cost of an error is measured in days. An unexpected obligation trajectory in August, an ADA threshold approached in September — those require immediate analysis, immediate notification, and immediate corrective action. That urgency suits my analytical instincts. I built automated monitoring tools at every assignment specifically because I wanted to know the execution position before anyone had to ask me.

That said, my most quantifiable impact has been in formulation. At the OSD Comptroller I reviewed over 40 budget justification packages, issued Program Budget Decisions, and contributed to over $2 billion in realignments across DoD portfolios. At the DoD OIG I helped recover an $87 million budget cut by developing the analytical response, data findings, and talking points that defended the agency's position through the department review. Those are formulation outcomes, and I'm proud of them.

The two functions reinforce each other. My execution monitoring data — the 18-month obligation patterns I build in every role — directly feeds my formulation estimates, which is why my year-end projections have consistently come within 2-3% of actual. If I under-invested in execution monitoring, my formulation would be guesswork.

For this role, I would bring both. The $145M carryover assumption in the FY2027 CBJ is a formulation decision I'll need to understand and manage against in execution. But if you want to know where I add the most value under daily pressure — it's building the monitoring infrastructure that makes execution predictable."`,
    traps: [
      "Saying 'I enjoy both equally' — non-committal and reads as evasive",
      "Picking a preference that conflicts with what the job requires ('I strongly prefer high-level formulation strategy')",
      "Not being able to explain why — the reasoning is more important than the choice",
      "Failing to affirm competence in the non-preferred function",
    ],
  },
  {
    id: 21,
    category: "PAST · TECHNICAL",
    competency: null,
    color: T.blue,
    q: "How do you manage a training and travel budget? How do you anticipate expenses throughout the year?",
    intent: "Asked by Richard Bak (Feb 2020). A technical execution question about two high-scrutiny discretionary categories — Training (OC 12.1) and Travel (OC 21.0) — that are easy to exhaust early and impossible to replenish in Q4. The anticipation piece is the key test: can you project the year-end position from early-year data and adjust before you hit a ceiling problem? Reactive management ('I monitor it') is not sufficient.",
    keyPoints: [
      "Establish office-level allocations at year start — know who owns what sub-ceiling, not just the aggregate",
      "Maintain a tracking log: employee, event, estimated cost, approval status, date — updated as obligations are processed",
      "Anticipate by mapping prior-year quarterly patterns to the current year; conference-heavy Q3 is the danger zone",
      "Early burn rate signals year-end position: 40% obligated by end of Q2 = likely fine; 70% = flag to office heads",
      "Maintain a mandatory vs. discretionary tier list — when ceilings tighten in Q4, you know what to defer",
    ],
    starModel: null,
    modelAnswer: `"At the 8th Army G8 I managed the training and travel budget as part of the command's $45M annual execution portfolio. The command had over 500 personnel, a mix of U.S. military, Korean augmentees, and contractors, with mandatory training requirements that were non-negotiable — language proficiency recertification, weapons qualification, leadership development programs — layered on top of conference travel and TDY.

My approach started at the beginning of the fiscal year: I sat with each program office to build a month-by-month training and travel calendar, mapping every known event by person, dates, estimated cost, and fund account. This gave me a projected OC 12.1 and OC 21.0 schedule, not just annual totals. I loaded everything into a tracking log in DTS-linked format and updated it weekly as travel orders were approved.

For anticipation I used two inputs. First, the prior-year quarterly pattern — at the 8th Army, Q1 and Q2 were training-heavy due to the mandatory certification cycle for Korean augmentees, which ran every October through January. I built that front-loaded pattern into the current-year projection so I wasn't surprised in February when the Q1 burn rate looked high. Second, I flagged any office that reached 60% of its T&T allotment by end of Q2 — that was my early-warning threshold for a potential Q4 shortfall.

The triage framework for Q3 and Q4 was simple: mandatory training (required by regulation or command order) gets funded first; discretionary professional development and optional conferences get reviewed against remaining allotment and deferred if needed. That decision rule was documented and communicated to program managers in writing at the start of the year, so there were no surprises when I had to say no to a conference request in September.

I also managed 1,100 Government Travel Card accounts and 32 DTS organizations. Delinquency rate dropped 40% over my tenure through the same proactive tracking approach. Ms. Sun Madaio can verify: DSN 315-723-6761."`,
    traps: [
      "Managing training and travel as one aggregate pool rather than office-by-office sub-allocations",
      "Reactive management — 'I monitor it and adjust as needed' with no anticipation mechanism",
      "Not distinguishing mandatory from discretionary — that triage framework is what makes Q4 manageable",
      "Forgetting the prior-year pattern analysis as the key predictive tool",
    ],
  },
  {
    id: 22,
    category: "PAST · BEHAVIORAL",
    competency: null,
    color: T.cyan,
    q: "How do you assist stakeholders at different staff levels — front-line program staff, mid-level managers, and senior leaders — with budget and financial management questions?",
    intent: "Asked by Richard Bak (Feb 2020). A communication and customer service question. The same information — the allotment balance — must be communicated completely differently to a GS-7 coordinator who needs a yes/no on a $500 purchase, and to Brian Williams who needs to know if OSO can sustain its Q4 mission. Candidates who give a single communication style for all levels have missed the point. Response time is as important as accuracy at the front-line level.",
    keyPoints: [
      "Front-line staff: fast, direct, procedural — yes/no + next step + documentation required, not a policy lecture",
      "Mid-level managers: balance + risk assessment + options — give them what they need to decide, not just the number",
      "Senior leaders: bottom line first, then supporting data, then options if action needed — they hunt for the headline",
      "Response speed matters at every level — being the person who answers fast is a competitive advantage",
      "OSO connection: Ray McInerney's FOIA staff process thousands of transactions; Katherine Taylor's security team operates 24/7 — financial questions escalate when fast answers aren't available",
    ],
    starModel: {
      situation: "What stakeholder situation required different communication approaches? What level were the people involved and what did each actually need?",
      task: "What financial information did each person need to make a decision — a transaction answer, a risk assessment, or a strategic recommendation?",
      action: "How did you tailor your response format and depth to each audience? What did you do differently for front-line staff vs. senior managers?",
      result: "Did the differentiated approach change how they engaged with the FM function — more proactive, fewer surprises, better compliance?",
    },
    modelAnswer: `"I have served stakeholders at every level from enlisted soldiers to Army generals and congressional staff, and the communication requirement is different at each level.

For front-line program staff — an Army program coordinator asking whether a GPC purchase for $800 in equipment is authorized — the answer needs to be fast, direct, and procedural. They do not need an OMB A-11 lecture. They need: 'Yes, that's OC 31.0 under your office's equipment sub-allotment. Submit the purchase request through GFEBS with the MIPR attached — I'll process it today.' Same-day, one clear next step.

For mid-level managers — an Army major at the 8th Army asking whether the command can absorb an additional Korean national hire before year-end — the response includes the current GFEBS obligation balance for the KN payroll account, the projected year-end position if the new hire onboards in August vs. October, and a flag if either scenario creates ADA risk against the OMA sub-allotment. I give them the number, the timing impact, and the risk context. I do not make the decision for them, but I give them everything they need to make it themselves.

For senior commanders and the CFO at DoD OIG — a briefing on execution status — the response leads with the headline in the first sentence: 'The agency is on track' or 'There is a concern in the R&D account that requires your attention before August 31.' Then the supporting data. Then options if action is needed. General officers and SES officials do not hunt for the bottom line — I put it in front of them first.

At the OSD Comptroller I now provide the same multi-level service to congressional staff, OMB analysts, and Service comptrollers. Each audience requires a different register. The measure of success is the same at every level: people contact me before they commit to something I can't support, because they know they'll get a fast and useful answer. Ms. Sun Madaio can verify: DSN 315-723-6761."`,
    traps: [
      "Describing one communication style for all levels — the differentiation is the entire point",
      "Being too technical with front-line staff — they need a yes/no and a next step",
      "Burying the headline for senior managers — they need the bottom line in the first sentence",
      "Not mentioning response speed — it is a quality indicator as important as accuracy",
    ],
  },
  {
    id: 23,
    category: "PAST · BEHAVIORAL",
    competency: null,
    color: T.red,
    q: "Give me an example of a time you sent out incorrect financial information. What happened and what was your remedy?",
    intent: "Asked by Richard Bak (Feb 2020). Specifically about EXTERNALLY transmitted wrong information — a report, a briefing, or an email that reached stakeholders with incorrect data they may have acted on. The additional dimension beyond the standard 'mistake' question: the correction must go to the same distribution as the original error, immediately. Quiet fixes are not corrections. The panel is testing: do you know the difference between correcting an error and managing an error?",
    keyPoints: [
      "The incorrect information was RECEIVED by others — not caught before it went out",
      "Immediate correction: same day, in writing, sent to the SAME distribution list as the original",
      "The correction document explicitly identifies what was wrong, what the correct information is, and why the error occurred",
      "Identify the root cause AND build the quality control step that would have caught it before transmission",
      "A quiet fix that doesn't reach everyone who received the wrong data is not a correction",
    ],
    starModel: {
      situation: "What was the incorrect information? What report, briefing, or communication contained it? Who received it and what might they have done with it?",
      task: "What was your obligation once you discovered the error? Who needed to know before you could issue a correction?",
      action: "How quickly did you issue the correction? Did it go to the full original distribution? What did the correction memo say? Did you call key recipients first?",
      result: "Was the incorrect data acted on before correction went out? What did you add to your production process to prevent recurrence?",
    },
    modelAnswer: `"In February 2019 at the DoD OIG, I distributed the monthly Status of Fund report to all program office chiefs on the 8th of the month. The report showed the Research and Development account with an available balance of $1.4M — enough, based on those numbers, to absorb a pending $900K contract modification one program manager had been waiting to execute.

She emailed me the same afternoon to confirm she could proceed. Before I responded, I ran a second reconciliation pass against STANFINS and caught the error: I had used the prior-month STANFINS extract rather than the current one, and a large obligation had posted between the two runs. The actual available balance was $340K — not $1.4M.

I did not respond to her email confirming the $900K. Instead I called her directly first — same afternoon, before close of business — to tell her verbally what had happened and to confirm she had not yet initiated the modification paperwork. She had not.

Within two hours I issued a written correction via email to the full distribution list — the same 12 program office chiefs who had received the original report. Subject line: 'CORRECTION — DoD OIG Status of Fund Report, February 2019.' The email identified exactly which figure was wrong, stated the correct balance, explained the cause (stale STANFINS extract used in template), and attached a corrected version of the full report.

I then added a mandatory pre-send step to my report production workflow: a Python script that validates the report's STANFINS extract date against the current calendar date and flags any report built on data more than 48 hours old. That check has run before every report distribution since.

Principle: the correction must be as visible as the error. Twelve people received the wrong data; twelve people received the correction — same channel, same urgency, same day. Ms. Nicole Dortch can verify: nicole.p.dortch.civ@mail.mil / 202-508-0612."`,
    traps: [
      "Quietly updating the file without formally notifying the original recipients",
      "Sending the correction only to the person who noticed, not the full distribution",
      "Not identifying the root cause — fixing the instance without closing the production gap",
      "Waiting to see whether anyone noticed before acting",
    ],
  },
  {
    id: 24,
    category: "PAST · TECHNICAL",
    competency: null,
    color: T.purple,
    q: "Describe your experience with payroll projections. How do you project personnel compensation costs and keep those projections accurate throughout the year?",
    intent: "Asked by Richard Bak (Feb 2020). Payroll (OC 11.1/11.3/11.9 + fringe OC 12.1) is 60-70% of any federal support office budget — the largest and most analytically complex line item. A candidate with no clear methodology here signals limited formulation depth. The panel wants a structured projection approach: base pay, step increases, hires/attrition, premium pay, fringe rate — and monthly updates during execution, not just an annual snapshot.",
    keyPoints: [
      "Components: base pay + locality + FERS + Medicare + FEHB employer share + premium pay (OC 11.9: overtime, Sunday differential, LEAP)",
      "OC breakdown: 11.1 (full-time permanent), 11.3 (other than full-time), 11.9 (other personnel compensation), 12.1 (fringe benefits at OPM-set rate)",
      "Projection methodology: current payroll register → WGI step increases on known dates → anticipated hires/separations at realistic fill rates → premium pay estimate → fringe rate applied",
      "Update monthly during execution — annual-only projections are wrong by Q2",
      "OSO: 732 FTE across Dir & Admin Support — payroll is your most consequential formulation task",
    ],
    starModel: null,
    modelAnswer: `"Payroll is where I have the deepest hands-on experience. At the 8th Army G8 in Korea I managed a $45M annual payroll program for over 500 personnel — U.S. military, Korean augmentee national workers, and civilian employees — with compensation structures ranging from standard GS pay tables to Korean national labor agreements with separate locality rates and benefit structures.

My projection methodology had four layers.

First, the base payroll register: every position, grade, step, and FTE status pulled from DCPDS, cross-referenced against the GFEBS fund allocation. I rebuilt this register quarterly because the command's TDA changed frequently — I processed over 300 TDA updates during my tenure and handled 900+ RPA actions.

Second, within-grade step increases. I mapped every WGI waiting period date in the register and added the pay differential to the out-year projection. For a command with 500+ personnel, this typically added 1.5 to 2 percent to the payroll baseline — enough to affect the Q4 execution picture if ignored.

Third, turnover modeling. Army commands have higher-than-average turnover, especially at the junior civilian grades. I built a vacancy rate model in Excel that used 18 months of historical separation data to project realistic fill rates by grade and office — not 100% fill, which is the most common formulation error in DoD payroll budgeting. That model was the primary driver of the 65% reduction in payroll excess I achieved — we stopped over-budgeting for positions that historically stayed vacant for 90+ days.

Fourth, Korean national labor cost forecasting. This was the most complex element — KN pay rates are set by the Status of Forces Agreement and subject to annual renegotiation. I coordinated directly with the SOFA labor office to get projected rate changes six months before they were finalized, then built range scenarios (low/mid/high) into the formulation submission.

I updated the projection monthly during execution. By end of Q2, my year-end payroll estimate was within plus or minus 2% of actual. Ms. Sun Madaio can verify: DSN 315-723-6761."`,
    traps: [
      "Describing payroll as 'entering numbers from HR' — the projection methodology is the skill being tested",
      "Not knowing the OC breakdown: 11.1 vs. 11.3 vs. 11.9 vs. 12.1 fringe",
      "Annual-only projections — wrong by Q2, the panel will notice",
      "Forgetting premium pay as a separate OC 11.9 line item",
    ],
  },
  {
    id: 25,
    category: "PAST · SITUATIONAL",
    competency: null,
    color: T.gold,
    q: "You're in a budget office. A program office submits a $1M mission support requirement. You know it wasn't approved in the enacted budget. How do you handle the request, and how do you communicate the answer?",
    intent: "Asked by Richard Bak (Feb 2020). A judgment and communication test. The wrong answer: 'I tell them no and move on.' The right answer: verify the status precisely (not funded vs. not allotted are different problems), communicate the reason not just the decision, and present every legitimate alternative path. The program office has a real mission requirement. Your job is to help them find a legal path to fund it — this year if possible, next year if not.",
    keyPoints: [
      "Verify FIRST: is it truly unfunded, or is it not yet allotted, or funded under a different appropriation account?",
      "Communicate in writing with the specific reason: not in enacted appropriation / not in current allotment",
      "Present every legitimate alternative: reprogramming action, reallocation from lower-priority, next-year formulation",
      "Help them build the FY2028 justification if genuinely unfundable this year — that is advisory FM work",
      "OSO connection: if McInerney's FOIA office submits a $1M tool requirement mid-year, your answer includes the formulation path, not just the denial",
    ],
    starModel: {
      situation: "What was the unfunded requirement? How did you verify it was truly not available — not just not allotted yet?",
      task: "What was your responsibility — communicate the decision only, or actively help identify alternative funding paths?",
      action: "How did you verify status, structure the communication, and present alternatives? Did you open the next-year formulation path?",
      result: "Did the program office find a path to fund the requirement? Did they come back with a stronger FY2028 submission?",
    },
    modelAnswer: `"Before I give any answer about an unfunded requirement I verify the status precisely, because 'it wasn't approved' has different meanings with different paths forward: not in the enacted appropriation, in the enacted appropriation but not yet allotted, or in the allotment but already committed elsewhere.

At the OSD Comptroller I have handled this situation at scale. During my three years as Senior Budget Analyst at the MPC Program and Budget office, I reviewed over 40 Service and Agency budget justification submissions and issued Program Budget Decisions that realigned and saved over $2 billion across DoD portfolios. Some of those decisions involved telling Services that a priority requirement was not going to be funded at the requested level — and then working with them to find alternative paths through the budget process.

For a $1M mission support requirement not in the enacted budget, my communication has three parts.

First, the factual status in writing, same day: 'This requirement is not funded in the enacted FY[X] appropriation. The current allotment does not have authority to support this obligation.' Clear, documented, no ambiguity.

Second, every legitimate alternative: Is there unobligated balance in the same appropriation account that could support a reprogramming action? Does the requirement fall under an existing contract vehicle or interagency agreement that has available ceiling? Is there a working capital fund or reimbursable mechanism that legally covers this type of expense? I research all three before I have the conversation, not during it.

Third, I open the next-year formulation path. If it is a genuine mission requirement that cannot be funded this year, I offer to help build the FY2028 justification — detailed cost basis, mission impact narrative, performance data to anchor the request. At the OSD Comptroller I have seen what makes a budget justification survive the OMB passback and what gets cut. A well-built submission for OSO's FY2028 budget call is something I can help construct.

What I do not do: give a verbal denial and consider the matter closed. The program office has a mission. My job is to help them find a legal path to accomplish it. Ms. Julie Bricker can verify: 703-587-9874."`,
    traps: [
      "Saying 'no' without presenting alternatives — that is transactional, not advisory",
      "Not verifying whether funds are truly unavailable vs. not yet allotted",
      "Proposing alternatives that are not legally viable given the appropriation structure",
      "Forgetting the next-year formulation path — if it is a legitimate requirement, help them get funded",
    ],
  },
  {
    id: 26,
    category: "PAST · BEHAVIORAL",
    competency: null,
    color: T.green,
    q: "Tell me about a creative or innovative idea you contributed that made a meaningful difference in your organization's financial management or operations.",
    intent: "Asked by Stephanie Lilly (Feb 2020). Tests initiative beyond the job description. 'Creative' in federal FM rarely means dramatic invention — it usually means: you saw a process everyone had normalized as broken, and you built something systematic to fix it. The 'meaningful difference' requires quantification or a clear before/after comparison. Candidates who can only describe tasks they were assigned are signaling execution-only experience.",
    keyPoints: [
      "'Creative' in FM context = seeing a gap others normalized and building a sustainable solution without being asked",
      "The initiative must have been yours — not a required corrective action or a leadership directive",
      "Quantify the impact: time saved, error rate reduced, compliance improved, ADA events prevented",
      "Sustainability test: is it still running? Was it adopted by others? Those details validate the idea",
      "OSO connection: frame what you would build here — the T&M ceiling dashboard, the monthly financial brief, the year-end execution tracker",
    ],
    starModel: {
      situation: "What problem did you observe that others had accepted as normal? How long had it persisted? What was the ongoing cost of not fixing it?",
      task: "Was this self-initiated or directed? What resources and authority did you have to work with?",
      action: "What did you build or change? What made the approach creative rather than obvious? How did you get others to adopt it?",
      result: "What changed, measurably? Is it still in use? Was it replicated or expanded beyond your office?",
    },
    modelAnswer: `"At the DoD Office of Inspector General, I identified a gap that had been accepted as normal: the agency had no consolidated spend plan model. Program offices tracked their own obligations in STANFINS, but there was no integrated view that showed the FM office — or the CFO — what the year-end execution position would look like across all accounts simultaneously. Every September was a reactive scramble.

No one had built the tool because building it required integrating STANFINS data across multiple fund accounts, object classes, and cost centers into a single coherent projection — and the previous approach had been to pull individual account reports manually.

I built a scenario-driven spend plan model in Excel VBA over a three-month period. The model automated the STANFINS data extract, structured it by cost center and object class, and generated month-by-month execution projections with a scenario function: program managers could toggle between base-case, accelerated-spending, and conservative-execution assumptions to see how year-end position changed under each scenario. The model updated in under five minutes from a fresh STANFINS extract.

The innovation was the scenario architecture. Previous spend plan tools just projected the current trajectory. Mine let the CFO office ask 'what if we freeze all discretionary obligations in October?' and see the impact on carryover before making the call. I presented three what-if scenarios during the FY2019 year-end review that directly informed the CFO's September obligation freeze decision.

Results: the agency entered year-end with a fully mapped obligation queue rather than a stack of surprise requests. Year-end close took 4 days instead of 11. Zero cost-center ADA events. The model was still in production use when I transitioned to the OSD Comptroller in 2020.

In my current role at the OSD Comptroller I have applied the same architecture at DoD enterprise scale — building a Department-wide Spend Plan Module that aligns planned funding with execution outcomes across 20 general ledgers and $338B in obligations. Ms. Nicole Dortch can verify: nicole.p.dortch.civ@mail.mil / 202-508-0612."`,
    traps: [
      "Describing a required corrective action or leadership directive as a 'creative idea'",
      "No measurable before/after — the panel needs to see the concrete impact",
      "A one-time fix rather than a sustained improvement",
      "Not connecting to what you would build at OSO — that framing shows the idea is transferable",
    ],
  },
  {
    id: 27,
    category: "PAST · BEHAVIORAL",
    competency: null,
    color: T.cyan,
    q: "Tell me about a time you were given an assignment with no training or background in that area. How did you approach it and what was the outcome?",
    intent: "Asked by Stephanie Lilly (Feb 2020). A variation of the 'new environment' question but with a harder constraint: zero institutional support. No predecessor, no SOP, no training course. Tests intellectual self-sufficiency — your ability to build competence from primary sources under time pressure. This scenario is common in federal FM: new OMB circulars, system migrations, mid-year reporting changes. The panel needs confidence that you don't stall when there is no one to ask.",
    keyPoints: [
      "Primary sources first: the authoritative regulation, system manual, OIG report, OMB circular — before asking colleagues",
      "Distinguish 'enough to act' (day 3) from 'deep competence' (week 6) — sequence your learning",
      "When you must ask, ask with specificity — bring what you already know and ask only what documentation couldn't answer",
      "Build your own SOP as you learn — it forces understanding of each step and is immediately useful to the organization",
      "OSO connection: Momentum, BPPAS, SEC-R 14-1 are not publicly documented — show you know how to build competence in a closed system",
    ],
    starModel: {
      situation: "What was the assignment and why were you given it despite having no background? What was the timeline and the stakes if you got it wrong?",
      task: "What did you need to be able to DO, and by when? What was the first concrete deliverable that would demonstrate competence?",
      action: "What did you read first? How did you sequence your learning — what comes before what? Who did you consult, and specifically what did you ask them that documentation could not answer?",
      result: "How quickly were you performing independently? What was the concrete measure — first deliverable submitted, first report accepted, first audit passed?",
    },
    modelAnswer: `"In October 2010 at AMCOM Aviation and Missile Command, Redstone Arsenal, I was designated as a power user and implementation lead for the GFEBS rollout — the Army's migration from legacy systems (STANFINS, SOMARDS) to the SAP-based enterprise financial system. I had no GFEBS training at the time of the designation. There was no predecessor to shadow. The legacy systems were being decommissioned on a fixed date. The first live obligation transactions had to post in GFEBS within 30 days.

Day one: I downloaded every available GFEBS user manual, the Army's GFEBS implementation guide from the DFAS website, and the system configuration documentation for AMCOM's specific module setup. I read the relevant sections — fund management, obligation processing, and the interface mapping between GFEBS and SPS, AXOL, and DTS — before touching the system.

Days two through four: I built a crosswalk between AMCOM's legacy fund codes and GFEBS accounting elements — fund, functional area, cost center, commitment item, and funds center. That mapping did not exist in any documentation; I derived it by reverse-engineering 12 months of STANFINS transaction history against the GFEBS chart of accounts.

Days five through ten: I ran parallel test transactions in the GFEBS training environment, posting the same obligations in both the legacy system and GFEBS, comparing outputs. I found three mapping discrepancies where the GFEBS posting logic differed from STANFINS in ways the user manual did not explain. I escalated those three items directly to the GFEBS Army Help Desk and received written workaround guidance within 48 hours.

By day 30, the first live GFEBS obligations posted cleanly. I then wrote the AMCOM-specific GFEBS SOP for obligation processing that became the training reference for the rest of the office. I was recognized with a cash award for the implementation work.

I applied the identical approach when I joined the DoD OIG in 2017 — primary sources first, build my own crosswalk, test in parallel, document the process. That method works every time I enter a new financial system environment. Ms. Elizabeth R. Bergmann can verify: elizabeth.r.bergmann.civ@mail.mil."`,
    traps: [
      "Waiting for someone to provide training before acting",
      "Reading secondary sources before primary — go to the regulation before the explainer",
      "Not building your own documentation — knowledge that exists only in your head doesn't help the organization",
      "A vague timeline — 'it took a while to get comfortable' is not a useful answer",
    ],
  },


  // ── NEW MULTI-PART QUESTIONS ─────────────────────────────────────────────────
  {
    id: 28,
    category: "MULTI-PART",
    competency: null,
    color: T.gold,
    q: "Walk me through your career progression from your earliest federal financial management role to today, and explain how each stage prepared you for this position. Then tell me: what is the one capability you have that most candidates at your experience level are unlikely to have?",
    intent: "A career narrative question that serves two purposes: (1) the panel is assessing whether you have a coherent story about why your path leads to this role, and (2) they want to know your differentiator. At SK-14, differentiation matters — the cert will be competitive. Do not just recite your resume. Show that each role built something specific that the next role required. The final part about unique capability is where you distinguish yourself from every other GS-13/14 who applied.",
    keyPoints: [
      "Do NOT read your resume — synthesize it. Each role should have one sentence: what you built or learned that the next role needed",
      "The arc should clearly end at 'and therefore I am uniquely suited to build OSO's FM program'",
      "Unique capability = data analytics applied to financial management. Most FM specialists can describe what a burn rate dashboard should do. You can build one.",
      "The GS-15 status is not a liability — frame it as: you've operated at scale, now you want to apply those capabilities with direct ownership",
      "Keep to 3 minutes. This is a setup answer, not the headline — save detail for the competency questions",
    ],
    starModel: null,
    modelAnswer: `"My career follows a deliberate arc from hands-on accounting to enterprise FM analytics, and every stage built something I needed for the next one.

I started in the Army as a finance specialist and then staff accountant — reconciling $200M+ in transaction records, building queries from scratch in legacy systems, learning that financial data quality is a discipline, not a given. That taught me what happens at the source level when people don't understand the system.

At AMCOM, Redstone Arsenal, I moved into budget and program analysis — managing a $200M+ multi-fund portfolio across O&M, Procurement, RDT&E, and FMS accounts. I led GFEBS implementation as a power user with no predecessor. That role taught me how to build competence in a closed financial system with no hand-holding, and how to manage programs where cost, schedule, and performance are interdependent.

At the 18th MP BDE and 21st TSC in Germany, I had my first full resource manager responsibility — executing GPC, GTC, DTS, and the full budget execution cycle. That's where I learned the internal control function as a practitioner, not an auditor.

At the 8th Army G8 in Korea, I managed a $45M payroll portfolio for 500+ personnel and achieved a 65% reduction in payroll excess through proactive data-driven monitoring. That role taught me what automated FM infrastructure can do that manual tracking cannot.

At the DoD OIG, I led the agency's financial management function while also performing COR duties and building the agency's first automated spend plan model. That's where FM analytics and internal controls merged for me.

At OSD Comptroller, I've been operating at DoD enterprise scale — $338B in obligations, 20 general ledgers, 30,000 users. I've built the monitoring and analytics infrastructure that supports CFO decision-making at the most senior level.

The one capability I have that most candidates at my experience level are unlikely to have: I can build the monitoring infrastructure myself. I don't need to request a data analyst or wait for an IT shop. Most senior FM professionals can describe what they need a dashboard to do. I can pull the Momentum data, write the logic, build the report, and deliver it to Brian Williams the next morning. That's not a common combination at this grade level."`,
    traps: [
      "Reading your resume verbatim — the panel already has it; they want synthesis",
      "Making the story too long — 3 minutes maximum, then move on",
      "Underselling the unique capability out of modesty — this is the moment to name it clearly",
      "Not connecting to OSO specifically — the arc should land on this role, not just 'senior FM'",
    ],
  },
  {
    id: 29,
    category: "MULTI-PART",
    competency: null,
    color: T.cyan,
    q: "You have one week before your first OSO month-end close. (a) Which of the four major OSO offices would you focus on financially first and why? (b) What are the three most important data pulls you'd make that week? (c) Walk me through what 'on track' versus 'at-risk' execution looks like for that office.",
    intent: "An OSO-specific knowledge and prioritization test. The panel is checking whether you know OSO's organizational structure, understand where the financial risk is concentrated, and can apply FM judgment before having any hands-on data. This is part knowledge, part analytical logic. There's a right answer to part (a): Security and Building Operations. That's where OIG-582 lives, that's the largest T&M contract concentration, and that's Katherine Taylor's portfolio — the highest financial stakes in OSO.",
    keyPoints: [
      "Part (a) answer is OSBO (Security and Building Operations) — OIG-582 targets this office directly, largest T&M contract exposure, physical security spans all SEC facilities",
      "Part (b) data pulls: Momentum YTD by OSBO cost center, SAM.gov T&M ceiling vs. actual for top OSBO contracts, GPC reconciliation status for OSBO accounts",
      "Part (c) on-track signals: OC 25.0 within ±8% of prior-year pace, T&M ceiling below 70% at mid-year, GPC current, COR logs submitted",
      "Part (c) at-risk signals: OC 25.0 running 15%+ above pace without explanation, any T&M ceiling above 85% before Q3, GPC past 5-day window, COR logs overdue 30+ days",
      "Connect OIG-582 explicitly — the panel will expect you to know this is NOT a generic FM answer, it's an OSO-specific one",
    ],
    starModel: null,
    modelAnswer: `"I'll take each part in order.

PART (a) — OFFICE PRIORITY:

Security and Building Operations — Katherine Taylor's OSBO portfolio — without question.

The reason is specific, not general. OIG Report 582 targeted OSO's T&M contract management — that finding was closed by early 2025, but the risk that drove it hasn't disappeared. Physical security guard services and facilities management contracts in OSBO-PSE remain OSO's largest T&M contract concentration. A closed finding doesn't mean a solved problem: if the corrective action controls have atrophied, OSBO is where the next T&M audit exposure would appear.

FOIA Services is a close second — Ray McInerney's operation has significant obligations and complex tool contracts. But OSBO carries the highest T&M contract risk concentration and the strongest audit history around it.

PART (b) — THREE DATA PULLS:

First: Momentum obligations year-to-date for all OSBO cost centers, broken out by object class and by contract vehicle. I want to see the OC 25.0 burn rate against the prior-year pattern for the same point in the year. Any divergence greater than 10% without a documented business reason is a flag.

Second: SAM.gov contract data for the three largest OSBO T&M vehicles — ceiling amount, period of performance, and actual spend to date. This is the OIG-582 Rec 1 deliverable in its most basic form: ceiling utilization rate per contract. If any contract is running above 80% utilization before Q3, that gets investigated before anything else.

Third: GPC reconciliation status for all OSBO cardholder accounts. I pull this third not because it's less important, but because it's the fastest to assess — either the accounts are reconciled within 5 days or they aren't. Any account past the 5-day window goes onto a call list the same day.

PART (c) — ON TRACK vs. AT RISK:

On track: OC 25.0 running within ±8% of the prior-year obligation pace at the same calendar date; the top three T&M contracts below 70% ceiling utilization at mid-year; all GPC accounts reconciled within the 5-day window; COR surveillance log submissions current within 30 days. No open OIG-582 corrective action items past their committed delivery date.

At risk: OC 25.0 running 15% or more above prior-year pace without a documented business reason — contract acceleration, scope expansion, or pricing change. Any T&M contract above 85% ceiling utilization before the start of Q3. Any GPC account more than 10 days past the reconciliation window. COR surveillance logs overdue by more than 30 days. Any of those four conditions sends a written flag to Brian Williams the same day I identify it, not after I've developed a corrective plan."`,
    traps: [
      "Not naming OSBO specifically — a generic 'I'd look at the highest-risk office' answer is not sufficient",
      "Missing the OIG-582 connection in part (a) — that's the specific reason OSBO is first",
      "Vague data pulls — 'I'd look at the financial data' without naming Momentum, SAM.gov, and specific metrics",
      "Not giving quantitative thresholds in part (c) — 'looks high' is not a monitoring framework",
    ],
  },
  {
    id: 30,
    category: "MULTI-PART",
    competency: null,
    color: T.purple,
    q: "Your background includes Python, Databricks, ADVANA, and data science capabilities well beyond what a traditional FM role requires. (a) How specifically would you apply those skills in this OSO/BMCB position? (b) What would you build that a traditional FM specialist might not think to build? (c) How would you ensure those capabilities serve Brian Williams' actual needs rather than becoming over-engineered distractions?",
    intent: "A panel question that probes whether your analytics capability is an asset or a risk in this role. The concern is real: a GS-15 data scientist applying for an SK-14 FM role might over-engineer everything and lose sight of the actual job. They need to see that you understand the purpose of the role — reliable financial management, OIG compliance, stakeholder service — and that your analytics skills are tools in service of that purpose, not the purpose itself. Part (c) is where most strong candidates lose points by not addressing the 'distraction' concern head-on.",
    keyPoints: [
      "Part (a): Specific OSO applications — automated Momentum pull for monthly brief, T&M dashboard, GPC compliance tracker, payroll projection model. Name the specific output for each.",
      "Part (b): The differentiator — anomaly detection on obligation patterns. Most FM specialists look at totals. You'd flag transactions that deviate from historical norms before they become findings.",
      "Part (c): Assessment before building. First 30 days = understand what Brian Williams actually reads vs. what exists on paper. Build the simplest version first. Success = he reads it monthly without needing me to explain it.",
      "Name your weakness explicitly: you have a tendency to over-engineer. Show you know it and have controls for it.",
      "The goal is not to impress the panel with your technical skills — it's to show your technical skills serve the FM mission.",
    ],
    starModel: null,
    modelAnswer: `"I'll take each part directly, including the uncomfortable one.

PART (a) — SPECIFIC APPLICATIONS AT OSO/BMCB:

Four concrete applications. First: automated Momentum data pull for the monthly financial status brief. Today that brief is probably produced by someone extracting data manually and formatting it by hand. I'd build a parameterized Python script that pulls the OSBO/OSO obligation data by cost center and OC in under five minutes and populates a pre-formatted brief template. Brian Williams gets the same report on the same date every month without me rebuilding it from scratch.

Second: T&M contract health dashboard — verifying whether the controls built to close OIG-582 are still running, or rebuilding them if they've atrophied. Monthly Momentum and SAM.gov pull, contract-by-contract ceiling utilization rate, COR surveillance log status. The finding is closed; the controls need to outlast the finding.

Third: GPC compliance tracker — weekly reconciliation status by cardholder, with automated flags at day 3 and day 5 of the reconciliation window. Not a manual check — a structured data pull from the GPC system.

Fourth: payroll projection model for OSO's workforce. My 8th Army model projected $45M in payroll within 2% accuracy annually. An OSO version would track vacancy rates, WGI dates, and projected hires to give OFM an accurate formulation number.

PART (b) — WHAT I'D BUILD THAT OTHERS WOULDN'T:

An anomaly detection layer. Most FM specialists look at burn rates and totals. I'd build a Python script that flags obligations that deviate from historical transaction patterns — the same vendor with a suddenly different OC code, obligations posting unusually close to the period of availability expiration, T&M invoice amounts clustering at the contract ceiling. These patterns appear in the data weeks before they generate an OIG finding. No one currently builds that for OSO. I have built it at DoD enterprise scale.

PART (c) — ENSURING IT SERVES BRIAN WILLIAMS, NOT MY INTERESTS:

This is the most important part of the question, and I want to answer it honestly.

My genuine professional weakness is over-engineering. I have built beautiful, comprehensive tools that were delivered three weeks after a simpler version would have served the need. I know this about myself.

My control for it: first 30 days are assessment only. Before I build anything, I sit with Brian Williams and ask two questions: what information do you currently wish you had but don't, and what information currently exists that you don't actually use? The gap between those two answers is my build list. I build only what's in that gap, starting with the simplest version that delivers the answer.

Success looks like Brian Williams reading the monthly brief without asking me to explain it, the T&M dashboard providing closure evidence for OIG-582, and the GPC tracker preventing a reconciliation exception before it appears in an audit. If he's not reading it, the tool failed regardless of how well I built it."`,
    traps: [
      "Answering part (c) weakly — 'I'd make sure to get feedback' is not enough; the panel needs to believe you won't over-engineer",
      "Not naming specific tools in part (a) — vague 'I'd apply my analytics skills' misses the point",
      "Overselling the tech and underselling the FM judgment — the analytics serve the FM mission, not the reverse",
      "Not acknowledging the over-engineering risk — failing to address the implicit concern in the question",
    ],
  },
  // ── HR / BEHAVIORAL QUESTIONS ─────────────────────────────────────────────────
  {
    id: 31,
    category: "HR · BEHAVIORAL",
    competency: null,
    color: T.green,
    q: "What is your greatest professional weakness?",
    intent: "A classic HR question that tests self-awareness and honesty. The panel knows this question is coming and they're scoring how authentic your answer is, not how polished it sounds. Three failure modes: (1) 'I work too hard' — nobody believes it; (2) a disqualifying weakness ('I sometimes miss deadlines'); (3) an answer so generic it signals no real self-reflection. The best answer: a specific, real weakness with a concrete example, followed by the actual steps you've taken to manage it — and honest acknowledgment that it's not fully resolved.",
    keyPoints: [
      "Name a REAL weakness — not a thinly disguised strength",
      "Give a specific example from your work history, not a hypothetical",
      "Describe the actual steps you've taken — not 'I'm working on it' but specific behavioral changes",
      "Acknowledge it's not fully resolved — that reads as honest, not weak",
      "Choose a weakness that is genuine but not disqualifying for FM work (e.g., not 'I sometimes miss deadlines')",
    ],
    starModel: null,
    modelAnswer: `"My genuine professional weakness is over-engineering analytical solutions — building comprehensive tools when a simpler, faster version would have served the immediate need better.

The clearest example: at the DoD OIG in 2018, I was assigned to build a spend plan model for the agency. I spent six weeks building a Python-powered, multi-scenario, STANFINS-linked system. The model was excellent. It was also three weeks late to be useful for the quarter it was meant to serve. A well-structured Excel workbook would have delivered 80% of the value in one week. The program offices needed something usable in October. I delivered something optimal in December.

I've put specific controls in place. Before I build anything now, I ask: what is the minimum output that solves the problem? Who is the actual user and how technical are they? What is the deadline before which something usable must exist? At OSO, that framework would mean: build the monthly financial brief in Excel first, automate it only after Brian Williams has confirmed the format is useful and the cadence works.

What I haven't fully solved: when I'm genuinely interested in a problem, I still occasionally build more than the situation requires. I notice it faster than I used to, and I have better controls for it. But I'm not going to claim it's gone, because it isn't."`,
    traps: [
      "'I work too hard' or 'I'm a perfectionist' — the panel has heard these hundreds of times and they signal low self-awareness",
      "A weakness that disqualifies you — 'I sometimes miss deadlines' or 'I struggle with numbers' would be problematic",
      "Being vague — 'I sometimes over-communicate' without a specific example and specific corrective action",
      "Claiming the weakness is fully resolved — that reads as dishonest and the panel knows it",
    ],
  },
  {
    id: 32,
    category: "HR · BEHAVIORAL",
    competency: null,
    color: T.green,
    q: "Tell me about a time you had a conflict with a colleague or teammate. What caused it, how did you handle it, and what was the outcome?",
    intent: "An interpersonal conflict question that tests emotional intelligence, professional maturity, and whether you can maintain working relationships under disagreement. The panel is not looking for candidates who have never had conflict — they're assessing whether you can disagree professionally, stay solution-focused, and preserve the relationship. Failure modes: (1) blaming the other person entirely; (2) describing a conflict that was really just a disagreement; (3) a resolution where you 'won' and the relationship didn't survive.",
    keyPoints: [
      "The conflict must be INTERPERSONAL — different from a compliance disagreement with a manager (Q14 covers that)",
      "Show that you understood the other person's perspective even when you disagreed with it",
      "The resolution must preserve the working relationship — both parties can continue to work together",
      "You do not have to have 'won' the disagreement — mature resolution often involves compromise or deferring to a supervisor",
      "Name specific actions you took to de-escalate, not just 'I remained professional'",
    ],
    starModel: {
      situation: "What was the context? Who was the colleague, what was the working relationship, and what triggered the conflict?",
      task: "What was at stake — the work product, the relationship, or both? What did each party need from the situation?",
      action: "What did you do specifically to address the conflict? Did you go to the person directly? Did you bring data? Did you involve a supervisor, and if so, at what point and why?",
      result: "What was decided? What happened to the relationship afterward? What would you do differently?",
    },
    modelAnswer: `"At the OSD Comptroller Program and Budget office in FY2022, I had a genuine conflict with a peer analyst — let's call him a counterpart from another branch — over a methodology difference that affected a significant Program Budget Decision.

We were both reviewing the same Service's budget request for a legacy system and its planned replacement. My counterpart's position: the replacement was fully funded, the legacy should be zeroed. My position: the replacement's funding profile was built on acquisition schedule assumptions that DoD's own program office data didn't support — and if the replacement slipped, which military acquisition programs frequently do, zeroing the legacy created an unfunded operational gap.

The conflict was real. He believed I was protecting a program that deserved to be cut. I believed he was accepting optimistic assumptions without stress-testing them. We both had legitimate analytical positions. We also both had significant ownership of our respective conclusions and had presented them to our supervisors.

What I did: I didn't argue with him directly. I wrote my risk assessment up formally — not as a refutation of his analysis, but as an addendum that documented the schedule assumptions embedded in his recommendation and their historical failure rate. I brought both documents to Ms. Julie Bricker and framed it explicitly: 'I'm not saying he's wrong. I'm saying there's a material risk the analysis doesn't capture and the PBD decision should account for it.'

Ms. Bricker reviewed both analyses and agreed the schedule risk was material. The PBD was modified to include a minimum sustaining level for the legacy program contingent on milestone performance.

My counterpart was professionally mature about the outcome. We continued working together without any persistent tension. He acknowledged later — when the replacement program did slip — that the risk assessment had been the right call. 

What I'd do differently: I waited too long before surfacing the disagreement to Ms. Bricker. I spent two days trying to resolve it bilaterally when the stakes were high enough to involve the supervisor earlier. Ms. Julie Bricker can verify: 703-587-9874."`,
    traps: [
      "Describing a conflict where you were clearly right and the other person was clearly wrong — that signals limited self-awareness",
      "Blaming the other person's personality rather than the substantive disagreement",
      "A resolution where the working relationship did not survive — that signals you can't manage interpersonal conflict professionally",
      "Describing a compliance disagreement rather than an interpersonal one — those are different questions",
    ],
  },
  {
    id: 33,
    category: "HR · BEHAVIORAL",
    competency: null,
    color: T.red,
    q: "Tell me about a professional failure — a time something you were responsible for didn't go as planned despite your best efforts. What happened, what did you do, and what did you take from it?",
    intent: "A failure question that tests honesty, accountability, and the ability to learn. The panel is explicitly not looking for a 'failure that was actually a success in disguise.' They want a real failure — something where the outcome was genuinely negative and you bore real responsibility for it. The quality of the answer is in the specificity of the learning, not the severity of the failure. Failure modes: (1) describing a trivial failure; (2) distributing blame across the team; (3) a learning so generic it could apply to any situation.",
    keyPoints: [
      "The failure must be REAL — not a 'failure' that was actually fine in the end",
      "You must own the failure — not 'the team failed' or 'the system failed'",
      "The impact must have been material — disruption to an office, a missed deadline with consequences, a corrective action required",
      "The learning must be SPECIFIC — not 'I learned to communicate better' but what you changed in your process",
      "Show the failure didn't recur — the new control is still running",
    ],
    starModel: {
      situation: "What were you responsible for? What was the context and what were the stakes?",
      task: "What were you expected to deliver, and by when? What were the consequences if it went wrong?",
      action: "What did you do — or fail to do — that caused the negative outcome? When did you realize it was going wrong? How did you respond once you knew?",
      result: "What was the actual negative outcome? How did you make it right? What specifically did you change so it wouldn't happen again?",
    },
    modelAnswer: `"In October 2015 at the 8th Army G8, I submitted a year-end carryover projection that was wrong by $1.2 million — and the error caused a three-week obligation freeze at the start of FY2016 that disrupted two program offices.

What happened: I had built a solid year-end execution model and I was confident in it. I ran my final update on September 20th using GFEBS data from that morning. I submitted my projection on September 27th. Between September 20th and September 27th, seven days of late-month obligations posted in GFEBS that I didn't capture in the update. My model showed projected carryover of $1.4 million. The actual carryover was approximately $200,000. The command had structured its FY2016 opening allotments around my $1.4M projection. When the actual numbers were reconciled in early October, two program offices had to freeze new obligations for three weeks.

I disclosed the error to Ms. Sun Madaio on October 6th, within 48 hours of discovering the discrepancy. I did not wait to understand the full cause before notifying her. The three-week freeze was operationally disruptive — one program office had a contractor start date that had to be pushed. That was a real cost, and my error contributed to it.

What I changed: I added a data freshness requirement to my year-end close checklist — the final carryover projection must be built from GFEBS data extracted no more than 24 hours before submission. I also added a reconciling step that cross-checks my projection against the OFM preliminary year-end report before it's submitted. If the two numbers diverge by more than 5%, I investigate the discrepancy before submitting.

The specific learning: I had a thorough process. The process didn't include a check for stale data, because I assumed freshness was handled upstream. It wasn't. I now treat data currency as an independent quality check — explicitly verified, not assumed. Both controls ran at every year-end close for the remainder of my 8th Army tenure. Ms. Sun Madaio can verify: DSN 315-723-6761."`,
    traps: [
      "A failure that was 'really a success' — 'I failed but the team learned so much' is not the answer",
      "Distributing blame — 'the system had a bug' or 'I wasn't given enough time' reduces the ownership",
      "A trivial failure — missing a minor deadline or a formatting error is not what the panel is asking about",
      "A generic learning — 'I learned to communicate better' without naming the specific behavioral change",
    ],
  },
  {
    id: 34,
    category: "HR · BEHAVIORAL",
    competency: null,
    color: T.gold,
    q: "You're currently a GS-15 Portfolio Manager at the OSD Comptroller. Why do you want this SK-14 position at the SEC, and why would you consider leaving a more senior federal role?",
    intent: "A direct challenge about grade and motivation that the panel will almost certainly ask. They want to know: (1) is this a desperation move or a genuine strategic choice? (2) do you understand what you're stepping into? (3) will you be bored or frustrated in six months? The worst answer: you downplay the grade difference or dodge the question. The best answer: address it head-on, explain the SK/GS pay comparison, and then make the substantive case for why this role is genuinely what you want right now.",
    keyPoints: [
      "Address the grade question FIRST and directly — SEC SK-14 compensation is competitive with GS-15; this is not a pay cut",
      "Then pivot to the substantive reason: you want direct FM program ownership, not enterprise oversight",
      "Name the 'enhance' mandate explicitly — this is a builder role, and that's what you want right now",
      "Connect to the OIG-582 corrective action opportunity — a concrete, tractable first deliverable you're excited about",
      "Do NOT say you want 'better work-life balance' or that your current role is 'too political' — neither plays well",
    ],
    starModel: null,
    modelAnswer: `"I want to address the grade question directly before anything else, because I expect it and it deserves a straight answer.

SEC's SK pay schedule is structured differently from the standard GS table. An SK-14 at Step 10 at the SEC is competitive with a GS-15 at the mid-steps in the Washington metro area. This is not a financial sacrifice. I verified that before I applied.

But the compensation answer is the least interesting part of my response. Here's the real one.

My current role at the OSD Comptroller is genuinely high-visibility work. I oversee analytics across $338 billion in obligations, manage a team of six, and provide CFO-level decision support at the most senior level in DoD. I am proud of that work.

What it is not: it is not a role where I own a financial management program end-to-end. I build infrastructure and tools that serve the enterprise. I do not personally serve the FOIA office chief or the Security and Building Operations director. I don't have a Brian Williams calling me when he needs to know if an August obligation puts the Q4 position at risk. The feedback loop between my work and its impact is six steps removed.

This role offers something my current role doesn't: complete, direct ownership of OSO's financial management program. The 'enhance' mandate tells me I'd be building something, not maintaining it. Brian Williams would be my primary client, and if the monthly financial brief isn't useful, I'd know within 30 days — not at the next enterprise reporting cycle.

I also came in knowing about OIG Report 582 — and that it was closed before April 2025. What interests me is what comes after closure: verifying the controls are still running, ensuring they're institutionalized rather than dependent on one person's memory, and building on that foundation. That's the kind of specific, hands-on FM ownership work I can't get at the enterprise oversight level I'm currently at.

I'm applying because this role offers the kind of hands-on FM program ownership and direct stakeholder impact that my current role, for all its scale and visibility, does not."`,
    traps: [
      "Dodging the grade question — address it directly and quickly, then pivot",
      "Saying the current role is 'too political' or that you want 'less pressure' — neither is a compelling reason",
      "Making it sound like a career setback you're rationalizing — own the choice as a strategic decision",
      "Not connecting to OSO specifically — a generic 'I want to do more hands-on work' is not sufficient for a GS-15 applying laterally",
    ],
  },
  {
    id: 35,
    category: "HR · BEHAVIORAL",
    competency: null,
    color: T.purple,
    q: "Describe a time when you felt genuinely overwhelmed at work — not just busy, but truly beyond your normal capacity. How did you respond and what did you learn about yourself?",
    intent: "A self-awareness and resilience question. The panel is not looking for someone who claims they never feel overwhelmed — that signals low self-awareness or dishonesty. They want to see: (1) honest acknowledgment that a situation was genuinely difficult, (2) deliberate triage decisions rather than reactive firefighting, and (3) a specific learning about your own stress response that you've actually applied. The worst answer is a story where everything was fine and you handled it perfectly — that's a workload management answer, not an overwhelmed answer.",
    keyPoints: [
      "The situation must be GENUINELY overwhelming — not just a busy week",
      "Acknowledge the emotional reality honestly — 'I was genuinely overwhelmed for several days' is more credible than 'I stayed calm'",
      "Show deliberate decision-making: triage by consequence, not by urgency; proactive stakeholder communication; scope reduction",
      "The learning must be about YOU — how you respond under stress, what signals you notice in yourself, what you do differently now",
      "This is different from the workload management competency question — that shows you handled everything perfectly; this shows you're human and self-aware",
    ],
    starModel: {
      situation: "What was the specific situation that pushed you past your normal capacity? What made it different from being just busy?",
      task: "What were all the competing demands? What would happen if each one was dropped?",
      action: "What was your internal response first — before you started problem-solving? Then, what deliberate decisions did you make? What did you ask for, defer, or renegotiate?",
      result: "What was the actual outcome? What did you learn about how YOU specifically respond under genuine overload — and what do you do differently now because of it?",
    },
    modelAnswer: `"In the spring of 2023, my team at the OSD Comptroller hit a six-week period where four major deliverables converged simultaneously in a way we had not planned for.

We had the ADVANA platform integration for two additional service general ledgers — committed delivery to the Department CFO. We had the quarterly DARQ application enhancement cycle with a Congressional reporting deadline. We had an emergency data call from the Deputy Secretary's office — a $338B obligation trend analysis turned into a 48-hour sprint with almost no warning. And two members of my six-person technical team went on medical leave simultaneously during the critical stretch.

The honest answer is that I was genuinely overwhelmed for about four days in the middle of that period. Not 'it was very busy.' Genuinely, I didn't know how we were going to close all four, and I was spending more time recalculating whether it was possible than actually working on the problems.

I called a 30-minute team meeting on day two of the crunch and laid out the situation transparently — here are the four deliverables, here are the real deadlines, here's what I think happens to each one if it's missed. We triaged collectively. The Deputy Secretary's data call got full-team priority for 48 hours because the consequence of missing it was immediate and visible at the highest level. The GL integration got an extension — I sent that email to the CFO shop myself, with a clear explanation, before it became a missed deadline. The DARQ cycle was scoped to the minimum defensible deliverable. Everything closed.

But the more important part of your question is what I learned about myself. The thing I noticed — and I've thought about this since — is that my signal of genuine overload isn't anxiety or paralysis. It's that I start recalculating feasibility instead of executing. I noticed that about myself during those four days. Once I named it and stopped recalculating, I started moving again.

What I do differently now: when I notice I'm spending time on 'can we do this' instead of 'how do we do this,' I treat that as the signal to stop, write down every thread and its actual consequence, and triage before executing. The triage takes 20 minutes. The recalculation loop can take days. Ms. Kate Sieve can verify: 703-697-4649."`,
    traps: [
      "Describing a situation where you handled everything perfectly — that's a workload management answer, not an overwhelmed answer",
      "Not acknowledging the emotional reality — 'I just buckled down' without admitting it was hard signals low self-awareness",
      "A learning so generic it could apply to anyone — 'I learned to prioritize' is not a specific insight about yourself",
      "A situation that sounds more like normal busyness — the panel is asking about genuine capacity overload, not just a full calendar",
    ],
  },

  {
    id: 10,
    category: "CLOSING",
    competency: null,
    color: T.green,
    q: "Do you have any questions for us?",
    intent: "This is your final impression. Questions that demonstrate source-level research — specific to OSO's actual situation — signal that you've done the work and are serious. Generic questions about benefits or growth opportunities signal the opposite.",
    keyPoints: [
      "Ask about OIG-582 corrective action status — shows you know the report and care about it",
      "Ask about the FY2028 carryover assumption — shows you read the CBJ",
      "Ask about what 'success at 12 months' looks like — positions you as results-oriented",
      "Ask about the relationship between BMCB and OFM — shows you understand the coordination dependency",
      "Maximum 3 questions. Ask the ones most important to you — not all 5",
    ],
    modelAnswer: `1. "OIG Report 582 was closed — all three recommendations were implemented with OIG concurrence before April 2025, and the December 2025 MPC no longer lists it as an outstanding management concern. My question is about what comes next: what specific controls were put in place to close the three recommendations, are they still running today, and has there been any internal review to verify the corrective actions have been sustained rather than atrophied since closure?"

2. "The FY2027 net request assumes $145 million in carryover from FY2026 — which implies a specific execution level this fiscal year. Has OSO's year-to-date execution been tracking in a way that supports that projection, or is there pressure on that assumption that would affect the financial management picture going into FY2027?"

3. "What does success look like for this position at 12 months — what specific capability or process improvement would tell you that the financial management program has been meaningfully enhanced?"`,
    traps: [
      "Asking about salary, benefits, telework, or work schedule",
      "Asking a question that was already answered during the interview",
      "Generic questions: 'What's the team culture like?'",
      "More than 3 questions — you're not the interviewer",
    ],
  },
];

// ─── DATA: ACCOMPLISHMENT RECORD BUILDER ─────────────────────────────────────
const AR_TEMPLATES = [
  {
    competency: "Financial Management",
    color: T.gold,
    icon: "💰",
    wordLimit: 300,
    sections: [
      { label: "Competency Title", placeholder: "Financial Management", hint: "Write exactly as listed in the announcement" },
      { label: "Position Title & Dates", placeholder: "e.g. Budget Analyst, SK-560-13, Jan 2022 – Present", hint: "Must match your resume exactly" },
      { label: "Situation (Challenge / Problem)", placeholder: "Describe the financial management gap, organizational complexity, or problem you inherited or identified. Be specific about: dollar value, number of offices, what was broken or missing.", hint: "Set the stage — what was at stake?" },
      { label: "Actions Taken", placeholder: "Walk through the full FM lifecycle: How did you manage formulation? What tracking/reporting systems did you build? How did you serve non-financial managers? How did you handle year-end?", hint: "Name specific systems, tools, dollar amounts" },
      { label: "Outcome / Results / Long-Term Impact", placeholder: "Quantify: zero ADA violations for X years, carryover projection accuracy improved from ±X% to ±Y%, monthly reporting established, OIG finding closed in X days.", hint: "Must be measurable. If no ADA violations, SAY THAT." },
      { label: "Verifier Name & Email", placeholder: "First Last, firstname.last@agency.gov", hint: "They may actually contact this person — must be reachable and current" },
    ],
  },
  {
    competency: "Financial Data Analysis and Reporting",
    color: T.blue,
    icon: "📊",
    wordLimit: 300,
    sections: [
      { label: "Competency Title", placeholder: "Financial Data Analysis and Reporting", hint: "Write exactly as listed in the announcement" },
      { label: "Position Title & Dates", placeholder: "e.g. Financial Management Analyst, GS-501-13, Mar 2021 – Dec 2023", hint: "Must match your resume exactly" },
      { label: "Situation (Challenge / Problem)", placeholder: "What triggered the analysis? A pattern you noticed in routine monitoring? An OIG inquiry? Leadership question? Describe what was unknown and why it mattered.", hint: "This must be a STUDY — not routine reporting" },
      { label: "Actions Taken", placeholder: "What data did you pull (name systems: Momentum, BPPAS, SAM.gov, etc.)? How did you structure the analysis? How did you present findings — one-pager, briefing, memo? To whom?", hint: "Be specific about data sources and presentation format" },
      { label: "Outcome / Results / Long-Term Impact", placeholder: "What management decision resulted from your analysis? What would NOT have happened without it? Was a violation prevented? Was a process changed? Was money recovered?", hint: "The 'so what' is mandatory — analysis without impact doesn't count" },
      { label: "Verifier Name & Email", placeholder: "First Last, firstname.last@agency.gov", hint: "Someone who saw you present the findings or acted on them" },
    ],
  },
  {
    competency: "Internal Controls and Compliance",
    color: T.cyan,
    icon: "⚖️",
    wordLimit: 300,
    sections: [
      { label: "Competency Title", placeholder: "Internal Controls and Compliance", hint: "Write exactly as listed in the announcement" },
      { label: "Position Title & Dates", placeholder: "e.g. Budget Analyst, GS-560-12, Aug 2020 – Jun 2022", hint: "Must match your resume exactly" },
      { label: "Situation (Challenge / Problem)", placeholder: "What control gap existed? OIG finding? FMFIA material weakness? Internal audit recommendation? What was the risk if it continued — ADA exposure, improper payments, audit escalation?", hint: "Name the specific statutory or regulatory framework at risk (OMB A-123, FMFIA, ADA)" },
      { label: "Actions Taken", placeholder: "How did you design the corrective control? What made it SUSTAINABLE (automated triggers, embedded in workflow) rather than a one-time fix? How did you document it for audit purposes? What was the closure package?", hint: "OIG closure = documented CAP + implementation evidence + sustainability demonstration" },
      { label: "Outcome / Results / Long-Term Impact", placeholder: "Was the OIG recommendation closed? What was the compliance rate before vs. after? Was the control still operating at the next audit cycle? Was a material weakness prevented?", hint: "If OIG closed the finding, say so explicitly — that's the gold standard" },
      { label: "Verifier Name & Email", placeholder: "First Last, firstname.last@agency.gov", hint: "OIG liaison, supervisor, or audit contact who can verify the closure" },
    ],
  },
  {
    competency: "Workload Management",
    color: T.purple,
    icon: "⏱️",
    wordLimit: 300,
    sections: [
      { label: "Competency Title", placeholder: "Workload Management", hint: "Write exactly as listed in the announcement" },
      { label: "Position Title & Dates", placeholder: "e.g. Financial Analyst, SK-501-13, Oct 2022 – Present", hint: "Must match your resume exactly" },
      { label: "Situation (Challenge / Problem)", placeholder: "Describe what was already on your plate AND what arrived unexpectedly. Give the panel a sense of the pressure — multiple hard deadlines, each with real consequences if dropped.", hint: "The 'unforeseen development' is required — something that arrived unexpectedly mid-execution" },
      { label: "Actions Taken", placeholder: "How did you triage? Show the framework: what did you do first and WHY (by consequence, not by loudness). What did you delegate, defer, or compress? What communication did you proactively make to stakeholders about timeline?", hint: "Triage framework = the panel scores you on the decision logic, not just the outcome" },
      { label: "Outcome / Results / Long-Term Impact", placeholder: "Every thread resolved without missed deadlines. What did you put in place afterward to prevent the same collision from recurring? (A system, a calendar, a protocol)", hint: "The process improvement shows this was a learning, not just luck" },
      { label: "Verifier Name & Email", placeholder: "First Last, firstname.last@agency.gov", hint: "Someone who witnessed the triage and the outcomes" },
    ],
  },
];

// ─── DATA: 90-DAY PLAN ────────────────────────────────────────────────────────
const PLAN_90 = [
  {
    phase: "Days 1–30: ASSESS",
    color: T.gold,
    subtitle: "Listen first. Map the current state. Build credibility before building anything.",
    items: [
      { action: "Sit with Brian Williams: explicit conversation about what 'enhanced' means to him", priority: "DAY 1", outcome: "Understand the specific gaps he wants closed" },
      { action: "Pull 6 months of Momentum data for all OSO cost centers — map actual obligation patterns", priority: "WEEK 1", outcome: "Baseline financial picture before anyone tells me what it looks like" },
      { action: "Pull OIG-582 corrective action closure documentation — verify all 3 recommendations were implemented and controls are still running", priority: "WEEK 1", outcome: "Know what was built to close 582 and whether it's still operational" },
      { action: "Meet individually with each OSO office head: McInerney (OFS), Taylor (OSBO), Pomicter, Coleman (Records)", priority: "WEEK 2", outcome: "Understand their financial pain points and upcoming plans" },
      { action: "Audit all active GPC accounts — reconciliation status, limit compliance, OC coding", priority: "WEEK 2", outcome: "Identify any A-123 compliance gaps from day one" },
      { action: "Request SEC-R 14-1 (Administrative Control of Funds) and OFM Allotment Letter from OFM", priority: "WEEK 1", outcome: "Get the internal documents that govern how Momentum works at SEC" },
      { action: "Introduce self to OFM Planning & Budget contact — establish the reporting relationship", priority: "WEEK 1", outcome: "OFM knows who to call; I know who to call" },
      { action: "Deliver first assessment memo to Brian Williams: current state, top 3 gaps, proposed priorities", priority: "DAY 30", outcome: "Brian Williams approves the 60-day work plan" },
    ],
  },
  {
    phase: "Days 31–60: BUILD",
    color: T.blue,
    subtitle: "Build the baseline infrastructure. Get OIG-582 corrective action formally documented.",
    items: [
      { action: "Build OSO allotment burn rate dashboard (Momentum data → weekly update → Brian Williams access)", priority: "BY DAY 45", outcome: "Brian Williams has real-time visibility without asking me" },
      { action: "Verify OIG-582 corrective action sustainability: T&M ceiling utilization dashboard still running? COR surveillance logs still submitted monthly? Contract type decision matrix still in use?", priority: "BY DAY 45", outcome: "Written sustainability assessment to Brian Williams — controls institutionalized or gaps identified" },
      { action: "If T&M controls from OIG-582 have atrophied: rebuild and document. If still operational: enhance and automate. Either way, deliver Brian Williams a T&M contract health dashboard.", priority: "BY DAY 60", outcome: "T&M monitoring infrastructure verified operational or rebuilt with documented controls" },
      { action: "Draft monthly financial status brief template; deliver first brief to Brian Williams and William Buckley", priority: "BY DAY 45", outcome: "Establish the monthly reporting rhythm immediately" },
      { action: "Conduct GPC oversight review — write up findings for Brian Williams", priority: "BY DAY 45", outcome: "Any A-123 gaps surface before OIG does" },
      { action: "Coordinate with Office of Acquisitions on contract type decision matrix for new acquisitions", priority: "BY DAY 60", outcome: "OIG-582 Rec 2 framework documented" },
      { action: "Build COR surveillance log template and submit draft SOP for Brian Williams review", priority: "BY DAY 60", outcome: "OIG-582 Rec 3 infrastructure underway" },
      { action: "Support FY2028 formulation season: distribute budget call to OSO office heads, track submissions", priority: "OCTOBER 31 DEADLINE", outcome: "Budget call coordination from day one" },
    ],
  },
  {
    phase: "Days 61–90: DELIVER",
    color: T.green,
    subtitle: "Demonstrate value. First deliverables in hand. Report to Brian Williams on the roadmap.",
    items: [
      { action: "Deliver first full monthly financial status brief — OIG-582 section, burn rates, GPC status, pending actions", priority: "MONTH 3", outcome: "Brian Williams' primary financial visibility tool operational" },
      { action: "Deliver T&M contract health dashboard — whether rebuilt or verified-and-enhanced from the OIG-582 corrective actions — showing 3 months of data", priority: "BY DAY 90", outcome: "T&M monitoring operational and documented for any future OIG review" },
      { action: "Brief Brian Williams and William Buckley on 90-day status: what's been built, what's next, 6-month roadmap", priority: "BY DAY 90", outcome: "Leadership alignment on priorities going forward" },
      { action: "Compile FY2028 formulation package from OSO office submissions; deliver to OFM", priority: "BY NOVEMBER", outcome: "First formulation season managed end-to-end" },
      { action: "Run first formal OSO internal control mini-assessment per OMB A-123 framework", priority: "BY DAY 90", outcome: "FMFIA annual assessment inputs ready" },
      { action: "Deliver OIG-582 sustainability memo to Brian Williams: controls verified operational, gaps found and addressed, 12-month maintenance plan documented", priority: "BY DAY 90", outcome: "OIG-582 corrective actions confirmed durable — not dependent on institutional memory" },
      { action: "Establish quarterly schedule with each OSO office head for financial planning conversations", priority: "BY DAY 90", outcome: "Institutional cadence set — not dependent on me asking every time" },
    ],
  },
];

// ─── DATA: QUESTIONS TO ASK ───────────────────────────────────────────────────
const PANEL_QUESTIONS = [
  {
    q: "OIG Report 582 was closed before April 2025 — all three recommendations were implemented with OIG concurrence and it no longer appears in the December 2025 MPC as an outstanding concern. My question is about what comes next: what specific controls were put in place, are they still running today, and are there open deliverables with OIG, and is building the surveillance infrastructure a priority you'd want to see from this role in the first 90 days?",
    why: "Shows you verified the current status from primary sources — not just that the report existed, but that it was closed. Demonstrates research rigor. Shifts the conversation from 'will you close it' to 'how do you sustain what was built' — a more sophisticated question.",
    risk: "NONE — this is exactly the right question. The panel will respect it.",
  },
  {
    q: "The FY2027 net request assumes $145 million in carryover from FY2026 — based on the CBJ's Request Summary of Changes table. Has OSO's FY2026 execution been tracking in a way that supports that projection, or is there pressure on that assumption?",
    why: "Shows you read the CBJ to page 6 and understood the carryover mechanics. Signals analytical depth. Directly relevant to what your financial management function will inherit.",
    risk: "LOW — demonstrates CBJ-level preparation. May prompt a technical conversation you should welcome.",
  },
  {
    q: "What does success look like for this position at the 12-month mark — what specific capability or process improvement would tell you that the financial management program has been meaningfully enhanced?",
    why: "Positions you as results-oriented. Invites Brian Williams to define his own success criteria so you can align to them explicitly.",
    risk: "NONE — universally well-received closing question.",
  },
  {
    q: "The BMCB is simultaneously hiring for a Continuity Management and Program Analyst. How do you see the Financial Management Specialist and that continuity role working together — are they distinct lanes or will there be collaboration on the COOP financial dimensions?",
    why: "Shows you found the companion posting. Demonstrates awareness of BMCB's dual mission. Practical question about your working environment.",
    risk: "LOW — may generate useful information about team structure.",
  },
  {
    q: "With the SEC's AI Task Force now active and the FY2027 CBJ specifically calling for Commercial Off-the-Shelf technology adoption — is BMCB planning any AI-enabled tools for financial management or continuity functions in FY2027?",
    why: "Signals tech-forward orientation aligned with Atkins administration priorities. Shows CBJ literacy. Opens a discussion where you can position your own AI capabilities.",
    risk: "LOW-MEDIUM — answer may be classified or TBD. Be ready to follow up with 'I'd welcome the opportunity to contribute to that planning.'",
  },
];

// ─── DATA: CRITICAL DISTINCTIONS ─────────────────────────────────────────────
const DISTINCTIONS = [
  { is: "OSO's internal budget manager", isNot: "The SEC's CFO or agency-wide budget lead" },
  { is: "Financial advisor to FOIA, Security, Facilities, Records office heads", isNot: "Policy-setter for SEC-wide financial management" },
  { is: "The person who tracks guard service and FOIA processing tool costs", isNot: "The person who manages enforcement or examination budgets" },
  { is: "Responsible for OIG-582 corrective actions within OSO", isNot: "Responsible for the full agency contract management program" },
  { is: "Financial conduit between OSO offices and OFM (Caryn Kauffman)", isNot: "The CFO of the SEC" },
  { is: "A builder of OSO's financial management infrastructure", isNot: "A policy analyst or congressional budget strategist" },
  { is: "SK-14 (excepted service, NTEU Chapter 293)", isNot: "SES or political appointee" },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.14em",
                    color: T.muted, textTransform: "uppercase", marginBottom: 12,
                    display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ height: 1, width: 20, background: T.border }} />
        {label}
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
      {children}
    </div>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.1em",
                   padding: "3px 8px", borderRadius: 3,
                   background: (color || T.blue) + "20",
                   color: color || T.blue, whiteSpace: "nowrap" }}>{label}</span>
  );
}

function Btn({ children, active, color, onClick, small }) {
  const c = color || T.blue;
  return (
    <button onClick={onClick}
      style={{ background: active ? c + "25" : "transparent",
               color: active ? c : T.muted, border: `1px solid ${active ? c + "60" : T.border}`,
               borderRadius: 6, padding: small ? "5px 12px" : "7px 18px",
               fontSize: small ? 11 : 12, fontWeight: 700, cursor: "pointer",
               transition: "all 0.15s", letterSpacing: "0.02em" }}>
      {children}
    </button>
  );
}

// ─── PAGE: OVERVIEW ───────────────────────────────────────────────────────────
function PageOverview() {
  const isMobile = useMobile();
  return (
    <div>
      <Section label="Position At a Glance">
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {[
            ["Grade", JOB.grade, T.gold],
            ["Hiring Manager", JOB.hiringManager, T.blue],
            ["Command Chain", JOB.chain, T.cyan],
            ["Location", JOB.location, T.purple],
            ["Union", "NTEU Chapter 293", T.green],
            ["Announcement", "USAJOBS #862266600", T.sub],
          ].map(([k, v, c], i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`,
                                   borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${c}` }}>
              <div style={{ fontSize: 15, color: T.muted, fontWeight: 600,
                             letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 20, color: T.text, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="The Critical Reframe — Read This First">
        <div style={{ background: T.card, border: `1px solid ${T.gold}40`,
                       borderRadius: 10, padding: "16px 18px" }}>
          <div style={{ fontSize: 18, color: T.gold, fontWeight: 700, marginBottom: 10 }}>
            ⚠️ THIS IS NOT A CFO-LEVEL POSITION
          </div>
          <div style={{ fontSize: 18, color: T.sub, lineHeight: 1.75, marginBottom: 14 }}>
            {JOB.summary}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
            {DISTINCTIONS.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 0, borderRadius: 7, overflow: "hidden",
                                     fontSize: 17, border: `1px solid ${T.border}` }}>
                <div style={{ background: T.green + "15", padding: "8px 10px", flex: 1, lineHeight: 1.4,
                               color: T.text, borderRight: `1px solid ${T.border}` }}>
                  <span style={{ color: T.green, fontWeight: 700 }}>IS: </span>{d.is}
                </div>
                <div style={{ background: T.red + "10", padding: "8px 10px", flex: 1, lineHeight: 1.4,
                               color: T.sub }}>
                  <span style={{ color: T.red, fontWeight: 700 }}>NOT: </span>{d.isNot}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section label="Four Competencies (Verbatim from Announcement)">
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {JOB.competencies.map((c, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${c.color}30`,
                                   borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.name}</div>
              </div>
              <div style={{ fontSize: 17, color: T.sub, lineHeight: 1.6, fontStyle: "italic" }}>
                "{c.def}"
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Accomplishment Record Requirements (Verbatim)">
        <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.red}40`, padding: "16px 18px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.red, marginBottom: 10 }}>
            🚨 CRITICAL — Failure to comply = automatic IFFM (ineligible)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {JOB.criticalWarnings.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start",
                                     background: T.red + "12", borderRadius: 6, padding: "8px 10px" }}>
                <span style={{ color: T.red, fontWeight: 700, flexShrink: 0 }}>⚠</span>
                <span style={{ fontSize: 17, color: T.sub, lineHeight: 1.5 }}>{w}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 8 }}>
            Required format for each narrative:
          </div>
          {JOB.accomplishmentFormat.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0",
                                   borderBottom: i < JOB.accomplishmentFormat.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <span style={{ width: 20, height: 20, background: T.blue + "25", color: T.blue,
                              borderRadius: "50%", display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 18, color: i === JOB.accomplishmentFormat.length - 1 ? T.red : T.text,
                              fontWeight: i === JOB.accomplishmentFormat.length - 1 ? 700 : 400 }}>{f}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Rating Scale">
        <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
          {JOB.ratings.map((r, i) => (
            <div key={i} style={{ flex: 1, background: T.card, borderRadius: 8, padding: "12px 14px",
                                   borderTop: `3px solid ${r.color}` }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: r.color, marginBottom: 6 }}>{r.label}</div>
              <div style={{ fontSize: 17, color: T.sub, lineHeight: 1.55 }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 17, color: T.muted, fontStyle: "italic" }}>
          Target: Highly Qualified — the only category that gets referred to Brian Williams for interview. Well Qualified may or may not make the cert depending on applicant pool size.
        </div>
      </Section>
    </div>
  );
}

// ─── PAGE: INTERVIEW QUESTIONS ────────────────────────────────────────────────
function PageQuestions() {
  const isMobile = useMobile();
  const [active, setActive] = useState(0);
  const [tab, setTab]       = useState("answer");
  const [expandedQ, setExpandedQ] = useState(null);
  const q = QUESTIONS[active];

  // Shared content renderer — used by both desktop detail panel & mobile accordion
  const TabContent = ({ question, activeTab }) => (
    <>
      {activeTab === "intent" && (
        <div style={{ background: T.card, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.gold, marginBottom: 8 }}>
            🎯 What the panel is actually evaluating
          </div>
          <div style={{ fontSize: 18, color: T.sub, lineHeight: 1.75 }}>{question.intent}</div>
        </div>
      )}
      {activeTab === "keypoints" && (
        <div style={{ background: T.card, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: question.color, marginBottom: 10 }}>
            ✅ Must include to score Highly Qualified
          </div>
          {question.keyPoints.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ color: question.color, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>▸</span>
              <span style={{ fontSize: 18, color: T.text, lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </div>
      )}
      {activeTab === "star" && question.starModel && (
        <div style={{ background: T.card, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: question.color, marginBottom: 10 }}>
            📋 STAR Framework — build your narrative here
          </div>
          {Object.entries(question.starModel).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: question.color, marginBottom: 4,
                             textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {k === "situation" ? "S — Situation" : k === "task" ? "T — Task" :
                 k === "action" ? "A — Actions" : "R — Result"}
              </div>
              <div style={{ fontSize: 18, color: T.sub, lineHeight: 1.65, fontStyle: "italic" }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      {activeTab === "answer" && (
        <div style={{ background: T.card, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.green, marginBottom: 10 }}>
            💬 Model Answer — adapt with your specific experiences
          </div>
          <div style={{ fontSize: 18, color: T.text, lineHeight: 1.8, whiteSpace: "pre-line",
                         fontFamily: "'IBM Plex Mono', monospace", background: T.dim,
                         borderRadius: 8, padding: "14px 16px" }}>
            {question.modelAnswer}
          </div>
        </div>
      )}
      {activeTab === "traps" && (
        <div style={{ background: T.card, borderRadius: 10, padding: "14px 16px",
                       border: `1px solid ${T.red}30` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.red, marginBottom: 10 }}>
            🚫 Common traps — these cost Highly Qualified rating
          </div>
          {question.traps.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ color: T.red, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✗</span>
              <span style={{ fontSize: 18, color: T.sub, lineHeight: 1.6 }}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ── MOBILE: accordion — each question expands inline ────────────────────
  if (isMobile) {
    return (
      <div>
        {QUESTIONS.map((qs, i) => {
          const isOpen = expandedQ === i;
          return (
            <div key={i} style={{ marginBottom: 10,
                                   border: `1px solid ${isOpen ? qs.color + "70" : T.border}`,
                                   borderRadius: 12, overflow: "hidden" }}>
              {/* Tappable question header */}
              <button
                onClick={() => { setExpandedQ(isOpen ? null : i); setTab("answer"); }}
                style={{ width: "100%", background: isOpen ? qs.color + "18" : T.card,
                          border: "none", padding: "16px 14px", cursor: "pointer",
                          textAlign: "left", display: "flex",
                          justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center",
                                 marginBottom: 8, flexWrap: "wrap" }}>
                    <Tag label={qs.category} color={qs.color} />
                    {qs.category.includes("PAST") && (
                      <span style={{ fontSize: 15 }} title="Past SEC Interview Question">⭐</span>
                    )}
                    {qs.competency && <Tag label={qs.competency} color={qs.color} />}
                  </div>
                  <div style={{ fontSize: 18, lineHeight: 1.5,
                                 color: isOpen ? T.text : T.sub,
                                 fontWeight: isOpen ? 600 : 400 }}>
                    "{qs.q}"
                  </div>
                </div>
                <span style={{ fontSize: 22, color: qs.color, flexShrink: 0, marginTop: 4 }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Answer section — shown when expanded */}
              {isOpen && (
                <div style={{ background: T.panel, borderTop: `1px solid ${T.border}` }}>
                  {/* Tab switcher */}
                  <div style={{ padding: "12px 14px 4px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[["answer", "Answer"], ["intent", "Panel Intent"], ["keypoints", "Key Points"],
                      ...(qs.starModel ? [["star", "STAR"]] : []),
                      ["traps", "Traps"]].map(([v, l]) => (
                      <Btn key={v} active={tab === v} color={qs.color}
                           onClick={() => setTab(v)} small>{l}</Btn>
                    ))}
                  </div>
                  <div style={{ padding: "10px 14px 20px" }}>
                    <TabContent question={qs} activeTab={tab} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── DESKTOP: side-by-side ────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: 16, minHeight: 600 }}>
      {/* Left: scrollable question list */}
      <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column",
                     gap: 8, overflowY: "auto", maxHeight: "calc(100vh - 180px)" }}>
        {QUESTIONS.map((qs, i) => (
          <button key={i} onClick={() => { setActive(i); setTab("answer"); }}
            style={{ background: active === i ? qs.color + "20" : T.card,
                     border: `1px solid ${active === i ? qs.color + "60" : T.border}`,
                     borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                     transition: "all 0.15s" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
              <Tag label={qs.category} color={qs.color} />
              {qs.category.includes("PAST") && (
                <span style={{ fontSize: 14, lineHeight: 1 }} title="Past SEC Interview Question">⭐</span>
              )}
            </div>
            <div style={{ fontSize: 17, color: active === i ? T.text : T.sub, lineHeight: 1.4,
                           fontWeight: active === i ? 600 : 400 }}>
              {qs.q.slice(0, 70)}{qs.q.length > 70 ? "…" : ""}
            </div>
          </button>
        ))}
      </div>

      {/* Right: detail panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: T.card, borderRadius: 10, padding: "16px 18px",
                       borderLeft: `4px solid ${q.color}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <Tag label={q.category} color={q.color} />
            {q.competency && <Tag label={q.competency} color={q.color} />}
          </div>
          <div style={{ fontSize: 23, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>"{q.q}"</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["answer", "Model Answer"], ["intent", "Panel Intent"], ["keypoints", "Key Points"],
            ...(q.starModel ? [["star", "STAR Framework"]] : []),
            ["traps", "Common Traps"]].map(([v, l]) => (
            <Btn key={v} active={tab === v} color={q.color} onClick={() => setTab(v)} small>{l}</Btn>
          ))}
        </div>

        <TabContent question={q} activeTab={tab} />
      </div>
    </div>
  );
}

// ─── PAGE: ACCOMPLISHMENT RECORD BUILDER ──────────────────────────────────────
function PageAR() {
  const [active, setActive] = useState(0);
  const [values, setValues] = useState(AR_TEMPLATES.map(t =>
    Object.fromEntries(t.sections.map(s => [s.label, ""]))
  ));
  const tmpl = AR_TEMPLATES[active];
  const vals = values[active];

  const update = (key, val) => {
    const updated = [...values];
    updated[active] = { ...updated[active], [key]: val };
    setValues(updated);
  };

  const allText = tmpl.sections.map(s => vals[s.label] || "").join(" ");
  const wordCount = allText.trim() === "" ? 0 : allText.trim().split(/\s+/).length;
  const pct = Math.min((wordCount / tmpl.wordLimit) * 100, 100);
  const wColor = wordCount > tmpl.wordLimit ? T.red : wordCount > tmpl.wordLimit * 0.85 ? T.gold : T.green;

  return (
    <div>
      <Section label="Select Competency">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {AR_TEMPLATES.map((t, i) => (
            <Btn key={i} active={active === i} color={t.color} onClick={() => setActive(i)}>
              {t.icon} {t.competency}
            </Btn>
          ))}
        </div>
      </Section>

      {/* Word count bar */}
      <div style={{ background: T.card, borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                     border: `1px solid ${wColor}40` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Total Accomplishment Record Word Count</span>
          <span style={{ fontSize: 21, fontWeight: 800, color: wColor, fontFamily: "monospace" }}>
            {wordCount} / {tmpl.wordLimit} {wordCount > tmpl.wordLimit ? "⚠️ OVER LIMIT" : ""}
          </span>
        </div>
        <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: wColor, borderRadius: 4, transition: "width 0.2s" }} />
        </div>
        {wordCount > tmpl.wordLimit && (
          <div style={{ fontSize: 17, color: T.red, marginTop: 6, fontWeight: 700 }}>
            ⚠️ Text beyond 300 words will NOT be considered by the rating panel. Cut immediately.
          </div>
        )}
      </div>

      {/* Input sections */}
      {tmpl.sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <label style={{ fontSize: 17, fontWeight: 700, color: tmpl.color,
                             letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</label>
            <span style={{ fontSize: 15, color: T.muted, fontStyle: "italic" }}>{s.hint}</span>
          </div>
          {s.label === "Competency Title" || s.label === "Position Title & Dates" || s.label === "Verifier Name & Email" ? (
            <input value={vals[s.label]} onChange={e => update(s.label, e.target.value)}
              placeholder={s.placeholder}
              style={{ width: "100%", background: T.card, border: `1px solid ${T.border}`,
                        borderRadius: 8, padding: "10px 12px", fontSize: 20, color: T.text,
                        outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          ) : (
            <textarea value={vals[s.label]} onChange={e => update(s.label, e.target.value)}
              placeholder={s.placeholder} rows={4}
              style={{ width: "100%", background: T.card, border: `1px solid ${T.border}`,
                        borderRadius: 8, padding: "10px 12px", fontSize: 20, color: T.text,
                        outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6,
                        boxSizing: "border-box" }} />
          )}
        </div>
      ))}

      {/* Preview */}
      {wordCount > 0 && (
        <div style={{ background: T.card, borderRadius: 10, padding: "16px 18px",
                       border: `1px solid ${tmpl.color}30`, marginTop: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: tmpl.color, marginBottom: 10 }}>
            📄 Preview — as it will appear in your PDF upload
          </div>
          {tmpl.sections.map((s, i) => vals[s.label] && (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.sub, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 18, color: T.text, lineHeight: 1.65,
                             whiteSpace: "pre-wrap" }}>{vals[s.label]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PAGE: 90-DAY PLAN ────────────────────────────────────────────────────────
function PagePlan() {
  const [active, setActive] = useState(0);
  const phase = PLAN_90[active];
  return (
    <div>
      <Section label="Select Phase">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {PLAN_90.map((p, i) => (
            <Btn key={i} active={active === i} color={p.color} onClick={() => setActive(i)}>
              {p.phase}
            </Btn>
          ))}
        </div>
      </Section>

      <div style={{ background: T.card, borderRadius: 10, padding: "14px 16px", marginBottom: 16,
                     borderLeft: `4px solid ${phase.color}` }}>
        <div style={{ fontSize: 23, fontWeight: 700, color: phase.color }}>{phase.phase}</div>
        <div style={{ fontSize: 18, color: T.sub, marginTop: 4 }}>{phase.subtitle}</div>
      </div>

      {phase.items.map((item, i) => (
        <div key={i} style={{ background: T.card, borderRadius: 8, padding: "12px 14px",
                               marginBottom: 10, border: `1px solid ${T.border}`,
                               display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: T.text, marginBottom: 4 }}>{item.action}</div>
            <div style={{ fontSize: 17, color: T.muted, fontStyle: "italic" }}>→ {item.outcome}</div>
          </div>
          <Tag label={item.priority} color={
            item.priority.includes("DAY 1") || item.priority.includes("URGENT") ? T.red :
            item.priority.includes("WEEK 1") || item.priority.includes("WEEK 2") ? T.gold :
            phase.color} />
        </div>
      ))}
    </div>
  );
}

// ─── PAGE: QUESTIONS TO ASK ───────────────────────────────────────────────────
function PageAskQuestions() {
  const isMobile = useMobile();
  return (
    <div>
      <Section label="Five Questions for the Panel — Ranked by Impact">
        <div style={{ background: T.card, borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                       border: `1px solid ${T.gold}30` }}>
          <div style={{ fontSize: 17, color: T.gold, fontWeight: 700 }}>
            Ask a maximum of 3. Pick the ones that matter most to you. Each one should signal something specific about your preparation.
          </div>
        </div>
        {PANEL_QUESTIONS.map((q, i) => (
          <div key={i} style={{ background: T.card, borderRadius: 10, padding: "16px 18px",
                                 marginBottom: 12, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: T.gold, flexShrink: 0 }}>{i + 1}.</span>
              <div style={{ fontSize: 20, color: T.text, lineHeight: 1.6, fontWeight: 600 }}>"{q.q}"</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              <div style={{ background: T.green + "12", borderRadius: 7, padding: "10px 12px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.green, marginBottom: 4 }}>WHY ASK THIS</div>
                <div style={{ fontSize: 17, color: T.sub, lineHeight: 1.55 }}>{q.why}</div>
              </div>
              <div style={{ background: T.blue + "12", borderRadius: 7, padding: "10px 12px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.blue, marginBottom: 4 }}>RISK LEVEL</div>
                <div style={{ fontSize: 17, color: T.sub, lineHeight: 1.55 }}>{q.risk}</div>
              </div>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

// ─── PAGE: QUICK REFERENCE ────────────────────────────────────────────────────
function PageQuickRef() {
  const isMobile = useMobile();
  const facts = [
    { cat: "ANNOUNCEMENT", items: [
      ["Announcement #", "USAJOBS #862266600"],
      ["Grade", "SK-0501-14 (SK-14)"],
      ["Hiring Manager", "Brian Williams, Chief BMCB"],
      ["Chain", "Williams → Buckley → Girod"],
      ["OFM/CFO", "Caryn Kauffman, 202-551-7840"],
      ["FOIA Services", "Ray McInerney, AD"],
      ["Security & Building Ops", "Katherine Taylor, AD"],
    ]},
    { cat: "BUDGET NUMBERS (FY2027 CBJ p.6-8)", items: [
      ["Agency Net Request", "$1,908,000K"],
      ["Operational Budget", "$2,078,000K"],
      ["Carryover Assumption", "$145,000K embedded in net request"],
      ["Agency Dir & Admin Support", "$320,196K / 732 FTE"],
      ["FY2026 Enacted (baseline)", "$2,176,893K / 4,024 FTE"],
      ["FY2027 FTE Request", "4,177 FTE (+153 from FY2026)"],
    ]},
    { cat: "KEY LAW & POLICY", items: [
      ["ADA Prohibition", "31 U.S.C. §1341(a)(1)"],
      ["ADA Reporting", "31 U.S.C. §1351 — simultaneous to OIG/Chair/OMB/Congress"],
      ["Purpose Statute", "31 U.S.C. §1301(a)"],
      ["Bona Fide Need", "31 U.S.C. §1502"],
      ["OMB A-11 Apportionment", "§120 — governs OSO spending authority"],
      ["OMB A-11 OC Coding", "§79 — object class classification"],
      ["Internal Controls", "OMB Circular A-123 / FMFIA 31 U.S.C. §3512"],
      ["GPC Program", "OMB A-123 Appendix B + FAR 13.301"],
      ["COR Designation", "FAR 1.602-2(d) — in writing, before work begins"],
    ]},
    { cat: "KEY OIG REPORTS", items: [
      ["OIG-488 (2011)", "Reveals: Momentum = financial system; BPPAS = budget; SEC-R 14-1"],
      ["OIG-582 (Aug 2024)", "T&M Contract Management — 3 open recs; your primary corrective action"],
      ["OIG-584 (Nov 2024)", "FISMA Level 3 — financial systems security"],
      ["OIG MPC (Dec 2025)", "4 challenges: oversight, human capital, systems, contracts"],
    ]},
    { cat: "FINANCIAL SYSTEMS", items: [
      ["Momentum", "Core financial system of record (OIG-488 confirmed)"],
      ["BPPAS", "Budget planning / activity-based costing (OIG-488 confirmed)"],
      ["SAM.gov", "Procurement data — FPDS.gov decommissioned Feb 24, 2026"],
      ["GSA SmartPay", "GPC program — 5-day reconciliation window"],
      ["SEC-R 14-1", "Administrative Control of Funds Regulation — INTERNAL, get on Day 1"],
    ]},
    { cat: "OSO INTERNAL CLIENTS", items: [
      ["FOIA Services", "Ray McInerney — 13,250 FOIA requests/year (FY27)"],
      ["Security & Building", "Katherine Taylor — highest T&M contract exposure (OIG-582)"],
      ["Records Policy", "Amanda Pomicter — NARA mandates, records system contracts"],
      ["Records Operations", "Casey Coleman — Acting Records Officer"],
    ]},
  ];

  return (
    <div>
      <Section label="Day-of-Interview Quick Reference — Know These Cold">
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
          {facts.map((group, gi) => (
            <div key={gi} style={{ background: T.card, borderRadius: 10, padding: isMobile ? "16px 14px" : "14px 16px",
                                   border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.1em", color: T.muted,
                             textTransform: "uppercase", marginBottom: 10 }}>{group.cat}</div>
              {group.items.map(([k, v], i) => (
                <div key={i} style={{ display: "flex", gap: 10, flexWrap: isMobile ? "wrap" : "nowrap",
                                       justifyContent: "space-between",
                                       padding: isMobile ? "8px 0" : "5px 0",
                                       borderBottom: i < group.items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ fontSize: 17, color: T.muted, minWidth: 140, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 17, color: T.text, fontFamily: "monospace",
                                  textAlign: "right", lineHeight: 1.4 }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section label="Final Checklist — Night Before Interview">
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          {[
            "Can recite the four competencies and their exact wording",
            "Can state the OIG-582 report title, date, and three corrective actions needed",
            "Know Momentum = core financial system, BPPAS = budget planning (both confirmed OIG-488)",
            "Know $145M carryover assumption and why it's the key financial risk",
            "Know the five-question list for the panel — picked my top three",
            "Accomplishment Record PDF uploaded to USA Staffing with all four narratives",
            "Each narrative ≤300 words (verified by word count tool)",
            "Each narrative has a verifiable contact with current email",
            "2-page resume submitted — no pages beyond page 2",
            "Know: SAM.gov replaced FPDS.gov on February 24, 2026",
            "Know the OFM phone number: 202-551-7840 (Caryn Kauffman)",
            "Know OSO Director: Olivier Girod / AD OAMR: William Buckley",
            "Prepared opening statement on 'why this role' — names OSO specifically, not the SEC broadly",
            "ADA response protocol memorized: verify → Brian Williams → OFM → if violation: simultaneous §1351 report",
            "90-day plan memorized: 30 days assess, 60 days build, 90 days deliver",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center",
                                   background: T.card, borderRadius: 7, padding: "9px 12px" }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${T.gold}`,
                             flexShrink: 0, background: T.dim }} />
              <span style={{ fontSize: 17, color: T.sub, lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── INNER PAGES CONFIG ───────────────────────────────────────────────────────
const INNER_PAGES = [
  { id: "overview",   label: "Position Overview",     icon: "📋" },
  { id: "questions",  label: "Interview Questions",   icon: "🎤" },
  { id: "ar",         label: "Accomplishment Record", icon: "✍️" },
  { id: "plan",       label: "90-Day Plan",           icon: "📅" },
  { id: "ask",        label: "Questions to Ask",      icon: "❓" },
  { id: "quickref",   label: "Quick Reference",       icon: "⚡" },
];

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function InterviewPrepPortal() {
  const [page, setPage]       = useState("overview");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <MobileCtx.Provider value={isMobile}>
    <div style={{ background: T.bg, color: T.text,
                   borderRadius: 0, overflow: "hidden",
                   fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif", fontSize: 20,
                   border: "none" }}>

      {/* ── Navigation ── */}
      <div style={{ background: T.panel, borderBottom: `1px solid ${T.border}`,
                     padding: isMobile ? "10px 14px" : "0 20px" }}>
        {isMobile ? (
          /* Mobile: logo row + select dropdown */
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em",
                             color: T.gold, textTransform: "uppercase" }}>SEC OSO · BMCB</div>
              <div style={{ fontSize: 12, color: T.sub }}>Interview Prep</div>
              <div style={{ marginLeft: "auto", fontSize: 11, color: T.muted, fontStyle: "italic" }}>
                ⭐ = past SEC Q
              </div>
            </div>
            <select
              value={page}
              onChange={e => setPage(e.target.value)}
              style={{ width: "100%", background: T.card, color: T.text,
                        border: `1px solid ${T.borderA}`, borderRadius: 8,
                        padding: "12px 40px 12px 14px", fontSize: 18,
                        fontFamily: "inherit", fontWeight: 600, cursor: "pointer",
                        WebkitAppearance: "none", appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9'><path d='M1 1l6 6 6-6' stroke='%2396b4cc' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
                        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
              {INNER_PAGES.map(p => (
                <option key={p.id} value={p.id}>{p.icon}  {p.label}</option>
              ))}
            </select>
          </div>
        ) : (
          /* Desktop: horizontal tab row */
          <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
            <div style={{ paddingRight: 20, marginRight: 20, borderRight: `1px solid ${T.border}`,
                           paddingTop: 10, paddingBottom: 10, flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.15em",
                             color: T.gold, textTransform: "uppercase" }}>SEC OSO · BMCB</div>
              <div style={{ fontSize: 15, color: T.sub, marginTop: 1 }}>Interview Prep</div>
            </div>
            {INNER_PAGES.map(p => (
              <button key={p.id} onClick={() => setPage(p.id)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "12px 14px",
                          background: "none", border: "none",
                          borderBottom: page === p.id ? `2px solid ${T.gold}` : "2px solid transparent",
                          cursor: "pointer", color: page === p.id ? T.text : T.muted,
                          fontSize: 17, fontWeight: page === p.id ? 700 : 400,
                          transition: "all 0.15s", flexShrink: 0, whiteSpace: "nowrap" }}>
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", paddingLeft: 16, flexShrink: 0 }}>
              <span style={{ fontSize: 14, color: T.muted, fontStyle: "italic" }}>
                ⚠️ Public data + reasonable assumptions only
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Page content */}
      <div style={{ padding: isMobile ? "16px 12px 60px" : "28px 32px 56px", minHeight: 500 }}>
        {page === "overview"  && <PageOverview />}
        {page === "questions" && <PageQuestions />}
        {page === "ar"        && <PageAR />}
        {page === "plan"      && <PagePlan />}
        {page === "ask"       && <PageAskQuestions />}
        {page === "quickref"  && <PageQuickRef />}
      </div>

      {/* Footer */}
      <div style={{ background: T.panel, borderTop: `1px solid ${T.border}`,
                     padding: "8px 16px", fontSize: isMobile ? 11 : 14, color: T.muted,
                     display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span>SEC OSO BMCB · FM Specialist SK-14 · Interview Prep Tool</span>
        <span>Sources: USAJOBS #862266600 · CBJ · OIG-488/582/MPC · FAR · OMB A-11/A-123</span>
      </div>
    </div>
    </MobileCtx.Provider>
  );
}
