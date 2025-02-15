import { randomUUID } from 'crypto'
import { ChatError, ChatErrorType } from '../../chat/types'
import { ChatMetadata, ChatOperationResult, SaveChatOptions } from '../../types/chat'
import { getRedisClient } from '../config'

export class ChatOperations {
  private static formatChatKey(chatId: string): string {
    return `chat:${chatId}:metadata`
  }

  private static formatUserChatsKey(userId: string): string {
    return `user:${userId}:chats`
  }

  private static validateDate(dateStr?: string): string {
    if (!dateStr) return new Date().toISOString()
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
      try {
        deserialized[key] = JSON.parse(value)
      } catch {
        deserialized[key] = value
      }
    }
    return deserialized as T
  }

  static async createChat(title: string): Promise<ChatOperationResult<ChatMetadata>> {
    const redis = await getRedisClient()
    const chatId = randomUUID()
    const chatKey = this.formatChatKey(chatId)

    const chatData: ChatMetadata = {
      id: chatId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      lastMessageId: '',
      status: 'active'
    }

    try {
      const serializedData = this.serializeForRedis(chatData)
      await redis.hmset(chatKey, serializedData)
      return { success: true, data: chatData }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to create chat',
          error
        )
      }
    }
  }

  static async getChatInfo(chatId: string): Promise<ChatOperationResult<ChatMetadata>> {
    const redis = await getRedisClient()
    const chatKey = this.formatChatKey(chatId)

    try {
      const data = await redis.hgetall(chatKey)
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Chat not found')
      }

      const chatData = this.deserializeFromRedis<ChatMetadata>(data)
      return { success: true, data: chatData }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to get chat info',
          error
        )
      }
    }
  }

  static async updateChat(
    chatId: string,
    data: Partial<ChatMetadata>,
    options: SaveChatOptions = {}
  ): Promise<ChatOperationResult<ChatMetadata>> {
    const redis = await getRedisClient()
    const chatKey = this.formatChatKey(chatId)

    try {
      const currentData = await this.getChatInfo(chatId)
      if (!currentData.success || !currentData.data) {
        throw new Error('Chat not found')
      }

      const updatedData: ChatMetadata = {
        ...currentData.data,
        ...data,
        updatedAt: new Date().toISOString()
      }

      const serializedData = this.serializeForRedis(updatedData)

      if (options.transaction) {
        const multi = redis.multi()
        multi.hmset(chatKey, serializedData)
        if (options.ttl) {
          multi.expire(chatKey, options.ttl)
        }
        const result = await multi.exec()
        if (!result || result.some(r => r.err)) {
          throw new Error('Transaction failed')
        }
      } else {
        await redis.hmset(chatKey, serializedData)
        if (options.ttl) {
          await redis.expire(chatKey, options.ttl)
        }
      }

      return { success: true, data: updatedData }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to update chat',
          error
        )
      }
    }
  }

  static async deleteChat(chatId: string): Promise<ChatOperationResult<boolean>> {
    const redis = await getRedisClient()
    const chatKey = this.formatChatKey(chatId)

    try {
      await redis.del(chatKey)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to delete chat',
          error
        )
      }
    }
  }

  static async addChatToUserList(
    userId: string,
    chatId: string,
    score: number
  ): Promise<ChatOperationResult<boolean>> {
    const redis = await getRedisClient()
    const userChatsKey = this.formatUserChatsKey(userId)

    try {
      const result = await redis.zadd(userChatsKey, score, chatId)
      if (!result) {
        throw new Error('Failed to add chat to user list')
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to add chat to user list',
          error
        )
      }
    }
  }

  static async getUserChats(
    userId: string,
    options: {
      start?: number
      end?: number
      reverse?: boolean
    } = {}
  ): Promise<ChatOperationResult<string[]>> {
    const redis = await getRedisClient()
    const userChatsKey = this.formatUserChatsKey(userId)
    const { start = 0, end = -1, reverse = false } = options

    try {
      const chatIds = reverse
        ? await redis.zrevrange(userChatsKey, start, end)
        : await redis.zrange(userChatsKey, start, end)
      return { success: true, data: chatIds }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to get user chats',
          error
        )
      }
    }
  }

  static async removeChatFromUserList(
    userId: string,
    chatId: string
  ): Promise<ChatOperationResult<boolean>> {
    const redis = await getRedisClient()
    const userChatsKey = this.formatUserChatsKey(userId)

    try {
      await redis.zrem(userChatsKey, chatId)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to remove chat from user list',
          error
        )
      }
    }
  }
} 