export type FinishReason = 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface UsageInfo {
  finishReason: FinishReason
  usage: TokenUsage
  timestamp: number
  model: string
  chatId: string
}

export interface ModelUsage {
  model: string
  totalUsage: TokenUsage
  usageHistory: UsageInfo[]
}

export interface UserUsage {
  userId: string
  totalUsage: TokenUsage
  modelUsage: Record<string, ModelUsage>
  lastUpdated: number
} 