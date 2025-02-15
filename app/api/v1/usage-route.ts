import { NextRequest } from 'next/server'
import { trackUsageSchema, validateRequest } from '@/lib/api/validation'
import { successResponse, handleAPIError } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import type { UsageStatsResponse, UsageStats } from '@/lib/types/api/responses'
import type { TrackUsageRequest } from '@/lib/types/api/requests'

export async function GET(): Promise<UsageStatsResponse> {
  try {
    // Get current period's usage stats
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const usageStats = await prisma.usage.findFirst({
      where: {
        periodStart: firstDayOfMonth
      }
    }) || {
      totalRequests: 0,
      totalTokens: 0,
      modelUsage: {},
      periodStart: firstDayOfMonth,
      periodEnd: now
    }

    return successResponse<UsageStats>(usageStats)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(
  request: NextRequest
): Promise<UsageStatsResponse> {
  try {
    const data = await validateRequest<TrackUsageRequest>(request, trackUsageSchema)
    
    // Get or create current period's usage stats
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const usageStats = await prisma.usage.upsert({
      where: {
        periodStart: firstDayOfMonth
      },
      create: {
        totalRequests: 1,
        totalTokens: data.tokens,
        modelUsage: {
          [data.model]: {
            requests: 1,
            tokens: data.tokens
          }
        },
        periodStart: firstDayOfMonth,
        periodEnd: now,
        metadata: data.metadata
      },
      update: {
        totalRequests: { increment: 1 },
        totalTokens: { increment: data.tokens },
        modelUsage: {
          [data.model]: {
            requests: { increment: 1 },
            tokens: { increment: data.tokens }
          }
        },
        periodEnd: now,
        metadata: data.metadata
      }
    })

    return successResponse<UsageStats>(usageStats)
  } catch (error) {
    return handleAPIError(error)
  }
}
