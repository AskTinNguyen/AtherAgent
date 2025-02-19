import { type MessageContext, type ResearchSuggestion } from '@/lib/types/research-enhanced';

export class SuggestionService {
  static async generateSuggestions(options: {
    messages: Array<{ role: string; content: string; timestamp: string }>
    chatId: string
    recentSearchQueries: string[]
    currentDepth: number
    maxDepth: number
  }): Promise<ResearchSuggestion[]> {
    const { messages, chatId, recentSearchQueries, currentDepth, maxDepth } = options

    // Analyze context
    const context = await this.analyzeContext({
      messages,
      sessionId: chatId,
      recentSearchQueries
    })

    // Generate suggestions
    const response = await fetch('/api/research/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        context,
        currentDepth,
        maxDepth
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate suggestions')
    }

    const suggestions = await response.json()
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions response format')
    }

    return suggestions
  }

  static async markSuggestionAsUsed(suggestionId: string): Promise<{ updated_at: string }> {
    const response = await fetch(`/api/research/suggestions/${suggestionId}/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark suggestion as used')
    }

    return data
  }

  private static async analyzeContext(options: {
    messages: Array<{ role: string; content: string; timestamp: string }>
    sessionId: string
    recentSearchQueries: string[]
  }): Promise<MessageContext> {
    const response = await fetch('/api/research/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to analyze context')
    }

    return response.json()
  }

  static async getStoredSuggestions(chatId: string): Promise<ResearchSuggestion[]> {
    const response = await fetch(`/api/research/suggestions?sessionId=${chatId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch stored suggestions')
    }

    const suggestions = await response.json()
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions response format')
    }

    return suggestions
  }
} 