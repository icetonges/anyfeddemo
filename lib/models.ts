// ═══════════════════════════════════════════════════════════════════════════
// models.ts  —  Chain-of-LLMs Configuration
// ═══════════════════════════════════════════════════════════════════════════
//
//  Chain routing by task profile:
//
//  'fast'    →  Gemini 3.1 Flash-Lite (cheapest) → Llama 8B → Llama 70B → Gemini 3.5 Flash
//  'value'   →  Gemini 3.5 Flash ★ → Gemini 2.5 Flash → Gemini 3.1 Flash-Lite → Claude Haiku
//  'best'    →  Gemini 3.5 Flash ★ → Claude Sonnet 4.6 → Claude Opus 4.6
//  'agentic' →  Gemini 3.5 Flash → Llama 3.3 70B → Claude Sonnet
//              (Compound Beta removed — exceeds Vercel 30s function timeout)
//
//  TIER 1  FREE / ULTRA-FAST (Groq)  ─────────────────────────────────────
//    Groq   Llama 3.1 8B Instant    →  lightning-fast, simple tasks
//    Groq   Llama 3.3 70B           →  strong general reasoning
//    Groq   Llama 4 Scout           →  vision + MoE reasoning
//
//  TIER 2  VALUE / BALANCED (Google + Haiku)  ─────────────────────────────
//    Gemini 3.1 Flash-Lite          →  ultra-cheap bulk / agentic chains
//    Gemini 2.5 Flash               →  proven reasoning, 1M ctx
//    Gemini 3.5 Flash  ★ DEFAULT    →  flagship value — speed + deep thinking
//    Claude Haiku 4.5               →  fastest Anthropic, 200K ctx
//
//  TIER 3  PREMIUM / FRONTIER (Claude)  ───────────────────────────────────
//    Claude Sonnet 4.6              →  balanced performance, vision, 200K
//    Claude Opus 4.6                →  most capable Anthropic, 200K
//
// ═══════════════════════════════════════════════════════════════════════════

export type ModelId =
  // Groq
  | 'meta-llama/llama-4-scout-17b-16e-instruct'
  | 'llama-3.3-70b-versatile'
  | 'llama-3.1-8b-instant'
  // Google Gemini
  | 'gemini-3.1-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-3.5-flash'
  // Anthropic Claude
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6'

export interface Model {
  id: ModelId
  name: string
  provider: 'groq' | 'google' | 'anthropic'
  providerLabel?: string
  providerColor: string
  inputPricePer1M: number
  outputPricePer1M: number
  contextWindow: string
  description: string
  isFree: boolean
  isDefault?: boolean
  supportsVision?: boolean
  badge?: string
  /** Chain routing tier: 1 = free/fast, 2 = value, 3 = frontier */
  tier: 1 | 2 | 3
}

export const MODELS: Model[] = [

  // ─── TIER 1 · FREE / ULTRA-FAST (Groq) ──────────────────────────────────

  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'groq',
    providerLabel: 'Groq',
    providerColor: '#f55036',
    inputPricePer1M: 0,
    outputPricePer1M: 0,
    contextWindow: '128K',
    description: 'Lightning-fast — great for simple tasks and high-volume chains.',
    isFree: true,
    supportsVision: false,
    tier: 1,
  },

  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    providerLabel: 'Groq',
    providerColor: '#f55036',
    inputPricePer1M: 0,
    outputPricePer1M: 0,
    contextWindow: '128K',
    description: 'Best Llama 3 — ultra-fast inference, strong general reasoning.',
    isFree: true,
    supportsVision: false,
    badge: 'Fast',
    tier: 1,
  },

  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    provider: 'groq',
    providerLabel: 'Groq',
    providerColor: '#f55036',
    inputPricePer1M: 0,
    outputPricePer1M: 0,
    contextWindow: '128K',
    description: 'Llama 4 MoE architecture — vision + reasoning, 128K context.',
    isFree: true,
    supportsVision: true,
    tier: 1,
  },

  // ─── TIER 2 · VALUE / BALANCED (Gemini + Haiku) ──────────────────────────

  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    provider: 'google',
    providerColor: '#4285f4',
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.50,
    contextWindow: '1M',
    description: 'High-volume agentic tasks — ultra-low latency, optimised for massive scale.',
    isFree: false,
    isDefault: false,
    tier: 2,
  },

  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    providerColor: '#4285f4',
    inputPricePer1M: 0.30,
    outputPricePer1M: 2.50,
    contextWindow: '1M',
    description: 'Proven reasoning staple — exceptional price-to-performance with 1M token context.',
    isFree: false,
    isDefault: false,
    tier: 2,
  },

  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'google',
    providerColor: '#4285f4',
    inputPricePer1M: 1.50,
    outputPricePer1M: 9.00,
    contextWindow: '1M',
    description: 'Flagship value model — ultimate balance of intelligence, speed, and deep thinking.',
    isFree: false,
    isDefault: true,
    badge: 'Recommended',
    tier: 2,
  },

  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    providerColor: '#c85a3a',
    inputPricePer1M: 0.8,
    outputPricePer1M: 4,
    contextWindow: '200K',
    description: 'Fastest Anthropic model — vision, 200K context, cost-efficient.',
    isFree: false,
    supportsVision: true,
    tier: 2,
  },

  // ─── TIER 3 · PREMIUM / FRONTIER (Claude) ────────────────────────────────

  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    providerColor: '#c85a3a',
    inputPricePer1M: 3,
    outputPricePer1M: 15,
    contextWindow: '200K',
    description: 'Balanced performance — vision, 200K context, strong reasoning.',
    isFree: false,
    supportsVision: true,
    badge: 'Balanced',
    tier: 3,
  },

  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    providerColor: '#c85a3a',
    inputPricePer1M: 15,
    outputPricePer1M: 75,
    contextWindow: '200K',
    description: 'Most capable Anthropic model — vision, 200K context, frontier intelligence.',
    isFree: false,
    supportsVision: true,
    tier: 3,
  },

]

// ─── Default ────────────────────────────────────────────────────────────────

export const DEFAULT_MODEL_ID: ModelId =
  MODELS.find(m => m.isDefault)?.id ?? 'gemini-3.5-flash'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** All models for a given provider, in their declared order */
export const byProvider = (provider: Model['provider']) =>
  MODELS.filter(m => m.provider === provider)

/** All models for a given routing tier */
export const byTier = (tier: Model['tier']) =>
  MODELS.filter(m => m.tier === tier)

/** Look up a model by id (throws if not found) */
export const getModel = (id: ModelId): Model => {
  const m = MODELS.find(m => m.id === id)
  if (!m) throw new Error(`Unknown model id: ${id}`)
  return m
}

/**
 * Chain-of-LLMs router
 *
 * Returns an ordered list of model IDs to try in sequence.
 * Intended use: attempt [0], fall back to [1] on error/timeout, etc.
 *
 * @param task  'fast'    → Tier 1 free models first
 *              'value'   → Tier 2 balanced models first
 *              'best'    → Tier 3 frontier models first
 *              'agentic' → Compound Beta (search) → Gemini 3.5 Flash → Sonnet
 */
export function chainFor(task: 'fast' | 'value' | 'best' | 'agentic'): ModelId[] {
  switch (task) {
    case 'fast':
      // Cheapest/fastest first; Gemini 3.5 Flash as value safety net
      return [
        'gemini-3.1-flash-lite',        // ultra-low cost, high volume
        'llama-3.1-8b-instant',         // Groq free fallback
        'llama-3.3-70b-versatile',      // stronger free fallback
        'gemini-3.5-flash',             // recommended value fallback
      ]
    case 'value':
      // Gemini 3.5 Flash leads as recommended default
      return [
        'gemini-3.5-flash',             // ★ recommended — speed + deep thinking
        'gemini-2.5-flash',             // proven reasoning, 1M ctx
        'gemini-3.1-flash-lite',        // cost-saving fallback
        'claude-haiku-4-5-20251001',    // Anthropic fallback
      ]
    case 'best':
      // Gemini 3.5 Flash leads; Claude models as premium escalation
      return [
        'gemini-3.5-flash',             // ★ recommended default
        'claude-sonnet-4-6',            // Anthropic balanced escalation
        'claude-opus-4-6',              // Anthropic frontier last resort
      ]
    case 'agentic':
      // Gemini 3.5 Flash leads (compound-beta removed — Vercel 504 timeout)
      return [
        'gemini-3.5-flash',             // reasoning + speed
        'llama-3.3-70b-versatile',      // free Groq fallback
        'claude-sonnet-4-6',            // frontier fallback
      ]
  }
}
