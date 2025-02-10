export interface SearchResult {
  url: string
  title: string
  content: string
  relevance: number
  depth: number
  source?: string
  timestamp?: number
  metadata?: Record<string, any>
}

export interface SearchSource {
  url: string
  title?: string
  content?: string
  type?: string
} 