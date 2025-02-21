// lib/services/suggestion-generator.ts
import { createClient } from '@/lib/supabase/client'
import { type MessageContext, type ResearchSuggestion } from '@/lib/types/research-enhanced'

export interface GenerateSuggestionsOptions {
  context: MessageContext
  currentDepth: number
  maxDepth: number
}

// New function to mark a suggestion as used
export async function markSuggestionAsUsed(suggestionId: string): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('research_suggestions')
      .update({ used_at: new Date().toISOString() })
      .eq('id', suggestionId)

    if (error) {
      console.error('Error marking suggestion as used:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in markSuggestionAsUsed:', error)
    throw error
  }
}

export async function fetchStoredSuggestions(sessionId: string): Promise<ResearchSuggestion[]> {
  try {
    console.log('Fetching suggestions for session:', sessionId)
    const supabase = createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    const { data: suggestions, error } = await supabase
      .from('research_suggestions')
      .select('*')
      .eq('session_id', sessionId)
      .is('used_at', null)
      .order('confidence', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching suggestions:', error)
      throw error
    }

    console.log('Fetched suggestions:', suggestions?.length || 0, 'results')
    return suggestions || []
  } catch (error) {
    console.error('Error in fetchStoredSuggestions:', error)
    throw error
  }
}

export async function generateResearchSuggestions(options: GenerateSuggestionsOptions): Promise<ResearchSuggestion[]> {
  try {
    console.log('Generating suggestions with options:', {
      mainTopic: options.context.main_topic,
      currentDepth: options.currentDepth,
      maxDepth: options.maxDepth
    })

    // Get the current session
    const supabase = createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    const response = await fetch('/api/research/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(options),
      credentials: 'include' // Include cookies in the request
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Suggestion API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(errorData.error || 'Failed to generate suggestions')
    }

    const suggestions = await response.json()
    
    if (!Array.isArray(suggestions)) {
      console.error('Invalid suggestions format:', suggestions)
      throw new Error('Invalid suggestions response format')
    }

    // Store suggestions in Supabase after generation
    try {
      console.log('Storing new suggestions in Supabase...')
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('research_suggestions')
        .insert(suggestions.map(suggestion => ({
          ...suggestion,
          session_id: options.context.session_id,
          created_at: new Date().toISOString()
        })))

      if (insertError) {
        console.error('Error storing suggestions:', insertError)
      } else {
        console.log('Successfully stored suggestions in Supabase')
      }
    } catch (error) {
      console.error('Error storing suggestions:', error)
    }

    console.log('Successfully generated suggestions:', suggestions)
    return suggestions
  } catch (error) {
    console.error('Error in generateResearchSuggestions:', error)
    throw error
  }
}