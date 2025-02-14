import { ChatOperations } from '@/lib/redis/chat'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { id, title = 'New Chat' } = await req.json()

    // Create the chat in Redis
    const result = await ChatOperations.createChat(title)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create chat' },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error initializing chat:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 