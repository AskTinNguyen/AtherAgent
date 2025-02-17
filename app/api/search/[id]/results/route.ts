import {
  clearStoredSearchResults,
  getStoredSearchResults,
  storeSearchResults
} from '@/lib/redis/search-results'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing required parameter (id)' },
        { status: 400 }
      )
    }

    const query = req.nextUrl.searchParams.get('q')
    if (!query) {
      return NextResponse.json(
        { error: 'Missing required parameter (q)' },
        { status: 400 }
      )
    }

    const results = await getStoredSearchResults(chatId, query)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error getting stored search results:', error)
    return NextResponse.json(
      { error: 'Failed to get stored search results' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing required parameter (id)' },
        { status: 400 }
      )
    }

    const body = await req.json()
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { query, results } = body
    
    if (!query || !results) {
      return NextResponse.json(
        { error: 'Missing required parameters (query, results)' },
        { status: 400 }
      )
    }

    await storeSearchResults(chatId, query, results)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    console.error('Error storing search results:', error)
    return NextResponse.json(
      { error: 'Failed to store search results' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing required parameter (id)' },
        { status: 400 }
      )
    }

    const query = req.nextUrl.searchParams.get('q')
    
    await clearStoredSearchResults(chatId, query || undefined)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing stored search results:', error)
    return NextResponse.json(
      { error: 'Failed to clear stored search results' },
      { status: 500 }
    )
  }
} 