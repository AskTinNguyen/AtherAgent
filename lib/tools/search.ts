import type {
  SearchOptions,
  SearchResults
} from '@/lib/types/search.types'
import { prepareSources } from '@/lib/utils/search-utils'
import { tavilySearch } from './tavily-search'

/**
 * Main search tool that handles query execution and result processing
 */
export const searchTool = {
  execute: (query: string, options: Partial<Omit<SearchOptions, 'query'>> = {}) => 
    executeSearch(query, { query, ...options })
}

/**
 * Public search function with default options
 */
export async function search(
  query: string,
  options: Partial<Omit<SearchOptions, 'query'>> = {}
): Promise<SearchResults> {
  return searchTool.execute(query, {
    max_results: options.max_results ?? 10,
    search_depth: options.search_depth ?? 'basic',
    include_domains: options.include_domains ?? [],
    exclude_domains: options.exclude_domains ?? [],
    topic: 'general',
    time_range: 'w',
    include_answer: 'basic',
    include_images: true,
    include_raw_content: false,
    session_id: options.session_id,
    message_id: options.message_id,
    depth_level: options.depth_level ?? 1
  })
}

/**
 * Core search execution function that handles:
 * 1. Query validation
 * 2. Search execution
 * 3. Database operations (if session_id provided)
 * 4. Error handling and result formatting
 */
async function executeSearch(
  query: string,
  options: Partial<SearchOptions>
): Promise<SearchResults> {
  if (!query) throw new Error('Search query is required')

  try {
    const searchResult = await tavilySearch(query, options)

    if (options.session_id) {
      if (!options.session_id.trim()) {
        throw new Error('Valid session ID is required for database operations')
      }

      const sources = prepareSources({
        results: searchResult.results,
        images: searchResult.images || []
      }, {
        session_id: options.session_id,
        message_id: options.message_id,
        search_query: query,
        depth_level: options.depth_level
      })

      // TODO: Implement Supabase integration
      // await supabase.from('sources').insert(sources)
    }

    return {
      ...searchResult,
      metadata: {
        timestamp: new Date().toISOString(),
        query,
        options: { ...options, query: undefined }
      }
    }
  } catch (error) {
    console.error('Search error:', error)
    return {
      results: [],
      total: 0,
      images: [],
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }
}
