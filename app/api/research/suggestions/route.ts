import { getAuthenticatedUser } from '@/lib/services/suggestions/auth'
import { generateAISuggestions } from '@/lib/services/suggestions/openai'
import { checkRateLimit } from '@/lib/services/suggestions/rate-limiter'
import { storeSuggestions } from '@/lib/services/suggestions/storage'
import { type MessageContext } from '@/lib/types/research-enhanced'
import { NextResponse } from 'next/server'

interface SuggestionRequest {
  context: MessageContext
  currentDepth: number
  maxDepth: number
}

export async function POST(req: Request) {
  try {
    // Get authenticated user and Supabase client
    const { supabase, user } = await getAuthenticatedUser()

    // Parse request body
    const { context, currentDepth, maxDepth } = (await req.json()) as SuggestionRequest

    // Validate context structure
    if (!context || !context.id || !context.session_id || !context.main_topic) {
      console.error('Invalid context structure:', context)
      return Response.json(
        { error: 'Invalid context structure. Missing required fields.' },
        { status: 400 }
      )
    }

    // Check rate limits
    try {
      checkRateLimit(context)
    } catch (err) {
      const error = err as Error
      console.log('Rate limit error:', error.message)
      return Response.json({ error: error.message }, { status: 429 })
    }

    // Generate AI suggestions
    let suggestions
    try {
      suggestions = await generateAISuggestions(context, currentDepth, maxDepth)
    } catch (err) {
      const error = err as Error
      console.error('Failed to generate suggestions:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Store suggestions in database
    try {
      const data = await storeSuggestions(
        supabase,
        context,
        suggestions,
        currentDepth,
        user.id
      )
      return Response.json(data)
    } catch (err) {
      const error = err as Error
      console.error('Failed to store suggestions:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
  } catch (err) {
    const error = err as Error
    console.error('Error in suggestions route:', error)
    if (error.message === 'Authentication required') {
      return Response.json({ error: 'User not authenticated' }, { status: 401 })
    }
    return Response.json(
      { error: 'Failed to process suggestion request' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Use the same auth helper as POST route
    const { supabase, user } = await getAuthenticatedUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // First verify session ownership
    const { data: sessionData, error: sessionError } = await supabase
      .from('research_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !sessionData) {
      console.error('Session verification failed:', sessionError)
      return NextResponse.json(
        { error: 'Invalid session or unauthorized access' },
        { status: 403 }
      )
    }

    // Fetch suggestions for the verified session
    const { data: suggestions, error: fetchError } = await supabase
      .from('research_suggestions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching suggestions:', fetchError)
      return NextResponse.json(
        { error: `Failed to fetch suggestions: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!suggestions) {
      return NextResponse.json([], { status: 200 }) // Return empty array if no suggestions found
    }

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error in GET /api/research/suggestions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    if (errorMessage === 'Authentication required') {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 