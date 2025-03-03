import { Redis } from '@upstash/redis'
import { LocalRedisWrapper, RedisWrapper, UpstashRedisWrapper } from './types'

let redis: RedisWrapper | null = null
let connectionAttempts = 0
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

async function createRedisConnection(): Promise<RedisWrapper> {
  try {
    // Ensure we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('Redis client can only be used on the server side')
    }

    const useLocalRedis = process.env.USE_LOCAL_REDIS === 'true'

    if (useLocalRedis) {
      const { createClient } = await import('redis')
      const client = createClient({
        url: process.env.LOCAL_REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > MAX_RETRIES) {
              console.error('Max Redis reconnection attempts reached')
              return new Error('Max reconnection attempts reached')
            }
            return Math.min(retries * 100, 3000) // Exponential backoff with max 3s
          },
          connectTimeout: 10000, // 10 seconds
          keepAlive: 5000 // 5 seconds
        }
      })

      // Handle Redis events
      client.on('error', (err) => console.error('Redis Client Error:', err))
      client.on('reconnecting', () => console.log('Reconnecting to Redis...'))
      client.on('connect', () => console.log('Redis Client Connected'))
      client.on('ready', () => console.log('Redis Client Ready'))
      client.on('end', () => console.log('Redis Client Connection Closed'))

      try {
        await client.connect()
        await client.ping() // Test connection
        return new LocalRedisWrapper(client)
      } catch (error) {
        console.error('Failed to connect to Redis:', error)
        throw error
      }
    } else {
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('Redis configuration is missing')
      }

      const client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
        retry: {
          retries: MAX_RETRIES,
          backoff: (retryCount) => Math.min(retryCount * 100, 3000)
        }
      })

      return new UpstashRedisWrapper(client)
    }
  } catch (error) {
    console.error('Error creating Redis connection:', error)
    throw error
  }
}

export async function getRedisClient(): Promise<RedisWrapper> {
  try {
    if (redis) {
      // Test the connection
      try {
        await redis.ping()
        return redis
      } catch (error) {
        console.error('Redis connection test failed:', error)
        // Connection is dead, clear it and try to reconnect
        await redis.close().catch(console.error)
        redis = null
      }
    }

    while (connectionAttempts < MAX_RETRIES) {
      try {
        redis = await createRedisConnection()
        connectionAttempts = 0 // Reset counter on success
        return redis
      } catch (error) {
        connectionAttempts++
        console.error(`Redis connection attempt ${connectionAttempts} failed:`, error)
        
        if (connectionAttempts === MAX_RETRIES) {
          throw new Error('Failed to establish Redis connection after multiple attempts')
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * connectionAttempts))
      }
    }

    throw new Error('Failed to establish Redis connection')
  } catch (error) {
    console.error('Fatal Redis connection error:', error)
    throw error
  }
}

// Function to close the Redis connection
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.close()
    redis = null
    connectionAttempts = 0
  }
}
