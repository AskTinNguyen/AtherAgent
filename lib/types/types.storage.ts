// Redis Key Patterns
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

// Redis TTL Values
export const REDIS_TTL = {
  /** Default TTL for chat data (30 days) */
  CHAT: 30 * 24 * 60 * 60,
  
  /** TTL for shared chats (7 days) */
  SHARED: 7 * 24 * 60 * 60,
  
  /** TTL for chat events (24 hours) */
  EVENTS: 24 * 60 * 60
} as const

// Redis Hash Fields
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

// Redis Score Multipliers
export const SCORE_MULTIPLIERS = {
  /** Base multiplier for chat scores */
  CHAT: 1,
  
  /** Multiplier for pinned chats */
  PINNED: 1000,
  
  /** Multiplier for shared chats */
  SHARED: 100
} as const

// Redis Operation Types
export interface RedisOperationResult<T> {
  success: boolean
  data?: T
  error?: Error
}

export interface RedisStorageOptions {
  ttl?: number
  transaction?: boolean
  prefix?: string
}

export type RedisKeyPattern = typeof REDIS_KEY_PATTERNS[keyof typeof REDIS_KEY_PATTERNS] 