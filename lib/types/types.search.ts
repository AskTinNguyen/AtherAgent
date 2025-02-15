// Search Result Types
export type SearchResultItem = {
  title: string
  url: string
  content: string
  relevance: number
  depth?: number
}

export interface SearchResults {
  results: SearchResultItem[]
  images?: SearchResultImage[]
  directUrls?: string[]
  number_of_results?: number
  query: string
}

export type SearchResultImage = {
  url: string
  title?: string
  thumbnail?: string
}

// SearXNG Types
export interface SearXNGResult {
  title: string
  url: string
  content: string
  img_src?: string
  publishedDate?: string
  score?: number
}

export interface SearXNGResponse {
  query: string
  number_of_results: number
  results: SearXNGResult[]
}

export type SearXNGImageResult = string

export type SearXNGSearchResults = {
  images: SearXNGImageResult[]
  results: SearchResultItem[]
  number_of_results?: number
  query: string
}

// Provider-specific Types
export type ExaSearchResults = {
  results: ExaSearchResultItem[]
}

export type SerperSearchResults = {
  searchParameters: {
    q: string
    type: string
    engine: string
  }
  videos: SerperSearchResultItem[]
}

export type ExaSearchResultItem = {
  score: number
  title: string
  id: string
  url: string
  publishedDate: Date
  author: string
}

export type SerperSearchResultItem = {
  title: string
  link: string
  snippet: string
  imageUrl: string
  duration: string
  source: string
  channel: string
  date: string
  position: number
}

export interface SearchSource {
  url: string
  title?: string
  snippet?: string
  timestamp: number
  messageId: string
  searchQuery?: string
} 