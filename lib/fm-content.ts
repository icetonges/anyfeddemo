// lib/fm-content.ts — Federal FM domain reference content (real frameworks & findings)
// Audit: DODIG-2026-032 (Dec 18, 2025) — FY2025 DoD AFR, 26 material weaknesses.
// Sources in ./sourcedata: FY2025_DoD_Agency_Financial_Report.pdf, DODIG-2026-032.pdf

export interface MaterialWeakness {
  num: number; title: string; issue: string
  category: 'IT & Systems' | 'Transactions & Balances' | 'Reporting & Oversight'
  status: 'Open' | 'Downgraded' | 'New'
}

export const DOD_MATERIAL_WEAKNESSES: MaterialWeakness[] = [
  { num:1,  category:'IT & Systems', status:'Open', title:'Financial Management Systems Modernization', issue:'Thousands of non-FFMIA-compliant systems; modernization delayed to FY 2031' },
  { num:2,  category:'IT & Systems', status:'Open', title:'Configuration Management', issue:'Unauthorized or undocumented changes to financial systems; NIST SP 800-53 noncompliance' },
  { num:3,  category:'IT & Systems', status:'Open', title:'Security Management', issue:'Inadequate security policies and risk management across financial systems' },
  { num:4,  category:'IT & Systems', status:'Open', title:'Access Controls', issue:'Excessive user access; inappropriate access to financial data and systems' },
  { num:5,  category:'IT & Systems', status:'Open', title:'Segregation of Duties', issue:'Same individuals performing incompatible functions (posting and approving)' },
  { num:6,  category:'IT & Systems', status:'Open', title:'Interface Controls', issue:'Transactions lost or corrupted between feeder systems and the general ledger' },
  { num:7,  category:'Transactions & Balances', status:'Open', title:'Universe of Transactions', issue:'Cannot produce a complete, accurate population of transactions for audit' },
  { num:8,  category:'Transactions & Balances', status:'Open', title:'Fund Balance with Treasury', issue:'Unresolved differences between DoD records and Treasury CARS/GWA' },
  { num:9,  category:'Transactions & Balances', status:'Open', title:'Inventory and Stockpile Materials', issue:'Supply system data does not reconcile to GL; $4.3B+ untracked materials (Navy alone)' },
  { num:10, category:'Transactions & Balances', status:'Open', title:'Operating Materials and Supplies', issue:'Accountability and valuation failures in OM&S records' },
  { num:11, category:'Transactions & Balances', status:'Open', title:'General Property, Plant, and Equipment', issue:'Asset records incomplete; capitalization inconsistent across Components' },
  { num:12, category:'Transactions & Balances', status:'Open', title:'Real Property', issue:'Land and facility records not reconciled to GL; iNFADS/GL gaps' },
  { num:13, category:'Transactions & Balances', status:'Open', title:'Government Property in Possession of Contractors', issue:'No reliable inventory of government property at contractor sites' },
  { num:14, category:'Transactions & Balances', status:'Open', title:'Joint Strike Fighter Program', issue:'F-35 program financial reporting and asset accountability failures' },
  { num:15, category:'Transactions & Balances', status:'Open', title:'Accounts Payable', issue:'Accruals not consistently recorded; MOCAS/GL mismatches' },
  { num:16, category:'Transactions & Balances', status:'Open', title:'Environmental and Disposal Liabilities', issue:'Cleanup cost estimates unreliable; methodology inconsistent' },
  { num:17, category:'Transactions & Balances', status:'Open', title:'Leases', issue:'SFFAS 54 implementation incomplete; right-of-use assets not fully recognized' },
  { num:18, category:'Transactions & Balances', status:'Open', title:'Unsupported Accounting Adjustments', issue:'Manual journal entries posted without supporting documentation' },
  { num:19, category:'Reporting & Oversight', status:'Open', title:'Intragovernmental Transactions & Eliminations', issue:'Buyer/seller imbalances prevent consolidated statement preparation' },
  { num:20, category:'Reporting & Oversight', status:'Open', title:'Gross Costs', issue:'Cost data not reliably captured from all feeder systems' },
  { num:21, category:'Reporting & Oversight', status:'Open', title:'Earned Revenue', issue:'Reimbursable revenue not consistently recognized or reconciled' },
  { num:22, category:'Reporting & Oversight', status:'Open', title:'Net Cost to Outlays Reconciliation', issue:'Cannot bridge proprietary and budgetary statements' },
  { num:23, category:'Reporting & Oversight', status:'Open', title:'Budgetary Resources', issue:'Apportionment, allotment, and obligation data inconsistencies' },
  { num:24, category:'Reporting & Oversight', status:'Open', title:'Service Organizations', issue:'SSAE 18 report reliance for shared service providers — coverage gaps' },
  { num:25, category:'Reporting & Oversight', status:'Open', title:'Component Entity-Level Controls', issue:'Individual Component governance and oversight failures' },
  { num:26, category:'Reporting & Oversight', status:'Open', title:'DoD-Wide Oversight and Monitoring', issue:'Department-level coordination and accountability gaps' },
]

export const DOD_AUDIT_FACTS = {
  report: 'DODIG-2026-032 (Dec 18, 2025)',
  opinion: 'Disclaimer of Opinion',
  opinionYears: 'FY 2018 – FY 2025 (every full-scope year)',
  cleanGoal: 'Unmodified opinion required by Dec 31, 2028 (NDAA FY2024, P.L. 118-31)',
  materialWeaknesses: 26,
  significantDeficiencies: 2,
  cleanEntities: ['Defense Commissary Agency','DCAA','DFAS Working Capital Fund','DHA Contract Resource Management','DISA Working Capital Fund','Military Retirement Fund','National Reconnaissance Office','USACE Civil Works','DTRA'],
}

export const FIAR_PHASES = [
  { phase:'Assess',  desc:'Document end-to-end processes, system inventories, USSGL mapping, risk & control matrices (RCM)', deliverables:'Process narratives · System inventories · RCMs' },
  { phase:'Correct', desc:'Close control gaps, clean historical data, implement/strengthen controls, train staff', deliverables:'Updated RCMs · Corrective action docs · Training records' },
  { phase:'Assert',  desc:'Draft statements, compile Key Supporting Documentation (KSD), mock audit, management sign-off', deliverables:'Assertion memo · KSD packages · Mock audit results' },
  { phase:'Sustain', desc:'Continuous control monitoring, resolve NFRs through Corrective Action Plans (CAPs)', deliverables:'Monitoring dashboards · NFR/CAP tracker' },
]

export const A11_PHASES = [
  { phase:'Formulation',  window:'18–24 months before FY', desc:'Agency builds request: program assessments, OMB Spring guidance, September OMB submission, passback & appeals, President\'s Budget (Feb)' },
  { phase:'Enactment',    window:'Feb – Oct 1',            desc:'Congressional action: hearings, 302(a)/302(b) allocations, subcommittee markups, conference, appropriations acts (or CR)' },
  { phase:'Execution',    window:'FY in progress',         desc:'OMB apportionment (A-11 §120), allotments, obligation & outlay management, ADA compliance (31 U.S.C. §1341), reprogramming (§1532)' },
  { phase:'Audit & Review', window:'FY close + Nov 15',    desc:'Financial statement audit, AFR/PAR publication, GTAS submission, FISCAM/A-123 assessments, OIG & GAO oversight' },
]

export const USSGL_SAMPLE = [
  { acct:'1010', title:'Fund Balance With Treasury',          normal:'Debit',  stmt:'Balance Sheet' },
  { acct:'1310', title:'Accounts Receivable',                 normal:'Debit',  stmt:'Balance Sheet' },
  { acct:'1750', title:'Equipment',                           normal:'Debit',  stmt:'Balance Sheet' },
  { acct:'2110', title:'Accounts Payable',                    normal:'Credit', stmt:'Balance Sheet' },
  { acct:'2210', title:'Accrued Funded Payroll & Leave',      normal:'Credit', stmt:'Balance Sheet' },
  { acct:'3100', title:'Unexpended Appropriations — Cumulative', normal:'Credit', stmt:'Net Position' },
  { acct:'4119', title:'Other Appropriations Realized',       normal:'Debit',  stmt:'SBR' },
  { acct:'4450', title:'Unapportioned Authority',             normal:'Credit', stmt:'SBR' },
  { acct:'4510', title:'Apportionments',                      normal:'Credit', stmt:'SBR' },
  { acct:'4610', title:'Allotments — Realized Resources',     normal:'Credit', stmt:'SBR' },
  { acct:'4801', title:'Undelivered Orders — Unpaid',         normal:'Credit', stmt:'SBR' },
  { acct:'4901', title:'Delivered Orders — Unpaid',           normal:'Credit', stmt:'SBR' },
  { acct:'6100', title:'Operating Expenses / Program Costs',  normal:'Debit',  stmt:'Net Cost' },
]

export const FINOPS_PROGRAMS = [
  { id:'dts', name:'Defense Travel System (DTS)', icon:'✈️',
    desc:'Temporary duty (TDY) travel authorization, voucher processing, and reimbursement. JTR compliance, post-payment reviews under the Improper Payments framework (PIIA).',
    kpis:['Voucher cycle time','Improper payment rate','Unsubmitted voucher aging','Debt management'] },
  { id:'gtc', name:'Government Travel Charge Card (GTC)', icon:'💳',
    desc:'Individually billed (IBA) and centrally billed (CBA) travel cards. Delinquency monitoring, salary offset, split disbursement, misuse case management per the Travel and Transportation Reform Act.',
    kpis:['Delinquency rate (30/60/90+)','Misuse cases','Salary offset actions','Account activation ratio'] },
  { id:'gpc', name:'Government Purchase Card (GPC)', icon:'🛒',
    desc:'Micro-purchase program (threshold $10K) under SmartPay 3. Approving official span of control, semi-annual reviews, data-mining flags via Insights/PCOLS.',
    kpis:['Monthly spend','Data-mining flag rate','Span of control (cards/AO)','Semi-annual review completion'] },
]

export const A123_CONTROLS = [
  { id:'ELC-01', area:'Entity Level',   ctrl:'Tone at the top — CFO governance council meets monthly; risk profile refreshed annually', freq:'Annual',    assertion:'All' },
  { id:'BGT-01', area:'Budget Execution', ctrl:'Apportionment vs. obligation edit check blocks obligations exceeding OMB apportionment (ADA preventive)', freq:'Continuous', assertion:'Compliance' },
  { id:'BGT-02', area:'Budget Execution', ctrl:'Monthly Status of Funds review — obligation rate vs. plan, ULO aging by appropriation', freq:'Monthly',  assertion:'Completeness' },
  { id:'ACC-01', area:'Accounting',     ctrl:'JV (journal voucher) two-person approval with KSD attached; no self-approval (SoD)', freq:'Per-transaction', assertion:'Existence' },
  { id:'ACC-02', area:'Accounting',     ctrl:'FBwT monthly reconciliation to Treasury CARS — differences aged & cleared within 60 days', freq:'Monthly',  assertion:'Accuracy' },
  { id:'PAY-01', area:'Payments',       ctrl:'Three-way match (obligation/receipt/invoice) before disbursement; prompt-pay interest tracked', freq:'Per-transaction', assertion:'Existence' },
  { id:'PAY-02', area:'Payments',       ctrl:'Improper payment sampling & recovery audit per PIIA; results to AFR', freq:'Quarterly',  assertion:'Accuracy' },
  { id:'PRC-01', area:'Acquisition',    ctrl:'Contract type decision matrix; COR surveillance checklist; ceiling utilization reporting', freq:'Quarterly', assertion:'Valuation' },
  { id:'CRD-01', area:'Charge Cards',   ctrl:'GPC data-mining flags adjudicated within 30 days; AO span-of-control ≤ 7 cardholders', freq:'Monthly',   assertion:'Compliance' },
  { id:'SYS-01', area:'Systems',        ctrl:'User access recertification for financial systems; privileged access reviewed quarterly (FISCAM)', freq:'Quarterly', assertion:'All' },
]

export const GUIDANCE_LIBRARY = [
  { title:'Anti-Deficiency Act', cite:'31 U.S.C. §1341', desc:'Prohibits obligations/expenditures exceeding appropriated or apportioned amounts. Violations require reporting to the President and Congress.' },
  { title:'OMB Circular A-11', cite:'2025 ed.', desc:'Preparation, submission, and execution of the budget — the full lifecycle rulebook including §120 apportionments.' },
  { title:'OMB Circular A-123', cite:'incl. Appendix A & B', desc:'Management\'s responsibility for ERM and internal control; Appendix B governs charge card programs.' },
  { title:'OMB Circular A-136', cite:'rev. 2025', desc:'Financial reporting requirements — AFR/PAR form and content.' },
  { title:'CFO Act of 1990', cite:'P.L. 101-576', desc:'Established agency CFOs and the federal financial management framework; 24 CFO Act agencies.' },
  { title:'FMFIA', cite:'31 U.S.C. §3512', desc:'Federal Managers Financial Integrity Act — annual assurance statements on internal control.' },
  { title:'FFMIA', cite:'P.L. 104-208', desc:'Requires systems to comply with federal FM system requirements, USSGL at transaction level.' },
  { title:'PIIA', cite:'P.L. 116-117', desc:'Payment Integrity Information Act — improper payment identification, sampling, and reporting.' },
  { title:'USSGL TFM', cite:'Treasury Financial Manual S2', desc:'The U.S. Standard General Ledger — uniform chart of accounts & posting logic for all agencies.' },
  { title:'FIAR Guidance', cite:'OUSD(C)', desc:'DoD Financial Improvement and Audit Remediation methodology — Assess, Correct, Assert, Sustain.' },
  { title:'JTR', cite:'Joint Travel Regulations', desc:'Per diem, travel allowances, and TDY entitlements for uniformed members and civilians.' },
  { title:'SmartPay 3', cite:'GSA', desc:'Government-wide charge card master contract — travel (GTC), purchase (GPC), fleet, integrated.' },
]
