import { randomUUID } from 'crypto'
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

  private static validateDate(dateStr: string): string {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        return new Date().toISOString()
      }
      return date.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  private static serializeForRedis<T extends Record<string, any>>(data: T): Record<string, string> {
    const serialized: Record<string, string> = {}
    for (const [key, value] of Object.entries(data)) {
      if (key === 'createdAt' || key === 'updatedAt') {
        serialized[key] = this.validateDate(value)
        continue
      }
      if (value === undefined || value === null) {
        serialized[key] = ''
        continue
      }
      try {
        serialized[key] = typeof value === 'string' ? value : JSON.stringify(value)
      } catch {
        serialized[key] = ''
      }
    }
    return serialized
  }

  private static deserializeFromRedis<T extends Record<string, any>>(data: Record<string, string>): T {
    const deserialized: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (!value) {
        deserialized[key] = null
        continue
      }
      if (key === 'createdAt' || key === 'updatedAt') {
        deserialized[key] = this.validateDate(value)
        continue
      }
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
      const chatId = randomUUID()
      
      const chatInfo: ChatMetadata = {
        id: chatId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
        lastMessageId: '',
        status: 'active'
      }
      
      const result = await redis.hmset(
        this.formatKey(REDIS_KEY_PATTERNS.CHAT_INFO, { chatId }),
        this.serializeForRedis(chatInfo)
      )
      
      if (!result) {
        throw new Error('Failed to create chat')
      }
      
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
      const messageKey = this.formatKey(REDIS_KEY_PATTERNS.MESSAGE, { 
        chatId: message.chatId, 
        messageId: message.id 
      })
      
      const storeResult = await redis.hmset(
        messageKey,
        this.serializeForRedis(message)
      )
      
      if (!storeResult) {
        throw new Error('Failed to store message')
      }
      
      // Add to message index
      const indexResult = await redis.zadd(
        this.formatKey(REDIS_KEY_PATTERNS.CHAT_MESSAGES, { chatId: message.chatId }),
        new Date(message.createdAt).getTime(),
        message.id
      )
      
      if (!indexResult) {
        await redis.del(messageKey)
        throw new Error('Failed to index message')
      }
      
      // Update chat info
      const chatInfoKey = this.formatKey(REDIS_KEY_PATTERNS.CHAT_INFO, { chatId: message.chatId })
      const chatInfo = await redis.hgetall<Record<string, string>>(chatInfoKey)
      
      if (chatInfo) {
        const deserializedInfo = this.deserializeFromRedis<ChatMetadata>(chatInfo)
        const updateResult = await redis.hmset(
          chatInfoKey,
          this.serializeForRedis({
            messageCount: deserializedInfo.messageCount + 1,
            lastMessageId: message.id,
            updatedAt: new Date().toISOString()
          })
        )
        
        if (!updateResult) {
          console.warn('Failed to update chat info')
        }
      }
      
      // If message has a parent, update thread relationships
      if (message.parentMessageId) {
        const threadResult = await redis.zadd(
          this.formatKey(REDIS_KEY_PATTERNS.CHAT_THREADS, { chatId: message.chatId }),
          new Date(message.createdAt).getTime(),
          `${message.parentMessageId}:${message.id}`
        )
        
        if (!threadResult) {
          console.warn('Failed to update thread relationships')
        }
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