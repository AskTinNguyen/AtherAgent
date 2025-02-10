import { verifyBookmarkCleanup } from '@/lib/redis/utils/bookmark-verify'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bookmarks/cleanup/verify
export async function GET(request: NextRequest) {
  try {
    const result = await verifyBookmarkCleanup()
    
    return NextResponse.json({
      isClean: result.isClean,
      remainingKeys: result.remainingKeys
    })
  } catch (error) {
    console.error('Failed to verify bookmark cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to verify bookmark cleanup' },
      { status: 500 }
    )
  }
} 