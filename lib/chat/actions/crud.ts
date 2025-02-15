'use server'

import { ChatOperations } from '@/lib/redis/chat'
import { revalidatePath } from 'next/cache'
import { Chat, ChatError, ChatErrorType, ChatMetadata, CreateChatOptions, UpdateChatOptions } from '../types'
import { getCurrentTimestamp } from '../utils/date-helpers'
import { validateCreateChat, validateUpdateChat } from '../utils/validation'

/**
 * Creates a new chat
 */
export async function createChat(options: CreateChatOptions): Promise<Chat> {
  const validation = validateCreateChat(options)
  if (!validation.success) {
    throw new ChatError(
      ChatErrorType.VALIDATION_ERROR,
      'Invalid chat data',
      validation.errors
    )
  }

  try {
    const chatId = crypto.randomUUID()
    
    const chat: Chat = {
      id: chatId,
      title: options.title || 'New Chat',
      messages: options.messages || [],
      createdAt: getCurrentTimestamp(),
      userId: options.userId,
      metadata: options.metadata,
      parentId: options.parentId
    }

    const result = await ChatOperations.createChat(chat.title)
    if (result.error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to create chat',
        result.error
      )
    }

    if (options.userId) {
      const addResult = await ChatOperations.addChatToUserList(
        options.userId,
        chatId,
        new Date(chat.createdAt).getTime()
      )
      if (addResult.error) {
        throw new ChatError(
          ChatErrorType.REDIS_ERROR,
          'Failed to add chat to user list',
          addResult.error
        )
      }
    }

    revalidatePath('/chat')
    return chat
  } catch (error) {
    throw new ChatError(
      ChatErrorType.REDIS_ERROR,
      'Failed to create chat',
      error
    )
  }
}

/**
 * Gets a chat by ID
 */
export async function getChat(chatId: string, userId?: string): Promise<Chat | null> {
  try {
    const result = await ChatOperations.getChatInfo(chatId)
    if (result.error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to get chat',
        result.error
      )
    }

    const chatData = result.data as ChatMetadata | null
    if (!chatData) return null

    // Convert ChatMetadata to Chat, ensuring required fields
    const chat: Chat = {
      id: chatId,
      title: chatData.title || 'Untitled Chat',
      messages: [], // Initialize empty messages array
      createdAt: chatData.createdAt || getCurrentTimestamp(),
      userId: chatData.userId as string | undefined,
      metadata: chatData.metadata || {},
      parentId: chatData.parentId as string | undefined,
      updatedAt: chatData.updatedAt as string | undefined
    }

    // Verify user access if userId provided
    if (userId && chat.userId !== userId) {
      throw new ChatError(
        ChatErrorType.UNAUTHORIZED,
        'Unauthorized access to chat'
      )
    }

    return chat
  } catch (error) {
    if (error instanceof ChatError) throw error
    throw new ChatError(
      ChatErrorType.REDIS_ERROR,
      'Failed to get chat',
      error
    )
  }
}

/**
 * Updates a chat
 */
export async function updateChat(
  chatId: string,
  updates: UpdateChatOptions,
  userId?: string
): Promise<Chat> {
  const validation = validateUpdateChat(updates)
  if (!validation.success) {
    throw new ChatError(
      ChatErrorType.VALIDATION_ERROR,
      'Invalid update data',
      validation.errors
    )
  }

  try {
    const existingChat = await getChat(chatId, userId)
    if (!existingChat) {
      throw new ChatError(
        ChatErrorType.NOT_FOUND,
        'Chat not found'
      )
    }

    const result = await ChatOperations.updateChat(chatId, {
      ...updates,
      updatedAt: getCurrentTimestamp()
    })

    if (result.error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to update chat',
        result.error
      )
    }

    const updatedData = result.data as ChatMetadata | null
    
    // Convert ChatMetadata to Chat, preserving existing data
    const updatedChat: Chat = {
      id: chatId,
      title: updatedData?.title || existingChat.title,
      messages: existingChat.messages,
      createdAt: existingChat.createdAt,
      userId: updatedData?.userId as string | undefined || existingChat.userId,
      metadata: updatedData?.metadata || existingChat.metadata || {},
      parentId: updatedData?.parentId as string | undefined || existingChat.parentId,
      updatedAt: updatedData?.updatedAt as string | undefined || getCurrentTimestamp()
    }

    revalidatePath('/chat')
    return updatedChat
  } catch (error) {
    if (error instanceof ChatError) throw error
    throw new ChatError(
      ChatErrorType.REDIS_ERROR,
      'Failed to update chat',
      error
    )
  }
}

/**
 * Deletes a chat
 */
export async function deleteChat(chatId: string, userId?: string): Promise<void> {
  try {
    const chat = await getChat(chatId, userId)
    if (!chat) {
      throw new ChatError(
        ChatErrorType.NOT_FOUND,
        'Chat not found'
      )
    }

    const result = await ChatOperations.deleteChat(chatId)
    if (result.error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to delete chat',
        result.error
      )
    }

    if (chat.userId) {
      const removeResult = await ChatOperations.removeChatFromUserList(chat.userId, chatId)
      if (removeResult.error) {
        throw new ChatError(
          ChatErrorType.REDIS_ERROR,
          'Failed to remove chat from user list',
          removeResult.error
        )
      }
    }

    revalidatePath('/chat')
  } catch (error) {
    if (error instanceof ChatError) throw error
    throw new ChatError(
      ChatErrorType.REDIS_ERROR,
      'Failed to delete chat',
      error
    )
  }
}

/**
 * Lists all chats for a user
 */
export async function listChats(userId: string): Promise<Chat[]> {
  try {
    const result = await ChatOperations.getUserChats(userId)
    if (result.error) {
      throw new ChatError(
        ChatErrorType.REDIS_ERROR,
        'Failed to list chats',
        result.error
      )
    }

    const chatIds = result.data || []
    const chats: Chat[] = []

    for (const chatId of chatIds) {
      try {
        const chat = await getChat(chatId, userId)
        if (chat) chats.push(chat)
      } catch (error) {
        console.error(`Failed to get chat ${chatId}:`, error)
      }
    }

    return chats
  } catch (error) {
    if (error instanceof ChatError) throw error
    throw new ChatError(
      ChatErrorType.REDIS_ERROR,
      'Failed to list chats',
      error
    )
  }
} 