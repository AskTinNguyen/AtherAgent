import { deleteChat, getChat, getChats, saveChat } from '@/lib/actions/chat'
import { getRedisClient } from '@/lib/redis/config'
import { Message } from '@/lib/types/chat'

// Mock Next.js functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

// Mock the Redis client
jest.mock('@/lib/redis/config')

describe('Chat Actions', () => {
  let mockRedisClient: jest.Mocked<any>

  beforeEach(() => {
    // Create a fresh mock for each test
    mockRedisClient = {
      multi: jest.fn(),
      hmset: jest.fn(),
      zadd: jest.fn(),
      hgetall: jest.fn(),
      zrange: jest.fn(),
      del: jest.fn(),
      zrem: jest.fn()
    }

    // Setup the mock implementation for multi
    const mockMulti = {
      hmset: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        { err: null, result: 1 },
        { err: null, result: 1 }
      ])
    }
    mockRedisClient.multi.mockReturnValue(mockMulti)

    // Setup the getRedisClient mock
    ;(getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('saveChat', () => {
    const mockChat = {
      id: 'test-chat-id',
      title: 'Test Chat',
      messages: [
        {
          role: 'user',
          content: 'Hello'
        },
        {
          role: 'assistant',
          content: 'Hi there!'
        }
      ] as Message[],
      createdAt: '2024-03-20T00:00:00.000Z'
    }

    it('should successfully save a chat', async () => {
      const result = await saveChat(mockChat, 'test-user')
      
      expect(result).toBe(true)
      expect(mockRedisClient.multi).toHaveBeenCalled()
      
      const multi = mockRedisClient.multi()
      expect(multi.hmset).toHaveBeenCalledTimes(4) // metadata, 2 messages, and backward compatibility
      expect(multi.zadd).toHaveBeenCalledTimes(3) // 2 messages + user's chat list
      expect(multi.exec).toHaveBeenCalled()
    })

    it('should throw an error when Redis operations fail', async () => {
      const mockMultiError = {
        hmset: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { err: new Error('Redis error'), result: null }
        ])
      }
      mockRedisClient.multi.mockReturnValue(mockMultiError)

      await expect(saveChat(mockChat, 'test-user'))
        .rejects
        .toThrow('Failed to save chat: One or more Redis operations failed during chat save')
    })
  })

  describe('getChat', () => {
    const mockChatData = {
      id: 'test-chat-id',
      title: 'Test Chat',
      messages: JSON.stringify([
        { role: 'user', content: 'Hello' }
      ]),
      createdAt: '2024-03-20T00:00:00.000Z'
    }

    it('should successfully retrieve a chat', async () => {
      mockRedisClient.hgetall.mockResolvedValue(mockChatData)

      const chat = await getChat('test-chat-id')
      
      expect(chat).toBeTruthy()
      expect(chat?.id).toBe('test-chat-id')
      expect(Array.isArray(chat?.messages)).toBe(true)
      expect(mockRedisClient.hgetall).toHaveBeenCalledWith('chat:test-chat-id')
    })

    it('should return null for non-existent chat', async () => {
      mockRedisClient.hgetall.mockResolvedValue(null)

      const chat = await getChat('non-existent-id')
      
      expect(chat).toBeNull()
      expect(mockRedisClient.hgetall).toHaveBeenCalledWith('chat:non-existent-id')
    })

    it('should handle invalid message JSON', async () => {
      mockRedisClient.hgetall.mockResolvedValue({
        ...mockChatData,
        messages: 'invalid-json'
      })

      const chat = await getChat('test-chat-id')
      
      expect(chat).toBeTruthy()
      expect(Array.isArray(chat?.messages)).toBe(true)
      expect(chat?.messages).toHaveLength(0)
    })
  })

  describe('getChats', () => {
    it('should return empty array for no user ID', async () => {
      const chats = await getChats(null)
      expect(chats).toEqual([])
      expect(mockRedisClient.zrange).not.toHaveBeenCalled()
    })

    it('should return empty array when no chats exist', async () => {
      mockRedisClient.zrange.mockResolvedValue([])

      const chats = await getChats('test-user')
      
      expect(chats).toEqual([])
      expect(mockRedisClient.zrange).toHaveBeenCalled()
    })

    it('should successfully retrieve multiple chats', async () => {
      mockRedisClient.zrange.mockResolvedValue(['chat:1', 'chat:2'])
      mockRedisClient.hgetall
        .mockResolvedValueOnce({
          id: '1',
          title: 'Chat 1',
          messages: JSON.stringify([]),
          createdAt: '2024-03-20T00:00:00.000Z'
        })
        .mockResolvedValueOnce({
          id: '2',
          title: 'Chat 2',
          messages: JSON.stringify([]),
          createdAt: '2024-03-20T00:00:00.000Z'
        })

      const chats = await getChats('test-user')
      
      expect(chats).toHaveLength(2)
      expect(mockRedisClient.zrange).toHaveBeenCalled()
      expect(mockRedisClient.hgetall).toHaveBeenCalledTimes(2)
    })
  })

  describe('deleteChat', () => {
    it('should successfully delete a chat', async () => {
      mockRedisClient.zrange.mockResolvedValue(['chat:test-chat-id'])
      mockRedisClient.del.mockResolvedValue(1)
      mockRedisClient.zrem.mockResolvedValue(1)

      const result = await deleteChat('test-chat-id', 'test-user')
      
      expect(result).toEqual({})
      expect(mockRedisClient.del).toHaveBeenCalledWith('chat:test-chat-id')
      expect(mockRedisClient.zrem).toHaveBeenCalled()
    })

    it('should return error when chat deletion fails', async () => {
      mockRedisClient.zrange.mockResolvedValue(['chat:test-chat-id'])
      mockRedisClient.del.mockResolvedValue(0)

      const result = await deleteChat('test-chat-id', 'test-user')
      
      expect(result).toEqual({ error: 'Failed to delete chat data' })
    })

    it('should return unauthorized error for non-existent chat', async () => {
      mockRedisClient.zrange.mockResolvedValue(['chat:other-id'])

      const result = await deleteChat('test-chat-id', 'test-user')
      
      expect(result).toEqual({ error: 'Unauthorized' })
    })
  })
}) 