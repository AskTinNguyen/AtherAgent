import { type FinishReason, type TokenUsage } from './types.core'
import { type ModelTokenCounter, type ModelUsageInfo } from './types.model'

export interface TimeRange {
  start: number
  end: number
}

export interface UsageAnalytics {
  timeRange: TimeRange
  totalUsage: TokenUsage
  averageUsagePerChat: TokenUsage
  modelBreakdown: Record<string, TokenUsage>
  costEstimates?: {
    totalCost: number
    currency: string
  }
}

export interface TrackUsageParams {
  model: string
  chatId: string
  usage: TokenUsage
  finishReason?: FinishReason
}

export interface UsageTrackerConfig {
  userId: string
  modelTokenCounter?: ModelTokenCounter
}

export interface UsageTracker {
  trackUsage: (params: TrackUsageParams) => Promise<void>
  getUserUsage: () => Promise<UserUsage>
  getModelUsage: (model: string) => Promise<TokenUsage>
  getAnalytics: (timeRange: TimeRange) => Promise<UsageAnalytics>
}

export interface UserUsage {
  userId: string
  totalUsage: TokenUsage
  modelUsage: Record<string, ModelUsageInfo[]>
  lastUpdated: number
}

// Redis-specific type (internal use)
export interface RedisUsageData extends Record<string, string> {
  userId: string
  totalUsage: string
  modelUsage: string
  lastUpdated: string
} 