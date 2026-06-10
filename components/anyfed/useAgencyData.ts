"use client"
// components/anyfed/useAgencyData.ts — client data hook with in-memory cache.
import { useEffect, useState } from "react"

const cache = new Map<string, unknown>()

export function useAgencyData<T = Record<string, unknown>>(agencyId: string, slice: string, extra = "") {
  const key = `${agencyId}:${slice}:${extra}`
  const [data, setData] = useState<T | null>((cache.get(key) as T) ?? null)
  const [loading, setLoading] = useState(!cache.has(key))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (cache.has(key)) { setData(cache.get(key) as T); setLoading(false); setError(null); return }
    setLoading(true); setError(null)
    fetch(`/api/agency-data?agency=${agencyId}&slice=${slice}${extra ? `&${extra}` : ""}`)
      .then(async r => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
        return j
      })
      .then(j => { if (alive) { cache.set(key, j); setData(j); setLoading(false) } })
      .catch(e => { if (alive) { setError(e.message); setLoading(false) } })
    return () => { alive = false }
  }, [key, agencyId, slice])

  return { data, loading, error }
}

// ── shared shapes returned by /api/agency-data ────────────────────────────
export interface YearPhase { phase: "actuals" | "enacted" | "request"; label: string }

export interface VintageYear { phase: "actuals"|"enacted"|"request"|"future"; total: number; components: Record<string, number> }
export interface LifecycleYear { actuals?: number; enacted?: number; request?: number; execVarPct?: number; reqToEnactedPct?: number }

export interface BudgetExhibit {
  title: string; appn: string; isMilcon?: boolean; note?: string
  years: Record<string, number>
  byOrg: Record<string, Record<string, number>>
  byBudgetActivity: Record<string, Record<string, number>>
  topAccounts: Record<string, Record<string, number>>
  byStateCountry?: Record<string, Record<string, number>>
  byFacilityCategory?: Record<string, Record<string, number>>
  // enriched layer ----------------------------------------------------------
  components?: Record<string, Record<string, number>>      // fy -> {actuals|discretionaryEnacted|mandatorySpendPlan|discretionaryRequest|mandatoryRequest|total|toa|appropriation|authorization}
  orgComponentMix?: Record<string, Record<string, Record<string, number>>> // fy -> org -> component -> $
  records?: BudgetRecord[]
  dims?: Record<string, string[]>
  quality?: { totalRows: number; nullAmounts: number; nonAddFiltered?: number; recordRows: number; recordsKept: number; drillLevels?: string[] }
  hierarchy?: string[]
  vintages?: Record<string, Record<string, VintageYear>>
  lifecycle?: Record<string, LifecycleYear>
}

export interface BudgetRecord {
  org: string; budgetActivity: string
  account?: string; project?: string; stateCountry?: string
  FY2024: number; FY2025: number; FY2026: number; FY2027: number
  [k: string]: string | number | undefined
}

export interface CatalogEntry { file: string; exhibit: string; vintage?: string; book: string; sheets: string[]; years: string[] }

export interface DodBudget {
  source: string
  unit: string
  agency?: string
  generated?: string
  yearPhase?: Record<string, YearPhase>
  exhibits: Record<string, BudgetExhibit>
  totalsByFY: Record<string, number>
  discMandatoryByFY?: Record<string, { discretionary: number; mandatory: number }>
  lifecycleDept?: Record<string, { actuals?: number; enacted?: number; request?: number; execVarPct?: number; reqToEnactedPct?: number }>
  books?: Record<string, { label: string; baseYear: number; folder: string; covers: string[] }>
  catalog?: CatalogEntry[]
}

export interface Txn {
  amount: number; date: string; fy: string; recipient: string
  subAgency: string; type: string; naics: string; kind: string
}

export interface DodAwards {
  source: string
  counts: { contracts: number; assistance: number }
  topRecipients: { name: string; total: number }[]
  bySubAgency: { name: string; total: number }[]
  byType: { name: string; total: number }[]
  byNaics: { name: string; total: number }[]
  monthly: { month: string; total: number }[]
  transactions: Txn[]
}

export interface LiveBudget {
  source: string
  fiscalYears: { fy: string; budgetaryResources: number; obligated: number; obligationRate: number | null }[]
}

// ── slice=detail: live multi-dimension drill data for ANY agency ───────────
export interface DetailNode {
  name: string; code?: string; value: number; outlays?: number; count?: number
  children: DetailNode[]
}
export interface DetailDim { label: string; childLabel: string; measure: string; nodes: DetailNode[] }
export interface DetailYear {
  fy: string; resources: number; obligated: number; rate: number | null
  byPeriod: { period: number; obligated: number }[]
}
export interface LiveDetail {
  source: string; agency: string; fiscalYear: string; fetchedAt: string
  years: DetailYear[]
  dims: { subAgency: DetailDim; budgetFunction: DetailDim; federalAccount: DetailDim; objectClass: DetailDim }
}

export interface LiveAwards {
  source: string
  fiscalYear: string
  agency: string
  total: number
  byCategory: { name: string; total: number }[]
  bySubAgency: { name: string; total: number; count?: number }[]
}
