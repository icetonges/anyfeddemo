"use client"
// components/anyfed/useAgencyData.ts — client data hook with in-memory cache.
import { useEffect, useState } from "react"

const cache = new Map<string, unknown>()

export function useAgencyData<T = Record<string, unknown>>(agencyId: string, slice: string) {
  const key = `${agencyId}:${slice}`
  const [data, setData] = useState<T | null>((cache.get(key) as T) ?? null)
  const [loading, setLoading] = useState(!cache.has(key))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (cache.has(key)) { setData(cache.get(key) as T); setLoading(false); setError(null); return }
    setLoading(true); setError(null)
    fetch(`/api/agency-data?agency=${agencyId}&slice=${slice}`)
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
export interface DodBudget {
  source: string
  unit: string
  exhibits: Record<string, {
    title: string; appn: string
    years: Record<string, number>
    byOrg: Record<string, Record<string, number>>
    byBudgetActivity: Record<string, Record<string, number>>
    topAccounts: Record<string, Record<string, number>>
  }>
  totalsByFY: Record<string, number>
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

export interface LiveAwards {
  source: string
  fiscalYear: string
  agency: string
  total: number
  byCategory: { name: string; total: number }[]
  bySubAgency: { name: string; total: number; count?: number }[]
}
