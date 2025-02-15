import { ChatOperations } from '@/lib/redis/chat'
import { ChatError } from '../../types'
import { createChat, deleteChat, getChat, listChats, updateChat } from '../crud'

// Mock Redis chat operations
jest.mock('@/lib/redis/chat', () => ({
  ChatOperations: {
    createChat: jest.fn(),
    getChatInfo: jest.fn(),
    updateChat: jest.fn(),
    deleteChat: jest.fn(),
    addChatToUserList: jest.fn(),
    removeChatFromUserList: jest.fn(),
    getUserChats: jest.fn()
  }
}))

// Mock Next.js functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

describe('Chat CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createChat', () => {
    const createChatOptions = {
      title: 'Test Chat',
      userId: 'user123'
    }

    it('should create a new chat successfully', async () => {
      const mockChatData = {
        id: expect.any(String),
        title: createChatOptions.title,
        createdAt: expect.any(String)
      }

      ChatOperations.createChat.mockResolvedValue({ data: mockChatData })
      ChatOperations.addChatToUserList.mockResolvedValue({ data: true })

      const chat = await createChat(createChatOptions)

      expect(chat).toMatchObject({
        title: createChatOptions.title,
        userId: createChatOptions.userId,
        messages: []
      })
      expect(chat.id).toBeDefined()
      expect(chat.createdAt).toBeDefined()
      expect(ChatOperations.createChat).toHaveBeenCalledWith(createChatOptions.title)
      expect(ChatOperations.addChatToUserList).toHaveBeenCalled()
    })

    it('should handle Redis errors', async () => {
      ChatOperations.createChat.mockResolvedValue({ error: new Error('Redis error') })

      await expect(createChat(createChatOptions)).rejects.toThrow(ChatError)
      expect(ChatOperations.createChat).toHaveBeenCalled()
    })
  })

  describe('getChat', () => {
    const mockChat = {
      id: 'chat123',
      title: 'Test Chat',
      messages: [],
      createdAt: '2025-02-15T03:04:36.752Z',
      userId: 'user123'
    }

    it('should get a chat successfully', async () => {
      ChatOperations.getChatInfo.mockResolvedValue({ data: mockChat })

      const chat = await getChat('chat123')
      expect(chat).toEqual(mockChat)
      expect(ChatOperations.getChatInfo).toHaveBeenCalledWith('chat123')
    })

    it('should return null for non-existent chat', async () => {
      ChatOperations.getChatInfo.mockResolvedValue({ data: null })

      const chat = await getChat('nonexistent')
      expect(chat).toBeNull()
    })

    it('should throw unauthorized error for wrong user', async () => {
      ChatOperations.getChatInfo.mockResolvedValue({ data: mockChat })

      await expect(getChat('chat123', 'wronguser')).rejects.toThrow(ChatError)
    })
  })

  describe('updateChat', () => {
    const mockChat = {
      id: 'chat123',
      title: 'Test Chat',
      messages: [],
      createdAt: '2025-02-15T03:04:36.752Z',
      userId: 'user123'
    }

    it('should update a chat successfully', async () => {
      const updates = { title: 'Updated Title' }
      ChatOperations.getChatInfo.mockResolvedValue({ data: mockChat })
      ChatOperations.updateChat.mockResolvedValue({ 
        data: { ...mockChat, ...updates }
      })

      const updatedChat = await updateChat('chat123', updates)
      expect(updatedChat.title).toBe(updates.title)
      expect(ChatOperations.updateChat).toHaveBeenCalled()
    })

    it('should throw error for non-existent chat', async () => {
      ChatOperations.getChatInfo.mockResolvedValue({ data: null })

      await expect(updateChat('nonexistent', { title: 'New Title' }))
        .rejects.toThrow(ChatError)
    })
  })

  describe('deleteChat', () => {
    const mockChat = {
      id: 'chat123',
      title: 'Test Chat',
      messages: [],
      createdAt: '2025-02-15T03:04:36.752Z',
      userId: 'user123'
    }

    it('should delete a chat successfully', async () => {
      ChatOperations.getChatInfo.mockResolvedValue({ data: mockChat })
      ChatOperations.deleteChat.mockResolvedValue({ data: true })
      ChatOperations.removeChatFromUserList.mockResolvedValue({ data: true })

      await deleteChat('chat123')
      expect(ChatOperations.deleteChat).toHaveBeenCalledWith('chat123')
      expect(ChatOperations.removeChatFromUserList).toHaveBeenCalledWith('user123', 'chat123')
    })

    it('should throw error for non-existent chat', async () => {
      ChatOperations.getChatInfo.mockResolvedValue({ data: null })

      await expect(deleteChat('nonexistent')).rejects.toThrow(ChatError)
    })
  })

  describe('listChats', () => {
    const mockChats = [
      {
        id: 'chat1',
        title: 'Chat 1',
        messages: [],
        createdAt: '2025-02-15T03:04:36.752Z',
        userId: 'user123'
      },
      {
        id: 'chat2',
        title: 'Chat 2',
        messages: [],
        createdAt: '2025-02-15T03:04:36.752Z',
        userId: 'user123'
      }
    ]

    it('should list chats successfully', async () => {
      ChatOperations.getUserChats.mockResolvedValue({ 
        data: mockChats.map(chat => chat.id)
      })
      
      // Mock individual chat retrievals
      for (const chat of mockChats) {
        ChatOperations.getChatInfo.mockResolvedValueOnce({ data: chat })
      }

      const chats = await listChats('user123')
      expect(chats).toHaveLength(2)
      expect(chats[0].id).toBe('chat1')
      expect(chats[1].id).toBe('chat2')
    })

    it('should handle empty chat list', async () => {
      ChatOperations.getUserChats.mockResolvedValue({ data: [] })

      const chats = await listChats('user123')
      expect(chats).toHaveLength(0)
    })

    it('should filter out failed chat retrievals', async () => {
      ChatOperations.getUserChats.mockResolvedValue({ 
        data: ['chat1', 'chat2']
      })

      // First chat succeeds, second fails
      ChatOperations.getChatInfo
        .mockResolvedValueOnce({ data: mockChats[0] })
        .mockResolvedValueOnce({ error: new Error('Failed to get chat') })

      const chats = await listChats('user123')
      expect(chats).toHaveLength(1)
      expect(chats[0].id).toBe('chat1')
    })
  })
}) 