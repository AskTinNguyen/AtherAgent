import { getStoredSearchResults, storeSearchResults } from '@/lib/redis/search-results'
import { searchSchema } from '@/lib/schema/search'
import { getSourcesBySession } from '@/lib/supabase/search-sources'
import { performSearch } from '@/lib/tools/search'
import { NextRequest } from 'next/server'
import { z } from 'zod'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id
    const body = await req.json()
    
    // Validate request body against our schema
    const validatedData = searchSchema.parse(body)

    // First check if we have cached results
    const cachedResults = await getStoredSearchResults(chatId, validatedData.query)
    if (cachedResults) {
      return new Response(JSON.stringify({
        success: true,
        results: cachedResults,
        source: 'cache'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // If no cache, perform the search
    const searchResults = await performSearch(validatedData)
    
    // Store results in both Redis and Supabase
    // Note: messageId will be undefined for direct searches
    await storeSearchResults(chatId, validatedData.query, searchResults)

    return new Response(JSON.stringify({
      success: true,
      results: searchResults,
      source: 'search'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Search API error:', error)
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to perform search'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// GET endpoint to retrieve stored sources for a session
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id
    
    // Get sources from Supabase
    const sources = await getSourcesBySession(chatId)
    
    return new Response(JSON.stringify({
      success: true,
      sources
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error fetching sources:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch sources'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 