import { getRedisClient } from '@/lib/redis/config'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    const redis = await getRedisClient()

    // Get the chat to verify it exists and get user ID
    const chat = await redis.hgetall(`chat:${chatId}`)
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    const userId = chat.userId || 'anonymous'
    const userChatKey = `user:v2:chat:${userId}`

    // Delete the chat and its reference in the user's chat list
    const [deleteResult, removeResult] = await Promise.all([
      redis.del(`chat:${chatId}`),
      redis.zrem(userChatKey, `chat:${chatId}`)
    ])
    
    // Check if deletion was successful
    if (!deleteResult || !removeResult) {
      return NextResponse.json(
        { error: 'Failed to delete chat' },
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 