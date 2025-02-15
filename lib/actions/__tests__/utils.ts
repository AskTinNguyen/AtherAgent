import { Message } from '@/lib/types/chat'
import { Chat } from '../chat'

/**
 * Mock chat data factory
 */
export function createMockChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: 'test-chat-id',
    title: 'Test Chat',
    messages: [
      {
        id: 'msg1',
        role: 'user',
        content: 'Hello',
        createdAt: '2024-02-15T00:00:00.000Z'
      }
    ] as Message[],
    createdAt: '2024-02-15T00:00:00.000Z',
    userId: 'test-user',
    ...overrides
  }
}

/**
 * Create invalid chat data for testing error cases
 */
export function createInvalidChat(type: 'missing-title' | 'missing-messages' | 'invalid-json' = 'missing-title'): Partial<Chat> {
  const baseChat = createMockChat()
  
  switch (type) {
    case 'missing-title':
      const { title, ...withoutTitle } = baseChat
      return withoutTitle
    
    case 'missing-messages':
      const { messages, ...withoutMessages } = baseChat
      return withoutMessages
    
    case 'invalid-json':
      return {
        ...baseChat,
        messages: 'invalid-json' as any
      }
  }
}

/**
 * Mock Redis client factory with configurable error behavior
 */
export function createMockRedisClient(options: {
  shouldError?: {
    zrange?: boolean
    hgetall?: boolean
    zadd?: boolean
    hmset?: boolean
    del?: boolean
    zrem?: boolean
  }
} = {}) {
  return {
    zrange: jest.fn().mockImplementation(() => {
      if (options.shouldError?.zrange) {
        return Promise.reject(new Error('Redis zrange error'))
      }
      return Promise.resolve([])
    }),
    hgetall: jest.fn().mockImplementation(() => {
      if (options.shouldError?.hgetall) {
        return Promise.reject(new Error('Redis hgetall error'))
      }
      return Promise.resolve(null)
    }),
    zadd: jest.fn().mockImplementation(() => {
      if (options.shouldError?.zadd) {
        return Promise.reject(new Error('Redis zadd error'))
      }
      return Promise.resolve(1)
    }),
    hmset: jest.fn().mockImplementation(() => {
      if (options.shouldError?.hmset) {
        return Promise.reject(new Error('Redis hmset error'))
      }
      return Promise.resolve('OK')
    }),
    del: jest.fn().mockImplementation(() => {
      if (options.shouldError?.del) {
        return Promise.reject(new Error('Redis del error'))
      }
      return Promise.resolve(1)
    }),
    zrem: jest.fn().mockImplementation(() => {
      if (options.shouldError?.zrem) {
        return Promise.reject(new Error('Redis zrem error'))
      }
      return Promise.resolve(1)
    })
  }
}

/**
 * Helper to create a chat key
 */
export function getChatKey(chatId: string) {
  return `chat:${chatId}`
}

/**
 * Helper to create a user chat key
 */
export function getUserChatKey(userId: string) {
  return `user:v1:chat:${userId}`
}

/**
 * Helper to stringify messages
 */
export function stringifyMessages(messages: Message[]) {
  return JSON.stringify(messages)
}

/**
 * Helper to create an invalid date string
 */
export function getInvalidDate() {
  return 'invalid-date'
}

/**
 * Helper to create a valid ISO date string
 */
export function getValidDate() {
  return new Date().toISOString()
}

/**
 * Helper to simulate Redis operation failures
 */
export function createRedisError(operation: string) {
  return new Error(`Redis ${operation} error`)
} 