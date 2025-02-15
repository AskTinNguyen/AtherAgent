import { ChatError, ChatErrorType } from '../../chat/types'
import { ChatOperationResult, Message, MessageType, SaveChatOptions } from '../../types/chat'
import { getRedisClient } from '../config'

export class MessageOperations {
  private static formatMessagesKey(chatId: string): string {
    return `chat:${chatId}:messages`
  }

  private static validateMessage(message: Message): Message {
    return {
      ...message,
      type: message.type || MessageType.TEXT,
      createdAt: message.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  static async saveMessages(
    chatId: string,
    messages: Message[],
    options: SaveChatOptions = {}
  ): Promise<ChatOperationResult<boolean>> {
    const redis = await getRedisClient()
    const messagesKey = this.formatMessagesKey(chatId)

    try {
      if (options.transaction) {
        const multi = redis.multi()
        messages.forEach((message, index) => {
          const validatedMessage = this.validateMessage(message)
          multi.zadd(messagesKey, index, JSON.stringify(validatedMessage))
        })

        const result = await multi.exec()
        if (!result || result.some(r => r.err)) {
          throw new Error(result?.find(r => r.err)?.err?.message || 'Transaction failed')
        }
      } else {
        for (let i = 0; i < messages.length; i++) {
          const validatedMessage = this.validateMessage(messages[i])
          const result = await redis.zadd(messagesKey, i, JSON.stringify(validatedMessage))
          if (!result) {
            throw new Error('Failed to save message')
          }
        }
      }

      if (options.ttl) {
        await redis.expire(messagesKey, options.ttl)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to save chat messages',
          error
        )
      }
    }
  }

  static async getMessages(
    chatId: string,
    options: {
      start?: number
      end?: number
      reverse?: boolean
    } = {}
  ): Promise<ChatOperationResult<Message[]>> {
    const redis = await getRedisClient()
    const messagesKey = this.formatMessagesKey(chatId)
    const { start = 0, end = -1, reverse = false } = options

    try {
      const messageStrings = reverse
        ? await redis.zrevrange(messagesKey, start, end)
        : await redis.zrange(messagesKey, start, end)

      const messages = messageStrings.map(str => JSON.parse(str) as Message)
      return { success: true, data: messages }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to get chat messages',
          error
        )
      }
    }
  }

  static async clearMessages(chatId: string): Promise<ChatOperationResult<boolean>> {
    const redis = await getRedisClient()
    const messagesKey = this.formatMessagesKey(chatId)

    try {
      await redis.del(messagesKey)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: new ChatError(
          ChatErrorType.REDIS_ERROR,
          error instanceof Error ? error.message : 'Failed to clear chat messages',
          error
        )
      }
    }
  }
} 