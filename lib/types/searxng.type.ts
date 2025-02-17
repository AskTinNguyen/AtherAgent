import { BaseSearchResult } from './search.types'

export interface SearXNGResult extends BaseSearchResult {
  domain: string
  favicon?: string
  img_src?: string
  score?: number
  publishedDate?: string
  content?: string
  description: string | null
}

export interface SearXNGResponse {
  query: string
  number_of_results: number
  results: SearXNGResult[]
}

export interface CrawlResult {
  content: string
  publishedDate?: string
  score?: number
}

export interface SearXNGSearchOptions {
  query: string
  maxResults?: number
  searchDepth?: 'basic' | 'advanced'
  includeDomains?: string[]
  excludeDomains?: string[]
  timeRange?: string
  engines?: string
  safeSearch?: string
} 