import {
    cacheResearchSuggestions,
    getCachedResearchSuggestions
} from '@/lib/redis/suggestions'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    const suggestions = await getCachedResearchSuggestions(userId)
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
    const { userId, suggestions } = await req.json()
    
    if (!userId || !suggestions) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    await cacheResearchSuggestions(userId, suggestions)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error caching suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to cache suggestions' },
      { status: 500 }
    )
  }
} 