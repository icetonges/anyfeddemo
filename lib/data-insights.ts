// lib/data-insights.ts — deterministic analysis engine for the Data Explorer.
// Pure functions (no React, no network) so the same logic powers the in-browser
// "AI agents" and can be narrated by the optional LLM route. Every number here
// is computed from the loaded budget data — nothing is canned.
import type { BudgetExhibit, BudgetRecord, DodBudget } from "@/components/anyfed/useAgencyData"

export const FYS = ["FY2024", "FY2025", "FY2026", "FY2027"] as const
export type FY = typeof FYS[number]

const r0 = (n: number) => Math.round(n)
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0)

// ── budget-phase semantics (the "what does this number mean" layer) ──────────
export const PHASE_META: Record<string, { phase: string; tag: string; advice: string }> = {
  FY2024: { phase: "Execution actuals", tag: "ACTUALS",
    advice: "Closed-year actual obligations. Use as a burn-rate baseline and for trend anchoring — not as forward authority." },
  FY2025: { phase: "Execution actuals (+reconciliation)", tag: "ACTUALS",
    advice: "Prior-year actuals plus reconciliation. Best ground truth for execution analytics and ML training targets." },
  FY2026: { phase: "Enacted", tag: "ENACTED",
    advice: "Current-year authority = discretionary enacted + PL 119-21 mandatory spend plan. Separate the two before trending — the mandatory tranche is one-time reconciliation money." },
  FY2027: { phase: "President's Budget request", tag: "REQUEST",
    advice: "Budget-year request = discretionary + mandatory request. It is a proposal, not authority; do not mix with enacted/actual series in a single trend without labeling." },
}

export interface ExhibitProfile {
  key: string; title: string; appn: string; isMilcon: boolean
  totals: Record<string, number>
  yoy: { fy: string; from: number; to: number; deltaPct: number }[]
  cagr: number | null
  components: Record<string, Record<string, number>>
  discMandatory: Record<string, { discretionary: number; mandatory: number; mandatoryShare: number }>
  topOrgShare: { org: string; share: number } | null
  hhi: number | null               // org concentration (0-10000)
  recordCount: number
  quality: BudgetExhibit["quality"] | null
}

export function profileExhibit(key: string, ex: BudgetExhibit): ExhibitProfile {
  const totals: Record<string, number> = {}
  FYS.forEach(fy => { if (ex.years[fy] != null) totals[fy] = ex.years[fy] })
  const present = FYS.filter(fy => totals[fy] != null)
  const yoy = present.slice(1).map((fy, i) => {
    const prev = present[i]; const from = totals[prev]; const to = totals[fy]
    return { fy: `${prev}→${fy}`, from, to, deltaPct: pct(to - from, from) }
  })
  let cagr: number | null = null
  if (present.length >= 2) {
    const a = totals[present[0]], b = totals[present[present.length - 1]]
    if (a > 0 && b > 0) cagr = Math.round((Math.pow(b / a, 1 / (present.length - 1)) - 1) * 1000) / 10
  }
  const discMandatory: ExhibitProfile["discMandatory"] = {}
  FYS.forEach(fy => {
    const c = ex.components?.[fy]; if (!c) return
    const disc = (c.discretionaryEnacted ?? 0) + (c.discretionaryRequest ?? 0) + (fy <= "FY2025" ? (c.actuals ?? 0) : 0)
    const mand = (c.mandatorySpendPlan ?? 0) + (c.mandatoryRequest ?? 0)
    if (disc || mand) discMandatory[fy] = { discretionary: r0(disc), mandatory: r0(mand), mandatoryShare: pct(mand, disc + mand) }
  })
  // org concentration on the latest present year
  const latest = present[present.length - 1]
  const orgMap = latest ? ex.byOrg[latest] ?? {} : {}
  const orgVals = Object.entries(orgMap)
  const sum = orgVals.reduce((s, [, v]) => s + v, 0)
  let topOrgShare: ExhibitProfile["topOrgShare"] = null
  let hhi: number | null = null
  if (sum > 0) {
    const sorted = orgVals.sort((a, b) => b[1] - a[1])
    topOrgShare = { org: sorted[0][0], share: pct(sorted[0][1], sum) }
    hhi = r0(orgVals.reduce((s, [, v]) => s + Math.pow((v / sum) * 100, 2), 0))
  }
  return {
    key, title: ex.title, appn: ex.appn, isMilcon: !!ex.isMilcon,
    totals, yoy, cagr, components: ex.components ?? {}, discMandatory,
    topOrgShare, hhi, recordCount: ex.records?.length ?? 0, quality: ex.quality ?? null,
  }
}

// ── pivot a record set by a dimension for one FY ─────────────────────────────
export function pivot(records: BudgetRecord[], dim: keyof BudgetRecord, fy: FY): { name: string; value: number }[] {
  const m = new Map<string, number>()
  for (const r of records) {
    const k = String(r[dim] ?? "—") || "—"
    m.set(k, (m.get(k) ?? 0) + (Number(r[fy]) || 0))
  }
  return Array.from(m.entries()).map(([name, value]) => ({ name, value: r0(value) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
}

// ── biggest movers between two FYs (record-level) ────────────────────────────
export function movers(records: BudgetRecord[], a: FY, b: FY, n = 8) {
  return records
    .map(r => ({ label: r.account ?? r.project ?? "—", org: r.org, ba: r.budgetActivity,
                 from: Number(r[a]) || 0, to: Number(r[b]) || 0, delta: (Number(r[b]) || 0) - (Number(r[a]) || 0) }))
    .filter(r => r.from || r.to)
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
    .slice(0, n)
}

// ── data-quality findings ────────────────────────────────────────────────────
export interface QualityFinding { level: "ok" | "info" | "warn"; title: string; detail: string }
export function qualityReport(key: string, ex: BudgetExhibit): QualityFinding[] {
  const out: QualityFinding[] = []
  const q = ex.quality
  const missing = FYS.filter(fy => ex.years[fy] == null)
  if (missing.length) out.push({ level: "warn", title: "Coverage gap",
    detail: `No total parsed for ${missing.join(", ")} — source book did not expose a matching sheet for ${ex.appn}.` })
  if (q) {
    const nullRate = q.totalRows ? pct(q.nullAmounts, q.totalRows) : 0
    out.push({ level: nullRate > 5 ? "warn" : "ok", title: "Null amounts",
      detail: `${q.nullAmounts} of ${q.totalRows} parsed rows had non-numeric amounts (${nullRate}%) — coerced to 0.` })
    if (q.nonAddFiltered) out.push({ level: "info", title: "Non-add rows excluded",
      detail: `${q.nonAddFiltered} rows flagged Non-Add / not-in-TOA were removed so totals tie to Total Obligational Authority.` })
    out.push({ level: "info", title: "Aggregation",
      detail: `${q.recordRows} unique line groups aggregated; top ${q.recordsKept} retained for interactive drill-down.` })
  }
  if (ex.isMilcon) out.push({ level: "warn", title: "MILCON semantics",
    detail: "Multi-year appropriation — prior-year columns are program amounts, NOT execution actuals. Do not treat C-1 FY2024/FY2025 like the other -1 exhibits." })
  return out
}

// ── usage advice for the selected exhibit/years ──────────────────────────────
export function usageAdvice(ex: BudgetExhibit): string[] {
  const tips: string[] = []
  const present = FYS.filter(fy => ex.years[fy] != null)
  present.forEach(fy => tips.push(`${fy} — ${PHASE_META[fy]?.phase}: ${PHASE_META[fy]?.advice}`))
  if (!ex.isMilcon && (ex.components?.FY2026?.mandatorySpendPlan || ex.components?.FY2027?.mandatoryRequest))
    tips.push("This exhibit carries PL 119-21 mandatory money alongside discretionary. Always split discretionary vs mandatory before computing growth — the mandatory tranche distorts year-over-year trends.")
  if (ex.isMilcon)
    tips.push("For MILCON, analyze by State/Country and Facility Category, and compare Authorization vs Appropriation vs Total Obligation Authority — they diverge when projects are authorized but not yet appropriated.")
  return tips
}

// ── compact profile object for optional LLM narration ────────────────────────
export function compactForLLM(budget: DodBudget, key: string): Record<string, unknown> {
  const ex = budget.exhibits[key]
  const p = profileExhibit(key, ex)
  return {
    exhibit: ex.title, appropriation: ex.appn, unit: budget.unit,
    totalsByFY: p.totals, yoy: p.yoy, cagr: p.cagr,
    discretionaryVsMandatory: p.discMandatory,
    topOrganizationShare: p.topOrgShare, orgConcentrationHHI: p.hhi,
    isMilcon: p.isMilcon,
    yearPhaseSemantics: budget.yearPhase,
  }
}

// ════════════════════════════════════════════ vintage / lifecycle analysis v2
import type { LifecycleYear } from "@/components/anyfed/useAgencyData"

export interface LifecycleFinding { fy: string; kind: "execution" | "congressional" | "single"; text: string; severity: "ok"|"info"|"warn" }

export function lifecycleFindings(ex: BudgetExhibit): LifecycleFinding[] {
  const out: LifecycleFinding[] = []
  const lc = ex.lifecycle ?? {}
  for (const fy of FYS) {
    const y = lc[fy] as LifecycleYear | undefined; if (!y) continue
    if (y.enacted != null && y.actuals != null) {
      const d = y.actuals - y.enacted; const p = y.execVarPct ?? 0
      out.push({ fy, kind: "execution", severity: Math.abs(p) > 5 ? "warn" : "info",
        text: `${fy} executed ${fmtK(y.actuals)} against ${fmtK(y.enacted)} enacted — ${p >= 0 ? "+" : ""}${p}% (${d >= 0 ? "+" : ""}${fmtK(d)}). ${p > 3 ? "Over-execution suggests supplementals/reprogramming above enacted authority." : p < -3 ? "Under-execution — unobligated balances or rescissions." : "Executed close to plan."}` })
    }
    if (y.request != null && y.enacted != null) {
      const d = y.enacted - y.request; const p = y.reqToEnactedPct ?? 0
      out.push({ fy, kind: "congressional", severity: Math.abs(p) > 5 ? "warn" : "info",
        text: `${fy} Congress enacted ${fmtK(y.enacted)} vs ${fmtK(y.request)} requested — ${p >= 0 ? "+" : ""}${p}% (${d >= 0 ? "+" : ""}${fmtK(d)}). ${d >= 0 ? "Congressional add above the President's request." : "Congressional cut below the request."}` })
    }
  }
  return out
}

export function deptLifecycle(budget: DodBudget): LifecycleFinding[] {
  const lc = budget.lifecycleDept ?? {}
  const out: LifecycleFinding[] = []
  for (const fy of FYS) {
    const y = lc[fy]; if (!y) continue
    if (y.enacted != null && y.actuals != null)
      out.push({ fy, kind: "execution", severity: Math.abs(y.execVarPct ?? 0) > 4 ? "warn" : "info",
        text: `${fy}: Department executed ${fmtK(y.actuals)} vs ${fmtK(y.enacted)} enacted (${(y.execVarPct ?? 0) >= 0 ? "+" : ""}${y.execVarPct}%).` })
    if (y.request != null && y.enacted != null)
      out.push({ fy, kind: "congressional", severity: Math.abs(y.reqToEnactedPct ?? 0) > 4 ? "warn" : "info",
        text: `${fy}: Congress enacted ${fmtK(y.enacted)} vs ${fmtK(y.request)} requested (${(y.reqToEnactedPct ?? 0) >= 0 ? "+" : ""}${y.reqToEnactedPct}%).` })
  }
  return out
}

const fmtK = (v: number) => {
  const n = v * 1000, a = Math.abs(n)
  if (a >= 1e12) return `$${(n/1e12).toFixed(2)}T`
  if (a >= 1e9)  return `$${(n/1e9).toFixed(1)}B`
  if (a >= 1e6)  return `$${(n/1e6).toFixed(1)}M`
  return `$${Math.round(n/1e3)}K`
}

// recursive drill: children of a path within the record hierarchy, for one FY
export function drillChildren(records: BudgetRecord[], hierarchy: string[], path: string[], fy: FY) {
  const level = path.length
  if (level >= hierarchy.length) return [] as { name: string; value: number; leaf: boolean }[]
  const field = hierarchy[level]
  const m = new Map<string, number>()
  for (const r of records) {
    let match = true
    for (let i = 0; i < path.length; i++) if (String(r[hierarchy[i]]) !== path[i]) { match = false; break }
    if (!match) continue
    const k = String(r[field] ?? "(unspecified)")
    m.set(k, (m.get(k) ?? 0) + (Number(r[fy]) || 0))
  }
  return Array.from(m.entries())
    .map(([name, value]) => ({ name, value: Math.round(value), leaf: level === hierarchy.length - 1 }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
}

// contextual insight for the mouse-follow agent
export interface HoverCtx {
  exhibitTitle?: string; fy?: string; phase?: string
  dim?: string; name?: string; value?: number; share?: number
  lifecycle?: LifecycleYear; note?: string
}
export function hoverInsight(c: HoverCtx): { title: string; lines: string[] } {
  const lines: string[] = []
  if (c.value != null) lines.push(`${fmtK(c.value)}${c.share != null ? ` · ${c.share}% of ${c.fy ?? "total"}` : ""}`)
  if (c.phase) {
    const m = PHASE_META[c.fy ?? ""] ?? { phase: c.phase, advice: "" }
    lines.push(`${c.fy} is ${m.phase.toLowerCase()}. ${m.advice}`)
  }
  if (c.lifecycle) {
    const y = c.lifecycle
    if (y.enacted != null && y.actuals != null) lines.push(`Execution variance: ${(y.execVarPct ?? 0) >= 0 ? "+" : ""}${y.execVarPct}% (actual ${fmtK(y.actuals)} vs enacted ${fmtK(y.enacted)}).`)
    if (y.request != null && y.enacted != null) lines.push(`Congressional action: ${(y.reqToEnactedPct ?? 0) >= 0 ? "+" : ""}${y.reqToEnactedPct}% vs request.`)
  }
  if (c.note) lines.push(c.note)
  if (c.share != null && c.share > 40 && c.dim) lines.push(`High concentration — ${c.name} alone is ${c.share}% of this ${c.dim}. Single-point exposure for category management.`)
  return { title: c.name ?? c.exhibitTitle ?? "Insight", lines: lines.length ? lines : ["Hover a figure, bar, or row for live analysis."] }
}
