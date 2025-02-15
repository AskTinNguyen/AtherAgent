// Model Core Types
export interface Model {
  id: string
  name: string
  provider: string
  providerId: string
}

export type ModelProvider = 'anthropic' | 'azure' | 'fireworks' | 'deepseek' | 'google' | 'groq' | 'ollama' | 'openai' | 'openai-compatible'

// Model Configuration
export interface ModelConfig {
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
}

// Model Capabilities
export interface ModelCapabilities {
  supportsStreaming: boolean
  supportsImages: boolean
  supportsVision: boolean
  supportsToolCalls: boolean
  maxContextLength: number
}

// Model Token Handling
export interface ModelTokenCounter {
  countPromptTokens: (prompt: string) => number
  countCompletionTokens: (completion: string) => number
  validateTokenCount: (count: number) => boolean
}

// Model Usage Statistics
export interface ModelUsage {
  model: string
  totalUsage: TokenUsage
  usageHistory: ModelUsageInfo[]
}

// Import this from types.core to avoid circular dependencies
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ModelUsageInfo {
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error'
  usage: TokenUsage
  timestamp: number
  model: string
  chatId: string
} 