import { ChatOperations } from '@/lib/redis/chat'
import { LocalRedisWrapper } from '@/lib/redis/types'
import { Message, MessageType } from '@/lib/types/chat'
import { randomUUID } from 'crypto'

jest.mock('@/lib/redis/config', () => ({
  getRedisClient: jest.fn()
}))

describe('Chat Operations Integration', () => {
  let mockRedisClient: jest.Mocked<LocalRedisWrapper>

  beforeEach(() => {
    mockRedisClient = {
      hgetall: jest.fn(),
      hmset: jest.fn(),
      zadd: jest.fn(),
      zrange: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      zrem: jest.fn(),
      multi: jest.fn()
    } as any

    const { getRedisClient } = require('@/lib/redis/config')
    getRedisClient.mockResolvedValue(mockRedisClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Chat Lifecycle', () => {
    it('should create a new chat successfully', async () => {
      const title = 'Test Chat'
      mockRedisClient.hmset.mockResolvedValue(1)

      const result = await ChatOperations.createChat(title)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.title).toBe(title)
      expect(result.data?.status).toBe('active')
      expect(result.data?.messageCount).toBe(0)
      expect(result.data?.lastMessageId).toBe('')
      expect(mockRedisClient.hmset).toHaveBeenCalledTimes(1)
    })

    it('should store a message in a chat', async () => {
      const chatId = randomUUID()
      const message: Message = {
        id: randomUUID(),
        chatId,
        content: 'Hello, World!',
        role: 'user',
        type: MessageType.TEXT,
        createdAt: new Date().toISOString(),
        metadata: {}
      }

      mockRedisClient.hmset.mockResolvedValue(1)
      mockRedisClient.zadd.mockResolvedValue(1)
      mockRedisClient.hgetall.mockResolvedValue({
        id: chatId,
        title: 'Test Chat',
        messageCount: '0',
        lastMessageId: '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const result = await ChatOperations.storeMessage(message)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(message)
      expect(mockRedisClient.hmset).toHaveBeenCalledTimes(2) // Message + Chat info update
      expect(mockRedisClient.zadd).toHaveBeenCalledTimes(1)
    })

    it('should retrieve chat messages in correct order', async () => {
      const chatId = randomUUID()
      const messages: Message[] = [
        {
          id: randomUUID(),
          chatId,
          content: 'Message 1',
          role: 'user',
          type: MessageType.TEXT,
          createdAt: new Date(Date.now() - 1000).toISOString(),
          metadata: {}
        },
        {
          id: randomUUID(),
          chatId,
          content: 'Message 2',
          role: 'assistant',
          type: MessageType.TEXT,
          createdAt: new Date().toISOString(),
          metadata: {}
        }
      ]

      mockRedisClient.zrange.mockResolvedValue(messages.map(m => m.id))
      mockRedisClient.hgetall
        .mockImplementation(async (key: string) => {
          const messageId = key.split(':').pop()
          const message = messages.find(m => m.id === messageId)
          return message ? {
            ...message,
            metadata: JSON.stringify(message.metadata)
          } : null
        })

      const result = await ChatOperations.getChatMessages(chatId)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0].content).toBe('Message 1')
      expect(result.data?.[1].content).toBe('Message 2')
    })

    it('should handle message threading correctly', async () => {
      const chatId = randomUUID()
      const parentMessage: Message = {
        id: randomUUID(),
        chatId,
        content: 'Parent Message',
        role: 'user',
        type: MessageType.TEXT,
        createdAt: new Date(Date.now() - 1000).toISOString(),
        metadata: {}
      }
      const replyMessage: Message = {
        id: randomUUID(),
        chatId,
        content: 'Reply Message',
        role: 'assistant',
        type: MessageType.TEXT,
        createdAt: new Date().toISOString(),
        parentMessageId: parentMessage.id,
        metadata: {}
      }

      mockRedisClient.hmset.mockResolvedValue(1)
      mockRedisClient.zadd.mockResolvedValue(1)
      mockRedisClient.hgetall.mockResolvedValue({
        id: chatId,
        title: 'Test Chat',
        messageCount: '1',
        lastMessageId: parentMessage.id,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const result = await ChatOperations.storeMessage(replyMessage)

      expect(result.success).toBe(true)
      expect(mockRedisClient.zadd).toHaveBeenCalledTimes(2) // Message index + Thread index
      expect(mockRedisClient.zadd).toHaveBeenCalledWith(
        expect.stringContaining('threads'),
        expect.any(Number),
        `${parentMessage.id}:${replyMessage.id}`
      )
    })
  })
}) 