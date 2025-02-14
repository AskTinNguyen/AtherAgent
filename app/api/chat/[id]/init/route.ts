import { saveChat } from '@/lib/actions/chat'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  console.log('[DEBUG] Initializing chat:', params)

  try {
    const chat = await saveChat({
      id: params.id,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    })

    console.log('[DEBUG] Chat initialized:', { id: chat.id })
    return NextResponse.json({ success: true, chat })
  } catch (error) {
    console.error('[DEBUG] Error initializing chat:', error)
    return NextResponse.json(
      { error: 'Failed to initialize chat' },
      { status: 500 }
    )
  }
} 