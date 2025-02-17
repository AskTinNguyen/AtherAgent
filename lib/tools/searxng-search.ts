import type {
  BaseSearchResult,
  SearchImage,
  SearchOptions,
  SearchResults
} from '@/lib/types/search.types'
import { SearXNGResult } from '@/lib/types/searxng.type'
import { crawlPage } from '@/lib/utils/crawl-utils'
import { fetchJsonWithRetry } from '@/lib/utils/http-utils'
import { createBaseMetadata, createImageMetadata } from '@/lib/utils/search-utils'

interface SearXNGRawResult {
  url: string
  title: string
  content: string
  img_src?: string
  publishedDate?: string
  score?: number
  domain: string
  favicon?: string
}

interface SearXNGRawResponse {
  query: string
  results: SearXNGRawResult[]
  number_of_results?: number
}

interface SearchEngineOptions {
  format: 'json'
  categories: string
  time_range?: string
  safesearch?: string
  engines?: string
}

function createSearXNGSearchUrl(
  baseUrl: string,
  query: string,
  options: Partial<SearchOptions>
): URL {
  const url = new URL(`${baseUrl}/search`)
  const searchOptions: SearchEngineOptions = {
    format: 'json',
    categories: 'general,images',
    time_range: options.search_depth === 'advanced' ? '' : 'year',
    safesearch: options.search_depth === 'advanced' ? '0' : '1',
    engines: options.search_depth === 'advanced' 
      ? process.env.SEARXNG_ENGINES || 'google,bing,duckduckgo,wikipedia'
      : 'google,bing'
  }

  Object.entries(searchOptions).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, value)
    }
  })
  url.searchParams.append('q', query)
  
  return url
}

function convertRawToSearchResult(
  raw: SearXNGRawResult,
  query: string,
  options: Partial<SearchOptions>
): SearXNGResult {
  return {
    url: raw.url,
    title: raw.title,
    description: raw.content || null,
    content: raw.content,
    type: 'webpage',
    relevance: raw.score || 1,
    depth_level: options.depth_level ?? 1,
    domain: raw.domain,
    favicon: raw.favicon,
    img_src: raw.img_src,
    score: raw.score,
    publishedDate: raw.publishedDate,
    metadata: createBaseMetadata('web', raw.content, raw.publishedDate),
    search_query: query,
    search_source: 'searxng'
  }
}

async function processAdvancedResults(
  results: SearXNGRawResult[],
  query: string,
  options: Partial<SearchOptions>
): Promise<SearXNGResult[]> {
  // Apply domain filtering if specified
  if (options.include_domains?.length || options.exclude_domains?.length) {
    results = results.filter(result => {
      const domain = new URL(result.url).hostname
      return (
        (!options.include_domains?.length ||
          options.include_domains.some(d => domain.includes(d))) &&
        (!options.exclude_domains?.length ||
          !options.exclude_domains.some(d => domain.includes(d)))
      )
    })
  }

  // Convert raw results to proper search results
  let searchResults = results.map(raw => convertRawToSearchResult(raw, query, options))

  // Perform deep crawling for advanced search
  if (options.search_depth === 'advanced') {
    const CRAWL_MULTIPLIER = parseInt(
      process.env.SEARXNG_CRAWL_MULTIPLIER || '4',
      10
    )
    const maxResults = options.max_results || 10

    const crawledResults = await Promise.all(
      searchResults
        .slice(0, maxResults * CRAWL_MULTIPLIER)
        .map(result => crawlPage(result, query))
    )

    searchResults = crawledResults
      .filter(result => result !== null)
      .map(result => result as SearXNGResult)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxResults)
  }

  return searchResults
}

function mapSearXNGToWebResults(
  results: SearXNGResult[],
  query: string,
  options: Partial<SearchOptions>
): BaseSearchResult[] {
  return results
    .filter(result => !result.img_src)
    .slice(0, options.max_results ?? 10)
    .map(result => ({
      title: result.title,
      url: result.url,
      description: result.content || result.description,
      relevance: result.score || 1,
      type: 'webpage',
      metadata: result.metadata,
      depth_level: result.depth_level,
      search_query: query,
      search_source: 'searxng'
    }))
}

function mapSearXNGToImageResults(
  results: SearXNGResult[],
  query: string,
  options: Partial<SearchOptions>,
  apiUrl: string
): SearchImage[] {
  return results
    .filter(result => result.img_src)
    .slice(0, options.max_results ?? 10)
    .map(result => ({
      url: result.img_src?.startsWith('http')
        ? result.img_src
        : `${apiUrl}${result.img_src}`,
      title: result.title,
      description: result.description,
      relevance: result.score || 1,
      type: 'image',
      thumbnailUrl: result.img_src || '',
      metadata: createImageMetadata(),
      depth_level: result.depth_level,
      search_query: query,
      search_source: 'searxng'
    }))
}

export async function searxngSearch(
  query: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResults> {
  const apiUrl = process.env.SEARXNG_API_URL
  if (!apiUrl) throw new Error('SEARXNG_API_URL is not set')

  try {
    const url = createSearXNGSearchUrl(apiUrl, query, options)
    const data: SearXNGRawResponse = await fetchJsonWithRetry(url.toString(), 3)

    if (!data || !Array.isArray(data.results)) {
      throw new Error('Invalid response structure from search engine')
    }

    let generalResults = await processAdvancedResults(
      data.results.filter(result => !result.img_src),
      query,
      options
    )

    const results = mapSearXNGToWebResults(generalResults, query, options)
    const images = mapSearXNGToImageResults(
      generalResults.filter(result => result.img_src),
      query,
      options,
      apiUrl
    )

    return {
      results,
      total: data.number_of_results || results.length,
      images,
      metadata: {
        timestamp: new Date().toISOString(),
        query,
        options: { ...options, query: undefined }
      }
    }
  } catch (error) {
    console.error('SearXNG API error:', error)
    throw error
  }
} 