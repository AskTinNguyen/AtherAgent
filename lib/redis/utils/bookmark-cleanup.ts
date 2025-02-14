import { getRedisClient } from '../config'

/**
 * Cleans up all bookmark-related data from Redis
 */
export async function cleanupBookmarkData(): Promise<{
  deletedKeys: string[]
  success: boolean
}> {
  const redis = await getRedisClient()
  const deletedKeys: string[] = []

  try {
    // Get all bookmark-related keys
    const patterns = [
      'user:*:bookmarks',
      'bookmark:*',
      'user:*:bookmark:*',
      'bookmark:*:permissions',
      'bookmark:*:analytics',
      'bookmark:*:research',
      'bookmark:*:relations',
      'bookmark:*:version'
    ]

    // Get all keys matching our patterns
    const keys: string[] = []
    for (const pattern of patterns) {
      const matchingKeys = await redis.keys(pattern)
      keys.push(...matchingKeys)
    }

    if (keys.length === 0) {
      return { deletedKeys: [], success: true }
    }

    // Delete all keys in batches to avoid timeout
    const BATCH_SIZE = 100
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(key => redis.del(key)))
      deletedKeys.push(...batch)
    }

    console.log(`Successfully deleted ${deletedKeys.length} bookmark-related keys`)
    return { deletedKeys, success: true }
  } catch (error) {
    console.error('Error cleaning up bookmark data:', error)
    return { deletedKeys, success: false }
  }
}

/**
 * Verifies if cleanup was successful
 */
export async function verifyCleanup(): Promise<{
  remainingKeys: string[]
  isClean: boolean
}> {
  const redis = await getRedisClient()
  
  try {
    // Check for any remaining bookmark keys
    const patterns = [
      'user:*:bookmarks',
      'bookmark:*',
      'user:*:bookmark:*',
      'bookmark:*:permissions',
      'bookmark:*:analytics',
      'bookmark:*:research',
      'bookmark:*:relations',
      'bookmark:*:version'
    ]

    const remainingKeys: string[] = []
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern)
      remainingKeys.push(...keys)
    }
    
    return {
      remainingKeys,
      isClean: remainingKeys.length === 0
    }
  } catch (error) {
    console.error('Error verifying cleanup:', error)
    throw error
  }
} 