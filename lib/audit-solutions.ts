// lib/audit-solutions.ts — deep remediation intelligence for the Audit Center.
// For each priority material weakness (DODIG-2026-032): root-cause analysis,
// Component-by-Component audit positions, the feeder→GL system landscape,
// a step-by-step Advana-pattern technical solution with AI embedded at each
// stage, a FIAR-aligned execution plan, and a live in-app demonstration
// mapping (the demo runs lib/ml/engine on the bundled sourcedata/ datasets).

export type CompStatus = "mw" | "sd" | "progress" | "clean" | "na"
export interface ComponentPosition { component: string; status: CompStatus; note: string }
export interface SystemNode { name: string; kind: "feeder" | "gl" | "treasury" | "reporting"; detail: string }
export interface SolutionStep { layer: string; title: string; tech: string; ai?: string }
export interface PlanPhase { phase: string; window: string; milestones: string[] }
export interface DemoConfig {
  model: "benford" | "anomaly" | "risk" | "cluster" | "forecast"
  dataset: "txn-contracts" | "txn-assistance" | "txn-all" | "exhibit-accounts" | "monthly-series"
  title: string
  rationale: string
}
export interface MWDeep {
  num: number
  exposure: string                  // headline financial exposure / scale
  rootCause: string
  criteria: string                  // the standard not met
  effect: string                    // audit + operational consequence
  positions: ComponentPosition[]
  systems: SystemNode[]
  solution: SolutionStep[]
  plan: PlanPhase[]
  demo: DemoConfig
}

export const COMP_STATUS_META: Record<CompStatus, { label: string; tone: "red" | "orange" | "gold" | "green" | "muted" }> = {
  mw:       { label: "Material weakness", tone: "red" },
  sd:       { label: "Significant deficiency", tone: "orange" },
  progress: { label: "CAP on track / downgraded", tone: "gold" },
  clean:    { label: "No finding / remediated", tone: "green" },
  na:       { label: "Not applicable", tone: "muted" },
}

// The canonical Advana medallion pattern, instantiated per MW below.
export const ADVANA_PATTERN = [
  "Bronze — raw, immutable ingest of every source system feed (full fidelity, PII-tagged)",
  "Silver — USSGL canonical model: one schema, TAS/BETC/trading-partner attributed, source-keyed",
  "Match — deterministic + probabilistic reconciliation engines over the canonical layer",
  "AI — anomaly, classification, NLP and forecasting models embedded in the pipeline",
  "Gold — append-only, hashed, Delta-versioned audit evidence artifacts on demand",
]

export const MW_DEEP: MWDeep[] = [
  // ───────────────────────────────────────────────────────── MW 7 — UoT
  {
    num: 7,
    exposure: "Blocks every other balance: no certified population = no valid sample = disclaimer",
    rootCause: "DoD executes through 4,000+ systems; obligations originate in feeders (DTS, WAWF, MOCAS, DCPS, DDS) and post to five different ERP general ledgers plus legacy ledgers. No single layer holds every transaction with proof of completeness, so the Department cannot hand auditors a population document that ties to the trial balance.",
    criteria: "SFFAS / GAO FAM 470 population completeness; FFMIA transaction-level USSGL traceability.",
    effect: "Auditors cannot draw statistically valid samples for any material line; MW #7 cascades into FBwT, AP, PP&E and Gross Costs findings. It is the single highest-leverage weakness in the inventory.",
    positions: [
      { component: "Army",            status: "mw",       note: "GFEBS posts cleanly, but ~12% of activity still rides legacy STANFINS/SOMARDS feeds without record-level handshake totals." },
      { component: "Navy",            status: "mw",       note: "Navy ERP covers General Fund core; ~50 feeders outside ERP lack interface completeness telemetry. $4.3B untracked material compounds the population gap." },
      { component: "Marine Corps",    status: "clean",    note: "First military service with an unmodified opinion (FY2024, sustained FY2025) — proved the UoT playbook: single ledger (SABRS→D2D), end-to-end transaction universe certified monthly." },
      { component: "Air Force",       status: "mw",       note: "DEAMS migration incomplete; parallel GAFS-R legacy ledger means two populations must be merged and de-duplicated each period." },
      { component: "DLA",             status: "sd",       note: "EBS population stable; residual gaps in distribution/disposition feeder coverage (DSS) downgraded from MW." },
      { component: "USACE Civil Works", status: "clean",  note: "CEFMS is a single integrated ledger — population produced natively with query parameters; model for the Department." },
      { component: "DFAS",            status: "progress", note: "As service provider, building the ODS-based universe staging layer; DFAS WCF itself holds a clean opinion." },
      { component: "4th Estate / WHS", status: "mw",      note: "DAI consolidates ~25 Defense agencies, but agency-unique feeders (grants, R&D) enter via spreadsheets — no system-controlled completeness gate." },
    ],
    systems: [
      { name: "DTS",    kind: "feeder", detail: "Travel obligations & vouchers" },
      { name: "WAWF (PIEE)", kind: "feeder", detail: "Receiving reports & invoices" },
      { name: "MOCAS",  kind: "feeder", detail: "Contract entitlement & disbursing" },
      { name: "DCPS",   kind: "feeder", detail: "Civilian payroll" },
      { name: "DDS",    kind: "feeder", detail: "Deployable disbursing (contingency)" },
      { name: "ODS",    kind: "feeder", detail: "DFAS operational data store (staging)" },
      { name: "GFEBS",  kind: "gl", detail: "Army GF ledger (SAP)" },
      { name: "Navy ERP", kind: "gl", detail: "Navy GF ledger (SAP)" },
      { name: "DEAMS",  kind: "gl", detail: "Air Force ledger (Oracle)" },
      { name: "DAI",    kind: "gl", detail: "4th Estate ledger (Oracle)" },
      { name: "SABRS",  kind: "gl", detail: "Marine Corps ledger" },
      { name: "DDRS-AFS", kind: "reporting", detail: "Statement compilation" },
      { name: "Advana", kind: "reporting", detail: "Department data platform — canonical layer" },
    ],
    solution: [
      { layer: "Bronze", title: "Ingest every feed with telemetry", tech: "Land GL postings (GFEBS, Navy ERP, DEAMS, DAI, SABRS) and feeder extracts (DTS, WAWF, MOCAS, DCPS, DDS via ODS) into append-only Delta tables; capture interface logs, record counts and hash totals per feed run.", ai: "Time-series model on feed volumes flags missing or anomalous feeds the morning they fail — completeness telemetry, not month-end surprises." },
      { layer: "Silver", title: "USSGL canonical transactions", tech: "Crosswalk every source schema to one canonical model: USSGL account, TAS/BETC, period, trading partner, source_system + source_key. This is the Rosetta-Stone layer that makes one population possible.", ai: "Probabilistic entity resolution (fuzzy doc-number/amount/date matching) links feeder documents to GL postings where keys are broken — the residual unmatched set becomes a worked queue, not an unknown." },
      { layer: "Match", title: "Population ↔ trial balance tie-out", tech: "Automated job aggregates the canonical population per Component/USSGL/period and ties to the DDRS trial balance; differences >$1 fail the gate and block certification.", ai: "Benford and robust-z screens run over the certified population as a standing data-integrity control." },
      { layer: "Gold", title: "System-generated UoT certification", tech: "Monthly job emits the certification artifact: query parameters, record count, gross/net, source-system coverage, tie-out status, SHA-256 population hash, Delta version — append-only, signed by the certifying official.", ai: "LLM drafts the completeness-assertion narrative from the interface telemetry for official review." },
    ],
    plan: [
      { phase: "Assess (FY26 Q3–Q4)", window: "now – Sep 2026", milestones: ["Authoritative system inventory + data contracts per feed", "Rank feeds by $ coverage; top 20 ≈ 95% of obligations", "Stand up Bronze ingest + telemetry for the top 20"] },
      { phase: "Correct (FY27 H1)", window: "Oct 2026 – Mar 2027", milestones: ["Silver canonical crosswalks for the five ERPs", "Entity-resolution model live; unmatched queue < 2% of $", "Monthly TB tie-out gate passing for Army + Navy GF"] },
      { phase: "Assert (FY27 H2)", window: "Apr – Sep 2027", milestones: ["First system-generated UoT certifications to auditors", "Mock sample pulls under 48-hour SLA", "USMC-pattern assertion memos per Component"] },
      { phase: "Sustain (FY28)", window: "Oct 2027 – Dec 2028", milestones: ["Certification fully automated at P12 close", "NFR re-tests passed; MW downgrade requested", "Population hash verification offered to DODIG"] },
    ],
    demo: { model: "benford", dataset: "txn-all", title: "Population integrity screen (Benford first-digit test)",
      rationale: "The same screen the Silver layer runs over each certified population — executed live here on the bundled DoD award transactions from sourcedata/. A conforming population supports the completeness assertion; deviation localizes where to dig." },
  },

  // ───────────────────────────────────────────────────────── MW 8 — FBwT
  {
    num: 8,
    exposure: "DoD FBwT ≈ $0.5T+ across TAS — the federal checkbook reconciliation",
    rootCause: "Component GL cash (USSGL 1010) and Treasury's CARS/GWA records are reconciled late, manually, and at summary level. Suspense accounts (F3875/F3885) absorb unmatched activity, and aged differences get written off without root-cause resolution.",
    criteria: "TFM Volume I Part 2 Chapter 5100 (FBwT reconciliation); A-123 monthly reconciliation controls.",
    effect: "Unsupported cash balances undermine the Balance Sheet and SBR simultaneously; write-offs of aged differences are themselves unsupported adjustments (feeds MW #18).",
    positions: [
      { component: "Army",            status: "mw",       note: "Largest unsupported difference volume; GFEBS-to-CARS matching strong for current activity, weak for pre-GFEBS history." },
      { component: "Navy",            status: "mw",       note: "Persistent suspense-account balances; disbursing-officer level differences from afloat/deployed operations (DDS feeds)." },
      { component: "Marine Corps",    status: "clean",    note: "FBwT was the breakthrough that unlocked the USMC opinion — daily ledger-to-Treasury matching at transaction grain." },
      { component: "Air Force",       status: "mw",       note: "DEAMS/GAFS-R dual-ledger period complicates TAS-level tie-out; improvement on current-year activity." },
      { component: "DLA",             status: "progress", note: "WCF cash reconciles within tolerance; CAP closing residual aged items." },
      { component: "USACE Civil Works", status: "clean",  note: "CEFMS reconciles to Treasury daily; zero unexplained differences at year-end." },
      { component: "DFAS",            status: "progress", note: "Runs the central recon for most Components; deploying automated matching to replace manual workbooks." },
      { component: "4th Estate / WHS", status: "sd",      note: "DAI agencies mostly within tolerance; legacy suspense from pre-DAI conversions still aging." },
    ],
    systems: [
      { name: "CARS / GWA", kind: "treasury", detail: "Treasury account statements (the other side)" },
      { name: "IPAC",   kind: "treasury", detail: "Intragovernmental payments & collections" },
      { name: "DCAS",   kind: "feeder", detail: "Disbursing/collection activity" },
      { name: "DDS",    kind: "feeder", detail: "Deployable disbursing vouchers" },
      { name: "ODS",    kind: "feeder", detail: "DFAS staging of disbursing data" },
      { name: "GFEBS",  kind: "gl", detail: "USSGL 1010 by TAS" },
      { name: "Navy ERP", kind: "gl", detail: "USSGL 1010 by TAS" },
      { name: "DEAMS",  kind: "gl", detail: "USSGL 1010 by TAS" },
      { name: "DAI",    kind: "gl", detail: "USSGL 1010 by TAS" },
      { name: "Advana", kind: "reporting", detail: "Both sides land here — recon runs on platform" },
    ],
    solution: [
      { layer: "Bronze", title: "Both sides, system-to-system", tech: "Ingest CARS/GWA statements and Component GL cash postings by TAS daily — no manual workbooks; both sides of the reconciliation are system-generated by construction." },
      { layer: "Silver", title: "Transaction-grain matching", tech: "Deterministic engine matches on TAS + doc number + amount + value-date windows; partial-key cascade (amount+date, then amount-only within window) before anything lands in suspense.", ai: "Gradient-boosted classifier — trained on years of analyst recon decisions — labels residuals TIMING / ERROR / UNEXPLAINED with confidence, and routes only low-confidence items to humans." },
      { layer: "Match", title: "Suspense burn-down", tech: "F3875/F3885 items get an owner, an age clock, and a 60-day clearance SLA; aging dashboard by Component and disbursing station.", ai: "Survival model predicts which items will breach SLA, so supervisors intervene at day 20, not day 61." },
      { layer: "Gold", title: "Immutable recon artifact", tech: "Monthly FBwT artifact per TAS: GL balance, CARS balance, categorized reconciling items, net unexplained — Delta-versioned and hash-locked, exactly the evidence TFM 5100 demands." },
    ],
    plan: [
      { phase: "Assess (FY26 Q3–Q4)", window: "now – Sep 2026", milestones: ["TAS census + materiality ranking", "Daily CARS ingest live", "Baseline unexplained-difference inventory"] },
      { phase: "Correct (FY27 H1)", window: "Oct 2026 – Mar 2027", milestones: ["Matching engine live for top-50 TAS (≈90% of cash)", "Classifier trained on 3 years of recon history", "Suspense 60-day SLA enforced"] },
      { phase: "Assert (FY27 H2)", window: "Apr – Sep 2027", milestones: ["Unexplained < auditor tolerance on top-50 TAS", "System-generated artifacts replace workbooks", "Component assertions for FBwT line"] },
      { phase: "Sustain (FY28)", window: "Oct 2027 – Dec 2028", milestones: ["Daily recon department-wide", "Aged (>1yr) differences fully dispositioned", "MW downgrade evidence package"] },
    ],
    demo: { model: "anomaly", dataset: "txn-contracts", title: "Residual outlier detection (robust-z / IQR)",
      rationale: "The same outlier engine the matching layer uses to flag suspicious residuals — run live on bundled DoD contract transactions. In production it runs on unmatched GL↔CARS items; extreme values get worked first because they move the unexplained balance most." },
  },

  // ───────────────────────────────────────────────────────── MW 6 — Interfaces
  {
    num: 6,
    exposure: "Hundreds of feeder→GL interfaces; every dropped batch is a completeness exception",
    rootCause: "Point-to-point interfaces built over decades move transactions between feeders and ledgers without end-to-end control totals. Failures are detected downstream (if at all) during month-end, and reprocessing creates duplicates.",
    criteria: "FISCAM AS-3 interface controls; NIST SP 800-53 SI family; FFMIA.",
    effect: "Transactions lost or duplicated between systems corrupt the population (MW #7), drive JV plugs (MW #18), and break feeder-to-GL reconciliations across every balance.",
    positions: [
      { component: "Army",            status: "mw",       note: "GFEBS↔WAWF/DTS/DCPS interfaces have control totals; legacy logistics feeds (LMP-era) do not." },
      { component: "Navy",            status: "mw",       note: "~50 feeders into Navy ERP; completeness telemetry exists for a minority of high-volume feeds." },
      { component: "Marine Corps",    status: "progress", note: "Small interface surface (SABRS-centric) — one of the structural reasons USMC could certify its universe." },
      { component: "Air Force",       status: "mw",       note: "DEAMS↔legacy bridge interfaces are the dominant exception source during migration." },
      { component: "DLA",             status: "sd",       note: "EBS internal integration strong; external trading-partner feeds remain exception-prone." },
      { component: "USACE Civil Works", status: "clean",  note: "Single integrated system — minimal interface risk by architecture." },
      { component: "DFAS",            status: "progress", note: "Owns the hub interfaces (ODS); instrumenting handshake totals as the central fix." },
      { component: "4th Estate / WHS", status: "mw",      note: "Agency-unique feeds into DAI via flat files; several with no automated rejection handling." },
    ],
    systems: [
      { name: "DTS",   kind: "feeder", detail: "Travel → GL daily batches" },
      { name: "WAWF (PIEE)", kind: "feeder", detail: "Acceptance → entitlement → GL" },
      { name: "MOCAS", kind: "feeder", detail: "Contract pay → GL summary postings" },
      { name: "DCPS",  kind: "feeder", detail: "Payroll → GL bi-weekly" },
      { name: "ODS",   kind: "feeder", detail: "DFAS hub staging for many flows" },
      { name: "GFEBS", kind: "gl", detail: "Inbound IDoc processing" },
      { name: "Navy ERP", kind: "gl", detail: "Inbound interface queue" },
      { name: "DEAMS", kind: "gl", detail: "Inbound + legacy bridge" },
      { name: "Advana", kind: "reporting", detail: "Interface telemetry lake" },
    ],
    solution: [
      { layer: "Bronze", title: "Interface telemetry lake", tech: "Every interface run logs batch ID, record count, hash total, accept/reject counts into a telemetry table — the data contract is enforced, not assumed." },
      { layer: "Silver", title: "In/out reconciliation per interface", tech: "Automated count-and-amount reconciliation: feeder extract vs GL accepted vs rejected, per batch, with rejects aged like receivables.", ai: "Forecast model per interface (volume by business day) detects silent failures — a Tuesday DTS feed at 30% of predicted volume pages the ops team before close." },
      { layer: "Match", title: "Duplicate & gap detection", tech: "Sequence-gap checks on batch numbers; probabilistic duplicate detection on reprocessed batches (same doc, same amount, different batch).", ai: "Clustering on rejection reason codes surfaces the systemic top-5 defects that drive 80% of exceptions." },
      { layer: "Gold", title: "Interface assurance artifact", tech: "Monthly per-interface certification: runs scheduled vs completed, records in/out, rejects cleared — the completeness assertion input for the UoT certification." },
    ],
    plan: [
      { phase: "Assess (FY26 Q3–Q4)", window: "now – Sep 2026", milestones: ["Interface census ranked by $ and volume", "Data contracts for top-25 interfaces", "Telemetry schema deployed"] },
      { phase: "Correct (FY27 H1)", window: "Oct 2026 – Mar 2027", milestones: ["Count/hash handshakes on top-25", "Volume-forecast alerting live", "Reject-aging SLA (10 business days)"] },
      { phase: "Assert (FY27 H2)", window: "Apr – Sep 2027", milestones: ["Zero unexplained batch gaps two consecutive quarters", "Interface assurance artifacts feeding UoT certs"] },
      { phase: "Sustain (FY28)", window: "Oct 2027 – Dec 2028", milestones: ["Telemetry mandatory for new interfaces (gate in ATO)", "MW consolidation case with FISCAM re-test"] },
    ],
    demo: { model: "forecast", dataset: "monthly-series", title: "Feed-volume forecasting (Holt exponential smoothing)",
      rationale: "The silent-failure detector: forecast next periods from the bundled DoD monthly obligation series with confidence bands — in production, an actual feed landing below the lower band triggers the interface alarm." },
  },

  // ───────────────────────────────────────────────────────── MW 18 — JVs
  {
    num: 18,
    exposure: "Billions in manual JVs each period; DDRS-level 'plugs' force statements to balance",
    rootCause: "When feeders and ledgers disagree, accountants post manual journal vouchers — often at period 12/13, often without attached KSD, sometimes system-generated 'forced-balance' entries at DDRS consolidation. The adjustment culture substitutes for fixing upstream data.",
    criteria: "USSGL TFM posting logic; A-123 JV approval/SoD controls; GAO FAM 480 evidence standards.",
    effect: "Unsupported adjustments contaminate otherwise-clean balances and are individually reportable; they also mask the upstream defects (MW #6, #7) that caused them.",
    positions: [
      { component: "Army",            status: "mw",       note: "GFEBS automation cut JV volume materially; remaining high-dollar JVs cluster at year-end cost allocations." },
      { component: "Navy",            status: "mw",       note: "Highest JV volume among services; legacy-to-ERP conversion entries still unsupported." },
      { component: "Marine Corps",    status: "progress", note: "JV discipline (two-person + KSD attach enforced in workflow) was part of the clean-opinion package." },
      { component: "Air Force",       status: "mw",       note: "DEAMS bridge JVs during migration; documentation retrieval slow." },
      { component: "DLA",             status: "sd",       note: "WCF JVs largely supported; cycle-count adjustments need methodology evidence." },
      { component: "USACE Civil Works", status: "clean",  note: "Low JV volume; all KSD-attached in CEFMS workflow." },
      { component: "DFAS",            status: "mw",       note: "Posts consolidation-level JVs for Components at DDRS — the 'plug' population auditors cite first." },
      { component: "4th Estate / WHS", status: "sd",      note: "DAI workflow enforces approval; legacy-agency conversion entries remain." },
    ],
    systems: [
      { name: "GFEBS",  kind: "gl", detail: "JV module w/ workflow" },
      { name: "Navy ERP", kind: "gl", detail: "JV module" },
      { name: "DEAMS",  kind: "gl", detail: "JV module + bridge entries" },
      { name: "DAI",    kind: "gl", detail: "JV module" },
      { name: "DDRS-B / DDRS-AFS", kind: "reporting", detail: "Consolidation-level JVs ('plugs') posted here" },
      { name: "Advana", kind: "reporting", detail: "JV analytics population" },
    ],
    solution: [
      { layer: "Bronze", title: "One JV population", tech: "Ingest every manual entry from all five ERPs and DDRS with preparer, approver, period, reversal flag, narrative text, and attachment metadata." },
      { layer: "Silver", title: "JV risk scoring", tech: "Composite score: amount percentile, period-13 flag, round-number flag, missing-KSD flag, preparer=approver (SoD breach), reversal-pattern flag.", ai: "NLP classifies the free-text JV narrative into purpose categories (accrual, correction, conversion, plug) — 'plug-like' language with no attachment is auto-escalated. Benford screening runs on the JV amount population." },
      { layer: "Match", title: "Root-cause linkage", tech: "Graph linking JVs to the interface exceptions and recon differences they compensate for — turning each plug into a pointer at the upstream defect to fix.", ai: "Clustering on (system, account, purpose) reveals the recurring JV families that one upstream fix would eliminate." },
      { layer: "Gold", title: "JV evidence package", tech: "For every JV above a threshold: auto-assembled package (entry, approval chain, attached KSD, risk score, root-cause link) — sample-ready without a document hunt." },
    ],
    plan: [
      { phase: "Assess (FY26 Q3–Q4)", window: "now – Sep 2026", milestones: ["Department-wide JV census incl. DDRS plugs", "Risk model calibrated on FY25 NFR'd entries"] },
      { phase: "Correct (FY27 H1)", window: "Oct 2026 – Mar 2027", milestones: ["KSD-attach hard gate in all five ERPs", "SoD rule: preparer≠approver enforced systemically", "Top-10 recurring JV families eliminated upstream"] },
      { phase: "Assert (FY27 H2)", window: "Apr – Sep 2027", milestones: ["Unsupported-JV $ down 80% vs FY25 baseline", "Auto evidence packages for 100% of high-risk JVs"] },
      { phase: "Sustain (FY28)", window: "Oct 2027 – Dec 2028", milestones: ["DDRS plug count → de-minimis", "Quarterly Benford + NLP screen institutionalized"] },
    ],
    demo: { model: "benford", dataset: "exhibit-accounts", title: "Adjustment-population screen (Benford on account amounts)",
      rationale: "Fabricated or force-balanced amounts distort first-digit frequencies. Run live on the bundled J-book account population as the stand-in for a JV population — in Advana this screens every period's manual entries." },
  },

  // ───────────────────────────────────────────────────────── MW 9 — Inventory
  {
    num: 9,
    exposure: "$4.3B+ untracked materials at Navy alone; OM&S valuation unreliable department-wide",
    rootCause: "Supply/logistics systems (GCSS-Army, LMP, Navy ERP supply, DLA DSS, AF ILS-S) track quantity and condition for warfighting, not USSGL valuation. Quantity×price seldom reconciles to the GL, physical counts lag, and condition-code changes don't flow to value.",
    criteria: "SFFAS 3 (inventory & related property); DoD FMR Vol 4 Ch 4.",
    effect: "Existence and valuation assertions fail for inventory, OM&S and stockpile materials; readiness data and financial data tell different stories about the same warehouse.",
    positions: [
      { component: "Army",            status: "mw",       note: "GCSS-Army/LMP quantity data strong; valuation crosswalk to GFEBS incomplete for ammunition and secondary items." },
      { component: "Navy",            status: "mw",       note: "$4.3B+ untracked materials finding; shipboard OM&S counts and condition codes not value-linked." },
      { component: "Marine Corps",    status: "progress", note: "Wall-to-wall counts + GCSS-MC linkage sustained the opinion; OM&S afloat remains the watch item." },
      { component: "Air Force",       status: "mw",       note: "Spares valuation (latest-price vs moving-average) inconsistencies; ILS-S→DEAMS linkage partial." },
      { component: "DLA",             status: "mw",       note: "Largest inventory custodian; DSS distribution-center counts reconcile, disposition (DLADS) stream does not." },
      { component: "USACE Civil Works", status: "na",     note: "Immaterial inventory balances." },
      { component: "DFAS",            status: "na",       note: "No inventory custodianship; posts what Components feed." },
      { component: "4th Estate / WHS", status: "sd",      note: "Limited OM&S; methodology documentation gaps." },
    ],
    systems: [
      { name: "GCSS-Army", kind: "feeder", detail: "Army supply quantities/condition" },
      { name: "LMP",    kind: "feeder", detail: "Army depot/wholesale logistics" },
      { name: "Navy ERP (SCM)", kind: "feeder", detail: "Navy supply module" },
      { name: "DSS (DLA)", kind: "feeder", detail: "Distribution standard system" },
      { name: "ILS-S",  kind: "feeder", detail: "AF inventory & logistics" },
      { name: "GFEBS",  kind: "gl", detail: "Army GL valuation" },
      { name: "Navy ERP", kind: "gl", detail: "Navy GL valuation" },
      { name: "DEAMS",  kind: "gl", detail: "AF GL valuation" },
      { name: "Advana", kind: "reporting", detail: "Quantity×price recon layer" },
    ],
    solution: [
      { layer: "Bronze", title: "Quantity + price + GL, side by side", tech: "Ingest item-level quantity/condition from the five supply systems and the corresponding GL balances; standardize on NIIN/NSN item keys." },
      { layer: "Silver", title: "Perpetual quantity×price recon", tech: "Item-level computed value vs GL by Component and appropriation; differences classified (price, quantity, condition, timing).", ai: "Price-outlier model (robust z on unit price within NSN family) catches the $80 bolt valued at $80,000; condition-code clustering finds populations whose value should have been written down." },
      { layer: "Match", title: "Count program optimization", tech: "Statistical count plans (ABC stratification) replace wall-to-wall where risk supports it; count results close the loop to valuation.", ai: "Risk model ranks locations/NSNs by miscount probability — count effort goes where errors live." },
      { layer: "Gold", title: "Existence & valuation evidence", tech: "Item-level lineage: count sheet → supply record → valuation → GL line, with the SFFAS 3 methodology attached — sample-ready KSD." },
    ],
    plan: [
      { phase: "Assess (FY26 Q3–Q4)", window: "now – Sep 2026", milestones: ["NSN-level census by custodian", "Valuation methodology inventory (latest vs MAC)"] },
      { phase: "Correct (FY27 H1)", window: "Oct 2026 – Mar 2027", milestones: ["Quantity×price recon live for top-$ NSN families", "Price-outlier model in production", "Navy untracked-material burn-down plan"] },
      { phase: "Assert (FY27 H2)", window: "Apr – Sep 2027", milestones: ["Existence/valuation assertion for DLA + Army GF", "Statistical count program approved by auditors"] },
      { phase: "Sustain (FY28)", window: "Oct 2027 – Dec 2028", milestones: ["Perpetual recon department-wide", "Condition-driven write-downs automated"] },
    ],
    demo: { model: "cluster", dataset: "txn-all", title: "Valuation tier clustering (k-means on log amounts)",
      rationale: "Stratifies a mixed population into value tiers exactly as the count-program optimizer stratifies NSNs — run live on the bundled award transactions to show micro/small/medium/major strata and where count effort should concentrate." },
  },

  // ───────────────────────────────────────────────────────── MW 15 — AP
  {
    num: 15,
    exposure: "Accruals mis-stated at scale; MOCAS↔GL mismatches in contract pay",
    rootCause: "The obligation lives in the GL, acceptance happens in WAWF, entitlement in MOCAS/IAPS, and the accrual is an estimate posted by formula. The three-way match is split across four systems, so payables at period end are modeled, not measured.",
    criteria: "SFFAS 1/5 liability recognition; Prompt Payment Act; FMR Vol 4 Ch 9.",
    effect: "AP balance fails existence/completeness; accrual reversals whipsaw Gross Costs; improper-payment exposure on disbursements without clean matches.",
    positions: [
      { component: "Army",            status: "mw",       note: "GFEBS three-way match works inside GFEBS; MOCAS-paid contracts post back at summary level only." },
      { component: "Navy",            status: "mw",       note: "Accrual estimation methodology inconsistencies across BSOs; WAWF acceptance lag distorts cutoff." },
      { component: "Marine Corps",    status: "progress", note: "Standardized accrual methodology + receiving-report discipline; sustained under audit." },
      { component: "Air Force",       status: "mw",       note: "DEAMS match engine maturing; legacy-paid population unmatched." },
      { component: "DLA",             status: "sd",       note: "WCF payables supported; capital-equipment accruals need methodology evidence." },
      { component: "USACE Civil Works", status: "clean",  note: "CEFMS native three-way match; AP cleanly supported." },
      { component: "DFAS",            status: "progress", note: "Operates MOCAS entitlement; deploying match analytics to push exceptions back to Components." },
      { component: "4th Estate / WHS", status: "sd",      note: "DAI match strong for simple buys; service-contract accruals estimated." },
    ],
    systems: [
      { name: "EDA / PIEE", kind: "feeder", detail: "Contract documents & mods" },
      { name: "WAWF (PIEE)", kind: "feeder", detail: "Receiving reports (DD-250)" },
      { name: "MOCAS",  kind: "feeder", detail: "Entitlement & contract pay" },
      { name: "IAPS / CAPS", kind: "feeder", detail: "Vendor pay (AF / 4th Estate)" },
      { name: "GFEBS",  kind: "gl", detail: "Obligations + AP (Army)" },
      { name: "Navy ERP", kind: "gl", detail: "Obligations + AP (Navy)" },
      { name: "DEAMS",  kind: "gl", detail: "Obligations + AP (AF)" },
      { name: "Advana", kind: "reporting", detail: "Cross-system match layer" },
    ],
    solution: [
      { layer: "Bronze", title: "Reassemble the three-way match", tech: "Ingest contracts (EDA), acceptances (WAWF), entitlements (MOCAS/IAPS/CAPS) and GL obligations/payables keyed on PIIN/SPIIN + CLIN." },
      { layer: "Silver", title: "Match state machine", tech: "Every contract line carries a state: obligated → accepted → entitled → disbursed → liquidated; payables are the measured set of accepted-not-disbursed lines, not a formula.", ai: "Where keys break, NLP extracts CLIN/ACRN references from unstructured invoice and mod text to restore the match." },
      { layer: "Match", title: "Accrual model with backtesting", tech: "For genuinely un-measurable populations (long-running service contracts), a gradient-boosted accrual model trained on WAWF acceptance-to-invoice lag replaces flat formulas — and is backtested against actuals every period with published error.", ai: "Risk-scores disbursements (amount, vendor novelty, match completeness, timing) for post-payment review under PIIA." },
      { layer: "Gold", title: "Cutoff evidence", tech: "Period-end package: measured payables listing + model-estimated accrual with backtest error + match-state census — the SFFAS 1 support auditors ask for." },
    ],
    plan: [
      { phase: "Assess (FY26 Q3–Q4)", window: "now – Sep 2026", milestones: ["Match-key quality census (PIIN/CLIN coverage)", "Accrual methodology inventory by Component"] },
      { phase: "Correct (FY27 H1)", window: "Oct 2026 – Mar 2027", milestones: ["Match state machine live for MOCAS-paid contracts", "NLP key-recovery cutting unmatched by 50%", "Accrual model v1 with backtest"] },
      { phase: "Assert (FY27 H2)", window: "Apr – Sep 2027", milestones: ["Measured payables ≥85% of AP balance", "Cutoff testing passed at two Components"] },
      { phase: "Sustain (FY28)", window: "Oct 2027 – Dec 2028", milestones: ["Backtested accrual error within tolerance 4 straight quarters", "PIIA sampling fed by risk scores"] },
    ],
    demo: { model: "risk", dataset: "txn-contracts", title: "Disbursement risk scoring (post-payment review queue)",
      rationale: "The PIIA review queue, computed live: every bundled DoD contract transaction is scored on amount, counterparty frequency and timing — the top of this list is where improper-payment dollars hide." },
  },

  // ───────────────────────────────────────────────────────── MW 19 — IGT
  {
    num: 19,
    exposure: "Buyer/seller imbalances block consolidation — DoD is its own largest trading partner",
    rootCause: "Reimbursable work crosses Components on MIPRs; buyer and seller record different amounts, periods, or trading-partner codes. G-Invoicing adoption is uneven, so there is no single agreed order to reconcile against.",
    criteria: "TFM Vol I Part 2 Ch 4700 (intragov); GTAS trading-partner edits; SFFAS 4/7.",
    effect: "Eliminations fail at consolidation; differences are forced with JVs (MW #18); the AFS carries unmatched intragovernmental activity every period.",
    positions: [
      { component: "Army",            status: "mw",       note: "High MIPR volume both directions; seller-side revenue recognition lags buyer-side expense." },
      { component: "Navy",            status: "mw",       note: "Working-capital activity (NWCF) compounds eliminations; TP-code accuracy poor on legacy orders." },
      { component: "Marine Corps",    status: "progress", note: "Smaller IGT footprint; G-Invoicing onboarding ahead of plan." },
      { component: "Air Force",       status: "mw",       note: "Buyer/seller differences with DLA and Army the largest pairs." },
      { component: "DLA",             status: "mw",       note: "Seller to everyone — pricing/recognition timing drives systemic differences." },
      { component: "USACE Civil Works", status: "progress", note: "Civil Works reimbursables reconcile; military-program orders pending G-Invoicing." },
      { component: "DFAS",            status: "progress", note: "Runs the IGT eliminations at DDRS; building the pair-matching analytics." },
      { component: "4th Estate / WHS", status: "sd",      note: "DAI agencies adopting G-Invoicing on the Treasury timeline." },
    ],
    systems: [
      { name: "G-Invoicing", kind: "treasury", detail: "Treasury's system of record for 7600A/B orders" },
      { name: "IPAC",   kind: "treasury", detail: "Settlement rail" },
      { name: "WAWF MIPR", kind: "feeder", detail: "Legacy order documents" },
      { name: "GTAS",   kind: "treasury", detail: "TP-coded trial balance submission" },
      { name: "GFEBS / Navy ERP / DEAMS / DAI", kind: "gl", detail: "Buyer & seller postings" },
      { name: "Advana", kind: "reporting", detail: "Pair-matching layer" },
    ],
    solution: [
      { layer: "Bronze", title: "Both sides of every order", tech: "Ingest G-Invoicing orders, IPAC settlements, and buyer/seller GL postings with TP codes; legacy MIPRs from WAWF/EDA as the bridge population." },
      { layer: "Silver", title: "Trading-partner pair matching", tech: "Deterministic match on order number + TP pair + period; the unmatched residual is the true elimination problem, quantified by pair.", ai: "Embedding-based matcher pairs orphan buyer/seller postings on amount, date proximity, and order-text similarity where order numbers are missing — recovering matches deterministic keys lose." },
      { layer: "Match", title: "Difference root-causing", tech: "Each unmatched pair classified: timing (period offset), pricing, TP-code error, or one-sided posting; routed to the responsible pair's worklist with an SLA.", ai: "Pareto clustering by (pair, root-cause) shows which 10 relationships drive most of the imbalance." },
      { layer: "Gold", title: "Elimination evidence", tech: "Quarterly buyer/seller comparison artifact per major pair, tied to GTAS submissions — the Ch 4700 evidence package, system-generated." },
    ],
    plan: [
      { phase: "Assess (FY26 Q3–Q4)", window: "now – Sep 2026", milestones: ["Pair-level imbalance baseline from GTAS", "G-Invoicing adoption census by Component"] },
      { phase: "Correct (FY27 H1)", window: "Oct 2026 – Mar 2027", milestones: ["Pair matching live for top-10 relationships", "Orphan-matcher recovering ≥30% of residuals", "New orders 100% G-Invoicing per Treasury mandate"] },
      { phase: "Assert (FY27 H2)", window: "Apr – Sep 2027", milestones: ["Top-10 pair imbalances within tolerance", "Quarterly comparison artifacts to DDRS/auditors"] },
      { phase: "Sustain (FY28)", window: "Oct 2027 – Dec 2028", milestones: ["Legacy MIPR population fully converted or closed", "Eliminations pass without forced JVs"] },
    ],
    demo: { model: "anomaly", dataset: "txn-assistance", title: "Orphan-posting outlier screen",
      rationale: "Run live on the bundled assistance transactions: the outlier engine that, in production, flags one-sided or amount-divergent buyer/seller postings for the pair-matching queue." },
  },

  // ───────────────────────────────────────────────────────── MW 11 — PP&E
  {
    num: 11,
    exposure: "General PP&E support gaps across services; legacy assets lack acquisition KSD",
    rootCause: "Accountability systems (DPAS, GCSS-Army, iNFADS for real property) and the GL disagree on existence and value. Capitalization thresholds were applied inconsistently for decades, and acquisition documents for legacy assets are in boxes, microfiche, or gone.",
    criteria: "SFFAS 6/50 (PP&E; deemed-cost election); FMR Vol 4 Ch 24-25.",
    effect: "Existence, completeness and valuation all impaired; depreciation unreliable; deemed-cost baselines (allowed by SFFAS 50) not yet evidenced for major classes.",
    positions: [
      { component: "Army",            status: "mw",       note: "GCSS-Army/DPAS to GFEBS linkage partial; military equipment baseline set, support for legacy general equipment thin." },
      { component: "Navy",            status: "mw",       note: "Ships/aircraft baselines accepted; shore facilities and minor property records inconsistent." },
      { component: "Marine Corps",    status: "progress", note: "Deemed-cost baselines accepted; sustainment of records discipline under audit." },
      { component: "Air Force",       status: "mw",       note: "Equipment records solid; installed-building-equipment and WIP capitalization inconsistent." },
      { component: "DLA",             status: "sd",       note: "Limited PP&E; warehouse automation assets need WIP-to-in-service evidence." },
      { component: "USACE Civil Works", status: "clean",  note: "Civil works assets (locks, dams) fully supported in CEFMS — decades of discipline." },
      { component: "DFAS",            status: "na",       note: "Minimal PP&E custodianship." },
      { component: "4th Estate / WHS", status: "sd",      note: "DPAS adoption complete; capitalization-threshold history uneven." },
    ],
    systems: [
      { name: "DPAS",   kind: "feeder", detail: "Defense property accountability" },
      { name: "GCSS-Army", kind: "feeder", detail: "Army equipment records" },
      { name: "iNFADS", kind: "feeder", detail: "Navy real property inventory" },
      { name: "APSR (various)", kind: "feeder", detail: "Component property systems of record" },
      { name: "GFEBS / Navy ERP / DEAMS / DAI", kind: "gl", detail: "PP&E + depreciation" },
      { name: "Advana", kind: "reporting", detail: "Asset lineage layer" },
    ],
    solution: [
      { layer: "Bronze", title: "Asset census, both books", tech: "Ingest the property systems of record (DPAS, GCSS-A, iNFADS, APSRs) and GL PP&E by asset ID; geo-coordinates and serial numbers carried through." },
      { layer: "Silver", title: "Existence & valuation lineage", tech: "Asset-level match: property record ↔ GL record ↔ depreciation schedule; mismatch census by class and Component.", ai: "Document AI (OCR + LLM extraction) mines digitized acquisition files — DD-1149s, contracts, transfer docs — to rebuild valuation support for legacy assets at scale; geospatial matching validates real-property existence against imagery/GIS without site visits." },
      { layer: "Match", title: "Deemed-cost program", tech: "Where SFFAS 50 permits, establish deemed-cost baselines with documented methodology; the lineage layer then only has to sustain forward.", ai: "Threshold-anomaly model finds assets capitalized inconsistently vs policy (expensed >threshold, capitalized <threshold) for cleanup." },
      { layer: "Gold", title: "Asset KSD on demand", tech: "Per-asset evidence package: property record, valuation source (or deemed-cost memo), depreciation calc, GL posting — produced by query, not by hunt." },
    ],
    plan: [
      { phase: "Assess (FY26 Q3–Q4)", window: "now – Sep 2026", milestones: ["Asset-class materiality map", "APSR↔GL mismatch baseline", "Digitization pipeline for legacy KSD"] },
      { phase: "Correct (FY27 H1)", window: "Oct 2026 – Mar 2027", milestones: ["Doc-AI extraction live; 100K legacy docs processed", "Deemed-cost memos drafted for two asset classes"] },
      { phase: "Assert (FY27 H2)", window: "Apr – Sep 2027", milestones: ["Existence testing passed for sampled real property", "Asset KSD packages produced <5 days"] },
      { phase: "Sustain (FY28)", window: "Oct 2027 – Dec 2028", milestones: ["Forward-sustainment controls tested", "Depreciation recompute automated quarterly"] },
    ],
    demo: { model: "cluster", dataset: "exhibit-accounts", title: "Capitalization strata discovery (k-means)",
      rationale: "Live clustering of the bundled account population into value strata — the same technique that segments an asset census into deemed-cost classes and flags threshold inconsistencies at the boundaries." },
  },
]

export const MW_DEEP_NUMS = MW_DEEP.map(m => m.num)
export function getDeep(num: number): MWDeep | undefined { return MW_DEEP.find(m => m.num === num) }
