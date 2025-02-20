// lib/services/suggestion-generator.ts
import { createClient } from '@/lib/supabase/client'
import { type MessageContext, type ResearchSuggestion } from '@/lib/types/research-enhanced'

export interface GenerateSuggestionsOptions {
  context: MessageContext
  currentDepth: number
  maxDepth: number
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

    console.log('Successfully generated suggestions:', suggestions)
    return suggestions
  } catch (error) {
    console.error('Error in generateResearchSuggestions:', error)
    throw error
  }
}