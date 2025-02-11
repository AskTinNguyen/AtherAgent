import { getRedisClient } from '@/lib/redis/config'
import { BOOKMARK_REDIS_KEYS } from '@/lib/redis/types/bookmarks'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url')
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    const redis = await getRedisClient()
    
    // Get all bookmarks for the user
    const bookmarkIds = await redis.zrange(BOOKMARK_REDIS_KEYS.userBookmarks('anonymous'), 0, -1)
    
    // Check each bookmark to find one matching the URL
    for (const bookmarkId of bookmarkIds) {
      const bookmarkData = await redis.hgetall(BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmarkId))
      
      if (bookmarkData && bookmarkData.content === url) {
        return NextResponse.json({
          isBookmarked: true,
          bookmarkId
        })
      }
    }

    return NextResponse.json({
      isBookmarked: false,
      bookmarkId: null
    })
  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return NextResponse.json(
      { error: 'Failed to check bookmark status' },
      { status: 500 }
    )
  }
} 