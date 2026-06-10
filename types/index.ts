// ─── Shared TypeScript types ───────────────────────────────────────────────

export interface NewsItem {
  id:        number
  cat:       string
  urg:       'HIGH' | 'MEDIUM' | 'LOW'
  headline:  string
  body:      string
  impact:    string
  time:      string
  src:       string
  url?:      string
  createdAt?: string
}

export interface ObligationRecord {
  fiscalYear:   number
  fiscalMonth:  number
  objectClass:  string
  program:      string
  obligated:    number
  planned:      number
}

export interface ChatMessage {
  role:    'user' | 'assistant'
  content: string
}

export type ModelProvider = 'groq' | 'google' | 'anthropic'

export interface Model {
  id:               string
  name:             string
  provider:         ModelProvider
  providerLabel?:   string
  providerColor:    string
  inputPricePer1M:  number
  outputPricePer1M: number
  contextWindow:    string
  description:      string
  isFree:           boolean
  isDefault?:       boolean
  supportsVision?:  boolean
  badge?:           string
  tier:             1 | 2 | 3
}
