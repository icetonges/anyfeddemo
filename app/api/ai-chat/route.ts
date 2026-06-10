// app/api/ai-chat/route.ts
// Chain-of-LLMs endpoint — optional modelId pins the first attempt;
// fallback chain runs automatically if that model fails.
import { NextRequest, NextResponse } from 'next/server'
import { callChain } from '@/lib/llm-chain'
import { chainFor } from '@/lib/models'
import { SEC_AI_SYSTEM_PROMPT } from '@/lib/sec-data'
import type { ChatMessage } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages: ChatMessage[] = body.messages ?? []
    const task: 'fast' | 'value' | 'best' | 'agentic' = body.task ?? 'best'

    // Optional: client can pin a specific model to try first.
    // If it fails the remainder of the task chain is used as fallback.
    const preferredModelId: string | undefined = body.modelId

    if (!messages.length) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
    }

    // Build the chain: preferred model first (if supplied), then the task
    // chain with that model removed to avoid duplicate attempts.
    const baseChain = chainFor(task)
    const chain = preferredModelId
      ? [preferredModelId, ...baseChain.filter(id => id !== preferredModelId)]
      : baseChain

    const { text, modelUsed } = await callChain(chain, SEC_AI_SYSTEM_PROMPT, messages, 1000)

    return NextResponse.json({ text, modelUsed, chainAttempted: chain })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ai-chat]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
