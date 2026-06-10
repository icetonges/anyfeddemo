// lib/ml/registry.ts — Model blueprints for the AI/ML Workbench.
// Modeled on DataRobot's blueprint/leaderboard pattern: each model declares its
// preprocessing → algorithm → post-processing chain, task type, and FM use case.

export type TaskType = 'forecasting' | 'anomaly' | 'fraud-screen' | 'clustering' | 'risk-scoring'

export interface ModelBlueprint {
  id: string
  name: string
  family: string
  task: TaskType
  blueprint: string[]          // ordered pipeline steps (DataRobot-style)
  useCase: string              // federal FM application
  needs: 'series' | 'amounts' | 'transactions'
  metricLabel: string
}

export const MODEL_BLUEPRINTS: ModelBlueprint[] = [
  {
    id: 'holt-es', name: 'Holt Exponential Smoothing', family: 'Time Series', task: 'forecasting',
    blueprint: ['Ordered series assembly', 'Missing-period interpolation', 'Holt linear-trend smoothing (α,β)', 'In-sample backtest', '80% prediction intervals'],
    useCase: 'Obligation & outlay forecasting — burn-rate projection to fiscal year-end, ADA early warning',
    needs: 'series', metricLabel: 'MAPE',
  },
  {
    id: 'ols-trend', name: 'OLS Trend Regression', family: 'Linear Models', task: 'forecasting',
    blueprint: ['Ordinal time encoding', 'Ordinary least squares fit', 'Residual diagnostics', 'Interval estimation'],
    useCase: 'Budget formulation — out-year topline projection for POM/BES and CBJ exhibits',
    needs: 'series', metricLabel: 'R²',
  },
  {
    id: 'robust-z', name: 'Robust Z-Score Anomaly Detector', family: 'Statistical Outliers', task: 'anomaly',
    blueprint: ['Median/MAD robust scaling', 'Modified z-score (0.6745·(x−med)/MAD)', 'IQR×3 fence cross-check', 'Severity ranking'],
    useCase: 'Execution monitoring — flag abnormal obligations, de-obligations, and feeder-system spikes (MW #6, #23)',
    needs: 'amounts', metricLabel: 'Flags',
  },
  {
    id: 'benford', name: "Benford's Law First-Digit Test", family: 'Forensic Analytics', task: 'fraud-screen',
    blueprint: ['First-significant-digit extraction', 'Expected log-distribution', 'χ² goodness-of-fit (8 df)', 'MAD conformity scale'],
    useCase: 'Audit & payment integrity — screen disbursement populations for fabricated amounts (PIIA, MW #18)',
    needs: 'amounts', metricLabel: 'χ²',
  },
  {
    id: 'kmeans', name: 'K-Means Spend Segmentation', family: 'Clustering', task: 'clustering',
    blueprint: ['Log₁₀ amount transform', 'k-means++ initialization', 'Lloyd iteration to convergence', 'Cluster profiling'],
    useCase: 'Acquisition analytics — segment award population into spend tiers for category management',
    needs: 'amounts', metricLabel: 'Inertia',
  },
  {
    id: 'risk-score', name: 'Transaction Risk Scorer', family: 'Rules + Statistics Ensemble', task: 'risk-scoring',
    blueprint: ['Percentile dollar banding', 'Round-dollar & negative-action rules', 'Year-end timing signal', 'Weighted ensemble score (0–100)', 'Driver attribution'],
    useCase: 'Improper-payment review — prioritize transactions for post-payment sampling (GPC/DTS data-mining style)',
    needs: 'transactions', metricLabel: 'High-risk',
  },
]
