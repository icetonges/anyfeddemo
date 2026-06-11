// lib/ussgl-statements.ts — FULL line-by-line statement models with USSGL
// account mapping (TFM USSGL Supplement crosswalks, representative accounts),
// audit assertions, and Key Supporting Documentation per line. This is the
// analyzable/trackable backbone: every statement line knows which USSGL
// accounts feed it, what evidences it, and where this portal can populate it.
// Account lists are the standard crosswalk families — verify the current-year
// TFM Section V crosswalk before citing in an audit deliverable.

export interface UssglLine {
  line: string                 // statement / SF-133 line number
  label: string
  ussgl: string                // contributing USSGL accounts (representative)
  normal: "D" | "C" | "—"      // normal balance
  kind?: "section" | "subtotal" | "total"
  assertion: string            // primary audit assertion(s)
  ksd: string                  // key supporting documentation
  source: string               // where the value lives / what this portal can do
  valueKey?: string            // runtime population key (FinancialStatements)
}
export interface UssglStatement {
  id: "sbr" | "bs" | "snc" | "scnp"
  title: string
  basis: string
  lines: UssglLine[]
}

export const USSGL_STATEMENTS: UssglStatement[] = [

  /* ── STATEMENT OF BUDGETARY RESOURCES — SF-133 / A-136 ─────────────────── */
  { id: "sbr", title: "Statement of Budgetary Resources", basis: "Budgetary (USSGL 4-series) · $ whole",
    lines: [
      { line: "—", label: "BUDGETARY RESOURCES", ussgl: "", normal: "—", kind: "section", assertion: "", ksd: "", source: "" },
      { line: "1000", label: "Unobligated balance from prior year budget authority, net", ussgl: "Beg. bal: 443000 445000 451000 459000 461000 465000 + 1021 recoveries (487100 497100)", normal: "C",
        assertion: "Completeness, Existence", ksd: "Prior-year certified GTAS trial balance · carryover apportionment (SF-132)", source: "File A (acquire Custom Account Data) — not in agency API" },
      { line: "1160/1200", label: "Appropriations (discretionary and mandatory)", ussgl: "411100–411900 412100–412900 (less 412700 cancellations, 438400 rescissions)", normal: "C",
        assertion: "Occurrence, Accuracy", ksd: "Appropriation warrant (TFS-6200) · apportionment SF-132 · appropriations act cite", source: "File A by line — appropriation acts loaded in Budget pages" },
      { line: "1400", label: "Borrowing authority", ussgl: "414000 414100 414300 414400", normal: "C",
        assertion: "Occurrence, Rights", ksd: "Borrowing agreements with Treasury BPD · statute authority", source: "File A — relevant for credit-program agencies" },
      { line: "1500", label: "Contract authority", ussgl: "413100 413200 413400", normal: "C",
        assertion: "Occurrence", ksd: "Statutory contract authority cite · liquidating appropriation tracking", source: "File A — e.g., DOT highway trust" },
      { line: "1700/1800", label: "Spending authority from offsetting collections", ussgl: "425200 426100 426300 427100 428300", normal: "C",
        assertion: "Occurrence, Completeness", ksd: "Reimbursable agreements (7600A/B) · collection vouchers (SF-1081/IPAC)", source: "File A — large for WCF/fee-funded entities" },
      { line: "1910", label: "TOTAL BUDGETARY RESOURCES", ussgl: "Σ above (4-series resources)", normal: "C", kind: "total",
        assertion: "All", ksd: "GTAS edit-passed trial balance · SF-133 tie-out", source: "✅ POPULATED — File A/GTAS via this portal", valueKey: "sbr.1910" },
      { line: "—", label: "STATUS OF BUDGETARY RESOURCES", ussgl: "", normal: "—", kind: "section", assertion: "", ksd: "", source: "" },
      { line: "2190", label: "New obligations and upward adjustments", ussgl: "480100 488100 490100 498100 (UDO/DO incurred, net of 487100 497100 downward adj.)", normal: "C", kind: "total",
        assertion: "Occurrence, Cut-off — THE UoT line", ksd: "Obligating documents: contracts/mods (PIID), MIPRs, task orders, travel auths, payroll certs", source: "✅ POPULATED — File A/GTAS via this portal · transaction detail = File C + D1/D2", valueKey: "sbr.2190" },
      { line: "2204", label: "Unobligated — apportioned, unexpired", ussgl: "451000 459000 461000", normal: "C",
        assertion: "Valuation, Presentation", ksd: "Current SF-132 apportionment · allotment ledgers", source: "File A by line" },
      { line: "2403", label: "Unobligated — unapportioned", ussgl: "443000 444000 445000 446000", normal: "C",
        assertion: "Presentation", ksd: "OMB apportionment status · withheld/deferred documentation", source: "File A by line" },
      { line: "2412/2413", label: "Unobligated — expired", ussgl: "465000", normal: "C",
        assertion: "Presentation, Cut-off", ksd: "Expired-account schedule · cancellation tracking (31 U.S.C. §1552–1557)", source: "File A by line" },
      { line: "2490", label: "Unobligated balance, end of period (total)", ussgl: "Σ 2204+2403+2412/13", normal: "C", kind: "total",
        assertion: "Completeness", ksd: "= 1910 − 2190 arithmetic check", source: "✅ DERIVED — 1910 − 2190", valueKey: "sbr.2490" },
      { line: "2500", label: "Total status of budgetary resources (must equal 1910)", ussgl: "2190 + 2490", normal: "C", kind: "subtotal",
        assertion: "Accuracy — statement self-check", ksd: "tie-out workpaper", source: "✅ CHECK — recomputed on this page", valueKey: "sbr.2500" },
      { line: "—", label: "OUTLAYS", ussgl: "", normal: "—", kind: "section", assertion: "", ksd: "", source: "" },
      { line: "4190", label: "Outlays, gross", ussgl: "480200 490200 498200 (delivered/paid) via FBwT 101000 credits", normal: "D", kind: "total",
        assertion: "Occurrence, Accuracy", ksd: "Payment files (SPS/PAM schedules) · Treasury CARS disbursement confirmations", source: "✅ POPULATED — Σ File B federal-account gross outlays (top-100)", valueKey: "sbr.4190" },
      { line: "4030/4120", label: "Less: offsetting collections & receipts", ussgl: "425200 426100 426300 (collected)", normal: "C",
        assertion: "Completeness", ksd: "Collection vouchers · IPAC · fee schedules", source: "File A by line" },
      { line: "4210", label: "Agency outlays, net", ussgl: "4190 − collections − distributed offsetting receipts", normal: "D", kind: "total",
        assertion: "All — ties to MTS", ksd: "Monthly Treasury Statement Table 5 (pulled by fiscaldata_statements.py)", source: "MTS monthly by agency — local FiscalData folder" },
      { line: "memo", label: "Unpaid obligations, end of period (UDO + accounts payable, budgetary)", ussgl: "480100 490100 (unpaid balances) 490800 accrual", normal: "C",
        assertion: "Existence — UDO validation triennial review (31 U.S.C. §1501)", ksd: "ULO/UDO review certifications · contract status reports", source: "File A by line — the dormant-obligation ML use case" },
    ]},

  /* ── BALANCE SHEET ──────────────────────────────────────────────────────── */
  { id: "bs", title: "Balance Sheet", basis: "Proprietary accrual (USSGL 1/2/3-series) · $ as reported in AFR",
    lines: [
      { line: "—", label: "ASSETS", ussgl: "", normal: "—", kind: "section", assertion: "", ksd: "", source: "" },
      { line: "1", label: "Fund Balance with Treasury", ussgl: "101000 (109000 in-transit)", normal: "D",
        assertion: "Existence, Completeness — DoD MW #8", ksd: "CARS/GWA account statements · monthly FBwT reconciliation (TFM 2-5100) · suspense (F3875) aging", source: "AFR Note · agency GL vs CARS — recon pattern demoed on this page below" },
      { line: "2", label: "Investments, net", ussgl: "134100–134300 161000–161900 (162000 amortization)", normal: "D",
        assertion: "Existence, Valuation", ksd: "BPD FedInvest statements · par/premium/discount schedules", source: "AFR — trust & revolving funds" },
      { line: "3", label: "Accounts receivable, net", ussgl: "131000 (131900 allowance)", normal: "D",
        assertion: "Valuation (allowance estimate)", ksd: "Aging schedules · TROR · allowance methodology paper", source: "AFR Note" },
      { line: "4", label: "Loans receivable, net (credit reform)", ussgl: "134100 135100 (139900 allowance/subsidy)", normal: "D",
        assertion: "Valuation — subsidy re-estimates", ksd: "Credit subsidy model (OMB SF-132 credit appx) · re-estimate memos", source: "AFR — ED/SBA/USDA heavy" },
      { line: "5", label: "Inventory, OM&S, and related property", ussgl: "151100 151200 152100 152200", normal: "D",
        assertion: "Existence, Valuation — DoD MW #1/#2 territory", ksd: "Physical counts/cycle inventories · APSR reconciliation · valuation method (MAC/LAC)", source: "AFR Note — property-heavy agencies" },
      { line: "6", label: "General PP&E, net", ussgl: "171100 171200 173000 174000 175000 181000 183000 (less 17x9/18x9 accum. depreciation)", normal: "D",
        assertion: "Existence, Valuation, Completeness", ksd: "Real property inventory · acquisition documents · depreciation schedules · impairment reviews", source: "AFR Note — the largest DoD audit asset risk" },
      { line: "7", label: "Other assets (advances, prepayments)", ussgl: "141000 142000 190000", normal: "D",
        assertion: "Existence", ksd: "Advance agreements · prepayment schedules", source: "AFR" },
      { line: "T1", label: "TOTAL ASSETS", ussgl: "Σ 1-series (net)", normal: "D", kind: "total",
        assertion: "All", ksd: "AFR (audited)", source: "AFR — agency-level not exposed by public API" },
      { line: "—", label: "LIABILITIES", ussgl: "", normal: "—", kind: "section", assertion: "", ksd: "", source: "" },
      { line: "8", label: "Accounts payable", ussgl: "211000 (219000 other)", normal: "C",
        assertion: "Completeness, Cut-off — accrual estimation", ksd: "Unpaid invoices · receiving reports (WAWF DD-250) · AP accrual methodology", source: "AFR Note — ≠ budgetary unpaid obligations (4801/4901): accrual vs budgetary" },
      { line: "9", label: "Accrued payroll and benefits", ussgl: "221000 221300 221500", normal: "C",
        assertion: "Completeness, Accuracy", ksd: "Payroll certs (DJMS/DCPS) · leave balances · benefit elections", source: "AFR" },
      { line: "10", label: "Federal employee and veterans' benefits payable (actuarial)", ussgl: "261000 262000 265000", normal: "C",
        assertion: "Valuation — actuarial assumptions (SFFAS 33)", ksd: "Actuarial valuation reports · assumption sensitivity · SNC Δ-assumptions tie", source: "AFR — drives VA/DoD/OPM net cost swings (visible in SNC tab)" },
      { line: "11", label: "Environmental and disposal liabilities", ussgl: "299500", normal: "C",
        assertion: "Valuation, Completeness — estimate", ksd: "Cleanup cost estimates (site-level) · engineering studies · legal obligations", source: "AFR — dominant for DOE; major DoD line" },
      { line: "12", label: "Debt and other liabilities", ussgl: "251000 252000 231000 240000 291000 299000", normal: "C",
        assertion: "Completeness, Rights/Obligations", ksd: "BPD debt confirmations · deferred revenue schedules · contingent liability (legal letters)", source: "AFR" },
      { line: "T2", label: "TOTAL LIABILITIES", ussgl: "Σ 2-series", normal: "C", kind: "total",
        assertion: "All", ksd: "AFR (audited)", source: "AFR" },
      { line: "—", label: "NET POSITION", ussgl: "", normal: "—", kind: "section", assertion: "", ksd: "", source: "" },
      { line: "13", label: "Unexpended appropriations", ussgl: "310000 (310100 received · 310700 used · 310200 transfers · 310600 adjustments)", normal: "C",
        assertion: "Accuracy — budgetary↔proprietary tie", ksd: "Appropriation warrants · SF-133 ↔ 310x crosswalk workpaper", source: "AFR — reconciles to File A unobligated + unpaid obligations" },
      { line: "14", label: "Cumulative results of operations", ussgl: "331000", normal: "C",
        assertion: "Accuracy — rollforward", ksd: "Prior-year closing (closing entries F:xxxx) · current-year SCNP", source: "AFR — SCNP tab shows the rollforward structure" },
      { line: "T3", label: "TOTAL NET POSITION (= assets − liabilities)", ussgl: "310000 + 331000", normal: "C", kind: "total",
        assertion: "All — accounting-equation check", ksd: "AFR (audited)", source: "AFR" },
    ]},

  /* ── STATEMENT OF NET COST ─────────────────────────────────────────────── */
  { id: "snc", title: "Statement of Net Cost", basis: "Proprietary accrual (USSGL 5/6/7-series) · $B at FR level",
    lines: [
      { line: "1", label: "Gross program costs", ussgl: "610000 (operating) 633000 640000 650000 (applied/cost of goods) 671000–672000 (depreciation/amortization) 673000 (imputed) 680000 (benefit expense)", normal: "D",
        assertion: "Completeness, Accuracy — cost assignment (SFFAS 4)", ksd: "Cost allocation methodology · payroll/contract expense support · depreciation schedules", source: "✅ POPULATED at agency level — audited FR (Fiscal Data)", valueKey: "snc.gross" },
      { line: "2", label: "Less: earned revenue (exchange)", ussgl: "510000 520000 531000 540000 (590000 other)", normal: "C",
        assertion: "Occurrence, Accuracy", ksd: "Reimbursable agreements · fee schedules · billing/collection support", source: "✅ POPULATED — audited FR", valueKey: "snc.earned" },
      { line: "3", label: "(Gain)/loss from changes in actuarial assumptions (SFFAS 33)", ussgl: "727100 727200 728100 728200", normal: "—",
        assertion: "Valuation — assumption changes isolated", ksd: "Actuarial reports · discount-rate documentation", source: "✅ POPULATED — audited FR (the swing line for VA/DoD/OPM)", valueKey: "snc.assump" },
      { line: "T", label: "NET COST OF OPERATIONS", ussgl: "1 − 2 ± 3", normal: "D", kind: "total",
        assertion: "All — articulates to SCNP", ksd: "FR/AFR (audited)", source: "✅ POPULATED — audited FR by agency by year", valueKey: "snc.net" },
      { line: "memo", label: "By responsibility segment / major program", ussgl: "cost-object dimension on 6-series", normal: "—",
        assertion: "Presentation (SFFAS 4 §SBR)", ksd: "Segment cost reports", source: "Agency AFR only — File B object class is the budgetary proxy on Data Intelligence" },
    ]},

  /* ── STATEMENT OF CHANGES IN NET POSITION ──────────────────────────────── */
  { id: "scnp", title: "Statement of Changes in Net Position", basis: "Proprietary accrual · rollforward of 310000/331000",
    lines: [
      { line: "1", label: "Net position, beginning of period", ussgl: "310000 + 331000 beginning balances", normal: "C",
        assertion: "Accuracy — opening balance (first-year audit focus)", ksd: "Prior-year audited Balance Sheet · closing entries", source: "AFR" },
      { line: "2", label: "Appropriations received", ussgl: "310100", normal: "C",
        assertion: "Occurrence", ksd: "Treasury warrants (TFS-6200)", source: "File A appropriations ≈ proxy; AFR exact" },
      { line: "3", label: "Appropriations used", ussgl: "310700 ↔ 570000 (financing source)", normal: "—",
        assertion: "Accuracy — the budgetary↔proprietary bridge", ksd: "Expended-authority crosswalk workpaper (310700 = 570000 every period)", source: "AFR — core tie-point for audit" },
      { line: "4", label: "Non-exchange revenue", ussgl: "580000 (taxes/duties/fines)", normal: "C",
        assertion: "Completeness", ksd: "Collection systems support · custodial split (SFFAS 7)", source: "AFR — large for TREAS/DHS(CBP)" },
      { line: "5", label: "Transfers in/(out) without reimbursement", ussgl: "572000 576500 577500", normal: "—",
        assertion: "Occurrence, Rights", ksd: "SF-1151 nonexpenditure transfer docs · trading-partner confirmation (intragov MW)", source: "AFR — must eliminate government-wide" },
      { line: "6", label: "Imputed financing", ussgl: "578000 (↔ 673000 imputed cost)", normal: "C",
        assertion: "Accuracy — OPM/Treasury factors", ksd: "OPM cost factors · imputed cost computation", source: "AFR" },
      { line: "7", label: "Less: net cost of operations", ussgl: "from SNC", normal: "D", kind: "subtotal",
        assertion: "Articulation — must equal SNC total", ksd: "FR/AFR (audited)", source: "✅ POPULATED — from the SNC tab (audited)", valueKey: "snc.net" },
      { line: "T", label: "Net position, end of period (→ Balance Sheet)", ussgl: "310000 + 331000 ending", normal: "C", kind: "total",
        assertion: "All — articulates to Balance Sheet", ksd: "AFR (audited)", source: "AFR" },
    ]},
]

export const getUssglStatement = (id: UssglStatement["id"]) => USSGL_STATEMENTS.find(s => s.id === id)!

/** flatten to analyzable rows (for JSON/CSV export, ML feature building) */
export function exportRows(values: Record<string, string | null>) {
  return USSGL_STATEMENTS.flatMap(st => st.lines.filter(l => l.kind !== "section").map(l => ({
    statement: st.title, basis: st.basis, line: l.line, label: l.label,
    ussgl_accounts: l.ussgl, normal_balance: l.normal, row_type: l.kind ?? "line",
    audit_assertion: l.assertion, ksd: l.ksd, data_source: l.source,
    value: l.valueKey ? values[l.valueKey] ?? null : null,
  })))
}
