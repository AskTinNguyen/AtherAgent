import { Message, MessageType } from '@/lib/types/types.chat'
import { LocalRedisWrapper } from '@/lib/types/types.redis'
import { createClient } from 'redis'
import { RedisOperations } from '../../data/redis-ops'
import { getCurrentTimestamp } from '../../utils/date-helpers'

describe('Redis Operations Integration Tests', () => {
  let redisClient: LocalRedisWrapper
  let redisOps: RedisOperations

  beforeAll(async () => {
    // Create a real Redis client for integration tests with recommended configuration
    const client = createClient({
      url: process.env.TEST_REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 10000,
        keepAlive: 5000,
        noDelay: true,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            return new Error('Redis connection failed after 10 retries')
          }
          return Math.min(retries * 100, 3000)
        }
      },
      pingInterval: 1000
    })

    // Handle Redis errors
    client.on('error', (err) => console.error('Redis Client Error:', err))
    client.on('connect', () => console.log('Redis Client Connected'))
    client.on('ready', () => console.log('Redis Client Ready'))
    client.on('reconnecting', () => console.log('Redis Client Reconnecting'))

    try {
      await client.connect()
      redisClient = new LocalRedisWrapper(client)
      redisOps = new RedisOperations(redisClient)
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  })

  afterAll(async () => {
    // Clean up Redis connection
    if (redisClient instanceof LocalRedisWrapper) {
      const client = (redisClient as any)['client']
      if (client && typeof client.quit === 'function') {
        try {
          await client.disconnect()
          await client.quit()
        } catch (error) {
          console.error('Error closing Redis connection:', error)
        }
      }
    }
  })

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      const keys = await redisClient.keys('test:*')
      if (keys.length > 0) {
        await redisClient.del(...keys)
      }
    } catch (error) {
      console.error('Error cleaning test data:', error)
      throw error
    }
  })

  describe('Data Persistence', () => {
    it('should successfully save and retrieve chat data', async () => {
      const chatId = 'test:chat:1'
      const chatData = {
        title: 'Test Chat',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        status: 'active'
      }

      // Test saving data
      const saveResult = await redisOps.saveChat(chatId, chatData)
      expect(saveResult).toBe(true)

      // Test retrieving data
      const retrievedData = await redisOps.getChat(chatId)
      expect(retrievedData).toEqual(expect.objectContaining(chatData))
    })

    it('should successfully save and retrieve chat messages', async () => {
      const chatId = 'test:chat:1'
      const messages: Message[] = [
        {
          id: 'msg1',
          chatId,
          content: 'Test message 1',
          role: 'user',
          type: MessageType.TEXT,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp()
        },
        {
          id: 'msg2',
          chatId,
          content: 'Test message 2',
          role: 'assistant',
          type: MessageType.TEXT,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp()
        }
      ]

      // Test saving messages
      const saveResult = await redisOps.saveChatMessages(chatId, messages)
      expect(saveResult).toBe(true)

      // Test retrieving messages
      const retrievedMessages = await redisOps.getChatMessages(chatId)
      expect(retrievedMessages).toHaveLength(messages.length)
      expect(retrievedMessages).toEqual(
        expect.arrayContaining(
          messages.map(msg => expect.objectContaining(msg))
        )
      )
    })

    it('should handle non-existent chat data', async () => {
      const nonExistentChatId = 'test:chat:nonexistent'
      const data = await redisOps.getChat(nonExistentChatId)
      expect(data).toBeNull()
    })
  })

  describe('Transaction Support', () => {
    it('should handle atomic operations in transactions', async () => {
      const chatId = 'test:chat:1'
      const chatData = {
        title: 'Test Chat',
        createdAt: getCurrentTimestamp(),
        status: 'active'
      }

      // Test transaction with multiple operations
      const saveResult = await redisOps.saveChat(chatId, chatData, { transaction: true })
      expect(saveResult).toBe(true)

      // Clear any existing messages
      await redisOps.clearChatMessages(chatId)

      const messages: Message[] = [
        {
          id: 'msg1',
          chatId,
          content: 'Test message 1',
          role: 'user',
          type: MessageType.TEXT,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp()
        }
      ]

      const messageResult = await redisOps.saveChatMessages(chatId, messages, { transaction: true })
      expect(messageResult).toBe(true)

      // Verify both operations succeeded
      const retrievedData = await redisOps.getChat(chatId)
      expect(retrievedData).toEqual(expect.objectContaining(chatData))

      const retrievedMessages = await redisOps.getChatMessages(chatId)
      expect(retrievedMessages).toHaveLength(messages.length)
      expect(retrievedMessages[0]).toEqual(expect.objectContaining(messages[0]))
    })

    it('should rollback transaction on failure', async () => {
      const chatId = 'test:chat:1'
      
      // Clear any existing messages
      await redisOps.clearChatMessages(chatId)
      
      // Mock a failure in the transaction
      jest.spyOn(redisClient, 'multi').mockImplementationOnce(() => ({
        hmset: () => { throw new Error('Transaction failed') },
        exec: async () => [{ err: new Error('Transaction failed'), result: null }]
      } as any))

      // Attempt to save chat data in a transaction
      await expect(
        redisOps.saveChat(chatId, { title: 'Test' }, { transaction: true })
      ).rejects.toThrow('Transaction failed')

      // Verify no data was saved
      const data = await redisOps.getChat(chatId)
      expect(data).toBeNull()
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous operations', async () => {
      const chatId = 'test:chat:concurrent'
      const operations = Array.from({ length: 5 }, (_, i) => ({
        title: `Test Chat ${i}`,
        createdAt: getCurrentTimestamp(),
        status: 'active'
      }))

      // Clear any existing data
      await Promise.all(
        operations.map((_, i) => redisOps.clearChatMessages(`${chatId}:${i}`))
      )

      // Execute multiple operations concurrently
      const results = await Promise.all(
        operations.map((data, i) => 
          redisOps.saveChat(`${chatId}:${i}`, data)
        )
      )

      // Verify all operations succeeded
      expect(results.every(r => r === true)).toBe(true)

      // Verify data integrity
      const savedData = await Promise.all(
        operations.map((_, i) => 
          redisOps.getChat(`${chatId}:${i}`)
        )
      )

      expect(savedData.every(d => d !== null)).toBe(true)
      expect(savedData.map(d => d?.status)).toEqual(
        operations.map(() => 'active')
      )
    })

    it('should maintain data consistency under load', async () => {
      const chatId = 'test:chat:load'
      const initialData = {
        title: 'Load Test Chat',
        createdAt: getCurrentTimestamp(),
        status: 'active'
      }

      // Clear any existing data
      await redisOps.clearChatMessages(chatId)

      // Save initial data
      await redisOps.saveChat(chatId, initialData)

      // Simulate multiple concurrent updates
      const updates = Array.from({ length: 10 }, (_, i) => ({
        ...initialData,
        title: `Updated Title ${i}`
      }))

      await Promise.all(
        updates.map(data => redisOps.saveChat(chatId, data))
      )

      // Verify final state
      const finalData = await redisOps.getChat(chatId)
      expect(finalData).not.toBeNull()
      expect(finalData?.title).toMatch(/^Updated Title \d$/)
    })
  })

  describe('Key Pattern and Versioning', () => {
    it('should handle key patterns correctly', async () => {
      const patterns = [
        'test:chat:pattern:1',
        'test:chat:pattern:2',
        'test:msg:pattern:1'
      ]

      // Clear any existing data
      await Promise.all(
        patterns.map(pattern => redisOps.clearChatMessages(pattern))
      )

      // Save data with different patterns
      await Promise.all(
        patterns.map(pattern => 
          redisOps.saveChat(pattern, {
            title: `Pattern Test ${pattern}`,
            createdAt: getCurrentTimestamp(),
            status: 'active'
          })
        )
      )

      // Test pattern matching
      const chatKeys = await redisClient.keys('test:chat:pattern:*')
      expect(chatKeys).toHaveLength(2)

      const msgKeys = await redisClient.keys('test:msg:pattern:*')
      expect(msgKeys).toHaveLength(1)
    })

    it('should handle versioned keys', async () => {
      const baseKey = 'test:chat:version'
      const versions = ['v1', 'v2']

      // Save different versions
      await Promise.all(
        versions.map(version => 
          redisOps.saveChat(`${baseKey}:${version}`, {
            title: `Version ${version}`,
            createdAt: getCurrentTimestamp(),
            status: 'active'
          })
        )
      )

      // Verify version isolation
      const v1Data = await redisOps.getChat(`${baseKey}:v1`)
      const v2Data = await redisOps.getChat(`${baseKey}:v2`)

      expect(v1Data?.title).toBe('Version v1')
      expect(v2Data?.title).toBe('Version v2')
    })
  })

  describe('Performance Metrics', () => {
    it('should complete operations within acceptable time', async () => {
      const chatId = 'test:chat:perf'
      const data = {
        title: 'Performance Test',
        createdAt: getCurrentTimestamp(),
        status: 'active'
      }

      const startTime = process.hrtime()

      // Test write performance
      await redisOps.saveChat(chatId, data)

      // Test read performance
      await redisOps.getChat(chatId)

      const [seconds, nanoseconds] = process.hrtime(startTime)
      const totalMs = (seconds * 1000) + (nanoseconds / 1000000)

      // Operations should complete within 100ms
      expect(totalMs).toBeLessThan(100)
    })

    it('should handle batch operations efficiently', async () => {
      const batchSize = 50
      const chatIds = Array.from(
        { length: batchSize }, 
        (_, i) => `test:chat:batch:${i}`
      )

      const startTime = process.hrtime()

      // Batch write
      await Promise.all(
        chatIds.map(id => 
          redisOps.saveChat(id, {
            title: `Batch Test ${id}`,
            createdAt: getCurrentTimestamp(),
            status: 'active'
          })
        )
      )

      const [seconds, nanoseconds] = process.hrtime(startTime)
      const totalMs = (seconds * 1000) + (nanoseconds / 1000000)

      // Average time per operation
      const avgTimePerOp = totalMs / batchSize

      // Each operation should average under 10ms
      expect(avgTimePerOp).toBeLessThan(10)
    })
  })

  it('should save and retrieve messages', async () => {
    const userMessage: Message = {
      id: 'msg1',
      chatId: 'chat1',
      content: 'Hello',
      role: 'user',
      type: MessageType.TEXT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const assistantMessage: Message = {
      id: 'msg2',
      chatId: 'chat1',
      content: 'Hi there!',
      role: 'assistant',
      type: MessageType.TEXT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Test saving messages
    const saveResult = await redisOps.saveChatMessages('chat1', [userMessage, assistantMessage])
    expect(saveResult).toBe(true)

    // Test retrieving messages
    const retrievedMessages = await redisOps.getChatMessages('chat1')
    expect(retrievedMessages).toHaveLength(2)
    expect(retrievedMessages).toEqual(
      expect.arrayContaining(
        [expect.objectContaining(userMessage), expect.objectContaining(assistantMessage)]
      )
    )
  })

  it('should handle multiple chats', async () => {
    const message: Message = {
      id: 'msg1',
      chatId: 'chat1',
      content: 'Hello',
      role: 'user',
      type: MessageType.TEXT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Test saving message
    const saveResult = await redisOps.saveChatMessages('chat1', [message])
    expect(saveResult).toBe(true)

    // Test retrieving message
    const retrievedMessages = await redisOps.getChatMessages('chat1')
    expect(retrievedMessages).toHaveLength(1)
    expect(retrievedMessages[0]).toEqual(expect.objectContaining(message))
  })
}) 