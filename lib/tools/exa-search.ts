import type {
  BaseSearchResult,
  SearchOptions,
  SearchResults
} from '@/lib/types/search.types'
import { createBaseMetadata } from '@/lib/utils/search-utils'
import Exa from 'exa-js'

export interface ExaSearchOptions {
  text: boolean
  highlights: boolean
  numResults: number
  includeDomains?: string[]
  excludeDomains?: string[]
}

export interface ExaSearchResult {
  title: string | null
  url: string
  text: string
  highlights?: string[]
  publishedDate?: string
  author?: string
}

export interface ExaResponse {
  results: ExaSearchResult[]
}

function mapExaToWebResults(
  results: ExaSearchResult[],
  query: string,
  options: Partial<Omit<SearchOptions, 'query'>>
): BaseSearchResult[] {
  return results.map(result => ({
    title: result.title || 'Untitled',
    url: result.url || '',
    description: result.text || null,
    relevance: 1,
    type: 'webpage',
    metadata: createBaseMetadata('web', result.text),
    depth_level: options.depth_level ?? 1,
    search_query: query,
    search_source: 'exa'
  }))
}

export async function exaSearch(
  query: string,
  options: Partial<Omit<SearchOptions, 'query'>> = {}
): Promise<SearchResults> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) throw new Error('EXA_API_KEY is not set')

  const exa = new Exa(apiKey)
  const exaResults = await exa.searchAndContents(query, {
    text: true,
    highlights: true,
    numResults: options.max_results ?? 10,
    includeDomains: options.include_domains,
    excludeDomains: options.exclude_domains
  })

  const results = mapExaToWebResults(exaResults.results, query, options)

  return {
    results,
    total: results.length,
    images: [] // Exa doesn't provide images
  }
} 