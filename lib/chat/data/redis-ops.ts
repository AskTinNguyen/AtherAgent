import { ChatOperations, MessageOperations } from '@/lib/redis/chat'
import { getRedisClient } from '@/lib/redis/config'
import { ChatMetadata, Message } from '@/lib/types/types.chat'
import { RedisWrapper } from '@/lib/types/types.redis'
import { ChatError, ChatErrorType } from '../types'
import { getCurrentTimestamp } from '../utils/date-helpers'
import {
  getChatKey,
  getChatMessagesKey,
  getChatMetadataKey,
  getChatRelatedKeys,
  getUserChatsKey
} from '../utils/key-management'

/**
 * Redis operation options
 */
export interface RedisOpOptions {
  /** Transaction options */
  transaction?: boolean
  
  /** TTL in seconds */
  ttl?: number
}

export async function withRedisClient<T>(
  operation: (redis: RedisWrapper) => Promise<T>
): Promise<T> {
  const redis = await getRedisClient()
  return operation(redis)
}

/**
 * Base Redis operations class
 */
export class RedisOperations {
  private redis: RedisWrapper

  constructor(redis?: RedisWrapper) {
    if (redis) {
      this.redis = redis
    } else {
      throw new Error('Redis client is required')
    }
  }

  /**
   * Creates a new instance of RedisOperations
   */
  static async create(): Promise<RedisOperations> {
    const client = await getRedisClient()
    return new RedisOperations(client)
  }

  /**
   * Saves chat data to Redis
   */
  async saveChat(
    chatId: string,
    data: Record<string, any>,
    options: RedisOpOptions = {}
  ): Promise<boolean> {
    const chatKey = getChatKey(chatId)
    
    try {
      if (options.transaction) {
        const multi = this.redis.multi()
        
        // Save chat data
        multi.hmset(chatKey, {
          ...data,
          updatedAt: getCurrentTimestamp()
        })
        
        const result = await multi.exec()
        if (!result || result.some(r => r.err)) {
          throw new Error('Transaction failed')
        }
      } else {
        const result = await this.redis.hmset(chatKey, {
          ...data,
          updatedAt: getCurrentTimestamp()
        })
        
        if (!result) {
          throw new Error('Failed to save chat data')
        }
      }
      
      return true
    } catch (error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to save chat data',
        error
      )
    }
  }

  /**
   * Gets chat data from Redis
   */
  async getChat(chatId: string): Promise<Record<string, any> | null> {
    try {
      const data = await this.redis.hgetall(getChatKey(chatId))
      return data
    } catch (error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to get chat data',
        error
      )
    }
  }

  /**
   * Saves chat messages to Redis
   * Note: This implementation uses sorted sets instead of lists since RedisWrapper
   * doesn't provide list operations
   */
  async saveChatMessages(
    chatId: string,
    messages: Message[],
    options: RedisOpOptions = {}
  ): Promise<boolean> {
    const messagesKey = getChatMessagesKey(chatId)
    
    try {
      if (options.transaction) {
        const multi = this.redis.multi()
        
        // Use message index as score to maintain exact order
        messages.forEach((message, index) => {
          multi.zadd(messagesKey, index, JSON.stringify(message))
        })
        
        const result = await multi.exec()
        if (!result || result.some(r => r.err)) {
          throw new Error(
            result?.find(r => r.err)?.err?.message || 'Transaction failed'
          )
        }
      } else {
        // Add messages with index as score
        for (let i = 0; i < messages.length; i++) {
          const result = await this.redis.zadd(messagesKey, i, JSON.stringify(messages[i]))
          if (!result) {
            throw new Error('Failed to save message')
          }
        }
      }
      
      return true
    } catch (error) {
      if (error instanceof Error) {
        throw new ChatError(
          ChatErrorType.REDIS_ERROR,
          error.message || 'Failed to save chat messages',
          error
        )
      }
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to save chat messages',
        error
      )
    }
  }

  /**
   * Gets chat messages from Redis
   */
  async getChatMessages(
    chatId: string,
    start: number = 0,
    end: number = -1
  ): Promise<Message[]> {
    try {
      const messages = await this.redis.zrange(getChatMessagesKey(chatId), start, end)
      return messages.map((m: string) => JSON.parse(m))
    } catch (error) {
      if (error instanceof Error) {
        throw new ChatError(
          ChatErrorType.REDIS_ERROR,
          error.message || 'Failed to get chat messages',
          error
        )
      }
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to get chat messages',
        error
      )
    }
  }

  /**
   * Clears chat messages from Redis
   */
  async clearChatMessages(chatId: string): Promise<boolean> {
    try {
      await this.redis.del(getChatMessagesKey(chatId))
      return true
    } catch (error) {
      if (error instanceof Error) {
        throw new ChatError(
          ChatErrorType.REDIS_ERROR,
          error.message || 'Failed to clear chat messages',
          error
        )
      }
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to clear chat messages',
        error
      )
    }
  }

  /**
   * Saves chat metadata to Redis
   */
  async saveChatMetadata(
    chatId: string,
    metadata: Record<string, any>,
    options: RedisOpOptions = {}
  ): Promise<boolean> {
    const metadataKey = getChatMetadataKey(chatId)
    
    try {
      const result = await this.redis.hmset(metadataKey, {
        ...metadata,
        updatedAt: getCurrentTimestamp()
      })
      
      if (!result) {
        throw new Error('Failed to save metadata')
      }
      
      return true
    } catch (error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to save chat metadata',
        error
      )
    }
  }

  /**
   * Gets chat metadata from Redis
   */
  async getChatMetadata(chatId: string): Promise<Record<string, any> | null> {
    try {
      return await this.redis.hgetall(getChatMetadataKey(chatId))
    } catch (error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to get chat metadata',
        error
      )
    }
  }

  /**
   * Adds chat to user's chat list
   */
  async addChatToUserList(
    userId: string,
    chatId: string,
    score: number
  ): Promise<boolean> {
    try {
      const result = await this.redis.zadd(getUserChatsKey(userId), score, getChatKey(chatId))
      if (!result) {
        throw new Error('Failed to add chat to user list')
      }
      return true
    } catch (error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to add chat to user list',
        error
      )
    }
  }

  /**
   * Gets user's chat list from Redis
   */
  async getUserChats(
    userId: string,
    start: number = 0,
    end: number = -1
  ): Promise<string[]> {
    try {
      return await this.redis.zrange(getUserChatsKey(userId), start, end)
    } catch (error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to get user chats',
        error
      )
    }
  }

  /**
   * Deletes a chat and all related data
   */
  async deleteChat(chatId: string, userId?: string): Promise<boolean> {
    const keys = getChatRelatedKeys(chatId)
    
    try {
      const multi = this.redis.multi()
      
      // Delete all chat related keys
      for (const key of keys) {
        await this.redis.del(key)
      }
      
      // Remove from user's chat list if userId provided
      if (userId) {
        await this.redis.zrem(getUserChatsKey(userId), getChatKey(chatId))
      }
      
      return true
    } catch (error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to delete chat',
        error
      )
    }
  }
}

// Chat Data Operations
export async function saveChatData(
  redis: RedisWrapper,
  chatId: string,
  data: Partial<ChatMetadata>,
  options: RedisOpOptions = {}
): Promise<boolean> {
  const result = await ChatOperations.updateChat(chatId, data, options)
  return result.success
}

export async function getChatData(
  redis: RedisWrapper,
  chatId: string
): Promise<ChatMetadata | null> {
  const result = await ChatOperations.getChatInfo(chatId)
  return result.success && result.data ? result.data : null
}

// Chat Messages Operations
export async function saveChatMessages(
  redis: RedisWrapper,
  chatId: string,
  messages: Message[],
  options: RedisOpOptions = {}
): Promise<boolean> {
  const result = await MessageOperations.saveMessages(chatId, messages, options)
  return result.success
}

export async function getChatMessages(
  redis: RedisWrapper,
  chatId: string,
  start: number = 0,
  end: number = -1
): Promise<Message[]> {
  const result = await MessageOperations.getMessages(chatId, { start, end })
  return result.success ? result.data : []
}

export async function clearChatMessages(
  redis: RedisWrapper,
  chatId: string
): Promise<boolean> {
  const result = await MessageOperations.clearMessages(chatId)
  return result.success
}

// User Chat Operations
export async function addChatToUserList(
  redis: RedisWrapper,
  userId: string,
  chatId: string,
  score: number
): Promise<boolean> {
  const result = await ChatOperations.addChatToUserList(userId, chatId, score)
  return result.success
}

export async function getUserChats(
  redis: RedisWrapper,
  userId: string,
  start: number = 0,
  end: number = -1
): Promise<string[]> {
  const result = await ChatOperations.getUserChats(userId, { start, end })
  return result.success ? result.data : []
}

export async function deleteChat(
  redis: RedisWrapper,
  chatId: string,
  userId?: string
): Promise<boolean> {
  const deleteResult = await ChatOperations.deleteChat(chatId)
  if (!deleteResult.success) return false

  if (userId) {
    const removeResult = await ChatOperations.removeChatFromUserList(userId, chatId)
    if (!removeResult.success) {
      console.warn('Failed to remove chat from user list:', removeResult.error)
    }
  }

  const clearResult = await MessageOperations.clearMessages(chatId)
  if (!clearResult.success) {
    console.warn('Failed to clear chat messages:', clearResult.error)
  }

  return true
} 