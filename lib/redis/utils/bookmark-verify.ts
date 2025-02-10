import { getRedisClient } from '../config'

/**
 * Utility to verify if any old bookmark data remains in Redis
 */
export async function verifyBookmarkCleanup(): Promise<{
  remainingKeys: string[]
  isClean: boolean
}> {
  const redis = await getRedisClient()
  
  try {
    // Check for any remaining bookmark keys
    const userBookmarkKeys = await redis.keys('user:*:bookmarks')
    const bookmarkDetailKeys = await redis.keys('bookmark:*')
    
    const remainingKeys = [...userBookmarkKeys, ...bookmarkDetailKeys]
    
    return {
      remainingKeys,
      isClean: remainingKeys.length === 0
    }
  } catch (error) {
    console.error('Error verifying bookmark cleanup:', error)
    throw error
  }
} 