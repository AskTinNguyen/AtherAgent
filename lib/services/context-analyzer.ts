import { type MessageContext } from '@/lib/types/research-enhanced'

export interface AnalyzeMessagesOptions {
  messages: {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }[]
  sessionId: string
  recentSearchQueries?: string[]
}

export async function analyzeMessageContext(options: AnalyzeMessagesOptions): Promise<MessageContext> {
  try {
    const response = await fetch('/api/research/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to analyze messages')
    }

    const context = await response.json()
    return context
  } catch (error) {
    console.error('Error analyzing message context:', error)
    throw error
  }
} 