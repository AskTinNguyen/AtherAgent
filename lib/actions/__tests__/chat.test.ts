import { Chat } from '@/lib/chat/types';
import { getRedisClient } from '@/lib/redis/config';
import { clearChats, deleteChat, getChat, getChats, saveChat, shareChat } from '../chat';
import {
  createInvalidChat,
  createMockChat,
  createMockRedisClient,
  getChatKey,
  getInvalidDate,
  getUserChatKey,
  stringifyMessages
} from './utils';

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
Object.defineProperty(global.crypto, 'randomUUID', {
  value: jest.fn(() => mockUUID),
  configurable: true
});

// Mock Redis client
jest.mock('@/lib/redis/config');

// Mock Next.js functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

describe('Chat Actions', () => {
  const userId = 'test-user';
  const chatId = 'test-chat-id';
  let mockRedisClient: ReturnType<typeof createMockRedisClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient = createMockRedisClient();
    (getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient);
  });

  describe('getChats', () => {
    it('should return empty array if no userId provided', async () => {
      const result = await getChats(null);
      expect(result).toEqual([]);
      expect(mockRedisClient.zrange).not.toHaveBeenCalled();
    });

    it('should return empty array if no chats found', async () => {
      mockRedisClient.zrange.mockResolvedValue([]);
      const result = await getChats(userId);
      expect(result).toEqual([]);
    });

    it('should fetch and parse chats successfully', async () => {
      const mockChat = createMockChat();
      mockRedisClient.zrange.mockResolvedValue([getChatKey(chatId)]);
      mockRedisClient.hgetall.mockResolvedValue({
        ...mockChat,
        messages: stringifyMessages(mockChat.messages)
      });

      const result = await getChats(userId);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(mockChat);
    });

    it('should handle invalid chat data gracefully', async () => {
      const invalidChat = createInvalidChat('missing-title');
      mockRedisClient.zrange.mockResolvedValue([getChatKey(chatId)]);
      mockRedisClient.hgetall.mockResolvedValue(invalidChat);

      const result = await getChats(userId);
      expect(result).toEqual([]);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient = createMockRedisClient({ shouldError: { zrange: true } });
      (getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient);

      const result = await getChats(userId);
      expect(result).toEqual([]);
    });

    it('should handle invalid message JSON', async () => {
      const invalidChat = createInvalidChat('invalid-json');
      mockRedisClient.zrange.mockResolvedValue([getChatKey(chatId)]);
      mockRedisClient.hgetall.mockResolvedValue(invalidChat);

      const result = await getChats(userId);
      expect(result).toEqual([]);
    });

    it('should handle invalid dates', async () => {
      const mockChat = createMockChat({ createdAt: getInvalidDate() });
      mockRedisClient.zrange.mockResolvedValue([getChatKey(chatId)]);
      mockRedisClient.hgetall.mockResolvedValue({
        ...mockChat,
        messages: stringifyMessages(mockChat.messages)
      });

      const result = await getChats(userId);
      expect(result).toHaveLength(1);
      expect(new Date(result[0].createdAt).getTime()).not.toBeNaN();
    });
  });

  describe('getChat', () => {
    it('should return null if chat not found', async () => {
      mockRedisClient.hgetall.mockResolvedValue(null);
      const result = await getChat(chatId, userId);
      expect(result).toBeNull();
    });

    it('should fetch and parse chat successfully', async () => {
      const mockChat = createMockChat();
      mockRedisClient.hgetall.mockResolvedValue({
        ...mockChat,
        messages: stringifyMessages(mockChat.messages)
      });

      const result = await getChat(chatId, userId);
      expect(result).toMatchObject(mockChat);
    });

    it('should handle invalid message JSON', async () => {
      const mockChat = createMockChat();
      mockRedisClient.hgetall.mockResolvedValue({
        ...mockChat,
        messages: 'invalid-json'
      });

      const result = await getChat(chatId, userId);
      expect(result?.messages).toEqual([]);
    });

    it('should handle invalid dates', async () => {
      const mockChat = createMockChat({ createdAt: getInvalidDate() });
      mockRedisClient.hgetall.mockResolvedValue({
        ...mockChat,
        messages: stringifyMessages(mockChat.messages)
      });

      const result = await getChat(chatId, userId);
      expect(result).toBeDefined();
      expect(new Date(result!.createdAt).getTime()).not.toBeNaN();
    });
  });

  describe('saveChat', () => {
    it('should save chat successfully', async () => {
      const mockChat = createMockChat();
      mockRedisClient.zadd.mockResolvedValue(1);

      const result = await saveChat(mockChat, userId);
      expect(result).toMatchObject({
        ...mockChat,
        userId
      });
      expect(mockRedisClient.zadd).toHaveBeenCalledWith(
        getUserChatKey(userId),
        expect.any(Number),
        expect.any(String)
      );
    });

    it('should generate id if not provided', async () => {
      const { id, ...chatWithoutId } = createMockChat();
      mockRedisClient.zadd.mockResolvedValue(1);

      const result = await saveChat(chatWithoutId as Chat, userId);
      expect(result.id).toBe(mockUUID);
      expect(result.id).not.toBe(id);
    });

    it('should handle save errors', async () => {
      mockRedisClient = createMockRedisClient({ shouldError: { zadd: true } });
      (getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient);

      const mockChat = createMockChat();
      await expect(saveChat(mockChat, userId)).rejects.toThrow('Redis zadd error');
    });

    it('should validate and fix invalid dates', async () => {
      const mockChat = createMockChat({ createdAt: getInvalidDate() });
      mockRedisClient.zadd.mockResolvedValue(1);

      const result = await saveChat(mockChat, userId);
      expect(new Date(result.createdAt).getTime()).not.toBeNaN();
    });
  });

  describe('clearChats', () => {
    it('should return error if no chats to clear', async () => {
      mockRedisClient.zrange.mockResolvedValue([]);

      const result = await clearChats(userId);
      expect(result.error).toBe('No chats to clear');
    });

    it('should clear all chats successfully', async () => {
      mockRedisClient.zrange.mockResolvedValue([getChatKey('1'), getChatKey('2')]);
      mockRedisClient.del.mockResolvedValue(1);
      mockRedisClient.zrem.mockResolvedValue(1);

      const result = await clearChats(userId);
      expect(result.error).toBeUndefined();
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.zrem).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures', async () => {
      mockRedisClient.zrange.mockResolvedValue([getChatKey('1')]);
      mockRedisClient.del.mockResolvedValue(0);
      mockRedisClient.zrem.mockResolvedValue(0);

      const result = await clearChats(userId);
      expect(result.error).toBe('Some chats could not be deleted');
    });

    it('should handle Redis errors', async () => {
      mockRedisClient = createMockRedisClient({ shouldError: { zrange: true } });
      (getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient);

      const result = await clearChats(userId);
      expect(result.error).toBe('Failed to clear chats');
    });
  });

  describe('deleteChat', () => {
    it('should return error if chat not found', async () => {
      mockRedisClient.zrange.mockResolvedValue([]);

      const result = await deleteChat(chatId, userId);
      expect(result.error).toBe('Unauthorized');
    });

    it('should delete chat successfully', async () => {
      mockRedisClient.zrange.mockResolvedValue([getChatKey(chatId)]);
      mockRedisClient.del.mockResolvedValue(1);
      mockRedisClient.zrem.mockResolvedValue(1);

      const result = await deleteChat(chatId, userId);
      expect(result.error).toBeUndefined();
      expect(mockRedisClient.del).toHaveBeenCalledWith(getChatKey(chatId));
      expect(mockRedisClient.zrem).toHaveBeenCalledWith(getUserChatKey(userId), getChatKey(chatId));
    });

    it('should handle Redis errors', async () => {
      mockRedisClient = createMockRedisClient({ shouldError: { zrange: true } });
      (getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient);

      const result = await deleteChat(chatId, userId);
      expect(result.error).toBe('Failed to delete chat');
    });

    it('should handle failed chat data deletion', async () => {
      mockRedisClient.zrange.mockResolvedValue([getChatKey(chatId)]);
      mockRedisClient.del.mockResolvedValue(0);

      const result = await deleteChat(chatId, userId);
      expect(result.error).toBe('Failed to delete chat data');
    });

    it('should handle failed user list removal', async () => {
      mockRedisClient.zrange.mockResolvedValue([getChatKey(chatId)]);
      mockRedisClient.del.mockResolvedValue(1);
      mockRedisClient.zrem.mockResolvedValue(0);

      const result = await deleteChat(chatId, userId);
      expect(result.error).toBe('Failed to remove chat from user list');
    });
  });

  describe('shareChat', () => {
    it('should return null if chat not found', async () => {
      mockRedisClient.hgetall.mockResolvedValue(null);

      const result = await shareChat(chatId, userId);
      expect(result).toBeNull();
    });

    it('should return null if user is not owner', async () => {
      const mockChat = createMockChat({ userId: 'other-user' });
      mockRedisClient.hgetall.mockResolvedValue(mockChat);

      const result = await shareChat(chatId, userId);
      expect(result).toBeNull();
    });

    it('should share chat successfully', async () => {
      const mockChat = createMockChat();
      mockRedisClient.hgetall.mockResolvedValue(mockChat);
      mockRedisClient.hmset.mockResolvedValue('OK');

      const result = await shareChat(chatId, userId);
      expect(result).toMatchObject({
        ...mockChat,
        sharePath: `/share/${chatId}`
      });
      expect(mockRedisClient.hmset).toHaveBeenCalledWith(
        getChatKey(chatId),
        expect.objectContaining({ sharePath: `/share/${chatId}` })
      );
    });

    it('should throw error if update fails', async () => {
      const mockChat = createMockChat();
      mockRedisClient.hgetall.mockResolvedValue(mockChat);
      mockRedisClient.hmset.mockResolvedValue(null);

      await expect(shareChat(chatId, userId)).rejects.toThrow('Failed to update chat');
    });
  });
}); 