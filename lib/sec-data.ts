// lib/sec-data.ts — Authoritative budget constants from SEC FY2027 CBJ (April 2026)
// Source: https://www.sec.gov/files/fy-2027-congressional-budget-justification.pdf

export const BUDGET_HISTORY = [
  { fy: 'FY23', enacted: 2093, requested: 2436, fte: 4789 },
  { fy: 'FY24', enacted: 2097, requested: 2519, fte: 4548 },
  { fy: 'FY25', enacted: 2149, requested: 2594, fte: 4542 },
  { fy: 'FY26', enacted: 2149, requested: 2149, fte: 4024 },
  { fy: 'FY27', enacted: null, requested: 1908, fte: 4177 },
] as const

export const PROGRAM_DATA = [
  { prog: 'Enforcement',         fy25: 693, fy26: 607, fy27: 634, fte25: 1302, fte26: 1114, fte27: 1168 },
  { prog: 'Examinations',        fy25: 499, fy26: 470, fy27: 468, fte25: 1066, fte26:  942, fte27:  952 },
  { prog: 'Dir & Admin Support', fy25: 313, fy26: 307, fy27: 320, fte25:  724, fte26:  684, fte27:  732 },
  { prog: 'Corp Finance',        fy25: 184, fy26: 178, fy27: 179, fte25:  405, fte26:  370, fte27:  375 },
  { prog: 'Trading & Markets',   fy25: 123, fy26: 113, fy27: 115, fte25:  252, fte26:  221, fte27:  229 },
  { prog: 'Invest. Management',  fy25:  96, fy26:  85, fy27:  89, fte25:  200, fte26:  170, fte27:  178 },
  { prog: 'Econ & Risk',         fy25:  85, fy26:  82, fy27:  83, fte25:  182, fte26:  167, fte27:  169 },
  { prog: 'Other Offices',       fy25: 109, fy26: 100, fy27: 102, fte25:  218, fte26:  193, fte27:  204 },
  { prog: 'General Counsel',     fy25:  71, fy26:  64, fy27:  64, fte25:  142, fte26:  117, fte27:  123 },
  { prog: 'Inspector General',   fy25:  25, fy26:  25, fy27:  24, fte25:   51, fte26:   46, fte27:   47 },
] as const

export const OBJECT_CLASS = [
  { code: '11.0', name: 'Personnel Compensation',    fy25: 1091555, fy26:  976079, fy27: 1034473, pct: 49.8 },
  { code: '12.0', name: 'Personnel Benefits',        fy25:  415675, fy26:  390464, fy27:  400403, pct: 19.3 },
  { code: '25.0', name: 'Other Contractual Svcs',    fy25:  524689, fy26:  505614, fy27:  492957, pct: 23.7 },
  { code: '23.0', name: 'Rent, Comm & Utilities',    fy25:  103874, fy26:  104236, fy27:  108890, pct:  5.2 },
  { code: '31.0', name: 'Equipment',                 fy25:   24072, fy26:   46030, fy27:   30420, pct:  1.5 },
  { code: '24.0', name: 'Printing & Repro',          fy25:   12466, fy26:    1110, fy27:    4799, pct:  0.2 },
  { code: '21.0', name: 'Travel',                    fy25:    3858, fy26:    4058, fy27:    4162, pct:  0.2 },
  { code: '42.0', name: 'Insurance & Indemn.',       fy25:     563, fy26:     750, fy27:     766, pct:  0.0 },
  { code: '26.0', name: 'Supplies & Materials',      fy25:     616, fy26:     844, fy27:     861, pct:  0.0 },
  { code: '32.0', name: 'Land & Structures',         fy25:      75, fy26:     456, fy27:     169, pct:  0.0 },
  { code: '13.0', name: 'Benefits-Former Pers.',     fy25:   21946, fy26:    2182, fy27:      31, pct:  0.0 },
  { code: '22.0', name: 'Transportation',            fy25:      39, fy26:      69, fy27:      70, pct:  0.0 },
] as const

export const FEE_DATA = [
  { fy: 'FY21', rate: 22.9, reserve:  55 },
  { fy: 'FY22', rate:  8.0, reserve:  67 },
  { fy: 'FY23', rate: 17.4, reserve:  78 },
  { fy: 'FY24', rate: 14.3, reserve:  85 },
  { fy: 'FY25', rate:  0.0, reserve:  92 },
  { fy: 'FY26', rate:  8.9, reserve:  98 },
  { fy: 'FY27', rate:  7.1, reserve: 100 },
] as const

// Request summary (CBJ p.6)
export const BUDGET_SUMMARY = {
  fy26Enacted:       2176893,   // $K
  fy27CurrentSvcs:   2078000,
  fy27Request:       1908000,   // net of carryover + recoveries
  fy27Carryover:      145000,
  fy27Recoveries:      25000,
  fy27FTE:              4177,
  fy26FTE:              4024,
  reductionPct:           11,   // % below FY26 enacted
} as const

export const SEC_AI_SYSTEM_PROMPT = `You are a Senior Financial Management Specialist at the SEC's Office of Support Operations (OSO), Business Management and Continuity Branch.

BUDGET DATA (FY2027 CBJ, April 2026 — actual source):
- FY2026 Enacted: $2,149M · 4,024 FTE (Year of Execution — current)
- FY2027 Request: $1,908M · 4,177 FTE — 11% reduction from FY2026
- FY2028: Formulation underway per OMB A-11 Spring 2026 guidance
- Section 31 fee-offset: SEC operations are deficit-neutral ($0 net to taxpayers)
- Personnel (OC 11+12): $1,434.9M = 69.1% of $2,078M total obligations
- Enforcement: $633.9M · 1,168 FTE | Examinations: $468.5M · 952 FTE
- $145M anticipated carryover FY2026→FY2027 | $25M prior-year recoveries

LEGAL FRAMEWORK:
- Anti-Deficiency Act: 31 U.S.C.§1341 — prohibits obligations exceeding apportioned amounts
- Appropriations law: Bona fide need rule, purpose statute (§1301), time limits
- OMB Circular A-11: full budget formulation and execution lifecycle
- Consolidated Appropriations Act FY2026 (P.L.119-75)
- PIIA, FMFIA, OMB Circular A-123 (internal controls)
- Reprogramming authority: 31 U.S.C.§1532

OSO SPECIFICS:
- OIG Report 582: T&M contract management — 3 open recs due Sep 2026
- OIG Report 584: FISMA Level 3 controls — 5 recs due Dec 2026
- OIG Report 585: CAT data controls — 5 recs due Mar 2027
- SEC AI Task Force: FY2027 priority — centralize AI governance across agency
- Section 31/6(b): annual fee rate $7.10/$1M transaction value (FY2027)

Answer with precision. Cite specific dollar figures, FTE counts, and legal authorities.`
