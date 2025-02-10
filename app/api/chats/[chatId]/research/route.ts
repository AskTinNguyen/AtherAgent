import { getChatResearchState, updateChatResearchState } from '@/lib/redis/research'
import { NextRequest, NextResponse } from 'next/server'

// Ensure route is always dynamically evaluated
export const dynamic = 'force-dynamic'

// Define types to match the deep research context
interface ResearchActivity {
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
}

interface ResearchSource {
  url: string
  title: string
  relevance: number
}

interface ResearchState {
  isActive: boolean
  activity: ResearchActivity[]
  sources: ResearchSource[]
  currentDepth: number
  maxDepth: number
  completedSteps: number
  totalExpectedSteps: number
}

export async function GET(
  request: NextRequest,
  context: { params: { chatId: string } }
) {
  // Await the params object before accessing its properties
  const params = await Promise.resolve(context.params)
  const chatId = params.chatId

  // Validate after awaiting
  if (typeof chatId !== 'string' || !chatId.trim()) {
    return NextResponse.json(
      { error: 'Chat ID is required' },
      { status: 400 }
    )
  }

  try {
    const state = await getChatResearchState(chatId)
    return NextResponse.json(state)
  } catch (error) {
    console.error('Failed to get research state:', error)
    return NextResponse.json(
      { error: 'Failed to get research state' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { chatId: string } }
) {
  // Await the params object before accessing its properties
  const params = await Promise.resolve(context.params)
  const chatId = params.chatId

  // Validate after awaiting
  if (typeof chatId !== 'string' || !chatId.trim()) {
    return NextResponse.json(
      { error: 'Invalid chat ID format' },
      { status: 400 }
    )
  }

  try {
    const { isCleared } = await request.json()
    await updateChatResearchState(chatId, isCleared)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update research state:', error)
    return NextResponse.json(
      { error: 'Failed to update research state' },
      { status: 500 }
    )
  }
} 