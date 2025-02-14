import { ChatOperations } from '../../../lib/redis/chat'
import { getRedisClient } from '../../../lib/redis/config'
import { Message, MessageType } from '../../../lib/types/chat'

jest.mock('../../../lib/redis/config')

describe('ChatOperations', () => {
  const mockRedis = {
    hmset: jest.fn(),
    zadd: jest.fn(),
    zrange: jest.fn(),
    hgetall: jest.fn(),
    del: jest.fn(),
    zrem: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getRedisClient as jest.Mock).mockResolvedValue(mockRedis)
  })

  describe('createChat', () => {
    it('should create a new chat successfully', async () => {
      const title = 'Test Chat'
      mockRedis.hmset.mockResolvedValue(1)

      const result = await ChatOperations.createChat(title)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.title).toBe(title)
      expect(mockRedis.hmset).toHaveBeenCalled()
    })

    it('should handle errors when creating chat', async () => {
      const title = 'Test Chat'
      mockRedis.hmset.mockRejectedValue(new Error('Redis error'))

      const result = await ChatOperations.createChat(title)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('storeMessage', () => {
    const mockMessage: Message = {
      id: '123',
      chatId: '456',
      role: 'user',
      type: MessageType.TEXT,
      content: 'Hello',
      createdAt: new Date().toISOString()
    }

    it('should store a message successfully', async () => {
      mockRedis.hgetall.mockResolvedValue({ messageCount: 0 })
      mockRedis.hmset.mockResolvedValue(1)
      mockRedis.zadd.mockResolvedValue(1)

      const result = await ChatOperations.storeMessage(mockMessage)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockMessage)
      expect(mockRedis.hmset).toHaveBeenCalled()
      expect(mockRedis.zadd).toHaveBeenCalled()
    })

    it('should handle errors when storing message', async () => {
      mockRedis.hmset.mockRejectedValue(new Error('Redis error'))

      const result = await ChatOperations.storeMessage(mockMessage)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getChatMessages', () => {
    it('should retrieve messages successfully', async () => {
      const messageIds = ['1', '2']
      const messages = [
        { id: '1', content: 'Hello' },
        { id: '2', content: 'World' }
      ]

      mockRedis.zrange.mockResolvedValue(messageIds)
      mockRedis.hgetall.mockImplementation((key) => {
        const id = key.split(':').pop()
        return Promise.resolve(messages.find(m => m.id === id))
      })

      const result = await ChatOperations.getChatMessages('123')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(mockRedis.zrange).toHaveBeenCalled()
      expect(mockRedis.hgetall).toHaveBeenCalledTimes(2)
    })

    it('should handle empty message list', async () => {
      mockRedis.zrange.mockResolvedValue([])

      const result = await ChatOperations.getChatMessages('123')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('should handle errors when retrieving messages', async () => {
      mockRedis.zrange.mockRejectedValue(new Error('Redis error'))

      const result = await ChatOperations.getChatMessages('123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getMessageThread', () => {
    it('should retrieve thread messages successfully', async () => {
      const threadIds = ['parent:1', 'parent:2']
      const messages = [
        { id: '1', content: 'Reply 1' },
        { id: '2', content: 'Reply 2' }
      ]

      mockRedis.zrange.mockResolvedValue(threadIds)
      mockRedis.hgetall.mockImplementation((key) => {
        const id = key.split(':').pop()
        return Promise.resolve(messages.find(m => m.id === id))
      })

      const result = await ChatOperations.getMessageThread('123', 'parent')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(mockRedis.zrange).toHaveBeenCalled()
      expect(mockRedis.hgetall).toHaveBeenCalledTimes(2)
    })

    it('should handle empty thread', async () => {
      mockRedis.zrange.mockResolvedValue([])

      const result = await ChatOperations.getMessageThread('123', 'parent')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('should handle errors when retrieving thread', async () => {
      mockRedis.zrange.mockRejectedValue(new Error('Redis error'))

      const result = await ChatOperations.getMessageThread('123', 'parent')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
}) 