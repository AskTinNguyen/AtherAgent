import { type MessageContext } from '@/lib/types/research-enhanced'

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 3, // Maximum requests per minute for testing
  WINDOW_MS: 60000, // 1 minute window
  MIN_INTERVAL_MS: 20000, // Minimum 20 seconds between requests
  CONTEXT_CACHE_MS: 300000 // Cache similar contexts for 5 minutes
}

// Simple in-memory request tracking for development
const requestTracker = {
  lastRequestTime: 0,
  requestCount: 0,
  resetTime: 0,
  recentContexts: new Map<string, {
    timestamp: number,
    mainTopic: string,
    relatedTopics: string[]
  }>()
}

function areContextsSimilar(
  context1: { main_topic: string, related_topics: string[] },
  context2: { mainTopic: string, relatedTopics: string[] }
): boolean {
  if (context1.main_topic.toLowerCase() === context2.mainTopic.toLowerCase()) {
    return true
  }
  
  const topics1 = new Set(context1.related_topics.map(t => t.toLowerCase()))
  const topics2 = new Set(context2.relatedTopics.map(t => t.toLowerCase()))
  const commonTopics = [...topics1].filter(t => topics2.has(t))
  
  return commonTopics.length >= Math.min(topics1.size, topics2.size) * 0.5
}

export function checkRateLimit(context: MessageContext) {
  const now = Date.now()
  
  // Clean up old context entries
  for (const [key, value] of requestTracker.recentContexts.entries()) {
    if (now - value.timestamp > RATE_LIMIT.CONTEXT_CACHE_MS) {
      requestTracker.recentContexts.delete(key)
    }
  }

  // Check for similar recent contexts
  for (const [, recentContext] of requestTracker.recentContexts.entries()) {
    if (areContextsSimilar(context, recentContext)) {
      throw new Error('Similar research context was recently processed. Please wait before requesting similar suggestions.')
    }
  }

  // Reset counter if window has passed
  if (now - requestTracker.resetTime >= RATE_LIMIT.WINDOW_MS) {
    requestTracker.requestCount = 0
    requestTracker.resetTime = now
  }

  // Check rate limit
  if (requestTracker.requestCount >= RATE_LIMIT.MAX_REQUESTS) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }

  // Check minimum interval
  const timeSinceLastRequest = now - requestTracker.lastRequestTime
  if (timeSinceLastRequest < RATE_LIMIT.MIN_INTERVAL_MS) {
    throw new Error(`Please wait ${Math.ceil((RATE_LIMIT.MIN_INTERVAL_MS - timeSinceLastRequest) / 1000)} seconds before making another request.`)
  }

  // Update tracking
  requestTracker.lastRequestTime = now
  requestTracker.requestCount++
  requestTracker.recentContexts.set(context.id, {
    timestamp: now,
    mainTopic: context.main_topic,
    relatedTopics: context.related_topics
  })
} 