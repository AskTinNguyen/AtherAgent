import { getRedisClient } from '@/lib/redis/config'
import { BOOKMARK_REDIS_KEYS } from '@/lib/redis/types/bookmarks'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const bookmarkId = request.nextUrl.searchParams.get('bookmarkId')
    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'bookmarkId parameter is required' },
        { status: 400 }
      )
    }

    const redis = await getRedisClient()
    
    // Check if the bookmark exists in Redis
    const bookmarkData = await redis.hgetall(BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmarkId))
    const exists = bookmarkData && Object.keys(bookmarkData).length > 0
    
    // Also check if it exists in the user's bookmark list
    const score = await redis.zscore(BOOKMARK_REDIS_KEYS.userBookmarks('anonymous'), bookmarkId)
    const isInUserList = score !== null
    
    return NextResponse.json({
      exists,
      isInUserList,
      isFullyDeleted: !exists && !isInUserList
    })
  } catch (error) {
    console.error('Error verifying bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to verify bookmark' },
      { status: 500 }
    )
  }
} 