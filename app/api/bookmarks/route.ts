import {
  createBookmark,
  deleteBookmark,
  getUserBookmarks,
  updateBookmark
} from '@/lib/redis/bookmarks/operations'
import { BookmarkType, ResearchMetadata } from '@/lib/redis/types/bookmarks'
import { NextRequest, NextResponse } from 'next/server'

// Input validation types
interface CreateBookmarkRequest {
  userId: string
  type: BookmarkType
  content: string
  metadata?: Partial<ResearchMetadata>
}

interface UpdateBookmarkRequest {
  bookmarkId: string
  userId: string
  updates: {
    content?: string
    metadata?: {
      depthLevel?: number
      relevanceScore?: number
      sourceContext?: string
      relatedTopics?: string[]
      previousQueries?: string[]
      sourceQuality?: {
        relevance?: number
        authority?: number
        freshness?: number
        coverage?: number
      }
    }
    organization?: {
      category?: string
      tags?: string[]
      folderId?: string
      collectionId?: string
      order?: number
    }
  }
}

/**
 * GET /api/bookmarks
 * Retrieves bookmarks with optional filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'anonymous'
    const category = searchParams.get('category') || undefined
    const tag = searchParams.get('tag') || undefined
    const type = searchParams.get('type') as BookmarkType | undefined
    const sortBy = searchParams.get('sortBy') as 'created' | 'accessed' | 'effectiveness' | undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined

    const bookmarks = await getUserBookmarks(userId, {
      category,
      tag,
      type,
      sortBy,
      limit,
      offset
    })

    return NextResponse.json(bookmarks)
  } catch (error) {
    console.error('Failed to get bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to get bookmarks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookmarks
 * Creates a new bookmark, primarily used for saving research findings and sources
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateBookmarkRequest
    const { userId = 'anonymous', type, content, metadata } = body

    // Basic validation
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    // Ensure metadata has all required fields
    const validatedMetadata: Partial<ResearchMetadata> = {
      depthLevel: metadata?.depthLevel ?? 0,
      relevanceScore: metadata?.relevanceScore ?? 0,
      sourceContext: metadata?.sourceContext ?? '',
      relatedTopics: metadata?.relatedTopics ?? [],
      previousQueries: metadata?.previousQueries ?? [],
      sourceQuality: {
        relevance: metadata?.sourceQuality?.relevance ?? 0,
        authority: metadata?.sourceQuality?.authority ?? 0,
        freshness: metadata?.sourceQuality?.freshness ?? 0,
        coverage: metadata?.sourceQuality?.coverage ?? 0
      }
    }

    const bookmark = await createBookmark(userId, type, content, validatedMetadata)
    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Failed to create bookmark:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/bookmarks
 * Updates a bookmark's content, metadata, or organization
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as UpdateBookmarkRequest
    const { bookmarkId, userId, updates } = body

    if (!bookmarkId || !userId) {
      return NextResponse.json(
        { error: 'Bookmark ID and user ID are required' },
        { status: 400 }
      )
    }

    // Convert the updates to match the EnhancedBookmark structure
    const enhancedUpdates = {
      content: updates.content,
      metadata: updates.metadata ? {
        depthLevel: updates.metadata.depthLevel ?? 0,
        relevanceScore: updates.metadata.relevanceScore ?? 0,
        sourceContext: updates.metadata.sourceContext ?? '',
        relatedTopics: updates.metadata.relatedTopics ?? [],
        previousQueries: updates.metadata.previousQueries ?? [],
        sourceQuality: {
          relevance: updates.metadata.sourceQuality?.relevance ?? 0,
          authority: updates.metadata.sourceQuality?.authority ?? 0,
          freshness: updates.metadata.sourceQuality?.freshness ?? 0,
          coverage: updates.metadata.sourceQuality?.coverage ?? 0
        }
      } : undefined,
      organization: updates.organization ? {
        category: updates.organization.category ?? 'uncategorized',
        tags: updates.organization.tags ?? [],
        folderId: updates.organization.folderId,
        collectionId: updates.organization.collectionId,
        order: updates.organization.order ?? 0
      } : undefined
    }

    const bookmark = await updateBookmark(bookmarkId, enhancedUpdates)
    
    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (bookmark.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Failed to update bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bookmarks
 * Removes a bookmark and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'anonymous'
    const bookmarkId = searchParams.get('bookmarkId')

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      )
    }

    const success = await deleteBookmark(bookmarkId, userId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Bookmark not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    )
  }
} 