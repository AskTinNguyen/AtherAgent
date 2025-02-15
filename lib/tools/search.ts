import { searchSchema, searchSchemaWithDefaults } from '@/lib/schema/search'
import { type SearchResultImage, type SearchResultItem, type SearchResults, type SearXNGResponse, type SearXNGResult } from '@/lib/types/types.search'
import { sanitizeUrl } from '@/lib/utils'
import { tool } from 'ai'
import Exa from 'exa-js'

export const searchTool = tool({
  description: 'Search the web for information',
  parameters: searchSchema,
  execute: async (args: unknown) => {
    // Parse with defaults schema to ensure all optional fields have values
    const {
      query,
      max_results = 20,
      search_depth = 'basic',
      include_domains = [],
      exclude_domains = []
    } = searchSchemaWithDefaults.parse(args)

    // Ensure arrays are properly initialized
    const includeDomains = Array.isArray(include_domains) ? include_domains : []
    const excludeDomains = Array.isArray(exclude_domains) ? exclude_domains : []
    
    // Tavily API requires a minimum of 5 characters in the query
    const filledQuery =
      query.length < 5 ? query + ' '.repeat(5 - query.length) : query
    let searchResult: SearchResults
    const searchAPI =
      (process.env.SEARCH_API as 'tavily' | 'exa' | 'searxng') || 'tavily'

    const effectiveSearchDepth =
      searchAPI === 'searxng' &&
      process.env.SEARXNG_DEFAULT_DEPTH === 'advanced'
        ? 'advanced'
        : search_depth || 'basic'

    console.log(
      `Using search API: ${searchAPI}, Search Depth: ${effectiveSearchDepth}`
    )

    try {
      if (searchAPI === 'searxng' && effectiveSearchDepth === 'advanced') {
        // API route for advanced SearXNG search
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/advanced-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: filledQuery,
            maxResults: max_results,
            searchDepth: effectiveSearchDepth,
            includeDomains: include_domains,
            excludeDomains: exclude_domains
          })
        })
        if (!response.ok) {
          throw new Error(
            `Advanced search API error: ${response.status} ${response.statusText}`
          )
        }
        searchResult = await response.json()
      } else {
        searchResult = await (searchAPI === 'tavily'
          ? tavilySearch
          : searchAPI === 'exa'
          ? exaSearch
          : searxngSearch)(
          filledQuery,
          max_results,
          effectiveSearchDepth === 'advanced' ? 'advanced' : 'basic',
          include_domains,
          exclude_domains
        )
      }
    } catch (error) {
      console.error('Search API error:', error)
      searchResult = {
        results: [],
        query: filledQuery,
        images: [],
        number_of_results: 0
      }
    }

    console.log('completed search')
    return searchResult
  }
})

export async function search(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  return searchTool.execute(
    {
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_domains: includeDomains,
      exclude_domains: excludeDomains
    },
    {
      toolCallId: 'search',
      messages: []
    }
  )
}

async function tavilySearch(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set in the environment variables')
  }
  const includeImageDescriptions = true
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: Math.max(maxResults, 5),
      search_depth: searchDepth,
      include_images: true,
      include_image_descriptions: includeImageDescriptions,
      include_answers: true,
      include_domains: includeDomains,
      exclude_domains: excludeDomains
    })
  })

  if (!response.ok) {
    throw new Error(
      `Tavily API error: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  const processedImages: SearchResultImage[] = includeImageDescriptions
    ? data.images
        .map(({ url, description }: { url: string; description: string }) => ({
          url: sanitizeUrl(url),
          title: description
        }))
        .filter(
          (image: SearchResultImage): image is SearchResultImage =>
            typeof image === 'object' &&
            image.title !== undefined &&
            image.title !== ''
        )
    : data.images.map((url: string) => ({ url: sanitizeUrl(url) }))

  const results: SearchResultItem[] = data.results.map((result: SearXNGResult) => ({
    title: result.title || '',
    url: result.url || '',
    content: result.content || '',
    relevance: 1,
    depth: searchDepth === 'advanced' ? 2 : 1
  }))

  return {
    results,
    query,
    images: processedImages,
    number_of_results: results.length
  }
}

async function exaSearch(
  query: string,
  maxResults: number = 10,
  _searchDepth: string,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) {
    throw new Error('EXA_API_KEY is not set in the environment variables')
  }

  const exa = new Exa(apiKey)
  const exaResults = await exa.searchAndContents(query, {
    highlights: true,
    numResults: maxResults,
    includeDomains,
    excludeDomains
  })

  const results: SearchResultItem[] = exaResults.results.map((result: any) => ({
    title: result.title,
    url: result.url,
    content: result.highlight || result.text,
    relevance: 1
  }))

  return {
    results,
    query,
    images: [],
    number_of_results: results.length
  }
}

async function searxngSearch(
  query: string,
  maxResults: number = 10,
  searchDepth: string,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const baseUrl = process.env.SEARXNG_URL
  if (!baseUrl) {
    throw new Error('SEARXNG_URL is not set in the environment variables')
  }

  const response = await fetch(`${baseUrl}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: query,
      format: 'json',
      pageno: 1,
      engines: ['google', 'bing', 'duckduckgo'],
      max_results: maxResults,
      search_depth: searchDepth,
      include_domains: includeDomains,
      exclude_domains: excludeDomains
    })
  })

  if (!response.ok) {
    throw new Error(
      `SearXNG API error: ${response.status} ${response.statusText}`
    )
  }

  const data: SearXNGResponse = await response.json()
  const results: SearchResultItem[] = data.results.map(result => ({
    title: result.title,
    url: result.url,
    content: result.content,
    relevance: 1
  }))

  return {
    results,
    query,
    images: [],
    number_of_results: data.number_of_results || results.length
  }
}
