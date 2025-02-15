import { NextRequest } from 'next/server'
import { createBookmarkSchema, validateRequest } from '@/lib/api/validation'
import { successResponse, handleAPIError, NotFoundError } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import type { 
  BookmarkListResponse, 
  BookmarkResponse,
  BookmarkCheckResponse,
  Bookmark 
} from '@/lib/types/api/responses'
import type { 
  CreateBookmarkRequest,
  UpdateBookmarkRequest 
} from '@/lib/types/api/requests'

export async function GET(): Promise<BookmarkListResponse> {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return successResponse<Bookmark[]>(bookmarks)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(
  request: NextRequest
): Promise<BookmarkResponse> {
  try {
    const data = await validateRequest<CreateBookmarkRequest>(request, createBookmarkSchema)
    
    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        url: data.url
      }
    })
    
    if (existingBookmark) {
      return successResponse<Bookmark>(existingBookmark)
    }
    
    const bookmark = await prisma.bookmark.create({
      data: {
        url: data.url,
        title: data.title,
        snippet: data.snippet,
        source: data.source,
        tags: data.tags,
        metadata: data.metadata
      }
    })

    return successResponse<Bookmark>(bookmark)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function PUT(
  request: NextRequest
): Promise<BookmarkResponse> {
  try {
    const { id, ...updates } = await request.json() as UpdateBookmarkRequest & { id: string }
    
    const bookmark = await prisma.bookmark.findUnique({
      where: { id }
    })
    
    if (!bookmark) {
      throw new NotFoundError('Bookmark not found')
    }
    
    const updatedBookmark = await prisma.bookmark.update({
      where: { id },
      data: updates
    })

    return successResponse<Bookmark>(updatedBookmark)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function DELETE(
  request: NextRequest
): Promise<BookmarkResponse> {
  try {
    const { id } = await request.json()
    
    const bookmark = await prisma.bookmark.findUnique({
      where: { id }
    })
    
    if (!bookmark) {
      throw new NotFoundError('Bookmark not found')
    }
    
    const deletedBookmark = await prisma.bookmark.delete({
      where: { id }
    })

    return successResponse<Bookmark>(deletedBookmark)
  } catch (error) {
    return handleAPIError(error)
  }
}
