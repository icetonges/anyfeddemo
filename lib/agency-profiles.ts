// lib/agency-profiles.ts — expert agency knowledge layer.
// Mission, operating footprint, uniqueness, and the financial-management
// landscape (budget · accounting · internal control · audit · fin ops) per
// agency, plus a senior-budget-professional briefing for the Budget Lifecycle
// page. Deep profiles for major agencies; a structurally-derived profile for
// the rest. Dollar figures marked ≈ are approximate orientation values —
// verify against the agency CBJ / appropriations act before citing.
import type { Agency } from "@/lib/agencies"

export interface EnactedYear { fy: string; amount: string; note: string }
export interface BudgetBrief {
  overview: string
  fundingStructure: string
  appropriations: string          // committees, acts, authorization interplay
  enacted: EnactedYear[]          // last ~3 enacted levels (≈, orientation)
  uniqueness: string
  insights: string[]              // senior budget professional reads
}
export interface AgencyProfile {
  mission: string
  footprint: string
  uniqueness: string
  fm: { budget: string; accounting: string; controls: string; audit: string; finops: string }
  budget: BudgetBrief
}

const P: Record<string, AgencyProfile> = {

  DOD: {
    mission: "Provide the military forces needed to deter war and protect the security of the United States — organize, train, and equip the Army, Navy/Marine Corps, Air Force/Space Force, and combatant commands across all warfighting domains.",
    footprint: "≈2.1M military + ≈780K civilians across ~4,800 sites in 160+ countries; ~$4.1T in assets including 26,000+ buildings, 19,000+ aircraft, 290+ battle-force ships. The largest employer and largest asset holder in the federal government.",
    uniqueness: "Scale plus federation: DoD is not one entity but ~50 reporting entities executing through five major ERPs and thousands of feeders under PPBE — a planning/programming layer (POM, FYDP) that exists nowhere else in government. Working capital funds, foreign military sales trust activity, and classified programs add accounting structures most agencies never touch.",
    fm: {
      budget: "PPBE governs: Planning (NDS→DPG), Programming (POM/FYDP), Budgeting (BES→PB J-books: M-1, O-1, P-1, R-1, C-1, RF-1), Execution. Two appropriations acts (Defense; MilCon-VA), annual NDAA authorization, and heavy use of multi-year (PROC 3yr, RDT&E 2yr, MILCON 5yr) and no-year authority.",
      accounting: "USSGL at transaction level is the FFMIA gap: five ERPs (GFEBS, Navy ERP, DEAMS, DAI, SABRS) plus legacy ledgers consolidate through DDRS to the agency-wide statements. DFAS performs accounting service for most Components; Treasury Index 97 accounts.",
      controls: "A-123 program run per Component with OUSD(C) oversight; the FY2025 ICOFR statement acknowledges 26 material weaknesses. SoD and access controls in the ERPs are the systemic gaps (MW #4/#5).",
      audit: "Largest financial audit on earth: ~1,600 auditors, 26 standalone Component audits rolled to the agency-wide opinion — disclaimer every year since FY2018; statutory clean-opinion deadline Dec 31, 2028 (P.L. 118-31). USMC's sustained unmodified opinion is the internal playbook.",
      finops: "DTS (travel), GTCC (≈2.5M cardholders), GPC under SmartPay 3, MOCAS/WAWF contract pay through DFAS, military and civilian payroll (DJMS/DCPS) — each a high-volume payment-integrity program under PIIA.",
    },
    budget: {
      overview: "The defense budget is the largest discretionary account in the federal budget — roughly half of all discretionary spending. It is built bottom-up through PPBE over ~24 months and defended line-by-line in four congressional committees (HASC/SASC authorize, HAC-D/SAC-D appropriate).",
      fundingStructure: "Appropriation families with different periods of availability: MILPERS (1yr), O&M (1yr), Procurement (3yr), RDT&E (2yr), MILCON (5yr), Revolving/Working Capital (no-year). Color-of-money discipline (31 U.S.C. §1301 purpose) is the daily constraint — the same program may draw on three appropriations simultaneously.",
      appropriations: "Defense Appropriations Act (HAC-D/SAC-D) carries ~96% of the topline; MILCON rides the MilCon-VA act. The NDAA authorizes annually before (in theory) appropriators fund. Reprogramming above thresholds requires prior approval from four committees (sec. 8005 general transfer authority, typically ~$6B cap).",
      enacted: [
        { fy: "FY2024", amount: "≈$824B", note: "Defense Approps, P.L. 118-47 division A (Mar 2024) — discretionary 051 base" },
        { fy: "FY2025", amount: "≈$826B", note: "full-year CR (P.L. 119-4) at near-FY24 levels — anomalies for new starts" },
        { fy: "FY2026", amount: "disc. enacted + P.L. 119-21 tranche", note: "see loaded exhibit data — mandatory reconciliation money rides alongside discretionary" },
      ],
      uniqueness: "Only agency with a statutory future-years program (FYDP) of record; only agency whose budget is authorized line-by-line annually; classified annexes carry tens of billions outside public exhibits; and the FY2026 structure mixes one-time mandatory reconciliation funding into the topline — a trend-analysis trap.",
      insights: [
        "Never trend the FY2026 topline raw: strip the P.L. 119-21 mandatory tranche first or every growth rate you brief is wrong.",
        "Watch unobligated balances by appropriation age, not just rate — 3yr PROC money in year 1 at 40% obligated is healthy; 1yr O&M at 85% in August is a September rush waiting to happen.",
        "Congressional adds concentrate in Procurement line items (ships, aircraft plus-ups) — the movers table between PB vintages predicts where marks land next cycle.",
        "CR risk is asymmetric for DoD: no new starts and production-rate locks bite Procurement/RDT&E hardest; O&M survives CRs best. Model the FY2027 CR scenario by appropriation, not at topline.",
        "The FYDP outyears are negotiating positions, not forecasts — programmatic risk lives in the gap between the FYDP ramp and realistic appropriations toplines.",
      ],
    },
  },

  SEC: {
    mission: "Protect investors; maintain fair, orderly, and efficient markets; and facilitate capital formation — regulating ~28,000 registered entities including broker-dealers, investment advisers, exchanges, and public companies.",
    footprint: "≈4,500 staff (attorneys, accountants, examiners, economists) in DC headquarters + 10 regional offices; 5 commissioners; divisions of Enforcement, Examinations, Corporation Finance, Trading & Markets, Investment Management.",
    uniqueness: "Deficit-neutral by design: Section 31 transaction fees offset every appropriated dollar, so SEC funding costs taxpayers $0 net — yet Congress still sets the spending ceiling annually, making the SEC fee-funded but appropriations-disciplined.",
    fm: {
      budget: "Single Salaries & Expenses account through the FSGG appropriations subcommittee; fee-rate machinery (Section 31) adjusts mid-year to match collections to the enacted ceiling. Reserve Fund (capped $100M/yr, $50M deposits) funds multi-year technology.",
      accounting: "Clean USSGL implementation in a single core system (Momentum-based FMS via shared service); filing-fee and Section 31 revenue accounting (custodial vs budgetary) is the technically interesting corner.",
      controls: "Mature A-123 program; no material weaknesses; FISMA and CAT data-security controls are the OIG's standing focus areas.",
      audit: "GAO audits the SEC directly (a distinction — most agencies get IPA audits). Sustained unmodified opinions; the audit watch items are IT controls, not balances.",
      finops: "Standard travel/purchase card programs at modest scale; the distinctive op is fee processing — billions in Section 31 collections reconciled to exchange-reported volume daily.",
    },
    budget: {
      overview: "A ~$2B regulatory budget that punches far above its weight: each enacted dollar is offset by Section 31 fees, but the appropriation still sets the binding obligation ceiling — so the SEC fights the same FSGG battles as taxpayer-funded peers.",
      fundingStructure: "One S&E account (no-year carryover components), the technology Reserve Fund, and offsetting Section 31 collections trued-up by mid-year fee-rate adjustments. Filing fees (Section 6(b)) are custodial — they go to Treasury, not the SEC.",
      appropriations: "Financial Services & General Government (FSGG) subcommittees. The act language matters as much as the number: riders routinely direct or restrict rulemaking activity.",
      enacted: [
        { fy: "FY2023", amount: "≈$2.21B", note: "Consolidated Approps 2023 — high-water mark" },
        { fy: "FY2024", amount: "≈$2.00B", note: "FSGG cut vs FY23 — first reduction in a decade" },
        { fy: "FY2025", amount: "≈$2.00B", note: "CR-level flat; fee rates adjusted down to match" },
      ],
      uniqueness: "The only major financial regulator that is simultaneously fee-offset AND annually appropriated (contrast FDIC/OCC/Fed — fully outside approps). This hybrid makes the SEC budget a policy lever: Congress can squeeze enforcement capacity without costing taxpayers a dollar.",
      insights: [
        "Watch FTE, not dollars: with ~70% of cost in compensation, a flat topline against locked-in pay raises is a real cut of ~4-5% in examination capacity each year.",
        "The Reserve Fund is the only true multi-year money — major technology programs (EDGAR modernization, CAT) live or die on its $100M annual cap.",
        "Fee-rate true-ups mean collections always match the ceiling — never read Section 31 collections as a demand signal.",
        "CRs hurt less here than at most agencies (no new-start construction), but hiring freezes under CRs compound the FTE squeeze.",
      ],
    },
  },

  FDIC: {
    mission: "Maintain stability and public confidence in the U.S. financial system: insure deposits (up to $250K), examine and supervise ~4,500 state-chartered banks, and resolve failed institutions as receiver.",
    footprint: "≈6,000 employees across HQ, 6 regional offices, and field examination staff; manages the Deposit Insurance Fund (DIF ≈ $130B+) and stands ready to run bank resolutions of any size on a weekend.",
    uniqueness: "Entirely outside the appropriations process: funded by risk-based assessments on insured banks and DIF investment income. The board approves the operating budget; Congress holds oversight hearings but never votes the FDIC a dollar.",
    fm: {
      budget: "Board-approved annual operating budget (~$3B) split between ongoing operations and receivership funding; assessment-rate setting is the real 'budget' decision — it sizes the DIF against the statutory reserve ratio (1.35% of insured deposits).",
      accounting: "GAAP (FASB) reporting for the DIF rather than pure FASAB — a corporate-style balance sheet with loss reserves for anticipated failures; receivership estates are accounted for separately as fiduciary activities.",
      controls: "COSO-based internal control over the DIF and receivership operations; resolution readiness exercises are a control unique to FDIC.",
      audit: "GAO audits the DIF and FRF annually — long unmodified streak; the estimation of contingent loss reserves for troubled banks is the recurring significant-judgment area.",
      finops: "Assessment collection from every insured bank quarterly, receivership cash management (asset sales, dividend distributions to creditors), and a standing resolution-funding capability that can mobilize billions in days.",
    },
    budget: {
      overview: "No appropriation, no fiscal-year cliff: the FDIC board adopts the budget each December, sized to examination workload and resolution readiness, funded by assessments that adjust with banking-sector risk.",
      fundingStructure: "Two funds: the DIF (assessments + investment income; pays operating costs and failure losses) and the FSLIC Resolution Fund (legacy). Special assessments recover extraordinary losses — e.g., the 2023 systemic-risk determinations were recouped from large banks, not taxpayers.",
      appropriations: "None. Oversight via Senate Banking / House Financial Services; GAO and the FDIC OIG provide the audit/inspection layer. The 'enacted amount' below is the board-approved operating budget.",
      enacted: [
        { fy: "CY2024", amount: "≈$3.0B", note: "board-approved operating budget" },
        { fy: "CY2025", amount: "≈$3.0B", note: "flat; examination staffing emphasis" },
        { fy: "CY2026", amount: "≈$3.1B", note: "board-approved; resolution-readiness investment" },
      ],
      uniqueness: "Budget flexibility no appropriated agency has: when banks fail, spending scales instantly without congressional action — the DIF absorbs losses and special assessments restore it. The discipline substitute is the statutory reserve ratio and board governance.",
      insights: [
        "The number to watch is the DIF reserve ratio vs the 1.35% statutory minimum — it drives assessment rates, which is the FDIC's real fiscal policy.",
        "Operating budget growth tracks problem-bank counts with a lag; a rising problem-bank list this year is next year's examiner hiring plan.",
        "Receivership spending is self-liquidating (recovered from estate assets) — never read gross resolution outlays as cost.",
      ],
    },
  },

  TREAS: {
    mission: "Maintain a strong economy: manage federal finances (collect revenue, pay obligations, borrow), produce currency, enforce financial sanctions, and steward the financial system.",
    footprint: "≈100K employees (≈85% in IRS); bureaus include IRS, Fiscal Service, OCC, Mint, BEP, FinCEN, TTB; Fiscal Service operates the government's cash and debt machinery — $5T+ annual collections, 1.4B+ payments/yr.",
    uniqueness: "Both an agency and THE fiscal utility: Treasury runs the accounts every other agency reconciles to (CARS/GWA, GTAS, IPAC, G-Invoicing). Its own books are dwarfed by its custodial role — interest on the public debt and tax collections flow through Treasury but belong to the government as a whole.",
    fm: {
      budget: "FSGG appropriations for most bureaus; IRS funding is the perennial battleground (base approps + IRA supplemental subject to recurring rescissions). Permanent indefinite appropriations cover debt interest — no annual vote.",
      accounting: "Fiscal Service publishes the governmentwide financial statements; Treasury's custodial accounting (taxes receivable, debt) is the largest custodial reporting anywhere.",
      controls: "A-123 across bureaus; IRS unpaid-assessments estimation and information-security are standing GAO focus areas.",
      audit: "GAO audits the consolidated governmentwide statements (disclaimer persists, driven largely by DoD) and the Schedule of the Public Debt (clean since 1997).",
      finops: "Operates the payment rails: Fiscal Service disburses for most civilian agencies, runs Do-Not-Pay, the Treasury Offset Program, and the central debt auctions.",
    },
    budget: {
      overview: "Treasury's discretionary budget (~$14-16B excl. IRS supplementals) is small relative to its role; the real money is permanent: debt interest (~$1T/yr territory) and tax-credit outlays never touch the appropriations process.",
      fundingStructure: "Annual FSGG appropriations per bureau + permanent indefinite authority (debt interest, certain refunds) + reimbursable franchise activity (shared services). IRS adds multi-year supplemental balances under recurring rescission pressure.",
      appropriations: "FSGG subcommittees; the IRS line is the political fulcrum — enforcement vs taxpayer-services allocations are specified in act language.",
      enacted: [
        { fy: "FY2023", amount: "≈$14.3B", note: "Treasury-wide discretionary excl. permanent accounts" },
        { fy: "FY2024", amount: "≈$14.5B", note: "plus IRA supplemental rescissions of ≈$20B" },
        { fy: "FY2025", amount: "≈$14.4B", note: "CR-level; further IRA clawbacks in side deals" },
      ],
      uniqueness: "The only department whose largest outlays require no appropriation at all (interest is constitutionally untouchable in practice), and whose operational health (Fiscal Service) is a systemic dependency for every other agency's FM.",
      insights: [
        "Track the IRS supplemental balance separately from base approps — rescissions hit the multi-year money, and enforcement-revenue scoring swings CBO baselines by tens of billions.",
        "Debt-service costs are the budget environment, not a budget line: every 100bp of rate persistence reprices the fiscal space all agencies compete for.",
        "Fiscal Service modernization (paper-check elimination, account consolidation) quietly changes every agency's reconciliation workload — watch its milestones if you run FBwT anywhere.",
      ],
    },
  },

  HHS: {
    mission: "Enhance the health and well-being of all Americans — operate Medicare and Medicaid, fund biomedical research (NIH), public-health response (CDC, ASPR), drug safety (FDA), and human-services programs.",
    footprint: "≈80K employees across 13 operating divisions; CMS alone moves ~$1.7T/yr in benefit payments — the largest single payment flow in government after Social Security.",
    uniqueness: "A mandatory-spending giant with a discretionary research enterprise bolted on: ~90% of HHS outlays (Medicare/Medicaid) bypass annual appropriations entirely, while NIH/CDC/FDA fight for discretionary dollars.",
    fm: {
      budget: "Labor-HHS-Education appropriations (the perennial last-to-pass bill) for discretionary; entitlement baselines set by authorizing law and re-estimated, not appropriated. User fees (FDA PDUFA) offset significant operations.",
      accounting: "CMS actuarial accruals (incurred-but-not-reported claims) are among the largest estimates in federal accounting; grant accounting (states, universities) dominates the rest.",
      controls: "Improper-payment programs at CMS are the government's largest PIIA exposure (Medicare FFS, Medicaid) — error-rate measurement and recovery audit are core controls.",
      audit: "Clean opinions in recent years; the OIG runs the largest health-care fraud enforcement portfolio in government.",
      finops: "Payment operations via Medicare Administrative Contractors, grants via PMS — both shared-service patterns other agencies study.",
    },
    budget: {
      overview: "Two budgets in one: a ~$120B discretionary research/public-health portfolio appropriated annually, riding on a ~$1.6T+ mandatory entitlement base that moves by demographics and authorizing law.",
      fundingStructure: "Discretionary via Labor-H; mandatory via permanent authority with annual re-estimates; trust funds (HI/SMI) with their own solvency arithmetic; substantial user-fee offsets at FDA; advance appropriations smooth some accounts.",
      appropriations: "Labor-HHS-Education subcommittee — historically the most contested non-defense bill, frequently finishing under CR or omnibus.",
      enacted: [
        { fy: "FY2023", amount: "≈$121B", note: "discretionary program level" },
        { fy: "FY2024", amount: "≈$117B", note: "post-FRA caps trim" },
        { fy: "FY2025", amount: "≈$117B", note: "CR-level discretionary; mandatory grows regardless" },
      ],
      uniqueness: "Discretionary/mandatory whiplash: a 2% NIH cut dominates headlines while Medicare grows $60B the same year on autopilot — budget analysis here must always state which lens it is using.",
      insights: [
        "Never mix program level with budget authority at HHS — PHS Act transfers and user fees make the two differ by billions.",
        "Watch trust-fund solvency dates (HI fund) — they convert actuarial tables into legislative deadlines that reshape everything else.",
        "Grant-heavy accounts execute slowly by design; obligation-rate alarms tuned for contracts will false-positive on NIH/CDC accounts.",
      ],
    },
  },

  DHS: {
    mission: "Safeguard the American people and homeland: border security (CBP), immigration (ICE, USCIS), cyber (CISA), disaster response (FEMA), transportation security (TSA), maritime (USCG), and protection (USSS).",
    footprint: "≈260K employees — third-largest department — across 8 operational components plus headquarters; the most operationally diverse portfolio in government.",
    uniqueness: "A 2003 merger of 22 legacy agencies that still shows in FM: multiple heritage financial systems, component-level cultures, and a budget that swings with emergencies (Disaster Relief Fund) and policy surges (border).",
    fm: {
      budget: "Single Homeland Security Appropriations Act; heavy supplemental and emergency-designation usage (DRF); fee funding at USCIS (~95% fee-funded) and TSA passenger fees offset parts of the topline.",
      accounting: "Component ledgers consolidating upward; USCG and FEMA carry the historic audit-risk balances (property, disaster obligations).",
      controls: "A-123 maturity varies by component — FEMA disaster-obligation controls under surge conditions are the stress test.",
      audit: "Earned its first clean opinion in FY2013 (first for a department of its size post-merger) and has largely sustained it — the proof-of-concept DoD cites.",
      finops: "FEMA's disaster payment surges, CBP duty collections (a major custodial revenue stream), and USCIS fee operations are the distinctive flows.",
    },
    budget: {
      overview: "A ~$60-65B discretionary base that understates the real fiscal footprint: DRF supplementals, fee accounts, and (in FY2025+) multi-year mandatory border funding via reconciliation ride alongside.",
      fundingStructure: "One appropriations act; the DRF with emergency-designated replenishment; USCIS/TSA fee offsets; multi-year reconciliation tranches (P.L. 119-21 border/immigration funding) executing outside annual caps.",
      appropriations: "Homeland Security subcommittees — uniquely, the full department in one bill, which makes it a frequent vehicle for immigration policy riders and shutdown brinkmanship.",
      enacted: [
        { fy: "FY2023", amount: "≈$60.7B", note: "net discretionary" },
        { fy: "FY2024", amount: "≈$61.8B", note: "P.L. 118-47 division C" },
        { fy: "FY2025", amount: "≈$62B + reconciliation", note: "CR-level base + P.L. 119-21 multi-year border tranche" },
      ],
      uniqueness: "The widest gap in government between 'enacted base' and 'money actually moving' — DRF supplementals and reconciliation tranches can exceed half the base in surge years. Topline trend analysis without fund-source decomposition is meaningless here.",
      insights: [
        "Decompose every DHS trend into base / DRF / fee / reconciliation before briefing — each moves on different authority and different politics.",
        "DRF burn forecasting is the highest-value analytics play: hurricane-season obligations are forecastable and replenishment lead-time is the binding constraint.",
        "Multi-year reconciliation money executes against plan, not appropriation-year pressure — its unobligated balances are healthy by design; don't let topline obligation rates hide base-account problems.",
      ],
    },
  },

  VA: {
    mission: "Serve America's veterans: health care (VHA — the largest integrated health system in the U.S.), benefits (VBA — disability compensation, GI Bill, home loans), and memorial affairs.",
    footprint: "≈450K employees, ~1,300 health facilities (172 medical centers), serving ~9M enrolled veterans; second-largest department by headcount and discretionary budget.",
    uniqueness: "Advance appropriations: medical care accounts are enacted a year ahead (P.L. 111-81) so a shutdown never closes a VA hospital. The Toxic Exposures Fund (PACT Act) created a mandatory channel growing alongside discretionary care.",
    fm: {
      budget: "MilCon-VA appropriations; medical care advance-appropriated; benefits are mandatory with annual re-estimates; the discretionary/TEF split is the new structural fault line.",
      accounting: "Actuarial veteran-benefit liabilities (hundreds of billions, sensitive to discount rates and PACT-era claims) dominate the balance sheet; health-care accruals at system scale.",
      controls: "Financial management system modernization (iFAMS) is the multi-year control bet — legacy FMS replacement mid-flight.",
      audit: "Clean opinions sustained for two decades, with recurring material weaknesses in IT controls and (recently) around the financial system migration.",
      finops: "Community-care claims processing (billions in external provider payments), beneficiary debt management, and the home-loan guaranty program's credit-reform accounting.",
    },
    budget: {
      overview: "A ~$370B+ total budget where the growth is structural: enrollment, acuity, PACT Act eligibility, and community care all compound — VA has been the fastest-growing major department for a decade.",
      fundingStructure: "Discretionary medical care (advance-appropriated, ~$130B+), mandatory compensation & pensions (~$190B+), the Toxic Exposures Fund, construction accounts, and credit-reform loan programs.",
      appropriations: "MilCon-VA subcommittees — historically the easiest bill to pass, which is why it often moves first and carries advance appropriations for the following year.",
      enacted: [
        { fy: "FY2023", amount: "≈$135B disc.", note: "+ mandatory ≈$168B" },
        { fy: "FY2024", amount: "≈$137B disc.", note: "TEF begins absorbing toxic-exposure care costs" },
        { fy: "FY2025", amount: "≈$141B disc.", note: "advance approps insulated it from the CR" },
      ],
      uniqueness: "The advance-appropriation + TEF structure means VA budget fights are about NEXT year and about which channel (discretionary vs TEF) pays — a cost-shifting debate with real scoring consequences, not a topline debate.",
      insights: [
        "Community care is the cost-control battleground: its growth rate (>10%/yr) outruns in-house care and is demand-driven — watch the MISSION Act access-standard levers.",
        "TEF reclassification moves billions between discretionary and mandatory without changing care delivered — normalize before any year-over-year claim.",
        "Benefits re-estimates land in the fall: PACT-era claims inventory is the leading indicator for the next mandatory step-up.",
      ],
    },
  },

  SSA: {
    mission: "Administer Social Security: retirement, survivors, and disability insurance for ~70M beneficiaries, plus SSI — issuing ~$1.5T in benefits annually with administrative costs under 1%.",
    footprint: "≈57K employees, ~1,200 field offices, teleservice and processing centers; the federal government's largest direct-to-citizen service network.",
    uniqueness: "Benefits are permanent indefinite authority from trust funds; only the administrative budget (LAE) is appropriated — so SSA's 'budget fight' is entirely about service capacity (wait times, disability backlogs), never about benefits themselves.",
    fm: {
      budget: "Single LAE account via Labor-HHS; trust-fund financed (the appropriation is a limitation on trust-fund spending, not new BA).",
      accounting: "Trust-fund accounting (OASI/DI) with intragovernmental investments in special-issue Treasuries; benefit-overpayment receivables are the messy ledger corner.",
      controls: "Payment accuracy programs (CDRs, SSI redeterminations) double as both controls and scored savings generators.",
      audit: "Clean opinions; improper payments (SSI in particular) and overpayment-recovery policy are the persistent findings.",
      finops: "1.2B+ payments/yr through Fiscal Service, representative-payee oversight, and program-integrity workloads that return $8-10 per $1 spent.",
    },
    budget: {
      overview: "The LAE account (~$14B) buys the administration of $1.5T in benefits — a 0.9% overhead ratio that is simultaneously SSA's pride and its trap: flat LAE against rising beneficiary rolls is an automatic service cut.",
      fundingStructure: "LAE limitation funded from the trust funds + a small GF share for SSI administration; program-integrity funding has dedicated cap adjustments (BBEDCA) that score as deficit reduction.",
      appropriations: "Labor-HHS-Education subcommittee; LAE competes directly with NIH/CDC in the same allocation — a structural disadvantage for an administrative account.",
      enacted: [
        { fy: "FY2023", amount: "≈$14.1B LAE", note: "" },
        { fy: "FY2024", amount: "≈$14.2B LAE", note: "essentially flat against +3% beneficiary growth" },
        { fy: "FY2025", amount: "≈$14.2B LAE", note: "CR-level — hiring freezes, field-office strain" },
      ],
      uniqueness: "A budget where demography is destiny: beneficiary growth is known a decade out, so every flat-funded year is a quantifiable, predictable service degradation — the cleanest cost-vs-service tradeoff curve in government.",
      insights: [
        "Use workload-per-FTE as the real budget metric: dollars are flat but claims volume isn't — the gap is the disability backlog.",
        "Program-integrity cap adjustments are the only reliably growable line: they score as savings, so appropriators fund them even in cut years.",
        "Trust-fund depletion dates (DI/OASI) set the legislative clock — administrative budget advocacy lands best framed against them.",
      ],
    },
  },

  NASA: {
    mission: "Drive advances in science, technology, aeronautics, and space exploration — Artemis lunar return, Earth and planetary science, and stewardship of human spaceflight.",
    footprint: "≈18K civil servants + a contractor workforce several times larger across 10 centers (JSC, KSC, JPL via Caltech FFRDC, GSFC…); unique national infrastructure (launch complexes, deep-space network).",
    uniqueness: "Program-project budget structure: NASA budgets by mission (SLS, Orion, Europa Clipper) with multi-year cost profiles and independent baselines (ABCs) — cost-growth breaches trigger statutory congressional reporting (the '30% breach' rule).",
    fm: {
      budget: "CJS appropriations; account structure (Deep Space Exploration, Science, Space Ops…) maps to directorates; heavy use of multi-year availability and milestone-based contracting (fixed-price commercial services vs cost-plus development).",
      accounting: "Space hardware asset accounting (when does a spacecraft become PP&E?), theme-based full-cost allocation, and JPL as a contractor-operated anomaly.",
      controls: "EVM on major programs is the control backbone; JCL (joint cost-schedule confidence) policy governs baselines.",
      audit: "Clean opinions; OIG focus is program cost growth (SLS/Orion per-launch cost) rather than ledger integrity.",
      finops: "Milestone payments to commercial partners (SpaceX, Axiom) under Space Act Agreements — a payment model the rest of government is now copying.",
    },
    budget: {
      overview: "A ~$25B science-and-exploration portfolio where the budget IS the program: launch dates, mission selections, and workforce levels at ten centers all trace directly to account-level marks.",
      fundingStructure: "Seven appropriation accounts, most 2-year availability; no fee income of consequence; Space Act reimbursable work for other agencies; cost-sharing via international partners (barter, not dollars).",
      appropriations: "Commerce-Justice-Science subcommittees; planetary science vs human exploration is the recurring intra-account knife fight, often decided in report language rather than bill text.",
      enacted: [
        { fy: "FY2023", amount: "≈$25.4B", note: "peak" },
        { fy: "FY2024", amount: "≈$24.9B", note: "FRA-cap cut — first nominal decline in a decade" },
        { fy: "FY2025", amount: "≈$24.9B", note: "CR-level; missions absorbed via schedule slips" },
      ],
      uniqueness: "Schedule is the budget release valve: NASA rarely cancels under cuts — it slips launch dates, which compounds total cost (standing-army costs) and creates the cost-growth findings OIG then reports. The fiscal and the orbital mechanics are coupled.",
      insights: [
        "Read report language, not just bill text — mission-level direction (e.g., Mars Sample Return restructuring) lives there.",
        "Fixed-price commercial lines execute fast; cost-plus development lines carry the unobligated balances — blended obligation rates mislead.",
        "Every year of schedule slip on a flagship adds ~10% lifecycle cost; treat slip announcements as budget events, not just program events.",
      ],
    },
  },

  DOE: {
    mission: "Ensure America's security and prosperity through energy, science, and nuclear security: NNSA stockpile stewardship, 17 national laboratories, environmental cleanup of the weapons complex, and energy R&D/deployment.",
    footprint: "≈16K federal employees overseeing ≈100K contractor staff — government-owned, contractor-operated (GOCO) labs and sites are the operating model; EM cleanup liabilities span 15 states.",
    uniqueness: "A contractor-operated department: 90%+ of spending flows through M&O contracts (LLNL, LANL, Sandia, ORNL…), so DoE FM is fundamentally contractor cost surveillance, and its balance sheet is dominated by a ~$500B+ environmental liability.",
    fm: {
      budget: "Energy & Water appropriations; NNSA semi-autonomous with its own accounts; loan programs (LPO) under credit reform with self-pay credit subsidy.",
      accounting: "The environmental cleanup liability estimate is the single largest non-actuarial estimate in civilian government; M&O contractor costs integrate into DoE's books (contractor-integrated accounting).",
      controls: "Contractor assurance systems + federal oversight — A-123 mediated through M&O contract clauses.",
      audit: "Clean opinions with the environmental liability as the perpetual significant estimate; KPMG-style emphasis paragraphs annually.",
      finops: "Payments largely to a handful of M&O primes; power marketing administrations (BPA, WAPA) run utility-style finances inside the department.",
    },
    budget: {
      overview: "A ~$50B portfolio that is three departments in a trench coat: NNSA weapons (~$25B, defense function 053), science & energy R&D (~$15B), and environmental management (~$8B) — each with its own committee dynamics.",
      fundingStructure: "Energy & Water appropriations; significant no-year construction money; IIJA/IRA supplementals created multi-year deployment balances (hydrogen hubs, grid) executing alongside base; LPO loan authority under FCRA.",
      appropriations: "Energy & Water Development subcommittees; NNSA lines are functionally defense spending (053) inside a civilian bill — they trade against water projects, not against other defense.",
      enacted: [
        { fy: "FY2023", amount: "≈$45.8B", note: "base, pre-supplemental balances" },
        { fy: "FY2024", amount: "≈$49.9B", note: "NNSA growth drives the increase" },
        { fy: "FY2025", amount: "≈$50B", note: "CR-level; supplemental balances keep executing" },
      ],
      uniqueness: "Defense money in a civilian bill, GOCO execution, and supplemental deployment funds with private-sector cost-share — DoE budget execution depends on counterparties (states, companies) most agencies never wait on.",
      insights: [
        "Track NNSA separately always — it grows on the defense topline's politics while the rest of DoE lives under non-defense caps.",
        "IIJA/IRA balances execute on negotiated milestones (cost-share closings) — slow obligation is process, not failure; read the project pipeline instead.",
        "The EM liability re-estimate each year can swing more than the entire EM appropriation — the balance sheet moves the conversation, not the budget.",
      ],
    },
  },
}

// ── structurally-derived profile for agencies without a deep entry ───────────
export function getProfile(a: Agency): AgencyProfile {
  if (P[a.id]) return P[a.id]
  const fee = a.funding === "fee-funded"
  const mixed = a.funding === "mixed"
  return {
    mission: `${a.name} executes its statutory mission under the ${a.cfoAct ? "CFO Act framework with a Senate-confirmed CFO" : "federal financial framework applicable to non-CFO Act entities"} — see the agency strategic plan for the current mission statement and priority goals.`,
    footprint: `Headquarters plus regional/field structure typical of a ${a.cfoAct ? "CFO Act" : "independent"} agency; consult the latest AFR/PAR Management's Discussion & Analysis for FTE, locations, and asset profile. Live execution figures for ${a.abbrev} are loaded on this page from USAspending/GTAS.`,
    uniqueness: fee
      ? `${a.abbrev} is fee-funded: collections offset spending, but Congress still disciplines the obligation ceiling — the hybrid posture that shapes everything in its FM.`
      : mixed
      ? `${a.abbrev} blends appropriated and reimbursable/fee funding — franchise-style operations make intragovernmental revenue accounting a first-class concern.`
      : `${a.abbrev} is conventionally appropriated — the discipline is annual: period-of-availability management, apportionment compliance, and year-end execution.`,
    fm: {
      budget: fee
        ? "Formulates under OMB Circular A-11 like any agency, but the enacted ceiling is offset by collections; fee-rate setting and collection forecasting are the distinctive budget tasks."
        : "Standard A-11 lifecycle: current-services baseline, OMB passback, President's Budget, appropriations subcommittee action, then §120 apportionment and allotment.",
      accounting: "USSGL at transaction level (FFMIA), GTAS submission monthly, financial statements under OMB A-136; shared-service providers handle core accounting for many agencies of this size.",
      controls: "OMB A-123 internal-control assessment with an annual FMFIA assurance statement; payment-integrity testing under PIIA proportional to outlay risk.",
      audit: `Annual financial statement audit under the CFO Act and OMB Bulletin 24-02${a.cfoAct ? "" : " (as applicable)"} — typically by IPA under OIG oversight. Drop the ${a.abbrev} AFR into sourcedata/ to power a finding-level tracker in the Audit module.`,
      finops: "GSA SmartPay charge cards, E-Gov Travel (ConcurGov), invoice processing via Treasury IPP or shared service, and Do-Not-Pay screening — the standard civilian fin-ops stack.",
    },
    budget: {
      overview: `${a.abbrev}'s budget follows the standard federal lifecycle; the live GTAS series on this page (resources, obligations, carryover) is the authoritative execution view loaded for this agency.`,
      fundingStructure: fee
        ? "Fee/assessment collections offsetting an enacted ceiling; watch carryover authority and fee-rate true-up mechanics."
        : mixed
        ? "Appropriated accounts alongside reimbursable/franchise revenue; the budget request nets intragovernmental income against gross authority."
        : "Annual and multi-year appropriated accounts; unobligated carryover composition (annual vs multi-year vs no-year) drives the right execution KPIs.",
      appropriations: "See the agency's appropriations subcommittee (House/Senate) and most recent act; act language and report directives often matter as much as the number.",
      enacted: [],
      uniqueness: "For agency-specific structure (trust funds, advance appropriations, fee offsets, credit programs), consult the CBJ overview chapter — then load it into sourcedata/ to light up this section with the agency's own exhibits.",
      insights: [
        "Anchor every trend to the live GTAS series loaded here: resources vs obligations vs carryover — the three-line story appropriators actually ask about.",
        "Decompose carryover by period of availability before judging obligation rates — multi-year money at 50% in year one is a plan, not a problem.",
        "Q4 obligation concentration (see Data Intelligence cadence) is the first thing an examiner reads — know your September story before they ask.",
      ],
    },
  }
}
