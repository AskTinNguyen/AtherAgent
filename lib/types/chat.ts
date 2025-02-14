export enum MessageType {
  TEXT = 'text',
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  RESEARCH = 'research',
  SYSTEM = 'system'
}

export interface ChatMetadata extends Record<string, unknown> {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessageId: string
  status: 'active' | 'archived' | 'deleted'
}

export interface MessageToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

export interface MessageToolResult {
  callId: string
  result: string
}

export interface MessageResearchData {
  depth: number
  sources: string[]
  confidence: number
}

export interface MessageMetadata {
  toolCalls?: MessageToolCall[]
  toolResults?: MessageToolResult[]
  researchData?: MessageResearchData
}

export interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  type: MessageType
  content: string
  metadata?: MessageMetadata
  createdAt: string
  parentMessageId?: string
}

// Redis key pattern types
export const REDIS_KEY_PATTERNS = {
  CHAT_INFO: 'chat:{chatId}:info',
  CHAT_MESSAGES: 'chat:{chatId}:messages',
  MESSAGE: 'message:{chatId}:{messageId}',
  CHAT_THREADS: 'chat:{chatId}:threads'
} as const

export type RedisKeyPattern = typeof REDIS_KEY_PATTERNS[keyof typeof REDIS_KEY_PATTERNS]

// Helper type for Redis operations
export interface ChatOperationResult<T> {
  success: boolean
  data?: T
  error?: string
} 