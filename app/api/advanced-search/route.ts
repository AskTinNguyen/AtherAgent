import { searxngSearch } from '@/lib/tools/searxng-search'
import {
  getCachedResults,
  normalizeCacheKey,
  setCachedResults
} from '@/lib/utils/cache-utils'
import { NextResponse } from 'next/server'

/**
 * Maximum number of results to fetch from search engine.
 * Increasing this value can improve result quality but may impact performance.
 * In advanced search mode, this is multiplied by CRAWL_MULTIPLIER for initial fetching.
 */
const MAX_RESULTS = Math.max(
  10,
  Math.min(100, parseInt(process.env.SEARXNG_MAX_RESULTS || '50', 10))
)

const CACHE_TTL = 3600 // Cache time-to-live in seconds (1 hour)
const CACHE_EXPIRATION_CHECK_INTERVAL = 3600000 // 1 hour in milliseconds

export async function POST(request: Request) {
  const { query, maxResults, searchDepth, includeDomains, excludeDomains } =
    await request.json()

  try {
    const cacheKey = normalizeCacheKey(
      query,
      maxResults,
      searchDepth || 'basic',
      Array.isArray(includeDomains) ? includeDomains : [],
      Array.isArray(excludeDomains) ? excludeDomains : []
    )

    // Try to get cached results
    const cachedResults = await getCachedResults(cacheKey)
    if (cachedResults) {
      return NextResponse.json(cachedResults)
    }

    // If not cached, perform the search
    const results = await searxngSearch(query, {
      max_results: maxResults,
      search_depth: searchDepth || 'basic',
      include_domains: Array.isArray(includeDomains) ? includeDomains : [],
      exclude_domains: Array.isArray(excludeDomains) ? excludeDomains : [],
      time_range: process.env.SEARXNG_TIME_RANGE || 'None',
      include_images: true
    })

    // Cache the results
    await setCachedResults(cacheKey, results)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Advanced search error:', error)
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : String(error),
        query: query,
        results: [],
        images: [],
        total: 0,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}
