'use server'

import { getRedisClient } from '@/lib/redis/config'
import { Message } from '@/lib/types/chat'
import { JSONValue } from 'ai'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  userId?: string
  sharePath?: string
}

function validateDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return new Date().toISOString()
    }
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function getUserChatKey(userId: string) {
  const CHAT_VERSION = 'v1'
  return `user:${CHAT_VERSION}:chat:${userId}`
}

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const redis = await getRedisClient()
    const chats = await redis.zrange(getUserChatKey(userId), 0, -1, {
      rev: true
    })

    if (chats.length === 0) {
      return []
    }

    const results = await Promise.all(
      chats.map(async (chatKey: string) => {
        try {
          const chat = await redis.hgetall(chatKey)
          return chat
        } catch (error) {
          console.error(`Error fetching chat ${chatKey}:`, error)
          // Skip invalid chats
          return null
        }
      })
    )

    return results
      .filter((result: Record<string, any> | null): result is Record<string, any> => {
        if (!result || 
            Object.keys(result).length === 0 || 
            !result.id || 
            !result.title || 
            !result.messages) {
          console.warn('Filtered out invalid chat result:', result)
          return false
        }
        return true
      })
      .map((chat: Record<string, any>) => ({
        ...chat,
        messages: typeof chat.messages === 'string' ? JSON.parse(chat.messages) : chat.messages,
        createdAt: validateDate(chat.createdAt)
      }))
  } catch (error) {
    console.error('Error fetching chats:', error)
    return []
  }
}

export async function getChat(id: string, userId: string = 'anonymous') {
  const redis = await getRedisClient()
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat) {
    return null
  }

  // Parse the messages if they're stored as a string
  if (typeof chat.messages === 'string') {
    try {
      chat.messages = JSON.parse(chat.messages)
    } catch (error) {
      console.error('Error parsing chat messages:', error)
      chat.messages = []
    }
  }

  chat.createdAt = validateDate(chat.createdAt)
  return chat
}

// Enhanced chart annotation extraction
function extractChartAnnotations(content: string): JSONValue[] {
  const annotations: JSONValue[] = []
  try {
    const chartMatches = content.match(/<chart_data>([\s\S]*?)<\/chart_data>/g) || []
    
    for (const match of chartMatches) {
      try {
        const chartData = match.replace(/<chart_data>|<\/chart_data>/g, '').trim()
        const parsedData = JSON.parse(chartData)
        if (parsedData) {
          annotations.push({
            type: 'chart',
            data: parsedData
          })
        }
      } catch (error) {
        console.error('Error parsing individual chart data:', error)
      }
    }
  } catch (error) {
    console.error('Error extracting chart annotations:', error)
  }
  return annotations
}

export async function clearChats(
  userId: string = 'anonymous'
): Promise<{ error?: string }> {
  const redis = await getRedisClient()
  const userChatKey = getUserChatKey(userId)
  const chats = await redis.zrange(userChatKey, 0, -1)
  
  if (!chats.length) {
    return { error: 'No chats to clear' }
  }

  try {
    // Delete all chats and their references in parallel
    const deleteResults = await Promise.all(
      chats.flatMap(chat => [
        redis.del(chat),
        redis.zrem(userChatKey, chat)
      ])
    )

    // Check if any operation failed
    if (deleteResults.some(result => !result)) {
      return { error: 'Some chats could not be deleted' }
    }

    revalidatePath('/')
    redirect('/')
    return {}
  } catch (error) {
    console.error('Error clearing chats:', error)
    return { error: 'Failed to clear chats' }
  }
}

export async function saveChat(chat: Chat, userId: string = 'anonymous') {
  try {
    const redis = await getRedisClient()

    const chatToSave = {
      ...chat,
      messages: JSON.stringify(chat.messages),
      createdAt: validateDate(chat.createdAt)
    }

    // Save chat data
    const saveResult = await redis.hmset(`chat:${chat.id}`, chatToSave)
    if (!saveResult) {
      throw new Error('Failed to save chat data')
    }

    // Add to user's chat list
    const indexResult = await redis.zadd(getUserChatKey(userId), Date.now(), `chat:${chat.id}`)
    if (!indexResult) {
      throw new Error('Failed to index chat')
    }

    return true
  } catch (error) {
    console.error('Error saving chat:', error)
    throw error
  }
}

export async function getSharedChat(id: string) {
  const redis = await getRedisClient()
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string, userId: string = 'anonymous') {
  const redis = await getRedisClient()
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== userId) {
    return null
  }

  const payload = {
    ...chat,
    sharePath: `/share/${id}`
  }

  const result = await redis.hmset(`chat:${id}`, payload)
  if (!result) {
    throw new Error('Failed to update chat')
  }

  return payload
}

export async function deleteChat(
  chatId: string,
  userId: string = 'anonymous'
): Promise<{ error?: string }> {
  const redis = await getRedisClient()
  const userChatKey = getUserChatKey(userId)
  const chats = await redis.zrange(userChatKey, 0, -1)
  const chat = `chat:${chatId}`

  if (!chats.includes(chat)) {
    return { error: 'Unauthorized' }
  }

  try {
    // Delete chat data
    const deleteResult = await redis.del(chat)
    if (!deleteResult) {
      return { error: 'Failed to delete chat data' }
    }

    // Remove from user's chat list
    const removeResult = await redis.zrem(userChatKey, chat)
    if (!removeResult) {
      return { error: 'Failed to remove chat from user list' }
    }

    revalidatePath('/')
    return {}
  } catch (error) {
    console.error('Error deleting chat:', error)
    return { error: 'Failed to delete chat' }
  }
}
