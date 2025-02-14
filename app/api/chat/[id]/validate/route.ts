import { getChat } from '@/lib/actions/chat'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  console.log('[DEBUG] Validating chat:', params)

  try {
    const chat = await getChat(params.id)
    
    if (!chat) {
      console.error('[DEBUG] Chat not found:', params.id)
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    console.log('[DEBUG] Chat validated:', { id: chat.id })
    return NextResponse.json({ success: true, chat })
  } catch (error) {
    console.error('[DEBUG] Error validating chat:', error)
    return NextResponse.json(
      { error: 'Failed to validate chat' },
      { status: 500 }
    )
  }
} 