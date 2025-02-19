import { saveSearchResultsToSupabase } from '@/lib/supabase/search-sources'
import { SearchResult } from '@/lib/types/search'
import { type SearchResults } from '@/types/search'
import { getRedisClient } from './config'
import { RedisWrapper } from './types'

const RESULTS_EXPIRY = 60 * 60 * 24 // 24 hours
const MAX_RETRIES = 3
const QUEUE_PROCESS_INTERVAL = 5000 // 5 seconds
const LOG_INTERVAL = 20 // Log every 20 items

// Add debug mode for development
const DEBUG = process.env.NODE_ENV === 'development'

// Singleton Redis client
let redisClient: RedisWrapper | null = null

/**
 * Get or initialize Redis client
 * @returns Promise<RedisWrapper> Redis client instance
 */
async function getOrInitRedisClient(): Promise<RedisWrapper> {
  if (!redisClient) {
    redisClient = await getRedisClient()
  }
  return redisClient
}

/**
 * Storage queue item interface for background processing
 */
interface StorageQueueItem {
  chatId: string
  messageId?: string
  results: SearchResult[]
  timestamp: number
  retryCount: number
}

// Queue for background Supabase storage operations
const storageQueue: StorageQueueItem[] = []
let isProcessingQueue = false
let processedItemCount = 0

/**
 * Get Redis key for search results
 * @param chatId - Chat ID
 * @param query - Search query
 * @returns Formatted Redis key
 */
function getSearchKey(chatId: string, query: string): string {
  // Normalize the query to prevent encoding issues
  const normalizedQuery = query.trim().toLowerCase()
  return `search:${chatId}:results:${encodeURIComponent(normalizedQuery)}`
}

/**
 * TIN: ASYNCHRONOUSLY Process the storage queue and persist results to Supabase
 * Implements retry logic and error handling with optimized logging
 */
async function processStorageQueue(): Promise<void> {
  if (isProcessingQueue || storageQueue.length === 0) return
  
  isProcessingQueue = true
  const initialQueueSize = storageQueue.length
  
  // Log only at the start of processing a new batch
  console.log('Starting queue processing:', { 
    queueSize: initialQueueSize,
    timestamp: new Date().toISOString()
  })

  try {
    while (storageQueue.length > 0) {
      const item = storageQueue[0]
      
      try {
        await saveSearchResultsToSupabase(
          item.chatId,
          item.messageId,
          item.results
        )
        
        storageQueue.shift()
        processedItemCount++

        // Log progress only every LOG_INTERVAL items or when queue is empty
        if (processedItemCount % LOG_INTERVAL === 0 || storageQueue.length === 0) {
          console.log('Queue processing progress:', {
            processed: processedItemCount,
            remaining: storageQueue.length,
            totalProcessed: processedItemCount
          })
        }

      } catch (error) {
        console.error('Error processing queue item:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          chatId: item.chatId,
          retryCount: item.retryCount
        })
        
        if (item.retryCount < MAX_RETRIES) {
          item.retryCount++
          storageQueue.shift()
          storageQueue.push(item)
          // Log only when retrying
          console.log('Requeued item for retry:', {
            chatId: item.chatId,
            retryCount: item.retryCount
          })
        } else {
          storageQueue.shift()
          console.error('Max retries reached for queue item:', {
            chatId: item.chatId,
            messageId: item.messageId
          })
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  } finally {
    // Log final status only when the entire batch is complete
    console.log('Queue processing completed:', {
      totalProcessed: processedItemCount,
      timestamp: new Date().toISOString()
    })
    processedItemCount = 0 // Reset counter for next batch
    isProcessingQueue = false
  }
}

// Start queue processing periodically
setInterval(processStorageQueue, QUEUE_PROCESS_INTERVAL)

/**
 * Queue search results for background storage in Supabase
 * @param chatId - Chat ID
 * @param messageId - Optional message ID
 * @param results - Search results to store
 */
async function queueForStorage(
  chatId: string,
  messageId: string | undefined,
  results: SearchResult[]
): Promise<void> {
  storageQueue.push({
    chatId,
    messageId,
    results,
    timestamp: Date.now(),
    retryCount: 0
  })
  
  // Log only when adding new items to an empty queue
  if (storageQueue.length === 1) {
    console.log('Started new queue:', {
      chatId,
      queueLength: storageQueue.length
    })
  }
  
  if (!isProcessingQueue) {
    processStorageQueue().catch(console.error)
  }
}

/**
 * Process and convert search results to a consistent format
 * @param results - Raw search results
 * @returns Processed search results array
 */
function processResults(results: SearchResults | SearchResult[]): SearchResult[] {
  if (Array.isArray(results)) {
    return results
  }

  const textResults = results.results || []
  const imageResults = (results.images || []).map(image => ({
    url: image.url,
    title: image.title || 'Image',
    content: '',
    snippet: '',
    relevance: 1,
    contentType: 'image',
    metadata: {
      type: 'image',
      thumbnail: image.thumbnail
    }
  }))

  return [...textResults, ...imageResults]
}

/**
 * Store search results in Redis cache and queue for Supabase storage
 * @param chatId - Chat ID
 * @param query - Search query
 * @param results - Search results to store
 * @param messageId - Optional message ID
 * @returns Processed search results
 */
export async function storeSearchResults(
  chatId: string,
  query: string,
  results: SearchResults | SearchResult[],
  messageId?: string
): Promise<SearchResult[]> {
  const redis = await getOrInitRedisClient()
  const processedResults = processResults(results)
  const key = getSearchKey(chatId, query)

  try {
    // Store in Redis cache with metadata
    const data = {
      results: processedResults,
      timestamp: Date.now(),
      query,
      messageId,
      chatId
    }

    // Set with expiry and verify storage
    await redis.set(key, JSON.stringify(data), { ex: RESULTS_EXPIRY })
    
    // Verify the data was stored
    const stored = await redis.get(key)
    if (!stored) {
      throw new Error('Failed to verify Redis storage')
    }

    if (DEBUG) {
      console.log('Stored search results in Redis:', {
        key,
        resultCount: processedResults.length,
        expiry: RESULTS_EXPIRY
      })
    }

    // Queue for background storage in Supabase
    queueForStorage(chatId, messageId, processedResults).catch(error => {
      console.error('Failed to queue results:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        chatId
      })
    })

    return processedResults
  } catch (error) {
    console.error('Failed to store results:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      chatId,
      query,
      key
    })
    throw error
  }
}

/**
 * Retrieve stored search results from Redis cache
 * @param chatId - Chat ID
 * @param query - Search query
 * @returns - The stored Search results or null if not found
 */
export async function getStoredSearchResults(
  chatId: string,
  query: string
): Promise<SearchResult[] | null> {
  const redis = await getOrInitRedisClient()
  const key = getSearchKey(chatId, query)
  
  try {
    const data = await redis.get(key)
    if (!data) {
      if (DEBUG) {
        console.log('No results found in Redis:', { key })
      }
      return null
    }

    const parsed = JSON.parse(data)
    
    // Verify TTL and log remaining time in debug mode
    if (DEBUG) {
      try {
        // Use getEx to reset expiry and get data in one operation
        await redis.set(key, data, { ex: RESULTS_EXPIRY })
        console.log('Retrieved search results from Redis:', {
          key,
          resultCount: parsed.results.length,
          expirySeconds: RESULTS_EXPIRY
        })
      } catch (error) {
        console.warn('Failed to update expiry time:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          key
        })
      }
    }
    
    return parsed.results
  } catch (error) {
    console.error('Error getting stored results:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      chatId,
      query,
      key
    })
    return null
  }
}

/**
 * Clear stored search results from Redis cache
 * @param chatId - Chat ID
 * @param query - Optional search query (if not provided, clears all results for the chat)
 */
export async function clearStoredSearchResults(
  chatId: string,
  query?: string
): Promise<void> {
  const redis = await getOrInitRedisClient()
  
  try {
    if (query) {
      // Clear specific query results from Redis
      await redis.del(getSearchKey(chatId, query))
    } else {
      // Clear all Redis cache for this chat
      const pattern = `search:${chatId}:results:*`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        // Delete keys in batches to avoid too many arguments
        for (let i = 0; i < keys.length; i += 10) {
          const batch = keys.slice(i, i + 10)
          await Promise.all(batch.map(key => redis.del(key)))
        }
      }
    }
  } catch (error) {
    console.error('Failed to clear results:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      chatId,
      query
    })
    throw error
  }
} 