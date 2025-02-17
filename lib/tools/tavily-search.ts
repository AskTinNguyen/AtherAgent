import type {
  BaseSearchResult,
  SearchImage,
  SearchOptions,
  SearchResults
} from '@/lib/types/search.types'
import { sanitizeUrl } from '@/lib/utils'
import { createBaseMetadata, createImageMetadata } from '@/lib/utils/search-utils'

export interface TavilySearchOptions {
  searchDepth: 'basic' | 'advanced'
  topic: 'news' | 'general'
  timeRange: string
  includeAnswer: 'basic' | 'advanced' | 'none'
  includeImages: boolean
  includeRawContent: boolean
  maxResults: number
  includeDomains?: string[]
  excludeDomains?: string[]
}

export interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
  publishedDate?: string
}

export interface TavilyImage {
  url: string
  description?: string
}

export interface TavilyResponse {
  results: TavilyResult[]
  images?: (TavilyImage | string)[]
  query: string
}

/**
 * Creates Tavily API options from the standard search options
 */
function createTavilyOptions(
  options: Partial<Omit<SearchOptions, 'query'>>
): TavilySearchOptions {
  return {
    searchDepth: options.search_depth || 'basic',
    topic: options.topic || "general",
    timeRange: options.time_range || "w",
    includeAnswer: options.include_answer || 'basic',
    includeImages: options.include_images ?? true,
    includeRawContent: options.include_raw_content ?? false,
    maxResults: Math.min(options.max_results ?? 10, 10),
    includeDomains: options.include_domains,
    excludeDomains: options.exclude_domains
  }
}

/**
 * Maps Tavily web results to standard BaseSearchResult format
 */
function mapTavilyToWebResults(
  results: TavilyResponse['results'],
  query: string,
  options: Partial<Omit<SearchOptions, 'query'>>
): BaseSearchResult[] {
  return results?.map(result => ({
    title: result.title || 'Untitled',
    url: sanitizeUrl(result.url) || '',
    description: result.content || null,
    relevance: result.score || 1,
    type: 'webpage',
    metadata: createBaseMetadata('web', result.content, result.publishedDate),
    depth_level: options.depth_level ?? 1,
    search_query: query,
    search_source: 'tavily'
  })) || []
}

/**
 * Maps Tavily image results to standard SearchImage format
 */
function mapTavilyToImageResults(
  images: TavilyResponse['images'],
  query: string,
  options: Partial<Omit<SearchOptions, 'query'>>
): SearchImage[] {
  return images?.map(img => {
    const url = sanitizeUrl(typeof img === 'string' ? img : img.url)
    if (!url) throw new Error('Invalid image URL')
    
    return {
      url,
      title: typeof img === 'string' ? 'Image' : (img.description || 'Image'),
      description: typeof img === 'string' ? null : (img.description || null),
      relevance: 1,
      type: 'image',
      thumbnailUrl: url,
      metadata: createImageMetadata(),
      depth_level: options.depth_level ?? 1,
      search_query: query,
      search_source: 'tavily'
    }
  }) || []
}

/**
 * Main Tavily search function that handles:
 * 1. API key validation
 * 2. Options transformation
 * 3. API call execution
 * 4. Results mapping
 */
export async function tavilySearch(
  query: string,
  options: Partial<Omit<SearchOptions, 'query'>> = {}
): Promise<SearchResults> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) throw new Error('TAVILY_API_KEY is not set')

  try {
    const { tavily } = require('@tavily/core')
    const client = tavily({ apiKey })
    const tavilyOptions = createTavilyOptions(options)
    const response = await client.search(query, tavilyOptions) as TavilyResponse

    const results = mapTavilyToWebResults(response.results, query, options)
    const images = mapTavilyToImageResults(response.images, query, options)

    return { results, total: results.length, images }
  } catch (error) {
    console.error('Tavily API error:', error)
    throw error
  }
} 