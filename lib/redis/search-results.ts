import { type SearchResults } from '@/types/search'
import { getRedisClient } from './config'

const REDIS_KEYS = {
  searchResults: (chatId: string, query: string) => 
    `search:${chatId}:results:${encodeURIComponent(query)}`,
  searchResultsTTL: 60 * 60 * 24 // 24 hours
}

export async function storeSearchResults(
  chatId: string,
  query: string,
  results: SearchResults
): Promise<void> {
  console.log('Storing search results:', { chatId, query })
  const redis = await getRedisClient()
  const key = REDIS_KEYS.searchResults(chatId, query)
  console.log('Redis key:', key)
  
  const data = JSON.stringify({
    results,
    timestamp: Date.now(),
    query
  })
  console.log('Data size:', data.length, 'bytes')

  try {
    await redis.set(key, data, { ex: REDIS_KEYS.searchResultsTTL })
    console.log('Successfully stored results in Redis')
  } catch (error) {
    console.error('Failed to store results in Redis:', error)
    throw error
  }
}

export async function getStoredSearchResults(
  chatId: string,
  query: string
): Promise<SearchResults | null> {
  const redis = await getRedisClient()
  const key = REDIS_KEYS.searchResults(chatId, query)
  
  const data = await redis.get(key)
  if (!data) return null
  
  const parsed = JSON.parse(data)
  
  // Check if cache is expired (24 hours)
  const timestamp = parsed.timestamp
  const now = Date.now()
  if (now - timestamp > REDIS_KEYS.searchResultsTTL * 1000) {
    await redis.del(key)
    return null
  }
  
  return parsed.results
}

export async function clearStoredSearchResults(
  chatId: string,
  query?: string
): Promise<void> {
  const redis = await getRedisClient()
  
  if (query) {
    // Clear specific search results
    const key = REDIS_KEYS.searchResults(chatId, query)
    await redis.del(key)
  } else {
    // Clear all search results for this chat
    const pattern = REDIS_KEYS.searchResults(chatId, '*')
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      for (const key of keys) {
        await redis.del(key)
      }
    }
  }
} 