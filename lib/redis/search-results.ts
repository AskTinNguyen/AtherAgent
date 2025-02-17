import { REDIS_KEYS } from '@/lib/redis/keys'
import { saveSearchResultsToSupabase } from '@/lib/supabase/search-sources'
import { type SearchResults } from '@/types/search'
import { getRedisClient } from './config'

export async function storeSearchResults(
  chatId: string,
  query: string,
  results: SearchResults,
  messageId?: string
): Promise<void> {
  console.log('Storing search results:', { chatId, query })
  
  // Store in Redis for caching
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
    // Store in Redis cache
    await redis.set(key, data, { ex: REDIS_KEYS.searchResultsTTL })
    console.log('Successfully stored results in Redis')

    // Store in Supabase for persistence
    // Handle both text results and images
    const textResults = results.items || results.results || []
    const imageResults = results.images || []

    // Convert images to search results format
    const imageSearchResults = imageResults.map(image => ({
      url: image.url,
      title: image.title || 'Image',
      content: image.description || '',
      snippet: image.description,
      relevance: 1,
      contentType: 'image',
      metadata: {
        type: 'image',
        thumbnail: image.thumbnail
      }
    }))

    // Combine text and image results
    const allResults = [...textResults, ...imageSearchResults]
    
    if (!Array.isArray(allResults)) {
      console.error('Invalid search results format:', results)
      throw new Error('Search results must contain either items or results array')
    }
    
    console.log('Processing combined results:', {
      textResults: textResults.length,
      imageResults: imageResults.length,
      totalResults: allResults.length
    })

    await saveSearchResultsToSupabase(chatId, messageId, allResults)
    console.log('Successfully stored results in Supabase')
  } catch (error) {
    console.error('Failed to store results in Supabase:', error)
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