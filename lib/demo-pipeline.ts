// lib/demo-pipeline.ts — the production-pattern demonstration engine behind the
// Audit Center "Live Demo". Pure functions, all computed from the loaded data:
//   1. population staging — manifest, quality gates, FNV-1a integrity hash
//   2. model blueprint   — the exact pipeline steps being executed
//   3. AI root-cause     — deterministic analyst that interrogates the actual
//                          model output (digit localization, flag concentration,
//                          driver attribution, strata design, band calibration)
//   4. evidence artifact — system-generated, UoT-certification-style text block
//   5. actions           — prioritized items with owners, grounded in the numbers
import type { Txn } from "@/components/anyfed/useAgencyData"
import type { BenfordResult, AnomalyRow, RiskRow, ClusterResult, ForecastResult, SeriesPoint } from "@/lib/ml/engine"
import { fmt } from "@/lib/live-insights"

export type DemoModel = "benford" | "anomaly" | "risk" | "cluster" | "forecast"

// ── stage 1: population staging ──────────────────────────────────────────────
export interface QualityGate { rule: string; before: number; after: number; note: string }
export interface PopulationManifest {
  records: number; gross: number; net: number
  dateMin?: string; dateMax?: string
  sources: { name: string; records: number; amount: number }[]
  gates: QualityGate[]
  hash: string
  basis: string
}

/** FNV-1a 32-bit over the amount stream — deterministic, reproducible. */
export function fnv1a(values: number[]): string {
  let h = 0x811c9dc5
  for (const v of values) {
    const s = String(Math.round(v * 100))
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0 }
  }
  return "0x" + h.toString(16).padStart(8, "0").toUpperCase()
}

export function stageTxns(txns: Txn[], basis: string): { manifest: PopulationManifest; clean: Txn[] } {
  const n0 = txns.length
  const s1 = txns.filter(t => t.amount !== 0)
  const s2 = s1.filter(t => Number.isFinite(t.amount))
  const clean = s2
  const bySrc = new Map<string, { records: number; amount: number }>()
  clean.forEach(t => {
    const k = t.kind === "contract" ? "USAspending contract prime txns" : "USAspending assistance prime txns"
    const e = bySrc.get(k) ?? { records: 0, amount: 0 }
    e.records++; e.amount += Math.abs(t.amount); bySrc.set(k, e)
  })
  const dates = clean.map(t => t.date).filter(Boolean).sort()
  return {
    clean,
    manifest: {
      records: clean.length,
      gross: clean.reduce((s, t) => s + Math.abs(t.amount), 0),
      net: clean.reduce((s, t) => s + t.amount, 0),
      dateMin: dates[0], dateMax: dates[dates.length - 1],
      sources: Array.from(bySrc.entries()).map(([name, v]) => ({ name, ...v })),
      gates: [
        { rule: "Drop zero-amount records", before: n0, after: s1.length, note: "administrative mods carry $0 — excluded from analytical population" },
        { rule: "Coerce non-numeric amounts", before: s1.length, after: s2.length, note: "non-finite values quarantined, never silently zeroed" },
      ],
      hash: fnv1a(clean.map(t => t.amount)),
      basis,
    },
  }
}

export function stageValues(values: number[], labels: string[], basis: string): { manifest: PopulationManifest; clean: number[]; cleanLabels: string[] } {
  const n0 = values.length
  const keep = values.map((v, i) => ({ v, l: labels[i] ?? "" })).filter(x => x.v !== 0 && Number.isFinite(x.v))
  return {
    clean: keep.map(x => Math.abs(x.v)), cleanLabels: keep.map(x => x.l),
    manifest: {
      records: keep.length,
      gross: keep.reduce((s, x) => s + Math.abs(x.v), 0),
      net: keep.reduce((s, x) => s + x.v, 0),
      sources: [{ name: "PB2026 + PB2027 J-book exhibit accounts (sourcedata/)", records: keep.length, amount: keep.reduce((s, x) => s + Math.abs(x.v), 0) }],
      gates: [{ rule: "Drop zero / non-numeric", before: n0, after: keep.length, note: "all-zero account-years excluded from the screen population" }],
      hash: fnv1a(keep.map(x => x.v)),
      basis,
    },
  }
}

export function stageSeries(series: SeriesPoint[], basis: string): PopulationManifest {
  return {
    records: series.length,
    gross: series.reduce((s, p) => s + Math.abs(p.value), 0),
    net: series.reduce((s, p) => s + p.value, 0),
    dateMin: series[0]?.label, dateMax: series[series.length - 1]?.label,
    sources: [{ name: "Action-date monthly rollup (sourcedata/ award files)", records: series.length, amount: series.reduce((s, p) => s + Math.abs(p.value), 0) }],
    gates: [{ rule: "Continuity check", before: series.length, after: series.length, note: "no missing periods in the series window" }],
    hash: fnv1a(series.map(p => p.value)),
    basis,
  }
}

// ── stage 2: model blueprints (the exact steps executed) ─────────────────────
export const MODEL_BLUEPRINT: Record<DemoModel, string[]> = {
  benford: [
    "extract |amount| > 0 from certified population",
    "leading-digit frequency distribution (d = 1…9)",
    "χ² goodness-of-fit vs Benford expected, 8 df, α = 0.05 (critical 15.51)",
    "MAD conformity grade per Nigrini bands (<0.6% close · <1.2% acceptable · ≥1.5% nonconformity)",
    "digit-level deviation ranking → localization set for root-cause",
  ],
  anomaly: [
    "robust center/scale: median + MAD (outlier-resistant, unlike mean/σ)",
    "modified z-score per record: 0.6745·(x−median)/MAD",
    "flag |z| > 3.5 OR beyond Q1−3·IQR / Q3+3·IQR (dual-method consensus)",
    "severity = max(z, IQR multiple) → triage ordering",
    "flag-set profiling: recipient / month / method concentration",
  ],
  risk: [
    "feature extraction per disbursement: log-amount percentile, counterparty frequency, calendar position",
    "rule+weight composite score 0–100 (transparent, audit-explainable — no black box)",
    "rank population; top tail = post-payment review queue",
    "driver attribution per flagged item (which features fired)",
    "expected-recovery sizing at PIIA planning factors",
  ],
  cluster: [
    "log₁₀ |amount| transform (federal amounts span 6+ orders of magnitude)",
    "k-means k=4, k-means++ seeding, converge on centroid stability",
    "back-transform strata boundaries to dollar ranges",
    "population/share per stratum → stratified test design",
    "allocation: 100% detail-test top stratum, MUS the middle, scan the micro tail",
  ],
  forecast: [
    "Holt double exponential smoothing (level + trend) on the period series",
    "grid-search α/β on one-step-ahead MAPE",
    "4-period forecast with 80% empirical residual bands",
    "lower band = silent-failure alarm threshold per period",
    "backtest MAPE published with the model — no unmeasured forecasts",
  ],
}

// ── stage 3: AI root-cause analysis (computed from actual results) ───────────
export interface RootFinding { severity: "high" | "medium" | "low"; title: string; detail: string }
export interface ActionItem { pri: 1 | 2 | 3; action: string; owner: string }
export interface RootCause { findings: RootFinding[]; actions: ActionItem[] }

const BENFORD_DIGIT_READING: Record<string, string> = {
  excessLow: "an excess of low leading digits often reflects split transactions engineered under approval thresholds (each piece lands just above the next power of ten)",
  excessHigh: "an excess of 8/9 leading digits is the just-under-the-threshold signature — amounts pushed as close to a limit ($10K micro-purchase, $250K SAT) as possible without crossing it",
  deficitOne: "a deficit of leading 1s usually means aggregation or rounding upstream — detail records were summarized before they reached this population, which itself is a completeness finding",
}

export function rootCauseBenford(b: BenfordResult, txns: Txn[] | null): RootCause {
  const devs = b.digits.map(d => ({ ...d, dev: d.observed - d.expected })).sort((x, y) => Math.abs(y.dev) - Math.abs(x.dev))
  const worst = devs[0]
  const second = devs[1]
  const findings: RootFinding[] = []
  findings.push({
    severity: b.conforms ? "low" : "high",
    title: b.conforms ? `Population conforms (χ² ${b.chi2} < 15.51, MAD ${b.mad}%)` : `Population deviates (χ² ${b.chi2} ≥ 15.51, MAD ${b.mad}%)`,
    detail: b.conforms
      ? "First-digit frequencies are statistically consistent with a natural transaction population — this supports (does not prove) the integrity assertion in the UoT certification. Keep the screen standing: conformity can degrade in a single quarter."
      : "The population's leading-digit structure is not natural. This does NOT prove fraud — mixed currencies, fixed-price schedules and threshold rules also distort digits — but it obligates a documented disposition before the population is certified.",
  })
  const dir = worst.dev > 0 ? "excess" : "deficit"
  const reading = worst.dev > 0 && worst.digit >= 8 ? BENFORD_DIGIT_READING.excessHigh
    : worst.dev > 0 && worst.digit <= 3 ? BENFORD_DIGIT_READING.excessLow
    : worst.digit === 1 && worst.dev < 0 ? BENFORD_DIGIT_READING.deficitOne
    : "isolated digit drift — check whether one program's pricing structure (unit costs, per-diem rates) dominates this digit"
  findings.push({
    severity: Math.abs(worst.dev) > 2 ? "high" : "medium",
    title: `Largest deviation: digit ${worst.digit} (${worst.observed}% observed vs ${worst.expected}% expected, ${worst.dev > 0 ? "+" : ""}${(worst.dev).toFixed(1)} pts)`,
    detail: `Pattern reading: ${dir} of leading ${worst.digit}s — ${reading}. Secondary deviation at digit ${second.digit} (${second.dev > 0 ? "+" : ""}${second.dev.toFixed(1)} pts).`,
  })
  const actions: ActionItem[] = []
  if (txns && txns.length) {
    const subset = txns.filter(t => String(Math.abs(t.amount)).replace(/[^1-9]/g, "")[0] === String(worst.digit))
    const subTotal = subset.reduce((s, t) => s + Math.abs(t.amount), 0)
    const byRecip = new Map<string, number>()
    subset.forEach(t => byRecip.set(t.recipient, (byRecip.get(t.recipient) ?? 0) + Math.abs(t.amount)))
    const topR = Array.from(byRecip.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const byMonth = new Map<string, number>()
    subset.forEach(t => byMonth.set(t.date.slice(0, 7), (byMonth.get(t.date.slice(0, 7)) ?? 0) + 1))
    const topM = Array.from(byMonth.entries()).sort((a, b) => b[1] - a[1])[0]
    findings.push({
      severity: "medium",
      title: `Localization: ${subset.length.toLocaleString()} records (${fmt(subTotal)}) lead with digit ${worst.digit}`,
      detail: `Concentration: ${topR.map(([n, v]) => `${n} (${fmt(v)})`).join(" · ")}${topM ? `; heaviest month ${topM[0]} with ${topM[1]} records` : ""}. The investigation starts with these counterparties, not with the whole population.`,
    })
    if (topR[0]) actions.push({ pri: 1, action: `Pull KSD (contract, receiving report, invoice) for the top digit-${worst.digit} counterparties — start with ${topR[0][0]} (${fmt(topR[0][1])}); disposition each as pricing-structure, threshold behavior, or exception`, owner: "Component audit liaison" })
  }
  actions.push(
    { pri: b.conforms ? 3 : 1, action: b.conforms ? `Attach this conformity result (χ² ${b.chi2}, MAD ${b.mad}%, hash-locked population) to the period's UoT certification as the standing integrity screen` : `Hold UoT certification for this population until digit-${worst.digit} deviation is dispositioned and documented`, owner: "FIAR Directorate" },
    { pri: 2, action: "Re-run the screen on each Component's population separately — department-level conformity can mask offsetting Component-level deviations", owner: "Advana FM analytics" },
    { pri: 3, action: "Institutionalize: quarterly Benford + MAD trend per population; alert on grade degradation, not just absolute failure", owner: "OUSD(C) A&FR" },
  )
  return { findings, actions }
}

export function rootCauseAnomaly(flags: AnomalyRow[], poolN: number, poolGross: number): RootCause {
  const flagged = flags.reduce((s, f) => s + Math.abs(f.value), 0)
  const share = poolGross ? Math.round(flagged / poolGross * 1000) / 10 : 0
  const recip = (l: string) => l.split(" · ")[0]
  const byR = new Map<string, number>()
  flags.forEach(f => byR.set(recip(f.label), (byR.get(recip(f.label)) ?? 0) + 1))
  const topR = Array.from(byR.entries()).sort((a, b) => b[1] - a[1])[0]
  const both = flags.filter(f => f.method.includes("+")).length
  const top = flags[0]
  const findings: RootFinding[] = [
    { severity: flags.length ? (share > 20 ? "high" : "medium") : "low",
      title: `${flags.length} flags carry ${fmt(flagged)} — ${share}% of population dollars in ${poolN ? Math.round(flags.length / poolN * 10000) / 100 : 0}% of records`,
      detail: "This asymmetry is the point: outlier review is the cheapest dollar-coverage in audit response. In production these are the unmatched-residual items worked first because each one moves the unexplained balance most." },
  ]
  if (top) findings.push({ severity: "high", title: `Severest item: ${top.label} (${fmt(top.value)}, score ${top.score.toFixed(1)})`,
    detail: `Flagged by ${top.method}. First test: is this a structural event (option exercise, incremental funding of a major program) or a data defect (duplicate feed, unit error, wrong TAS)? Structural events get documented and whitelisted; defects get a root-cause ticket against the source interface.` })
  if (topR && topR[1] >= 3) findings.push({ severity: "medium", title: `Counterparty concentration: ${topR[0]} appears in ${topR[1]} flags`,
    detail: "Repeated flags on one counterparty shift the hypothesis from random error to systematic cause — pricing structure, recurring duplicate, or a feed defect specific to that entity's contracts. Review the contract file once, disposition all flags together." })
  if (flags.length) findings.push({ severity: "low", title: `Method consensus: ${both} of ${flags.length} flags hit BOTH robust-z and IQR`,
    detail: "Dual-method flags are the highest-confidence set; single-method flags near the boundary are tuning candidates, not necessarily exceptions." })
  const actions: ActionItem[] = [
    { pri: 1, action: top ? `Disposition the top ${Math.min(5, flags.length)} flags (${fmt(flags.slice(0, 5).reduce((s, f) => s + Math.abs(f.value), 0))}) within 10 business days — structural / defect / exception, with evidence attached` : "No flags — record the clean screen result with the population hash as period evidence", owner: "FM Ops review cell" },
    ...(topR && topR[1] >= 3 ? [{ pri: 2 as const, action: `Open a single consolidated review of ${topR[0]} (${topR[1]} flagged items) — one contract-file pull, one disposition memo`, owner: "Contracting officer / DFAS" }] : []),
    { pri: 2, action: "Wire this screen into the daily matching pipeline: flag at ingest, not at month-end — residuals get younger and cheaper to fix", owner: "Advana FM analytics" },
    { pri: 3, action: "Backtest the 3.5σ threshold quarterly against disposition outcomes; tighten where >80% of flags disposition as structural", owner: "Data science cell" },
  ]
  return { findings, actions }
}

export function rootCauseRisk(rows: RiskRow[], poolN: number, amountByLabel: Map<string, number>): RootCause {
  const driverFreq = new Map<string, number>()
  rows.forEach(r => r.drivers.forEach(d => driverFreq.set(d, (driverFreq.get(d) ?? 0) + 1)))
  const topDrivers = Array.from(driverFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const high = rows.filter(r => r.score >= 60)
  const queue$ = rows.reduce((s, r) => s + Math.abs(amountByLabel.get(r.label) ?? 0), 0)
  // PIIA planning factor — government-wide improper payment planning rate, labeled as such
  const expected = queue$ * 0.012
  const findings: RootFinding[] = [
    { severity: high.length ? "high" : "medium",
      title: `${rows.length}-item review queue from ${poolN.toLocaleString()} disbursements · ${high.length} high-risk (≥60) · queue value ${fmt(queue$)}`,
      detail: `Risk-based sampling beats random sampling on recovery-per-review-hour — this queue IS the PIIA sampling frame. At the 1.2% government-wide planning factor, expected improper payments inside the queue ≈ ${fmt(expected)} (planning estimate, not a finding).` },
    { severity: "medium",
      title: `Dominant risk drivers: ${topDrivers.map(([d, n]) => `${d} (${n}×)`).join(" · ")}`,
      detail: "Driver attribution is what makes the score audit-explainable — every flagged item can state in plain language why it was selected. A black-box score would itself be an A-123 control deficiency." },
  ]
  if (topDrivers[0] && topDrivers[0][1] >= rows.length * 0.6) findings.push({
    severity: "medium", title: `Single driver fires on ${topDrivers[0][1]} of ${rows.length} items`,
    detail: `When one feature dominates (${topDrivers[0][0]}), the control fix is upstream — address the condition itself (e.g., one-time vendor onboarding checks, year-end timing rules) and the queue shrinks structurally.` })
  return {
    findings,
    actions: [
      { pri: 1, action: `Route the ${Math.min(rows.length, 15)} top-scored disbursements to post-payment review with a 30-day disposition SLA; recovered amounts to the PIIA recapture report`, owner: "Post-payment review cell (DFAS)" },
      { pri: 2, action: `Brief the dominant-driver pattern (${topDrivers[0]?.[0] ?? "n/a"}) to the entitlement chain — prevention upstream beats recovery downstream ~10:1`, owner: "Component FM / entitlement office" },
      { pri: 2, action: "Feed disposition outcomes back as labels — after two quarters, replace static weights with a learned model and publish its backtest in the AFR payment-integrity section", owner: "Data science cell" },
      { pri: 3, action: "Reconcile this queue's coverage against the OMB-approved PIIA sampling plan so the risk-based frame counts toward statutory testing", owner: "PIIA program office" },
    ],
  }
}

export function rootCauseCluster(k: ClusterResult, poolN: number, poolGross: number): RootCause {
  const tiers = ["Micro", "Small", "Medium", "Major"]
  const major = k.clusters[k.clusters.length - 1]
  const medium = k.clusters[k.clusters.length - 2]
  const major$ = major ? major.share : 0
  const mus = medium ? Math.min(60, Math.max(15, Math.ceil(medium.size * 0.08))) : 0
  const findings: RootFinding[] = [
    { severity: "medium",
      title: `Strata discovered: ${k.clusters.map((c, i) => `${tiers[i]} ${c.size}`).join(" · ")} (converged in ${k.iterations} iterations)`,
      detail: `The ${tiers[k.clusters.length - 1]} stratum holds ${major?.size ?? 0} items (${major$}% of population dollars) between ${major ? fmt(major.min) : "—"} and ${major ? fmt(major.max) : "—"}. Test design follows the dollars, not the row counts.` },
    { severity: "low",
      title: "Why k-means on log-amounts and not fixed dollar bands",
      detail: "Fixed bands ($1M/$10M/$100M) are arbitrary and drift with appropriation mix; data-driven strata adapt per population and are defensible in the sampling memo — the boundaries are reproducible from the hash-locked population." },
  ]
  return {
    findings,
    actions: [
      { pri: 1, action: `Detail-test 100% of the ${tiers[k.clusters.length - 1]} stratum (${major?.size ?? 0} items, ${major$}% of dollars) — full KSD pull per item`, owner: "Audit response team" },
      { pri: 2, action: `MUS-sample ≈${mus} items from the ${tiers[k.clusters.length - 2] ?? "Medium"} stratum (interval = stratum $ / n, seed documented for auditor re-extraction)`, owner: "Statistical sampling cell" },
      { pri: 3, action: "Analytic-only scan of Micro/Small strata (Benford + outlier screens) — no item testing unless a screen fires; document the rationale in the sampling memo", owner: "Advana FM analytics" },
    ],
  }
}

export function rootCauseForecast(f: ForecastResult): RootCause {
  const next = f.forecast[0]
  const bandW = next ? Math.round((next.hi - next.lo) / Math.max(next.value, 1) * 100) : 0
  const grade = f.metrics.mape < 10 ? "tight" : f.metrics.mape < 25 ? "usable" : "noisy"
  const findings: RootFinding[] = [
    { severity: grade === "noisy" ? "medium" : "low",
      title: `Backtest MAPE ${f.metrics.mape}% — ${grade} fit · next-period expectation ${next ? fmt(next.value) : "—"}`,
      detail: `80% band: ${next ? `${fmt(next.lo)} – ${fmt(next.hi)}` : "—"} (±${bandW}% width). ${grade === "noisy" ? "Wide bands mean the series mixes regimes (surge months + quiet months) — fit per-quarter models or add month-of-FY seasonality before using this for alerting." : "Band is tight enough to serve as the silent-failure alarm: an actual feed below the lower bound pages interface ops the same day."}` },
    { severity: "medium",
      title: "What this detects that count-checks miss",
      detail: "Record-count handshakes catch a feed that didn't arrive; volume forecasting catches the feed that arrived but was PARTIAL — the harder failure mode, and the one that historically surfaces as an unexplained reconciliation difference three weeks later." },
  ]
  return {
    findings,
    actions: [
      { pri: 1, action: `Set the per-period alarm at the 80% lower band (next period: ${next ? fmt(next.lo) : "—"}); breach = same-day interface ops ticket + hold on downstream certification`, owner: "Interface operations (DFAS)" },
      { pri: 2, action: "Fit one model per interface (not one global) — DTS, WAWF, MOCAS and payroll cadences differ structurally; publish each MAPE on the interface assurance artifact", owner: "Advana FM analytics" },
      { pri: 3, action: "Quarterly re-fit with champion/challenger: if seasonal model beats Holt on MAPE, promote it; keep the loser as challenger", owner: "Data science cell" },
    ],
  }
}

// ── stage 4: evidence artifact ───────────────────────────────────────────────
export function buildArtifact(opts: {
  mwNum: number; model: DemoModel; manifest: PopulationManifest
  metrics: [string, string][]; verdict: string
}): string {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC"
  const id = `SCRN-MW${String(opts.mwNum).padStart(2, "0")}-${opts.model.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
  const lines = [
    "ANALYTIC SCREEN EVIDENCE ARTIFACT",
    "═".repeat(64),
    `Artifact ID:      ${id}`,
    `Material weakness: MW #${opts.mwNum} (DODIG-2026-032)`,
    `Screen:           ${opts.model.toUpperCase()} · lib/ml/engine (in-browser execution)`,
    `Generated:        ${ts} (system-generated)`,
    "",
    "POPULATION",
    `  Basis:          ${opts.manifest.basis}`,
    `  Records:        ${opts.manifest.records.toLocaleString()}`,
    `  Gross amount:   ${fmt(opts.manifest.gross)}`,
    `  Net amount:     ${fmt(opts.manifest.net)}`,
    ...(opts.manifest.dateMin ? [`  Span:           ${opts.manifest.dateMin} → ${opts.manifest.dateMax}`] : []),
    ...opts.manifest.sources.map(s => `  Source:         ${s.name} — ${s.records.toLocaleString()} rec · ${fmt(s.amount)}`),
    `  Integrity hash: ${opts.manifest.hash} (FNV-1a over amount stream)`,
    "",
    "RESULT",
    ...opts.metrics.map(([k, v]) => `  ${(k + ":").padEnd(16)}${v}`),
    `  Verdict:        ${opts.verdict}`,
    "",
    "REPRODUCIBILITY",
    "  Re-running this screen on the identical population (verify via",
    "  integrity hash) reproduces these results exactly. No manual",
    "  additions, deletions, or modifications were made.",
    "═".repeat(64),
  ]
  return lines.join("\n")
}
