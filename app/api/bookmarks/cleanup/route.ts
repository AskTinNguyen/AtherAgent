import { cleanupBookmarkData, verifyCleanup } from '@/lib/redis/utils/bookmark-cleanup'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/bookmarks/cleanup
export async function POST(request: NextRequest) {
  try {
    // Perform cleanup
    const { deletedKeys, success } = await cleanupBookmarkData()
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cleanup bookmark data' },
        { status: 500 }
      )
    }

    // Verify cleanup
    const { remainingKeys, isClean } = await verifyCleanup()
    
    return NextResponse.json({
      success: true,
      deletedKeysCount: deletedKeys.length,
      deletedKeys,
      isClean,
      remainingKeys
    })
  } catch (error) {
    console.error('Error in bookmark cleanup endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process cleanup request' },
      { status: 500 }
    )
  }
} 