// lib/ml/engine.ts — Real ML computation for the AnyFed AI/ML Workbench.
// Every model here genuinely computes on the selected dataset (no canned outputs).

export interface SeriesPoint { label: string; value: number }
export interface ForecastResult {
  history: SeriesPoint[]
  forecast: { label: string; value: number; lo: number; hi: number }[]
  metrics: { mae: number; mape: number; r2: number; method: string }
}

// ── Holt linear-trend exponential smoothing with in-sample backtest ────────
export function holtForecast(series: SeriesPoint[], horizon = 4, alpha = 0.5, beta = 0.3): ForecastResult {
  const y = series.map(p => p.value)
  if (y.length < 3) throw new Error('Need ≥3 points')
  let level = y[0]
  let trend = y[1] - y[0]
  const fitted: number[] = [level + trend]
  for (let t = 1; t < y.length; t++) {
    const prevLevel = level
    level = alpha * y[t] + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
    fitted.push(level + trend)
  }
  const resid = y.slice(1).map((v, i) => v - fitted[i])
  const mae = resid.reduce((s, r) => s + Math.abs(r), 0) / resid.length
  const mape = 100 * resid.reduce((s, r, i) => s + Math.abs(r / (y[i + 1] || 1)), 0) / resid.length
  const meanY = y.reduce((a, b) => a + b, 0) / y.length
  const ssTot = y.reduce((s, v) => s + (v - meanY) ** 2, 0)
  const ssRes = resid.reduce((s, r) => s + r * r, 0)
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0
  const sd = Math.sqrt(ssRes / Math.max(1, resid.length - 1))
  const forecast = Array.from({ length: horizon }, (_, h) => {
    const v = level + trend * (h + 1)
    const band = 1.28 * sd * Math.sqrt(h + 1)   // ~80% interval
    return { label: `+${h + 1}`, value: round2(v), lo: round2(v - band), hi: round2(v + band) }
  })
  return { history: series, forecast, metrics: { mae: round2(mae), mape: round2(mape), r2: round2(r2), method: 'Holt linear-trend ES (α=0.5, β=0.3)' } }
}

// ── OLS linear regression forecast ─────────────────────────────────────────
export function linearForecast(series: SeriesPoint[], horizon = 4): ForecastResult {
  const n = series.length
  const xs = series.map((_, i) => i)
  const ys = series.map(p => p.value)
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  const b = sxx ? sxy / sxx : 0
  const a = my - b * mx
  const fitted = xs.map(x => a + b * x)
  const resid = ys.map((v, i) => v - fitted[i])
  const ssRes = resid.reduce((s, r) => s + r * r, 0)
  const ssTot = ys.reduce((s, v) => s + (v - my) ** 2, 0)
  const sd = Math.sqrt(ssRes / Math.max(1, n - 2))
  const mae = resid.reduce((s, r) => s + Math.abs(r), 0) / n
  const mape = 100 * resid.reduce((s, r, i) => s + Math.abs(r / (ys[i] || 1)), 0) / n
  return {
    history: series,
    forecast: Array.from({ length: horizon }, (_, h) => {
      const v = a + b * (n + h)
      const band = 1.28 * sd * Math.sqrt(1 + 1 / n)
      return { label: `+${h + 1}`, value: round2(v), lo: round2(v - band), hi: round2(v + band) }
    }),
    metrics: { mae: round2(mae), mape: round2(mape), r2: round2(ssTot ? 1 - ssRes / ssTot : 0), method: 'OLS linear regression' },
  }
}

// ── Anomaly detection: robust z-score (median/MAD) + IQR ───────────────────
export interface AnomalyRow { idx: number; label: string; value: number; score: number; method: string }
export function detectAnomalies(values: number[], labels: string[], zThresh = 3.5): AnomalyRow[] {
  const sorted = [...values].sort((a, b) => a - b)
  const med = quantile(sorted, 0.5)
  const mad = quantile(values.map(v => Math.abs(v - med)).sort((a, b) => a - b), 0.5) || 1e-9
  const q1 = quantile(sorted, 0.25), q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1 || 1e-9
  const out: AnomalyRow[] = []
  values.forEach((v, i) => {
    const rz = Math.abs(0.6745 * (v - med) / mad)
    const iqrOut = v < q1 - 3 * iqr || v > q3 + 3 * iqr
    if (rz > zThresh || iqrOut) {
      out.push({ idx: i, label: labels[i] ?? `row ${i}`, value: v, score: round2(rz),
                 method: rz > zThresh ? 'robust-z' : 'IQR×3' })
    }
  })
  return out.sort((a, b) => b.score - a.score).slice(0, 50)
}

// ── Benford's Law first-digit test (audit fraud-screening classic) ─────────
export interface BenfordResult {
  digits: { digit: number; expected: number; observed: number }[]
  chi2: number; criticalValue: number; conforms: boolean; n: number; mad: number
}
export function benfordTest(values: number[]): BenfordResult {
  const firsts = values
    .map(v => Math.abs(v)).filter(v => v >= 1)
    .map(v => Number(String(v).replace(/[^1-9]/g, '').charAt(0)))
    .filter(d => d >= 1 && d <= 9)
  const n = firsts.length
  const counts = Array(10).fill(0)
  firsts.forEach(d => counts[d]++)
  let chi2 = 0, madSum = 0
  const digits = Array.from({ length: 9 }, (_, i) => {
    const d = i + 1
    const expP = Math.log10(1 + 1 / d)
    const obsP = n ? counts[d] / n : 0
    const expN = expP * n
    if (expN > 0) chi2 += (counts[d] - expN) ** 2 / expN
    madSum += Math.abs(obsP - expP)
    return { digit: d, expected: round2(expP * 100), observed: round2(obsP * 100) }
  })
  return { digits, chi2: round2(chi2), criticalValue: 15.51, conforms: chi2 < 15.51,
           n, mad: round2((madSum / 9) * 100) }
}

// ── k-means clustering (1-D log-scale on amounts; k-means++ init) ──────────
export interface ClusterResult {
  clusters: { center: number; size: number; min: number; max: number; share: number }[]
  inertia: number; iterations: number
}
export function kmeans1d(values: number[], k = 4, maxIter = 60): ClusterResult {
  const pts = values.filter(v => Math.abs(v) > 0).map(v => Math.log10(Math.abs(v)))
  if (pts.length < k) throw new Error('Not enough points for k clusters')
  // k-means++ init (deterministic seed)
  let seed = 42
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31
  const centers = [pts[Math.floor(rand() * pts.length)]]
  while (centers.length < k) {
    const d2 = pts.map(p => Math.min(...centers.map(c => (p - c) ** 2)))
    const sum = d2.reduce((a, b) => a + b, 0)
    let r = rand() * sum
    let idx = 0
    while (r > d2[idx] && idx < pts.length - 1) r -= d2[idx++]
    centers.push(pts[idx])
  }
  let assign = new Array(pts.length).fill(0)
  let iter = 0
  for (; iter < maxIter; iter++) {
    const next = pts.map(p => {
      let best = 0, bd = Infinity
      centers.forEach((c, ci) => { const d = (p - c) ** 2; if (d < bd) { bd = d; best = ci } })
      return best
    })
    if (next.every((a, i) => a === assign[i]) && iter > 0) break
    assign = next
    for (let ci = 0; ci < k; ci++) {
      const members = pts.filter((_, i) => assign[i] === ci)
      if (members.length) centers[ci] = members.reduce((a, b) => a + b, 0) / members.length
    }
  }
  const inertia = pts.reduce((s, p, i) => s + (p - centers[assign[i]]) ** 2, 0)
  const clusters = centers.map((c, ci) => {
    const members = pts.filter((_, i) => assign[i] === ci)
    return {
      center: round2(10 ** c), size: members.length,
      min: members.length ? round2(10 ** Math.min(...members)) : 0,
      max: members.length ? round2(10 ** Math.max(...members)) : 0,
      share: round2(100 * members.length / pts.length),
    }
  }).sort((a, b) => a.center - b.center)
  return { clusters, inertia: round2(inertia), iterations: iter + 1 }
}

// ── Improper-payment / transaction risk scoring (transparent weights) ──────
export interface RiskRow { label: string; score: number; drivers: string[]; value: number }
export interface RiskInput { label: string; amount: number; date?: string; counterpartyCount?: number; roundDollar?: boolean }
export function riskScore(rows: RiskInput[]): RiskRow[] {
  const amounts = rows.map(r => Math.abs(r.amount))
  const sorted = [...amounts].sort((a, b) => a - b)
  const p90 = quantile(sorted, 0.9), p99 = quantile(sorted, 0.99)
  return rows.map(r => {
    const a = Math.abs(r.amount)
    const drivers: string[] = []
    let s = 0
    if (a >= p99) { s += 35; drivers.push('Top-1% dollar value') }
    else if (a >= p90) { s += 18; drivers.push('Top-10% dollar value') }
    if (a > 0 && a % 1000 === 0) { s += 15; drivers.push('Round-dollar amount') }
    if (r.amount < 0) { s += 20; drivers.push('De-obligation / negative action') }
    if (r.date) {
      const m = Number(r.date.slice(5, 7))
      if (m === 9) { s += 18; drivers.push('September (year-end spike window)') }
    }
    if ((r.counterpartyCount ?? 0) === 1) { s += 8; drivers.push('Single-transaction counterparty') }
    return { label: r.label, value: r.amount, score: Math.min(100, s), drivers }
  }).sort((a, b) => b.score - a.score)
}

// ── helpers ────────────────────────────────────────────────────────────────
function quantile(sortedAsc: number[], q: number): number {
  if (!sortedAsc.length) return 0
  const pos = (sortedAsc.length - 1) * q
  const lo = Math.floor(pos)
  const frac = pos - lo
  return sortedAsc[lo] + (sortedAsc[Math.min(lo + 1, sortedAsc.length - 1)] - sortedAsc[lo]) * frac
}
function round2(v: number): number { return Math.round(v * 100) / 100 }
