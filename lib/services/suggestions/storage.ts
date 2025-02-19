import { type MessageContext } from '@/lib/types/research-enhanced'
import { type SupabaseClient } from '@supabase/supabase-js'
import { type GeneratedSuggestion } from './openai'

export async function storeSuggestions(
  supabase: SupabaseClient,
  context: MessageContext,
  suggestions: GeneratedSuggestion[],
  currentDepth: number,
  userId: string
) {
  // First, verify the session exists and user has access
  const { data: sessionData, error: verifyError } = await supabase
    .from('research_sessions')
    .select('id')
    .eq('id', context.session_id)
    .eq('user_id', userId)
    .single()

  if (verifyError || !sessionData) {
    throw new Error('Invalid session or unauthorized access')
  }

  // Prepare the suggestions data
  const suggestionsData = suggestions.map((suggestion) => ({
    id: crypto.randomUUID(),
    session_id: context.session_id,
    context_id: context.id,
    type: suggestion.type,
    content: suggestion.content,
    confidence: suggestion.confidence,
    metadata: {
      depth_level: currentDepth + 1,
      related_topics: suggestion.related_topics
    },
    created_at: new Date().toISOString()
  }))

  // Store suggestions in database
  const { data, error } = await supabase
    .from('research_suggestions')
    .upsert(suggestionsData, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select()
  
  if (error) {
    throw new Error(`Failed to store suggestions: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    throw new Error('No data returned from suggestion storage')
  }

  return data
} 