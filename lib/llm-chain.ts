// lib/llm-chain.ts — Chain-of-LLMs router
// Gemini 3.5 Flash leads all main chains (recommended default).
// Falls back through the chain on any error or timeout.

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { chainFor, getModel } from './models'
import type { ChatMessage } from '@/types'

// Clients are created lazily so module import doesn't throw at build time
// when environment variables aren't yet available.
let _anthropic: Anthropic | undefined
let _google: GoogleGenerativeAI | undefined
let _groq: Groq | undefined

function getAnthropic(): Anthropic {
  return (_anthropic ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }))
}
function getGoogle(): GoogleGenerativeAI {
  return (_google ??= new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? ''))
}
function getGroq(): Groq {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error('GROQ_API_KEY environment variable is not set')
    _groq = new Groq({ apiKey: key })
  }
  return _groq
}

/**
 * Strip any extra client-side fields (e.g. modelUsed) so only
 * { role, content } reach each provider's API.
 * Role is cast to the literal union required by strict SDKs.
 */
function sanitize(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages.map(({ role, content }) => ({
    role: role as 'user' | 'assistant',
    content,
  }))
}

/** Call a single model and return the text reply */
async function callModel(
  modelId: string,
  system:  string,
  messages: ChatMessage[],
  maxTokens = 1000,
): Promise<string> {
  const model = getModel(modelId as Parameters<typeof getModel>[0])
  const clean = sanitize(messages)

  if (model.provider === 'anthropic') {
    const res = await getAnthropic().messages.create({
      model:      model.id,
      max_tokens: maxTokens,
      system,
      messages:   clean,
    })
    const block = res.content[0]
    if (block.type !== 'text') throw new Error('Non-text block from Anthropic')
    return block.text
  }

  if (model.provider === 'google') {
    const gm   = getGoogle().getGenerativeModel({
      model: model.id,
      // Pass system prompt as a Content object — required by the v1beta API
      systemInstruction: { role: 'user', parts: [{ text: system }] },
    })
    const chat = gm.startChat({
      history: clean.slice(0, -1).map(m => ({
        role:  m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    })
    const last = clean[clean.length - 1]
    const res  = await chat.sendMessage(last.content)
    return res.response.text()
  }

  if (model.provider === 'groq') {
    const res = await getGroq().chat.completions.create({
      model:      model.id,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        ...clean,
      ],
    })
    return res.choices[0]?.message?.content ?? ''
  }

  throw new Error(`Unknown provider: ${model.provider}`)
}

/**
 * callChain — try each model ID in the provided list in order.
 * Returns the first successful response along with the model that answered.
 * Logs every failure so fallback behaviour is visible in server logs.
 */
export async function callChain(
  chain: string[],
  system: string,
  messages: ChatMessage[],
  maxTokens = 1000,
): Promise<{ text: string; modelUsed: string }> {
  const errors: string[] = []

  for (const modelId of chain) {
    try {
      const text = await callModel(modelId, system, messages, maxTokens)
      if (chain.indexOf(modelId) > 0) {
        console.info(`[chain] fell back to ${modelId} after ${chain.indexOf(modelId)} failure(s)`)
      }
      return { text, modelUsed: modelId }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[chain] ${modelId} failed — trying next: ${msg}`)
      errors.push(`${modelId}: ${msg}`)
    }
  }

  throw new Error(`All models in chain failed.\n${errors.join('\n')}`)
}

/**
 * chainChat — convenience wrapper: resolves a task profile to a chain then
 * calls callChain. Use callChain directly when you need a custom chain order.
 */
export async function chainChat(
  task: Parameters<typeof chainFor>[0],
  system: string,
  messages: ChatMessage[],
  maxTokens = 1000,
): Promise<{ text: string; modelUsed: string }> {
  return callChain(chainFor(task), system, messages, maxTokens)
}
