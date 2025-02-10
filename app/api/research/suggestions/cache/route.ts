import {
    cacheResearchSuggestions,
    getCachedResearchSuggestions
} from '@/lib/redis/suggestions'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const chatId = req.nextUrl.searchParams.get('chatId')

    if (!userId || !chatId) {
      return NextResponse.json(
        { error: 'Missing required parameters (userId, chatId)' },
        { status: 400 }
      )
    }

    const suggestions = await getCachedResearchSuggestions(chatId, userId)
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error getting cached suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to get cached suggestions' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, chatId, suggestions } = await req.json()
    
    if (!userId || !chatId || !suggestions) {
      return NextResponse.json(
        { error: 'Missing required parameters (userId, chatId, suggestions)' },
        { status: 400 }
      )
    }

    await cacheResearchSuggestions(chatId, userId, suggestions)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error caching suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to cache suggestions' },
      { status: 500 }
    )
  }
} 