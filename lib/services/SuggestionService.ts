export interface Suggestion {
  id: string
  content: string
  status: 'pending' | 'refreshing' | 'selected'
  depth_level: number
  timestamp: string
}

interface GenerateSuggestionsParams {
  messages: { role: string; content: string; timestamp: string }[]
  chatId: string
  recentSearchQueries: string[]
  currentDepth: number
  maxDepth: number
  context: {
    main_topic: string
    session_id: string
    id: string
    related_topics: string[]
    depth_level: number
    message_count: number
    last_message_timestamp: string
  }
}

export class SuggestionService {
  static async generateSuggestions({
    messages,
    chatId,
    recentSearchQueries,
    currentDepth,
    maxDepth,
    context
  }: GenerateSuggestionsParams): Promise<Suggestion[]> {
    try {
      // Call OpenAI to generate suggestions based on context
      const response = await fetch('/api/suggestions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          chatId,
          recentSearchQueries,
          currentDepth,
          maxDepth,
          context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate suggestions')
      }

      const data = await response.json()
      return data.suggestions.map((suggestion: any) => ({
        id: crypto.randomUUID(),
        content: suggestion.content,
        status: 'pending',
        depth_level: currentDepth,
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error in generateSuggestions:', error)
      throw error
    }
  }
} 