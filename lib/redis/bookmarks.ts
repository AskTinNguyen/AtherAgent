import { nanoid } from 'nanoid'
import { getRedisClient } from './config'

const REDIS_KEYS = {
  userBookmarks: (userId: string) => `user:${userId}:bookmarks`,
  bookmarkDetails: (bookmarkId: string) => `bookmark:${bookmarkId}`
}

export interface BookmarkedSuggestion {
  id: string
  userId: string
  type: 'path' | 'source' | 'depth'
  content: string
  metadata: Record<string, any>
  createdAt: string
}

type BookmarkRecord = Record<keyof BookmarkedSuggestion, string>

export async function bookmarkSuggestion(
  userId: string,
  suggestion: {
    type: 'path' | 'source' | 'depth'
    content: string
    metadata: Record<string, any>
  }
): Promise<BookmarkedSuggestion> {
  const redis = await getRedisClient()
  const bookmarkId = nanoid()
  
  const bookmark: BookmarkedSuggestion = {
    id: bookmarkId,
    userId,
    ...suggestion,
    createdAt: new Date().toISOString()
  }

  const bookmarkRecord: BookmarkRecord = {
    ...bookmark,
    metadata: JSON.stringify(bookmark.metadata)
  }

  try {
    // Store bookmark details and add to user's list in parallel
    await Promise.all([
      redis.hmset(REDIS_KEYS.bookmarkDetails(bookmarkId), bookmarkRecord),
      redis.zadd(REDIS_KEYS.userBookmarks(userId), Date.now(), bookmarkId)
    ])
    
    return bookmark
  } catch (error) {
    console.error('Error creating bookmark:', error)
    throw error
  }
}

export async function removeBookmark(userId: string, bookmarkId: string): Promise<void> {
  const redis = await getRedisClient()
  
  try {
    // Remove bookmark and its reference in parallel
    await Promise.all([
      redis.zrem(REDIS_KEYS.userBookmarks(userId), bookmarkId),
      redis.del(REDIS_KEYS.bookmarkDetails(bookmarkId))
    ])
  } catch (error) {
    console.error('Error removing bookmark:', error)
    throw error
  }
}

export async function getUserBookmarks(userId: string): Promise<BookmarkedSuggestion[]> {
  const redis = await getRedisClient()
  
  try {
    // Get all bookmark IDs for the user
    const bookmarkIds = await redis.zrange(REDIS_KEYS.userBookmarks(userId), 0, -1)
    
    if (!bookmarkIds.length) return []
    
    // Get bookmark details for each ID
    const bookmarkPromises = bookmarkIds.map(async (id) => {
      const data = await redis.hgetall<BookmarkRecord>(REDIS_KEYS.bookmarkDetails(id))
      if (!data || !data.id) return null
      
      return {
        ...data,
        metadata: JSON.parse(data.metadata)
      } as BookmarkedSuggestion
    })
    
    const bookmarks = await Promise.all(bookmarkPromises)
    return bookmarks.filter((b): b is BookmarkedSuggestion => b !== null)
  } catch (error) {
    console.error('Error getting user bookmarks:', error)
    throw error
  }
} 