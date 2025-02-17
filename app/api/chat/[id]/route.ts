import { getRedisClient } from '@/lib/redis/config'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params

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
    const pipeline = redis.pipeline()
    pipeline.del(`chat:${chatId}`)
    pipeline.zrem(userChatKey, `chat:${chatId}`)
    
    const results = await pipeline.exec()
    
    // Check if deletion was successful
    if (!results || results.some((result: unknown) => !result)) {
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