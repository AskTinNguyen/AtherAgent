export interface SearchResultItem {
  url: string
  title: string
  content: string
  depth?: number
  publishedDate?: string
  relevance?: number
  domain?: string
  favicon?: string
}

export interface SearchResults {
  results: SearchResultItem[]
  totalResults?: number
  nextPage?: string
  searchTime?: number
  provider?: string
  directUrls?: string[]
  images?: {
    url: string
    title: string
    thumbnail?: string
  }[]
}

export interface SearchOptions {
  query: string
  maxResults?: number
  includeDomains?: string[]
  excludeDomains?: string[]
  depth?: 'basic' | 'advanced'
  imageSearch?: boolean
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all'
}

export interface SearchSource {
  url: string
  title: string
  content: string
  publishedDate?: string
  domain?: string
  favicon?: string
} 