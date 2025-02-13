import {
  ChatMetadata,
  ChatOperationResult,
  Message,
  REDIS_KEY_PATTERNS
} from '../types/chat'
import { getRedisClient } from './config'

export class ChatOperations {
  private static formatKey(pattern: string, params: Record<string, string>): string {
    let key = pattern
    Object.entries(params).forEach(([param, value]) => {
      key = key.replace(`{${param}}`, value)
    })
    return key
  }

  private static serializeForRedis<T extends Record<string, any>>(data: T): Record<string, string> {
    const serialized: Record<string, string> = {}
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = typeof value === 'string' ? value : JSON.stringify(value)
    }
    return serialized
  }

  private static deserializeFromRedis<T extends Record<string, any>>(data: Record<string, string>): T {
    const deserialized: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      try {
        deserialized[key] = JSON.parse(value)
      } catch {
        deserialized[key] = value
      }
    }
    return deserialized as T
  }

  static async createChat(title: string): Promise<ChatOperationResult<ChatMetadata>> {
    try {
      const redis = await getRedisClient()
      const chatId = crypto.randomUUID()
      
      const chatInfo: ChatMetadata = {
        id: chatId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
        lastMessageId: '',
        status: 'active'
      }
      
      await redis.hmset(
        this.formatKey(REDIS_KEY_PATTERNS.CHAT_INFO, { chatId }),
        this.serializeForRedis(chatInfo)
      )
      
      return {
        success: true,
        data: chatInfo
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  static async storeMessage(message: Message): Promise<ChatOperationResult<Message>> {
    try {
      const redis = await getRedisClient()
      
      // Store message data
      await redis.hmset(
        this.formatKey(REDIS_KEY_PATTERNS.MESSAGE, { 
          chatId: message.chatId, 
          messageId: message.id 
        }),
        this.serializeForRedis(message)
      )
      
      // Add to message index
      await redis.zadd(
        this.formatKey(REDIS_KEY_PATTERNS.CHAT_MESSAGES, { chatId: message.chatId }),
        new Date(message.createdAt).getTime(),
        message.id
      )
      
      // Update chat info
      const chatInfoKey = this.formatKey(REDIS_KEY_PATTERNS.CHAT_INFO, { chatId: message.chatId })
      const chatInfo = await redis.hgetall<Record<string, string>>(chatInfoKey)
      
      if (chatInfo) {
        const deserializedInfo = this.deserializeFromRedis<ChatMetadata>(chatInfo)
        await redis.hmset(
          chatInfoKey,
          this.serializeForRedis({
            messageCount: deserializedInfo.messageCount + 1,
            lastMessageId: message.id,
            updatedAt: new Date().toISOString()
          })
        )
      }
      
      // If message has a parent, update thread relationships
      if (message.parentMessageId) {
        await redis.zadd(
          this.formatKey(REDIS_KEY_PATTERNS.CHAT_THREADS, { chatId: message.chatId }),
          new Date(message.createdAt).getTime(),
          `${message.parentMessageId}:${message.id}`
        )
      }
      
      return {
        success: true,
        data: message
      }
    } catch (error) {
      console.error('Error storing message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  static async getChatMessages(
    chatId: string,
    options: {
      start?: number
      end?: number
      reverse?: boolean
    } = {}
  ): Promise<ChatOperationResult<Message[]>> {
    try {
      const redis = await getRedisClient()
      const messageIds = await redis.zrange(
        this.formatKey(REDIS_KEY_PATTERNS.CHAT_MESSAGES, { chatId }),
        options.start || 0,
        options.end || -1,
        { rev: options.reverse }
      )
      
      if (!messageIds.length) {
        return {
          success: true,
          data: []
        }
      }
      
      const messages: Message[] = []
      for (const id of messageIds) {
        const msg = await redis.hgetall<Record<string, string>>(
          this.formatKey(REDIS_KEY_PATTERNS.MESSAGE, { 
            chatId, 
            messageId: id 
          })
        )
        if (msg) {
          messages.push(this.deserializeFromRedis<Message>(msg))
        }
      }
      
      return {
        success: true,
        data: messages
      }
    } catch (error) {
      console.error('Error retrieving chat messages:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  static async getChatInfo(chatId: string): Promise<ChatOperationResult<ChatMetadata>> {
    try {
      const redis = await getRedisClient()
      const chatInfo = await redis.hgetall<Record<string, string>>(
        this.formatKey(REDIS_KEY_PATTERNS.CHAT_INFO, { chatId })
      )
      
      if (!chatInfo) {
        return {
          success: false,
          error: 'Chat not found'
        }
      }
      
      return {
        success: true,
        data: this.deserializeFromRedis<ChatMetadata>(chatInfo)
      }
    } catch (error) {
      console.error('Error retrieving chat info:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  static async getMessageThread(
    chatId: string,
    messageId: string
  ): Promise<ChatOperationResult<Message[]>> {
    try {
      const redis = await getRedisClient()
      const threadPattern = `${messageId}:*`
      
      const relatedIds = await redis.zrange(
        this.formatKey(REDIS_KEY_PATTERNS.CHAT_THREADS, { chatId }),
        0,
        -1
      )
      
      const threadIds = relatedIds
        .filter(id => id.startsWith(threadPattern))
        .map(id => id.split(':')[1])
      
      if (!threadIds.length) {
        return {
          success: true,
          data: []
        }
      }
      
      const messages: Message[] = []
      for (const id of threadIds) {
        const msg = await redis.hgetall<Record<string, string>>(
          this.formatKey(REDIS_KEY_PATTERNS.MESSAGE, { 
            chatId, 
            messageId: id 
          })
        )
        if (msg) {
          messages.push(this.deserializeFromRedis<Message>(msg))
        }
      }
      
      return {
        success: true,
        data: messages
      }
    } catch (error) {
      console.error('Error retrieving message thread:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
} 