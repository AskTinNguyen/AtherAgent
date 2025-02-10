import { cleanupOldBookmarkData } from '@/lib/redis/utils/bookmark-cleanup'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/bookmarks/cleanup
export async function POST(request: NextRequest) {
  try {
    const result = await cleanupOldBookmarkData()
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully cleaned up old bookmark data',
      deletedKeys: result.deletedKeys
    })
  } catch (error) {
    console.error('Failed to clean up bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to clean up bookmarks' },
      { status: 500 }
    )
  }
} 