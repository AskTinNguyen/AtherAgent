import { getRedisClient } from '../config'

/**
 * Utility to clean up old bookmark data from Redis
 * Only removes data with old bookmark-related keys
 */
export async function cleanupOldBookmarkData(): Promise<{
  deletedKeys: string[]
  error?: string
}> {
  const redis = await getRedisClient()
  const deletedKeys: string[] = []

  try {
    // 1. Find all user bookmark keys
    const userBookmarkPattern = 'user:*:bookmarks'
    const userBookmarkKeys = await redis.keys(userBookmarkPattern)

    // 2. Find all bookmark detail keys
    const bookmarkDetailPattern = 'bookmark:*'
    const bookmarkDetailKeys = await redis.keys(bookmarkDetailPattern)

    // Combine all keys to delete
    const keysToDelete = [...userBookmarkKeys, ...bookmarkDetailKeys]

    if (keysToDelete.length === 0) {
      return {
        deletedKeys: [],
      }
    }

    // 3. Delete all found keys
    await Promise.all(
      keysToDelete.map(key => redis.del(key))
    )
    
    console.log(`Successfully deleted ${keysToDelete.length} old bookmark keys`)
    return {
      deletedKeys: keysToDelete
    }

  } catch (error) {
    console.error('Error cleaning up old bookmark data:', error)
    return {
      deletedKeys,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 