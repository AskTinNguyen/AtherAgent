import { Message, MessageType } from '../../types/chat'
import { ChatOperations } from '../chat'
import { getRedisClient } from '../config'

export class ChatMigration {
  private static parseMessages(messagesStr: string | Array<any>): Message[] {
    if (!messagesStr) return []
    
    if (Array.isArray(messagesStr)) {
      return messagesStr
        .filter(msg => msg && typeof msg === 'object')
        .map((msg, index) => this.convertMessage(msg, index))
    }
    
    try {
      const parsedMessages = JSON.parse(messagesStr)
      if (Array.isArray(parsedMessages)) {
        return parsedMessages
          .filter(msg => msg && typeof msg === 'object')
          .map((msg, index) => this.convertMessage(msg, index))
      }
      return []
    } catch (error) {
      console.error('Failed to parse messages:', error)
      return []
    }
  }

  private static convertMessage(msg: any, index: number): Message {
    if (!msg || typeof msg !== 'object') {
      console.warn('Invalid message format, creating placeholder message')
      msg = {}
    }

    const now = new Date()
    const timestamp = new Date(now.getTime() - (index * 1000)).toISOString()
    
    // Validate and sanitize message content
    const content = typeof msg.content === 'string' ? msg.content : ''
    const role = ['user', 'assistant', 'system'].includes(msg.role) ? msg.role : 'user'
    const type = Object.values(MessageType).includes(msg.type as MessageType) ? msg.type : MessageType.TEXT
    
    return {
      id: msg.id || crypto.randomUUID(),
      chatId: msg.chatId || '',
      role,
      type,
      content,
      metadata: msg.metadata && typeof msg.metadata === 'object' ? msg.metadata : undefined,
      createdAt: msg.createdAt || timestamp,
      parentMessageId: msg.parentMessageId || undefined
    }
  }

  private static deserializeRedisHash<T extends Record<string, any>>(data: Record<string, string>): T {
    const deserialized: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      try {
        deserialized[key] = JSON.parse(value)
      } catch {
        // If parsing fails, keep the original string value
        deserialized[key] = value
      }
    }
    return deserialized as T
  }

  private static async validateChat(chatId: string): Promise<boolean> {
    const redis = await getRedisClient()
    try {
      // Check if chat exists
      const exists = await redis.keys(`chat:${chatId}`)
      if (!exists.length) {
        console.warn(`Chat ${chatId} does not exist`)
        return false
      }

      // Check if chat has valid data
      const chatData = await redis.hgetall<Record<string, string>>(`chat:${chatId}`)
      if (!chatData || !Object.keys(chatData).length) {
        console.warn(`Chat ${chatId} has no data`)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error validating chat ${chatId}:`, error)
      return false
    }
  }

  static async migrateChat(chatId: string): Promise<boolean> {
    const redis = await getRedisClient()
    
    try {
      // Validate chat before migration
      const isValid = await this.validateChat(chatId)
      if (!isValid) {
        console.warn(`Skipping invalid chat ${chatId}`)
        return false
      }

      // Get old chat data
      const oldChatKey = `chat:${chatId}`
      const oldChatData = await redis.hgetall<Record<string, string>>(oldChatKey)
      
      if (!oldChatData || !Object.keys(oldChatData).length) {
        console.error(`No data found for chat ${chatId}`)
        return false
      }

      const oldChat = this.deserializeRedisHash<{
        title: string
        messages: string | any[]
        createdAt: string
        updatedAt: string
      }>(oldChatData)

      // Create new chat structure
      const createResult = await ChatOperations.createChat(oldChat.title || 'Untitled Chat')
      if (!createResult.success) {
        throw new Error('Failed to create new chat structure')
      }

      // Migrate messages
      const messages = this.parseMessages(oldChat.messages || [])
      if (!messages.length) {
        console.warn(`No valid messages found for chat ${chatId}`)
        return true
      }

      // Store messages in new structure
      let migratedCount = 0
      for (const msg of messages) {
        try {
          const storeResult = await ChatOperations.storeMessage({
            ...msg,
            chatId: createResult.data!.id
          })
          if (storeResult.success) {
            migratedCount++
          } else {
            console.error(`Failed to migrate message ${msg.id} in chat ${chatId}:`, storeResult.error)
          }
        } catch (error) {
          console.error(`Error migrating message ${msg.id} in chat ${chatId}:`, error)
        }
      }

      // Verify migration with partial success allowed
      if (migratedCount === 0) {
        console.error(`Failed to migrate any messages for chat ${chatId}`)
        return false
      }

      console.log(`Successfully migrated ${migratedCount}/${messages.length} messages for chat ${chatId}`)
      return true
    } catch (error) {
      console.error(`Failed to migrate chat ${chatId}:`, error)
      return false
    }
  }

  static async migrate(): Promise<{
    total: number
    success: number
    failed: number
    skipped: number
  }> {
    const redis = await getRedisClient()
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    }

    try {
      // Get all chat IDs
      const chatKeys = await redis.keys('chat:*')
      results.total = chatKeys.length

      console.log(`Found ${results.total} chats to migrate`)

      // Migrate each chat
      for (const chatKey of chatKeys) {
        const chatId = chatKey.replace('chat:', '')
        
        // Validate chat before migration
        const isValid = await this.validateChat(chatId)
        if (!isValid) {
          console.warn(`Skipping invalid chat ${chatId}`)
          results.skipped++
          continue
        }

        const success = await this.migrateChat(chatId)
        if (success) {
          results.success++
          console.log(`Successfully migrated chat ${chatId}`)
        } else {
          results.failed++
          console.error(`Failed to migrate chat ${chatId}`)
        }
      }

      return results
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }
} 