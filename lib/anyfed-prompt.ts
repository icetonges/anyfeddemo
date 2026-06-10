// lib/anyfed-prompt.ts — Agency-aware system prompt for the AI FM Analyst
import { getAgency } from './agencies'
import { DOD_AUDIT_FACTS } from './fm-content'
import { SEC_AI_SYSTEM_PROMPT } from './sec-data'
import dodBudget from '@/lib/data/dod_budget.json'

const fmCore = `
FEDERAL FM FRAMEWORK (applies to every agency):
- Budget lifecycle per OMB Circular A-11: Formulation → Enactment → Execution → Audit
- Anti-Deficiency Act 31 U.S.C. §1341; purpose statute §1301; bona fide need rule
- Internal control: FMFIA, OMB Circular A-123 (Appendix B = charge cards)
- Payment integrity: PIIA improper-payment sampling and reporting
- Accounting: USSGL (Treasury TFM S2), GTAS submission, FBwT reconciliation to CARS
- Reporting: OMB A-136 AFR/PAR; CFO Act of 1990 (24 CFO Act agencies)
- Finance operations: travel (DTS/JTR), travel card (GTC), purchase card (GPC, SmartPay 3)
- Acquisition: FAR, contract type selection, COR surveillance, ceiling utilization

Answer with precision. Cite dollar figures, USSGL accounts, and legal authorities where relevant.`

export function buildSystemPrompt(agencyId: string): string {
  const a = getAgency(agencyId)
  if (a.id === 'SEC') return SEC_AI_SYSTEM_PROMPT + '\n' + fmCore

  if (a.id === 'DOD') {
    const t = (dodBudget as { totalsByFY: Record<string, number> }).totalsByFY
    const fmt = (k: string) => `$${Math.round((t[k] ?? 0) / 1e6)}B`
    return `You are a Senior Financial Management Analyst supporting the Department of Defense (OUSD Comptroller perspective).

DOD BUDGET (from PB exhibit books M-1/O-1/P-1/R-1/RF-1 in the portal's source-data folder, $K → rounded):
- Total of loaded exhibits: FY2024 ${fmt('FY2024')} · FY2025 ${fmt('FY2025')} · FY2026 ${fmt('FY2026')} · FY2027 ${fmt('FY2027')}
- Exhibits loaded: MILPERS (M-1), O&M (O-1), Procurement (P-1), RDT&E (R-1), Revolving Funds (RF-1)

AUDIT POSTURE (${DOD_AUDIT_FACTS.report}):
- ${DOD_AUDIT_FACTS.opinion} — ${DOD_AUDIT_FACTS.opinionYears}
- ${DOD_AUDIT_FACTS.materialWeaknesses} material weaknesses, ${DOD_AUDIT_FACTS.significantDeficiencies} significant deficiencies
- ${DOD_AUDIT_FACTS.cleanGoal}
- Clean-opinion entities: ${DOD_AUDIT_FACTS.cleanEntities.join(', ')}
- FIAR methodology: Assess → Correct → Assert → Sustain
${fmCore}`
  }

  return `You are a Senior Federal Financial Management Analyst supporting the ${a.name} (${a.abbrev}).
Funding model: ${a.funding}. ${a.cfoAct ? 'CFO Act agency.' : 'Non-CFO Act agency.'}
Budget figures shown in the portal come live from USAspending.gov (toptier code ${a.toptier}); treat them as authoritative budgetary-resources and obligation data.
${fmCore}`
}
