// app/api/ai-chat/route.ts
// Agency-aware chain-of-LLMs endpoint.
//   default        → callChain with the per-agency analyst prompt
//   mode:'compare' → run TWO pinned models in parallel on the same prompt
//   mode:'judge'   → impartial adjudication of two answers via the best chain
import { NextRequest, NextResponse } from 'next/server'
import { callChain } from '@/lib/llm-chain'
import { chainFor } from '@/lib/models'
import { buildAnalystPrompt } from '@/lib/analyst-context'
import type { ChatMessage } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface CompareResult {
  modelId: string; ok: boolean; text?: string; error?: string; ms: number
}

async function runOne(modelId: string, system: string, messages: ChatMessage[]): Promise<CompareResult> {
  const t0 = Date.now()
  try {
    const { text } = await callChain([modelId], system, messages, 1000)
    return { modelId, ok: true, text, ms: Date.now() - t0 }
  } catch (err) {
    return { modelId, ok: false, error: err instanceof Error ? err.message : String(err), ms: Date.now() - t0 }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const agencyId: string = (body.agency ?? 'DOD').toUpperCase()
    const system = buildAnalystPrompt(agencyId)
    const task: 'fast' | 'value' | 'best' | 'agentic' = body.task ?? 'best'

    // ── judge mode: adjudicate two model answers ─────────────────────────
    if (body.mode === 'judge') {
      const { question, answers } = body as { question: string; answers: { modelId: string; text: string }[] }
      if (!question || !Array.isArray(answers) || answers.length !== 2) {
        return NextResponse.json({ error: 'judge mode needs question + exactly two answers' }, { status: 400 })
      }
      const judgePrompt: ChatMessage[] = [{
        role: 'user',
        content: `You are an impartial senior federal FM reviewer. Two AI models answered the same question for this agency. Compare them rigorously.

QUESTION:
${question}

ANSWER A — ${answers[0].modelId}:
${answers[0].text}

ANSWER B — ${answers[1].modelId}:
${answers[1].text}

Score each answer 1-10 on: factual accuracy (fiscal law, USSGL, agency specifics) · specificity ($ figures, citations, time basis) · actionability. Call out any hallucinated figure or wrong authority. End with exactly one line: "VERDICT: A" or "VERDICT: B" or "VERDICT: TIE", plus a one-sentence reason.`,
      }]
      const { text, modelUsed } = await callChain(chainFor('best'), system, judgePrompt, 800)
      return NextResponse.json({ mode: 'judge', text, modelUsed })
    }

    const messages: ChatMessage[] = body.messages ?? []
    if (!messages.length) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
    }

    // ── compare mode: two pinned models, same prompt, in parallel ────────
    if (body.mode === 'compare') {
      const { modelA, modelB } = body as { modelA?: string; modelB?: string }
      if (!modelA || !modelB) {
        return NextResponse.json({ error: 'compare mode needs modelA and modelB' }, { status: 400 })
      }
      const results = await Promise.all([
        runOne(modelA, system, messages),
        runOne(modelB, system, messages),
      ])
      return NextResponse.json({ mode: 'compare', agency: agencyId, results })
    }

    // ── single mode: preferred model first, task chain as fallback ───────
    const preferredModelId: string | undefined = body.modelId
    const baseChain = chainFor(task)
    const chain = preferredModelId
      ? [preferredModelId, ...baseChain.filter(id => id !== preferredModelId)]
      : baseChain

    const { text, modelUsed } = await callChain(chain, system, messages, 1000)
    return NextResponse.json({ text, modelUsed, agency: agencyId, chainAttempted: chain })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ai-chat]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
