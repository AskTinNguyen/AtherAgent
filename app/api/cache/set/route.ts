import { getRedisClient } from '@/lib/redis/config'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    const redis = await getRedisClient()
    // Set with 5 minute expiration
    await redis.set(key, JSON.stringify(value), { ex: 300 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting cache:', error)
    return NextResponse.json(
      { error: 'Failed to set cache' },
      { status: 500 }
    )
  }
} 