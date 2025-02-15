import { REDIS_KEY_PATTERNS, REDIS_TTL } from '../../types/chat'

/**
 * Key generation options
 */
interface KeyOptions {
  /** User ID for user-specific keys */
  userId?: string
  
  /** Chat ID for chat-specific keys */
  chatId?: string
  
  /** Whether to include version in key */
  includeVersion?: boolean
}

/**
 * Generates Redis key with proper versioning and formatting
 */
export function generateKey(pattern: string, options: KeyOptions = {}): string {
  let key = pattern

  if (options.userId) {
    key = key.replace('{userId}', options.userId)
  }

  if (options.chatId) {
    key = key.replace('{chatId}', options.chatId)
  }

  return key
}

/**
 * Gets user's chat list key
 */
export function getUserChatsKey(userId: string): string {
  return generateKey(REDIS_KEY_PATTERNS.USER_CHATS, { userId })
}

/**
 * Gets chat data key
 */
export function getChatKey(chatId: string): string {
  return generateKey(REDIS_KEY_PATTERNS.CHAT, { chatId })
}

/**
 * Gets chat messages key
 */
export function getChatMessagesKey(chatId: string): string {
  return generateKey(REDIS_KEY_PATTERNS.CHAT_MESSAGES, { chatId })
}

/**
 * Gets chat metadata key
 */
export function getChatMetadataKey(chatId: string): string {
  return generateKey(REDIS_KEY_PATTERNS.CHAT_METADATA, { chatId })
}

/**
 * Gets chat events key
 */
export function getChatEventsKey(chatId: string): string {
  return generateKey(REDIS_KEY_PATTERNS.CHAT_EVENTS, { chatId })
}

/**
 * Gets all related keys for a chat
 */
export function getChatRelatedKeys(chatId: string): string[] {
  return [
    getChatKey(chatId),
    getChatMessagesKey(chatId),
    getChatMetadataKey(chatId),
    getChatEventsKey(chatId)
  ]
}

/**
 * Gets expiration date for a chat
 */
export function getChatExpiration(type: keyof typeof REDIS_TTL = 'CHAT'): string {
  const date = new Date()
  date.setSeconds(date.getSeconds() + REDIS_TTL[type])
  return date.toISOString()
}

/**
 * Extracts chat ID from a Redis key
 */
export function extractChatId(key: string): string | null {
  const match = key.match(/chat:([^:]+)/)
  return match ? match[1] : null
}

/**
 * Extracts user ID from a Redis key
 */
export function extractUserId(key: string): string | null {
  const match = key.match(/user:[^:]+:chat:([^:]+)/)
  return match ? match[1] : null
}

/**
 * Validates a Redis key format
 */
export function isValidKeyFormat(key: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/{([^}]+)}/g, '[^:]+')
  return new RegExp(`^${regexPattern}$`).test(key)
}

/**
 * Checks if a key belongs to a specific pattern
 */
export function matchesKeyPattern(key: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/{([^}]+)}/g, '([^:]+)')
  return new RegExp(`^${regexPattern}$`).test(key)
} 