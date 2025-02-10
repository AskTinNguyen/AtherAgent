import { createUsageTracker } from '@/lib/services/usage-tracker'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession()

  if (!session) {
    console.log('GET /api/usage: Unauthorized - No session')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Use demo user ID for now, in production this would be the actual user ID
    const usageTracker = createUsageTracker({ userId: 'demo' })
    const usage = await usageTracker.getUserUsage()
    console.log('GET /api/usage: Success', { usage })
    return NextResponse.json(usage)
  } catch (error) {
    console.error('GET /api/usage: Error fetching usage:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession()

  if (!session) {
    console.log('POST /api/usage: Unauthorized - No session')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    console.log('POST /api/usage: Received request', { body })
    
    const { model, chatId, usage, finishReason } = body

    if (!model || !chatId || !usage) {
      console.log('POST /api/usage: Missing required fields', { model, chatId, usage })
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const usageTracker = createUsageTracker({ userId: 'demo' })
    await usageTracker.trackUsage({
      model,
      chatId,
      usage,
      finishReason: finishReason || 'stop'
    })

    console.log('POST /api/usage: Successfully tracked usage', {
      model,
      chatId,
      usage,
      finishReason
    })

    return new NextResponse('OK')
  } catch (error) {
    console.error('POST /api/usage: Error tracking usage:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 