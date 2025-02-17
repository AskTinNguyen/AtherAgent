export interface SearchResult {
  url: string
  title: string
  snippet?: string
  content: string
  relevance?: number
  language?: string
  wordCount?: number
  status?: number
  contentType?: string
  encoding?: string
  depth?: number
  keywords?: string[]
}

export interface SearchImage {
  url: string
  title: string
  thumbnail?: string
  description?: string
}

// Base interface with common properties
interface BaseSearchResults {
  total?: number
  nextPage?: string
  metadata?: Record<string, any>
  images: SearchImage[]
  number_of_results?: number
  items?: SearchResult[]
  results?: SearchResult[]
}

// For backward compatibility, allow either items or results array
export type SearchResults = BaseSearchResults

export type SearchDepth = 'basic' | 'advanced'
export type SearchTimeRange = 'day' | 'week' | 'month' | 'year'
export type SearchAnswerType = 'basic' | 'advanced'
export type SearchTopic = 'news' | 'general'