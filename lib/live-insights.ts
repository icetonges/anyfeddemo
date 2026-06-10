// lib/live-insights.ts — deterministic expert-analysis engine for live
// (GTAS/USAspending-derived) agency data. Pure functions, no React, no network:
// the same logic powers the Data Intelligence page, the live Data Explorer,
// and the mouse-follow agent. Every number is computed from loaded data.
import type { LiveDetail, DetailDim, DetailNode, DetailYear } from "@/components/anyfed/useAgencyData"

export const fmt = (n: number): string => {
  const a = Math.abs(n)
  if (a >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (a >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  if (a >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  if (a >= 1e3)  return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0)
const r1 = (n: number) => Math.round(n * 10) / 10

export type DimKey = "subAgency" | "budgetFunction" | "federalAccount" | "objectClass"
export const DIM_KEYS: DimKey[] = ["subAgency", "budgetFunction", "federalAccount", "objectClass"]

// ── concentration / structure profile of a dimension ────────────────────────
export interface DimProfile {
  n: number; total: number; topName: string; topShare: number; top3Share: number
  hhi: number                      // 0–10,000; >2,500 = concentrated (DOJ/FTC horizontal-merger convention)
  effectiveN: number               // 1/Σshare² — "how many categories really matter"
  gini: number                     // 0–1 inequality of the distribution
  negatives: number; zeros: number; withChildren: number; childCount: number
  reading: string
}
export function dimProfile(dim: DetailDim): DimProfile | null {
  const nodes = dim.nodes.filter(x => x.value !== 0 || (x.children?.length ?? 0) > 0)
  if (!nodes.length) return null
  const vals = nodes.map(x => Math.max(x.value, 0))
  const total = vals.reduce((s, v) => s + v, 0)
  const sorted = [...nodes].sort((a, b) => b.value - a.value)
  const shares = vals.map(v => (total ? v / total : 0))
  const hhi = Math.round(shares.reduce((s, x) => s + Math.pow(x * 100, 2), 0))
  const effectiveN = r1(1 / Math.max(shares.reduce((s, x) => s + x * x, 0), 1e-9))
  // gini via mean absolute difference
  const sv = [...vals].sort((a, b) => a - b)
  let cum = 0, weighted = 0
  sv.forEach((v, i) => { weighted += (2 * (i + 1) - sv.length - 1) * v; cum += v })
  const gini = cum ? r1(weighted / (sv.length * cum) * 10) / 10 : 0
  const topShare = pct(sorted[0]?.value ?? 0, total)
  const top3Share = pct(sorted.slice(0, 3).reduce((s, x) => s + x.value, 0), total)
  const reading =
    hhi > 5000 ? `Extremely concentrated (HHI ${hhi}): "${sorted[0].name}" dominates — treat this dimension as effectively single-category; variance analysis belongs one level down.` :
    hhi > 2500 ? `Concentrated (HHI ${hhi} > 2,500): top category holds ${topShare}%. Aggregate trends are driven by one or two categories — always decompose before explaining a move.` :
    `Diversified (HHI ${hhi}): ~${effectiveN} categories carry real weight. Aggregate trends here are meaningful; use top-${Math.min(5, nodes.length)} + remainder for clean charts.`
  return {
    n: nodes.length, total, topName: sorted[0]?.name ?? "—", topShare, top3Share, hhi, effectiveN, gini,
    negatives: nodes.filter(x => x.value < 0).length, zeros: dim.nodes.length - nodes.length,
    withChildren: nodes.filter(x => x.children.length > 0).length,
    childCount: nodes.reduce((s, x) => s + x.children.length, 0),
    reading,
  }
}

// ── obligation cadence / seasonality (the federal Q4 story) ─────────────────
export interface CadenceInsight {
  fy: string; periods: number; q4Share: number; sepShare: number; q1Share: number
  surge: "severe" | "elevated" | "normal" | "front-loaded"
  text: string
}
export function cadence(year: DetailYear | undefined): CadenceInsight | null {
  if (!year || year.byPeriod.length < 6) return null
  const tot = year.byPeriod.reduce((s, p) => s + Math.max(p.obligated, 0), 0)
  if (!tot) return null
  const share = (ps: number[]) => pct(year.byPeriod.filter(p => ps.includes(p.period)).reduce((s, p) => s + Math.max(p.obligated, 0), 0), tot)
  const q4 = share([10, 11, 12]), sep = share([12]), q1 = share([1, 2, 3])
  const surge: CadenceInsight["surge"] = q4 > 40 ? "severe" : q4 > 32 ? "elevated" : q1 > 40 ? "front-loaded" : "normal"
  const text =
    surge === "severe"   ? `Q4 took ${q4}% of ${year.fy} obligations (Sep alone ${sep}%) vs a 25% uniform baseline — a textbook use-it-or-lose-it spike. Expect elevated improper-payment and contract-rush risk; sample Sep awards disproportionately in post-payment review.` :
    surge === "elevated" ? `Q4 share is ${q4}% (Sep ${sep}%) — above the 25% uniform baseline. Year-end execution pressure is visible but not extreme; check whether large Sep de-obligations/awards distort the monthly series.` :
    surge === "front-loaded" ? `Obligations are front-loaded: Q1 took ${q1}%. Typical of agencies that obligate full-year funding upfront (grants, benefits, leases) — burn-rate alarms calibrated for linear spend will false-positive here.` :
    `Obligation cadence is close to uniform (Q4 ${q4}%, Q1 ${q1}%) — disciplined spend plan execution; linear burn-rate models are appropriate for this agency.`
  return { fy: year.fy, periods: year.byPeriod.length, q4Share: q4, sepShare: sep, q1Share: q1, surge, text }
}

// ── obligation vs outlay lag (unliquidated balances) ────────────────────────
export interface OutlayInsight { ratio: number; laggards: { name: string; value: number; outlays: number; ratio: number }[]; text: string }
export function outlayLag(dim: DetailDim): OutlayInsight | null {
  const nodes = dim.nodes.filter(x => x.value > 0 && x.outlays != null)
  if (!nodes.length) return null
  const ob = nodes.reduce((s, x) => s + x.value, 0)
  const out = nodes.reduce((s, x) => s + (x.outlays ?? 0), 0)
  const ratio = ob ? r1(out / ob * 100) : 0
  const laggards = nodes.map(x => ({ name: x.name, value: x.value, outlays: x.outlays ?? 0, ratio: x.value ? r1((x.outlays ?? 0) / x.value * 100) : 0 }))
    .filter(x => x.value > ob * 0.02 && x.ratio < 80).sort((a, b) => a.ratio - b.ratio).slice(0, 5)
  const text =
    ratio < 75 ? `Gross outlays are only ${ratio}% of obligations — large unliquidated balances are building. Normal for capital/multi-year programs, a red flag for annual O&M-type accounts: validate undelivered orders (the classic ULO audit finding).` :
    ratio > 110 ? `Outlays exceed current-year obligations (${ratio}%) — the agency is liquidating prior-year obligations. Spending headlines based on outlays will overstate current-year activity.` :
    `Outlays run at ${ratio}% of obligations — a healthy liquidation pace; obligations and outlays can be used interchangeably for trend purposes at this level.`
  return { ratio, laggards, text }
}

// ── object-class mix → what kind of agency is this operationally ────────────
export interface MixInsight { compShare: number; contractShare: number; grantShare: number; otherShare: number; text: string }
const OC_COMP = /personnel|permanent|benefit|wages|cash awards|military pay/i
const OC_CONTRACT = /services|advisory|operation and maintenance|equipment|supplies|r&d|research|construction|rental|utilities|communications|travel|transportation|printing/i
const OC_GRANT = /grant|subsid|insurance claims|interest|investments|loans/i
export function objectClassMix(dim: DetailDim): MixInsight | null {
  const nodes = dim.nodes.filter(x => x.value > 0)
  if (!nodes.length) return null
  const tot = nodes.reduce((s, x) => s + x.value, 0)
  const sum = (re: RegExp) => nodes.filter(x => re.test(x.name)).reduce((s, x) => s + x.value, 0)
  const comp = sum(OC_COMP)
  const grant = sum(OC_GRANT)
  const contract = Math.max(sum(OC_CONTRACT) - 0, 0)
  const compShare = pct(comp, tot), grantShare = pct(grant, tot)
  const contractShare = pct(contract, tot)
  const otherShare = Math.max(0, r1(100 - compShare - contractShare - grantShare))
  const text =
    compShare > 45 ? `Compensation & benefits are ${compShare}% of obligations — a people-driven agency. FM focus: payroll accuracy (the GPC/payroll feeder recs), FTE-to-budget alignment, and unfunded pay-raise exposure in out-years.` :
    grantShare > 45 ? `Grants/subsidies/claims dominate (${grantShare}%) — a pass-through agency. FM focus: grantee monitoring, improper-payment testing (IPERIA), and timing of advance vs reimbursement drawdowns.` :
    contractShare > 45 ? `Contractual services & acquisitions are ${contractShare}% of obligations — a buy-side agency. FM focus: undelivered orders, contract close-out backlog, and de-obligation sweeps before year-end.` :
    `Balanced mix (comp ${compShare}% · contracts ${contractShare}% · grants ${grantShare}%) — no single cost-driver dominates; build variance narratives per object-class group, not at the agency level.`
  return { compShare, contractShare, grantShare, otherShare, text }
}

// ── multi-year resources trajectory ─────────────────────────────────────────
export interface TrendInsight { latest: DetailYear; yoyResources: number | null; yoyObligated: number | null; carryover: number; carryoverShare: number; rateTrend: string; text: string }
export function resourceTrend(years: DetailYear[]): TrendInsight | null {
  if (!years.length) return null
  const latest = years[years.length - 1]
  const prev = years.length > 1 ? years[years.length - 2] : null
  const yoyResources = prev && prev.resources ? r1((latest.resources - prev.resources) / prev.resources * 100) : null
  const yoyObligated = prev && prev.obligated ? r1((latest.obligated - prev.obligated) / prev.obligated * 100) : null
  const carryover = latest.resources - latest.obligated
  const carryoverShare = pct(carryover, latest.resources)
  const rates = years.map(y => y.rate).filter((x): x is number => x != null)
  const rateTrend = rates.length > 2 ? (rates[rates.length - 1]! > rates[0]! + 2 ? "rising" : rates[rates.length - 1]! < rates[0]! - 2 ? "falling" : "stable") : "stable"
  const text = `${latest.fy}: ${fmt(latest.resources)} total budgetary resources, ${fmt(latest.obligated)} obligated (${latest.rate ?? "—"}%). ` +
    (yoyResources != null ? `Resources moved ${yoyResources >= 0 ? "+" : ""}${yoyResources}% YoY while obligations moved ${yoyObligated! >= 0 ? "+" : ""}${yoyObligated}%. ` : "") +
    (carryoverShare > 35 ? `Unobligated balance is ${fmt(carryover)} (${carryoverShare}% of resources) — substantial carryover/multi-year authority; the obligation *rate* is the wrong KPI, track obligations against the spend plan instead.` :
     carryoverShare < 8 ? `Only ${carryoverShare}% of resources remain unobligated — tight execution; little buffer for in-year requirements without reprogramming.` :
     `Unobligated balance ${fmt(carryover)} (${carryoverShare}%) is within the normal band for annual+multi-year mixes.`)
  return { latest, yoyResources, yoyObligated, carryover, carryoverShare, rateTrend, text }
}

// ── per-dimension usage doctrine (expert, static) ────────────────────────────
export const DIM_DOCTRINE: Record<DimKey, { use: string; pitfall: string; auditHook: string }> = {
  subAgency: {
    use: "Organizational accountability: who is spending. Use for allocation reviews, mid-year execution scrubs, and assigning variance explanations to component CFOs.",
    pitfall: "Sourced from award transactions, not GTAS — excludes payroll, intragov transfers, and non-award obligations. It will NOT tie to the budgetary-resources total; never present the two on one chart without labeling the basis.",
    auditHook: "Map components to reporting entities for component-level audit opinions; concentration here defines materiality allocation.",
  },
  budgetFunction: {
    use: "Policy-purpose view (OMB functional classification). Use it to brief appropriators and OMB examiners — it is the language of the President's Budget Analytical Perspectives.",
    pitfall: "Functions cross appropriation lines; a single account can split across subfunctions. Don't reconcile function totals to appropriation acts directly.",
    auditHook: "Functional shifts year-over-year flag mission repurposing — a trigger for reprogramming-authority compliance checks (sec. 8005-type limits).",
  },
  federalAccount: {
    use: "The Treasury backbone (TAS rollups). This is the ONLY dimension that ties to FBwT, SF-133, and GTAS — use it for reconciliation, carryover analysis, and anything audit-facing.",
    pitfall: "Account names are statutory, not descriptive; X-year (no-year) accounts mix vintages inside one line. Split by availability period before trending.",
    auditHook: "Drill to Treasury Account to anchor the Universe of Transactions; child-sum vs parent mismatches here are reportable data-integrity findings.",
  },
  objectClass: {
    use: "Cost-structure view (OMB Circular A-11 §83). Use for spend-category management, comp-vs-contract mix, and building bottom-up budget formulation baselines.",
    pitfall: "Object class is recorded at obligation, not invoice — service contracts spanning years distort single-year reads. Pair with outlays for liquidation reality.",
    auditHook: "OC 25 (other services) is the classic dumping ground — a high OC-25 share is a data-quality smell worth a journal-level sample.",
  },
}

// ── data-quality scorecard for the live bundle ──────────────────────────────
export interface QualityFinding { level: "ok" | "info" | "warn"; title: string; detail: string }
export function liveQuality(d: LiveDetail): { score: number; findings: QualityFinding[] } {
  const f: QualityFinding[] = []
  let score = 100
  const dims = Object.entries(d.dims) as [DimKey, DetailDim][]
  dims.forEach(([k, dim]) => {
    if (!dim.nodes.length) { score -= 12; f.push({ level: "warn", title: `${dim.label}: no rows`, detail: `USAspending returned no ${dim.label.toLowerCase()} rows for ${d.fiscalYear} — the agency may not report this breakout or the FY is too early in GTAS.` }) }
    const neg = dim.nodes.filter(n => n.value < 0)
    if (neg.length) { score -= 4; f.push({ level: "info", title: `${dim.label}: ${neg.length} negative value(s)`, detail: `Negative obligations are de-obligations/recoveries (e.g. ${neg[0].name}). Keep them for net totals; exclude for Benford/anomaly screens.` }) }
    // parent/child integrity
    const bad = dim.nodes.filter(n => n.children.length > 1 && Math.abs(n.children.reduce((s, c) => s + c.value, 0) - n.value) > Math.abs(n.value) * 0.02)
    if (bad.length) { score -= 6; f.push({ level: "warn", title: `${dim.label}: child sums ≠ parent`, detail: `${bad.length} parent row(s) differ >2% from the sum of children (e.g. ${bad[0].name}) — drill-down shares below that node are indicative, not exact.` }) }
  })
  const award = d.dims.subAgency.nodes.reduce((s, n) => s + Math.max(n.value, 0), 0)
  const acct = d.dims.federalAccount.nodes.reduce((s, n) => s + Math.max(n.value, 0), 0)
  if (acct > 0 && award > 0) {
    const cov = pct(award, acct)
    f.push({ level: cov < 35 ? "warn" : "info", title: `Award coverage: ${cov}% of account obligations`, detail: `Sub-agency/office figures come from award transactions (${fmt(award)}); total account obligations are ${fmt(acct)}. The gap is payroll, intragovernmental, and non-award activity — different measurement bases by design.` })
    if (cov < 35) score -= 5
  }
  if (d.years.length) f.push({ level: "ok", title: `${d.years.length} fiscal years of resources history`, detail: `GTAS-derived budgetary resources ${d.years[0].fy}–${d.years[d.years.length - 1].fy}, with ${d.years[d.years.length - 1].byPeriod.length} reporting periods in the latest year.` })
  else { score -= 15; f.push({ level: "warn", title: "No budgetary-resources history", detail: "The FY series endpoint returned nothing — trend and cadence analytics are disabled." }) }
  f.push({ level: "ok", title: "Lineage", detail: `Fetched ${new Date(d.fetchedAt).toLocaleString()} from api.usaspending.gov (GTAS/DATA Act broker submissions). Figures are agency-certified monthly files, not audited statements.` })
  return { score: Math.max(score, 20), findings: f }
}

// ── prep pipeline (transparent cleaning for live data) ──────────────────────
export interface PrepStep { name: string; action: string; before: number; after: number }
export function prepPipeline(dim: DetailDim): { steps: PrepStep[]; clean: DetailNode[] } {
  const raw = dim.nodes
  const s1 = raw.filter(n => n.value !== 0 || n.children.length)
  const s2 = s1.filter(n => n.value >= 0)
  const dedup = new Map<string, DetailNode>()
  s2.forEach(n => { const k = n.name.trim().toUpperCase(); const e = dedup.get(k)
    if (e) dedup.set(k, { ...e, value: e.value + n.value, outlays: (e.outlays ?? 0) + (n.outlays ?? 0), children: [...e.children, ...n.children] })
    else dedup.set(k, n) })
  const s3 = Array.from(dedup.values()).sort((a, b) => b.value - a.value)
  return {
    steps: [
      { name: "Drop empty rows", action: "value = 0 and no children", before: raw.length, after: s1.length },
      { name: "Quarantine de-obligations", action: "value < 0 → held out for net-vs-gross views", before: s1.length, after: s2.length },
      { name: "Normalize + dedupe names", action: "trim/case-fold, merge duplicates", before: s2.length, after: s3.length },
    ],
    clean: s3,
  }
}

// ── compare engine: align two node sets by name, compute deltas ──────────────
export interface CompareRow { name: string; a: number | null; b: number | null; delta: number; deltaPct: number | null }
export function compareNodes(a: DetailNode[], b: DetailNode[], topN = 14): { rows: CompareRow[]; totalA: number; totalB: number; onlyA: number; onlyB: number } {
  const am = new Map(a.map(n => [n.name.trim().toUpperCase(), n.value]))
  const bm = new Map(b.map(n => [n.name.trim().toUpperCase(), n.value]))
  const names = new Map<string, string>()
  a.forEach(n => names.set(n.name.trim().toUpperCase(), n.name))
  b.forEach(n => { if (!names.has(n.name.trim().toUpperCase())) names.set(n.name.trim().toUpperCase(), n.name) })
  const rows: CompareRow[] = Array.from(names.entries()).map(([k, label]) => {
    const va = am.get(k) ?? null, vb = bm.get(k) ?? null
    const delta = (vb ?? 0) - (va ?? 0)
    return { name: label, a: va, b: vb, delta, deltaPct: va ? r1(delta / Math.abs(va) * 100) : null }
  }).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
  return {
    rows: rows.slice(0, topN),
    totalA: a.reduce((s, n) => s + n.value, 0), totalB: b.reduce((s, n) => s + n.value, 0),
    onlyA: rows.filter(r => r.b == null).length, onlyB: rows.filter(r => r.a == null).length,
  }
}

// ── hover-agent insight for live nodes ───────────────────────────────────────
export interface LiveHoverCtx {
  dimLabel?: string; name?: string; value?: number; share?: number
  outlays?: number; count?: number; depth?: number; note?: string; fy?: string
}
export function liveHover(c: LiveHoverCtx): { title: string; lines: string[] } {
  const lines: string[] = []
  if (c.value != null) lines.push(`${fmt(c.value)}${c.share != null ? ` · ${c.share}% of ${c.dimLabel ?? "total"}` : ""}${c.fy ? ` · ${c.fy}` : ""}`)
  if (c.outlays != null && c.value) {
    const r = r1(c.outlays / c.value * 100)
    lines.push(`Outlays ${fmt(c.outlays)} (${r}% liquidated)${r < 70 ? " — unliquidated balance building; check undelivered orders." : r > 115 ? " — liquidating prior-year obligations." : "."}`)
  }
  if (c.count) lines.push(`${c.count.toLocaleString()} award transactions behind this figure.`)
  if (c.share != null && c.share > 40) lines.push(`Concentration alert: single ${c.dimLabel?.toLowerCase() ?? "category"} at ${c.share}% — decompose before explaining any aggregate move.`)
  if (c.depth === 1) lines.push(`Child-level row — shares are of the parent, not the agency total.`)
  if (c.note) lines.push(c.note)
  return { title: c.name ?? "Insight", lines: lines.length ? lines : ["Hover any figure, row, or bar for live analysis."] }
}

// ── one ranked expert-finding feed for the whole bundle ──────────────────────
export interface ExpertFinding { severity: "high" | "medium" | "low"; area: string; title: string; text: string }
export function expertFindings(d: LiveDetail): ExpertFinding[] {
  const out: ExpertFinding[] = []
  const t = resourceTrend(d.years)
  if (t) out.push({ severity: t.carryoverShare > 35 || Math.abs(t.yoyResources ?? 0) > 12 ? "high" : "medium", area: "Resources", title: `${t.latest.fy} posture`, text: t.text })
  const cad = cadence(d.years[d.years.length - 1])
  if (cad) out.push({ severity: cad.surge === "severe" ? "high" : cad.surge === "elevated" ? "medium" : "low", area: "Cadence", title: `Obligation cadence — ${cad.surge}`, text: cad.text })
  const fa = dimProfile(d.dims.federalAccount)
  if (fa) out.push({ severity: fa.hhi > 5000 ? "medium" : "low", area: "Accounts", title: `Account structure`, text: `${fa.n} federal accounts, ${fa.childCount} treasury accounts beneath. ${fa.reading}` })
  const ol = outlayLag(d.dims.federalAccount)
  if (ol) out.push({ severity: ol.ratio < 70 ? "high" : ol.ratio < 85 ? "medium" : "low", area: "Liquidation", title: `Outlay ratio ${ol.ratio}%`, text: ol.text })
  const mix = objectClassMix(d.dims.objectClass)
  if (mix) out.push({ severity: "medium", area: "Cost structure", title: `Comp ${mix.compShare}% · Contracts ${mix.contractShare}% · Grants ${mix.grantShare}%`, text: mix.text })
  const sa = dimProfile(d.dims.subAgency)
  if (sa && sa.topShare > 60) out.push({ severity: "medium", area: "Organization", title: `${sa.topName} concentration`, text: `${sa.topName} carries ${sa.topShare}% of award obligations — component-level review should start there; the remaining components are immaterial to the aggregate story.` })
  const order = { high: 0, medium: 1, low: 2 }
  return out.sort((a, b) => order[a.severity] - order[b.severity])
}
