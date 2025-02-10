'use server'

import { getRedisClient, RedisWrapper } from '@/lib/redis/config'
import { type Chat } from '@/lib/types'
import { JSONValue } from 'ai'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getRedis(): Promise<RedisWrapper> {
  return await getRedisClient()
}

const CHAT_VERSION = 'v2'
function getUserChatKey(userId: string) {
  return `user:${CHAT_VERSION}:chat:${userId}`
}

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const redis = await getRedis()
    const chats = await redis.zrange(getUserChatKey(userId), 0, -1, {
      rev: true
    })

    if (chats.length === 0) {
      return []
    }

    const results = await Promise.all(
      chats.map(async chatKey => {
        const chat = await redis.hgetall(chatKey)
        return chat
      })
    )

    return results
      .filter((result): result is Record<string, any> => {
        if (result === null || Object.keys(result).length === 0) {
          return false
        }
        return true
      })
      .map(chat => {
        const plainChat = { ...chat }
        if (typeof plainChat.messages === 'string') {
          try {
            const parsedMessages = JSON.parse(plainChat.messages)
            plainChat.messages = parsedMessages.map((msg: any) => {
              // Handle special chart message type
              if (msg.type === 'chart' && msg.data) {
                return {
                  ...msg,
                  data: typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data
                }
              }

              return {
                ...msg,
                // Ensure tool invocations are properly structured
                ...(msg.toolInvocations && {
                  toolInvocations: msg.toolInvocations.map((tool: any) => ({
                    ...tool,
                    args: typeof tool.args === 'string' ? JSON.parse(tool.args) : tool.args,
                    result: tool.result && typeof tool.result === 'string' ? 
                      JSON.parse(tool.result) : tool.result
                  }))
                }),
                // Ensure annotations (including charts) are properly structured
                ...(msg.annotations && {
                  annotations: msg.annotations.map((annotation: any) => {
                    if (typeof annotation === 'string') {
                      try {
                        return JSON.parse(annotation)
                      } catch {
                        return annotation
                      }
                    }
                    // If it's a chart annotation, ensure data is properly parsed
                    if (annotation?.type === 'chart' && typeof annotation.data === 'string') {
                      try {
                        return {
                          ...annotation,
                          data: JSON.parse(annotation.data)
                        }
                      } catch {
                        return annotation
                      }
                    }
                    return annotation
                  })
                }),
                // Handle chart data in content if present
                ...(msg.content && typeof msg.content === 'string' && {
                  content: msg.content,
                  annotations: [
                    ...(msg.annotations || []),
                    ...extractChartAnnotations(msg.content)
                  ]
                })
              }
            })
          } catch (error) {
            plainChat.messages = []
          }
        }
        if (plainChat.createdAt && !(plainChat.createdAt instanceof Date)) {
          plainChat.createdAt = new Date(plainChat.createdAt)
        }
        return plainChat as Chat
      })
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string = 'anonymous') {
  const redis = await getRedis()
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat) {
    return null
  }

  // Parse the messages if they're stored as a string
  if (typeof chat.messages === 'string') {
    try {
      // Parse messages and ensure tool invocations and annotations are preserved
      const parsedMessages = JSON.parse(chat.messages)
      chat.messages = parsedMessages.map((msg: any) => {
        // Handle special chart message type
        if (msg.type === 'chart' && msg.data) {
          return {
            ...msg,
            data: typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data
          }
        }

        return {
          ...msg,
          // Ensure tool invocations are properly structured
          ...(msg.toolInvocations && {
            toolInvocations: msg.toolInvocations.map((tool: any) => ({
              ...tool,
              args: typeof tool.args === 'string' ? JSON.parse(tool.args) : tool.args,
              result: tool.result && typeof tool.result === 'string' ? 
                JSON.parse(tool.result) : tool.result
            }))
          }),
          // Ensure annotations (including charts) are properly structured
          ...(msg.annotations && {
            annotations: msg.annotations.map((annotation: any) => {
              if (typeof annotation === 'string') {
                try {
                  return JSON.parse(annotation)
                } catch {
                  return annotation
                }
              }
              // If it's a chart annotation, ensure data is properly parsed
              if (annotation?.type === 'chart' && typeof annotation.data === 'string') {
                try {
                  return {
                    ...annotation,
                    data: JSON.parse(annotation.data)
                  }
                } catch {
                  return annotation
                }
              }
              return annotation
            })
          }),
          // Handle chart data in content if present
          ...(msg.content && typeof msg.content === 'string' && {
            content: msg.content,
            annotations: [
              ...(msg.annotations || []),
              ...extractChartAnnotations(msg.content)
            ]
          })
        }
      })
    } catch (error) {
      console.error('Error parsing chat messages:', error)
      chat.messages = []
    }
  }

  // Ensure messages is always an array
  if (!Array.isArray(chat.messages)) {
    chat.messages = []
  }

  return chat
}

// Helper function to extract chart annotations from content
function extractChartAnnotations(content: string): JSONValue[] {
  const annotations: JSONValue[] = []
  const chartMatch = content.match(/<chart_data>([\s\S]*?)<\/chart_data>/)
  if (chartMatch) {
    try {
      const chartData = JSON.parse(chartMatch[1].trim())
      annotations.push({
        type: 'chart',
        data: chartData
      })
    } catch (error) {
      console.error('Error parsing chart data from content:', error)
    }
  }
  return annotations
}

export async function clearChats(
  userId: string = 'anonymous'
): Promise<{ error?: string }> {
  const redis = await getRedis()
  const userChatKey = getUserChatKey(userId)
  const chats = await redis.zrange(userChatKey, 0, -1)
  if (!chats.length) {
    return { error: 'No chats to clear' }
  }
  const pipeline = redis.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(userChatKey, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  redirect('/')
}

export async function saveChat(chat: Chat, userId: string = 'anonymous') {
  try {
    const redis = await getRedis()
    const pipeline = redis.pipeline()

    const chatToSave = {
      ...chat,
      messages: JSON.stringify(chat.messages)
    }

    pipeline.hmset(`chat:${chat.id}`, chatToSave)
    pipeline.zadd(getUserChatKey(userId), Date.now(), `chat:${chat.id}`)

    const results = await pipeline.exec()

    return results
  } catch (error) {
    throw error
  }
}

export async function getSharedChat(id: string) {
  const redis = await getRedis()
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string, userId: string = 'anonymous') {
  const redis = await getRedis()
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== userId) {
    return null
  }

  const payload = {
    ...chat,
    sharePath: `/share/${id}`
  }

  await redis.hmset(`chat:${id}`, payload)

  return payload
}
