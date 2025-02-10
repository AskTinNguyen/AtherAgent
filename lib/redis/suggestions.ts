import { ResearchSuggestion } from '@/components/research-suggestions'
import { getRedisClient } from './config'

const REDIS_KEYS = {
  chatSuggestions: (chatId: string, userId: string) => `chat:${chatId}:user:${userId}:suggestions`,
  suggestionTTL: 60 * 60 * 24 // 24 hours
}

export async function cacheResearchSuggestions(
  chatId: string,
  userId: string,
  suggestions: ResearchSuggestion[]
): Promise<void> {
  const redis = await getRedisClient()
  const key = REDIS_KEYS.chatSuggestions(chatId, userId)
  
  // Store suggestions as JSON string
  await redis.hmset(key, {
    suggestions: JSON.stringify(suggestions),
    timestamp: Date.now().toString()
  })
}

export async function getCachedResearchSuggestions(
  chatId: string,
  userId: string
): Promise<ResearchSuggestion[] | null> {
  const redis = await getRedisClient()
  const key = REDIS_KEYS.chatSuggestions(chatId, userId)
  
  const data = await redis.hgetall<{
    suggestions: string
    timestamp: string
  }>(key)
  
  if (!data) return null
  
  // Check if cache is expired (24 hours)
  const timestamp = parseInt(data.timestamp, 10)
  const now = Date.now()
  if (now - timestamp > REDIS_KEYS.suggestionTTL * 1000) {
    await redis.del(key)
    return null
  }
  
  return JSON.parse(data.suggestions)
}

export async function clearCachedResearchSuggestions(
  chatId: string,
  userId: string
): Promise<void> {
  const redis = await getRedisClient()
  const key = REDIS_KEYS.chatSuggestions(chatId, userId)
  await redis.del(key)
} 