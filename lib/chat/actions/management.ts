'use server'

import { revalidatePath } from 'next/cache'
import {
  deleteChat,
  getChatData,
  getChatMessages,
  getUserChats,
  withRedisClient
} from '../data/redis-ops'
import { Chat, ChatError, ChatErrorType, ChatExport } from '../types'
import { getCurrentTimestamp } from '../utils/date-helpers'

/**
 * Clears all chats for a user
 */
export async function clearUserChats(userId: string): Promise<void> {
  try {
    await withRedisClient(async (redis) => {
      const chatIds = await getUserChats(redis, userId)
      
      // Delete each chat
      await Promise.all(
        chatIds.map(async (chatId) => {
          try {
            await deleteChat(redis, chatId, userId)
          } catch (error) {
            console.error(`Failed to delete chat ${chatId}:`, error)
          }
        })
      )
    })

    revalidatePath('/')
  } catch (error) {
    throw new ChatError(
      ChatErrorType.REDIS_ERROR,
      'Failed to clear user chats',
      error
    )
  }
}

/**
 * Exports a chat with all its data
 */
export async function exportChat(chatId: string, userId?: string): Promise<ChatExport> {
  try {
    return await withRedisClient(async (redis) => {
      const chat = await getChatData(redis, chatId)

      if (!chat) {
        throw new ChatError(
          ChatErrorType.NOT_FOUND,
          'Chat not found'
        )
      }

      const messages = await getChatMessages(redis, chatId)

      const exportData: Chat = {
        id: chat.id,
        title: chat.title,
        messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        metadata: chat.settings
      }

      return {
        version: '1.0',
        exportedAt: getCurrentTimestamp(),
        data: exportData
      }
    })
  } catch (error) {
    throw new ChatError(
      ChatErrorType.REDIS_ERROR,
      'Failed to export chat',
      error
    )
  }
}

/**
 * Batch operation on multiple chats
 */
export async function batchOperation(
  chatIds: string[],
  operation: 'delete' | 'archive' | 'restore',
  userId?: string
): Promise<{ success: string[]; failed: string[] }> {
  const results = {
    success: [] as string[],
    failed: [] as string[]
  }

  await withRedisClient(async (redis) => {
    await Promise.all(
      chatIds.map(async (chatId) => {
        try {
          switch (operation) {
            case 'delete':
              await deleteChat(redis, chatId, userId)
              break
            // TODO: Implement archive and restore operations
            default:
              throw new Error(`Unsupported operation: ${operation}`)
          }
          results.success.push(chatId)
        } catch (error) {
          console.error(`Failed to ${operation} chat ${chatId}:`, error)
          results.failed.push(chatId)
        }
      })
    )
  })

  if (results.success.length > 0) {
    revalidatePath('/')
  }

  return results
} 