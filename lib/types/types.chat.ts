import { Message as AIMessage } from 'ai'

// Chat Message Types
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
  description?: string
  settings?: Record<string, any>
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
  [key: string]: any
}

export interface Message {
  id: string
  chatId: string
  role: AIMessage['role']
  content: AIMessage['content']
  type: MessageType
  metadata?: MessageMetadata
  createdAt: string
  updatedAt: string
  parentMessageId?: string
}

// Redis key pattern types
export const REDIS_KEY_PATTERNS = {
  /** Pattern for user's chat list */
  USER_CHATS: 'user:v1:chat:{userId}',
  
  /** Pattern for chat data */
  CHAT: 'chat:{chatId}',
  
  /** Pattern for chat messages */
  CHAT_MESSAGES: 'chat:{chatId}:messages',
  
  /** Pattern for chat metadata */
  CHAT_METADATA: 'chat:{chatId}:metadata',
  
  /** Pattern for shared chats */
  SHARED_CHATS: 'shared:chats',
  
  /** Pattern for chat events */
  CHAT_EVENTS: 'chat:{chatId}:events',
  
  /** Pattern for message data */
  MESSAGE: 'message:{chatId}:{messageId}',
  
  /** Pattern for chat threads */
  CHAT_THREADS: 'chat:{chatId}:threads'
} as const

/**
 * Redis TTL values in seconds
 */
export const REDIS_TTL = {
  /** Default TTL for chat data (30 days) */
  CHAT: 30 * 24 * 60 * 60,
  
  /** TTL for shared chats (7 days) */
  SHARED: 7 * 24 * 60 * 60,
  
  /** TTL for chat events (24 hours) */
  EVENTS: 24 * 60 * 60
} as const

/**
 * Redis hash field names for chat data
 */
export const CHAT_HASH_FIELDS = {
  ID: 'id',
  TITLE: 'title',
  MESSAGES: 'messages',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  USER_ID: 'userId',
  SHARE_PATH: 'sharePath',
  METADATA: 'metadata',
  PARENT_ID: 'parentId'
} as const

/**
 * Redis sorted set score calculation
 */
export const SCORE_MULTIPLIERS = {
  /** Base multiplier for chat scores */
  CHAT: 1,
  
  /** Multiplier for pinned chats */
  PINNED: 1000,
  
  /** Multiplier for shared chats */
  SHARED: 100
} as const

// Chat Operation Types
export interface ChatOperationResult<T> {
  success: boolean
  data?: T
  error?: Error
}

export interface SaveChatOptions {
  transaction?: boolean
  ttl?: number
}

// Chat Instance Types
export interface Chat {
  id: string
  title: string
  path?: string
  createdAt: number
  updatedAt: number
  order: number
  lastMessage?: string
  messageCount?: number
  folderId?: string
}

export type RedisKeyPattern = typeof REDIS_KEY_PATTERNS[keyof typeof REDIS_KEY_PATTERNS] 