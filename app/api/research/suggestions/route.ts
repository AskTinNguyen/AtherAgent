import { getAuthenticatedUser } from '@/lib/services/suggestions/auth'
import { generateAISuggestions } from '@/lib/services/suggestions/openai'
import { checkRateLimit } from '@/lib/services/suggestions/rate-limiter'
import { storeSuggestions } from '@/lib/services/suggestions/storage'
import { type MessageContext } from '@/lib/types/research-enhanced'

interface SuggestionRequest {
  context: MessageContext
  currentDepth: number
  maxDepth: number
}

export async function POST(req: Request) {
  try {
    // Get authenticated user and Supabase client
    const { supabase, session } = await getAuthenticatedUser()

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
        session.user.id
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
    return Response.json(
      { error: 'Failed to process suggestion request' },
      { status: 500 }
    )
  }
} 