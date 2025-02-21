import { getRedisClient } from '@/lib/redis/config'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const redis = await getRedisClient()
    const data = await redis.get(key)
    return NextResponse.json(data ? JSON.parse(data) : null)
  } catch (error) {
    console.error('Error fetching from cache:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from cache' },
      { status: 500 }
    )
  }
} 