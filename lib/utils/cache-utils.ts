import { SearchResults } from '@/lib/types/search.types'
import { Redis } from '@upstash/redis'
import { createClient } from 'redis'

const CACHE_TTL = 3600 // Cache time-to-live in seconds (1 hour)
const CACHE_EXPIRATION_CHECK_INTERVAL = 3600000 // 1 hour in milliseconds

let redisClient: Redis | ReturnType<typeof createClient> | null = null

export async function initializeRedisClient() {
  if (redisClient) return redisClient

  const useLocalRedis = process.env.USE_LOCAL_REDIS === 'true'

  if (useLocalRedis) {
    const localRedisUrl = process.env.LOCAL_REDIS_URL || 'redis://localhost:6379'
    redisClient = createClient({ url: localRedisUrl })
    await redisClient.connect()
  } else {
    const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashRedisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (upstashRedisRestUrl && upstashRedisRestToken) {
      redisClient = new Redis({
        url: upstashRedisRestUrl,
        token: upstashRedisRestToken
      })
    }
  }

  return redisClient
}

export function normalizeCacheKey(
  query: string,
  maxResults: number,
  searchDepth: string,
  includeDomains: string[],
  excludeDomains: string[]
): string {
  const normalizedQuery = query.toLowerCase().trim()
  const domains = {
    include: Array.isArray(includeDomains) ? includeDomains.join(',') : '',
    exclude: Array.isArray(excludeDomains) ? excludeDomains.join(',') : ''
  }
  return `search:${normalizedQuery}:${maxResults}:${searchDepth}:${domains.include}:${domains.exclude}`
}

export async function getCachedResults(
  cacheKey: string
): Promise<SearchResults | null> {
  try {
    const client = await initializeRedisClient()
    if (!client) return null

    let cachedData: string | null
    if (client instanceof Redis) {
      cachedData = await client.get(cacheKey)
    } else {
      cachedData = await client.get(cacheKey)
    }

    if (cachedData) {
      console.log(`Cache hit for key: ${cacheKey}`)
      return JSON.parse(cachedData)
    }
    
    console.log(`Cache miss for key: ${cacheKey}`)
    return null
  } catch (error) {
    console.error('Redis cache error:', error)
    return null
  }
}

export async function setCachedResults(
  cacheKey: string,
  results: SearchResults
): Promise<void> {
  try {
    const client = await initializeRedisClient()
    if (!client) return

    const serializedResults = JSON.stringify(results)
    
    if (client instanceof Redis) {
      await client.set(cacheKey, serializedResults, { ex: CACHE_TTL })
      await client.sadd('search:keys', cacheKey)
    } else {
      await client.set(cacheKey, serializedResults, { EX: CACHE_TTL })
      await client.sAdd('search:keys', cacheKey)
    }
    
    console.log(`Cached results for key: ${cacheKey}`)
  } catch (error) {
    console.error('Redis cache error:', error)
  }
}

export async function cleanupExpiredCache(): Promise<void> {
  try {
    const client = await initializeRedisClient()
    if (!client) return

    const keys = await client.keys('search:*')
    for (const key of keys) {
      const ttl = await client.ttl(key)
      if (ttl <= 0) {
        await client.del(key)
        console.log(`Removed expired cache entry: ${key}`)
      }
    }
  } catch (error) {
    console.error('Cache cleanup error:', error)
  }
}

// Set up periodic cache cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCache, CACHE_EXPIRATION_CHECK_INTERVAL)
} 