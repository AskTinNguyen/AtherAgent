import { getRedisClient } from '@/lib/redis/config'
import { type TokenUsage } from '@/lib/types/types.core'
import {
  type RedisUsageData,
  type TimeRange,
  type TrackUsageParams,
  type UsageAnalytics,
  type UsageInfo,
  type UsageTracker,
  type UsageTrackerConfig,
  type UserUsage
} from '@/lib/types/types.usage'

const USER_USAGE_PREFIX = 'usage:'

// Implementation
export function createUsageTracker(config: UsageTrackerConfig): UsageTracker {
  const { userId, modelTokenCounter } = config
  
  if (!userId) throw new Error('UserId is required')
  
  const getUserKey = () => `${USER_USAGE_PREFIX}${userId}`

  const getUserUsage = async (): Promise<UserUsage> => {
    const redis = await getRedisClient()
    const userKey = getUserKey()

    try {
      const data = await redis.hgetall<RedisUsageData>(userKey)

      if (!data || !data.userId) {
        return {
          userId,
          totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          modelUsage: {},
          lastUpdated: Date.now()
        }
      }

      return {
        userId: data.userId,
        totalUsage: JSON.parse(data.totalUsage),
        modelUsage: JSON.parse(data.modelUsage),
        lastUpdated: parseInt(data.lastUpdated)
      }
    } catch (error) {
      console.error('Error getting user usage:', error)
      return {
        userId,
        totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        modelUsage: {},
        lastUpdated: Date.now()
      }
    }
  }

  return {
    trackUsage: async ({ model, chatId, usage, finishReason = 'stop' }: TrackUsageParams) => {
      if (!model) throw new Error('Model is required')
      if (!chatId) throw new Error('ChatId is required')
      if (!usage) throw new Error('Usage is required')

      try {
        const usageInfo: UsageInfo = {
          finishReason,
          usage,
          timestamp: Date.now(),
          model,
          chatId
        }

        // Get current usage data
        const redis = await getRedisClient()
        const userKey = getUserKey()
        const currentData = await getUserUsage()

        // Update model-specific usage
        if (!currentData.modelUsage[model]) {
          currentData.modelUsage[model] = {
            model,
            totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            usageHistory: []
          }
        }

        // Update totals
        currentData.totalUsage.promptTokens += usage.promptTokens
        currentData.totalUsage.completionTokens += usage.completionTokens
        currentData.totalUsage.totalTokens += usage.totalTokens

        const modelUsage = currentData.modelUsage[model]
        modelUsage.totalUsage.promptTokens += usage.promptTokens
        modelUsage.totalUsage.completionTokens += usage.completionTokens
        modelUsage.totalUsage.totalTokens += usage.totalTokens
        modelUsage.usageHistory.unshift(usageInfo)

        // Update timestamp
        currentData.lastUpdated = Date.now()

        // Save to Redis
        await redis.hmset(userKey, {
          userId,
          totalUsage: JSON.stringify(currentData.totalUsage),
          modelUsage: JSON.stringify(currentData.modelUsage),
          lastUpdated: currentData.lastUpdated.toString()
        })
      } catch (error) {
        console.error('Error tracking usage:', error)
        throw new Error('Failed to track usage')
      }
    },

    getUserUsage,

    getModelUsage: async (model: string) => {
      if (!model) throw new Error('Model is required')
      const userData = await getUserUsage()
      return userData.modelUsage[model]?.totalUsage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    },

    getAnalytics: async (timeRange: TimeRange): Promise<UsageAnalytics> => {
      const userData = await getUserUsage()
      
      const modelBreakdown: Record<string, TokenUsage> = {}
      Object.entries(userData.modelUsage).forEach(([model, usage]) => {
        modelBreakdown[model] = usage.totalUsage
      })

      return {
        timeRange,
        totalUsage: userData.totalUsage,
        averageUsagePerChat: {
          promptTokens: 0, // TODO: Implement average calculation
          completionTokens: 0,
          totalTokens: 0
        },
        modelBreakdown
      }
    }
  }
}
