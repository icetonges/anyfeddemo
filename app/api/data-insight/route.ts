// app/api/data-insight/route.ts
// Optional LLM narration over a DETERMINISTIC budget profile computed client-side.
// Gemini → Claude → Groq chain. If no API keys are configured the chain throws and
// we return { available:false } so the client shows its deterministic analysis instead.
import { NextRequest, NextResponse } from 'next/server'
import { callChain } from '@/lib/llm-chain'
import { chainFor } from '@/lib/models'
import type { ChatMessage } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

const SYSTEM = `You are a senior U.S. federal budget data analyst embedded in a financial-management portal.
You are given a JSON profile that was computed deterministically from official DoD budget exhibit data
($K). Write a tight, decision-grade briefing. Rules:
- Lead with the single most important movement (cite the $ and %).
- Separate discretionary from PL 119-21 mandatory whenever both appear; never trend them combined.
- Respect budget-phase semantics: actuals = execution truth, enacted = current authority, request = proposal.
- Flag any data caveat the analyst must respect (e.g., MILCON is multi-year, not actuals).
- 5-7 sentences max, plain prose, no preamble, no markdown headers. Be specific with numbers.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const profile = body.profile
    const agency = body.agency ?? 'DOD'
    if (!profile) return NextResponse.json({ error: 'profile is required' }, { status: 400 })

    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Agency: ${agency}\nDeterministic profile (units = $K):\n${JSON.stringify(profile, null, 1)}\n\nWrite the briefing.`,
    }]

    try {
      const { text, modelUsed } = await callChain(chainFor('value'), SYSTEM, messages, 600)
      return NextResponse.json({ available: true, text, modelUsed })
    } catch (chainErr) {
      // No keys / all providers failed → signal graceful fallback.
      const msg = chainErr instanceof Error ? chainErr.message : String(chainErr)
      return NextResponse.json({ available: false, reason: msg })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
