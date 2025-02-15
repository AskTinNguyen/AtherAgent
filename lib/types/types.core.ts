import { Message } from 'ai'

// Core Message Types
export interface MultimodalMessage extends Message {
  attachments?: AttachmentFile[]
  sources?: ResearchSource[]
}

export interface ExtendedMessage extends Message {
  searchSources?: SearchSource[]
}

// Core Operation Types
export interface OperationResult<T> {
  success: boolean
  data?: T
  error?: Error | null
  message?: string
}

// Core Metadata Types
export interface Metadata {
  createdAt: string | number
  updatedAt: string | number
  version?: string
  [key: string]: unknown
}

// Core Configuration Types
export interface Config {
  environment: 'development' | 'staging' | 'production'
  features: Record<string, boolean>
  api: {
    baseUrl: string
    version: string
    timeout: number
  }
}

// Core Usage Types
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface UsageInfo {
  timestamp: number
  model: string
  tokens: TokenUsage
  cost: number
}

export type FinishReason = 
  | 'stop' 
  | 'length'
  | 'content_filter'
  | 'tool_calls'
  | 'function_call'

// Core Validation Types
export interface ValidationResult {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
}

// Core Event Types
export interface Event<T = unknown> {
  type: string
  payload: T
  timestamp: number
  source?: string
} 