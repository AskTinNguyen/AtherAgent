import { searchSchema, searchSchemaWithDefaults } from '@/lib/schema/search'
import { SearchResult } from '@/lib/types'
import { sanitizeUrl } from '@/lib/utils'
import { tool } from 'ai'
import Exa from 'exa-js'

// Define interfaces for search results
interface SearchImage {
  url: string
  description?: string
}

interface SearchResults {
  results: Array<{
    title: string
    url: string
    content: string
    relevance?: number
    depth?: number
  }>
  query: string
  images: SearchImage[]
  number_of_results: number
}

interface SearXNGResult {
  url: string
  title: string
  content: string
  img_src?: string
}

interface SearXNGResponse {
  query: string
  results: SearXNGResult[]
  number_of_results?: number
}

// Add Exa types
interface ExaSearchResult {
  title: string
  url: string
  text: string
  publishedDate?: string
  author?: string
  highlight?: string
}

interface ExaResponse {
  results: ExaSearchResult[]
}

// Add Tavily types
interface TavilyImage {
  url: string
  description?: string
}

interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
  publishedDate?: string
}

interface TavilyResponse {
  results: TavilyResult[]
  images?: (TavilyImage | string)[]
  query: string
}

export const searchTool = tool({
  description: 'Search the web for information',
  parameters: searchSchema,
  execute: async (args: unknown) => {
    console.log('Search tool executed with args:', args)
    
    // Parse with defaults schema to ensure all optional fields have values
    const {
      query,
      max_results = 20,
      search_depth = 'basic',
      include_domains = [],
      exclude_domains = [],
      topic = 'general',
      time_range = 'w',
      include_answer = 'basic',
      include_images = true,
      include_image_descriptions = true
    } = searchSchemaWithDefaults.parse(args)

    console.log('Parsed search parameters:', {
      query,
      max_results,
      search_depth,
      include_domains,
      exclude_domains,
      topic,
      time_range,
      include_answer,
      include_images,
      include_image_descriptions
    })

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
      `Using search API: ${searchAPI}, Search Depth: ${effectiveSearchDepth}, Topic: ${topic}`
    )

    try {
      console.log(`Initiating ${searchAPI} search...`)
      
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
            includeDomains,
            excludeDomains
          })
        })
        if (!response.ok) {
          throw new Error(
            `Advanced search API error: ${response.status} ${response.statusText}`
          )
        }
        searchResult = await response.json()
      } else {
        if (searchAPI === 'tavily') {
          console.log('Using Tavily search with params:', {
            query: filledQuery,
            maxResults: max_results,
            searchDepth: effectiveSearchDepth,
            topic,
            timeRange: time_range,
            includeAnswer: include_answer
          })
        }
        
        searchResult = await (searchAPI === 'tavily'
          ? tavilySearch(
              filledQuery,
              max_results,
              effectiveSearchDepth,
              includeDomains,
              excludeDomains,
              {
                topic,
                timeRange: time_range,
                includeAnswer: include_answer,
                includeImages: include_images,
                includeImageDescriptions: include_image_descriptions
              }
            )
          : searchAPI === 'exa'
          ? exaSearch(
              filledQuery,
              max_results,
              effectiveSearchDepth,
              includeDomains,
              excludeDomains
            )
          : searxngSearch(
              filledQuery,
              max_results,
              effectiveSearchDepth,
              includeDomains,
              excludeDomains
            ))
            
        console.log('Search completed with results:', {
          numberOfResults: searchResult.number_of_results,
          numberOfImages: searchResult.images.length
        })
      }
    } catch (error) {
      console.error('Search API error:', error)
      if (error instanceof Error) {
        console.error('Error details:', error.message)
        console.error('Error stack:', error.stack)
      }
      searchResult = {
        results: [],
        query: filledQuery,
        images: [],
        number_of_results: 0
      }
    }

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
  excludeDomains: string[] = [],
  options: {
    topic?: 'news' | 'general' | 'research' | 'code'
    timeRange?: 'day' | 'w' | 'month' | 'year'
    includeAnswer?: 'basic' | 'advanced' | 'none'
    includeImages?: boolean
    includeImageDescriptions?: boolean
  } = {}
): Promise<SearchResults> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set in the environment variables')
  }

  try {
    const { tavily } = require('@tavily/core')
    const client = tavily({ apiKey })

    const response = await client.search(query, {
      searchDepth,
      topic: options.topic || "general",
      timeRange: options.timeRange || "w",
      includeAnswer: options.includeAnswer || searchDepth,
      includeImages: options.includeImages ?? true,
      includeImageDescriptions: options.includeImageDescriptions ?? true,
      maxResults: Math.max(maxResults, 5),
      includeDomains,
      excludeDomains
    }) as TavilyResponse

    // Process images with proper type checking
    const processedImages = response.images?.map((img: TavilyImage | string) => ({
      url: sanitizeUrl(typeof img === 'string' ? img : img.url),
      description: typeof img === 'string' ? undefined : img.description
    })).filter((image: SearchImage): image is SearchImage => 
      typeof image === 'object' &&
      'url' in image &&
      typeof image.url === 'string' &&
      (!('description' in image) || typeof image.description === 'string')
    ) || []

    // Process search results
    const results = response.results?.map((result: TavilyResult) => ({
      title: result.title || '',
      url: result.url || '',
      content: result.content || '',
      relevance: result.score || 1,
      depth: searchDepth === 'advanced' ? 2 : 1
    })) || []

    return {
      results,
      query,
      images: processedImages,
      number_of_results: results.length
    } satisfies SearchResults
  } catch (error) {
    console.error('Tavily API error:', error)
    throw error
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

  return {
    results: exaResults.results.map(result => ({
      title: result.title || '',
      url: result.url || '',
      content: result.highlights?.[0] || '',
      relevance: 1,
      depth: 1
    })),
    query,
    images: [],
    number_of_results: exaResults.results.length || 0
  }
}

async function searxngSearch(
  query: string,
  maxResults: number = 10,
  searchDepth: string,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiUrl = process.env.SEARXNG_API_URL
  if (!apiUrl) {
    throw new Error('SEARXNG_API_URL is not set in the environment variables')
  }

  try {
    // Construct the URL with query parameters
    const url = new URL(`${apiUrl}/search`)
    url.searchParams.append('q', query)
    url.searchParams.append('format', 'json')
    url.searchParams.append('categories', 'general,images')

    // Apply search depth settings
    if (searchDepth === 'advanced') {
      url.searchParams.append('time_range', '')
      url.searchParams.append('safesearch', '0')
      url.searchParams.append('engines', 'google,bing,duckduckgo,wikipedia')
    } else {
      url.searchParams.append('time_range', 'year')
      url.searchParams.append('safesearch', '1')
      url.searchParams.append('engines', 'google,bing')
    }

    // Fetch results from SearXNG
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`SearXNG API error (${response.status}):`, errorText)
      throw new Error(
        `SearXNG API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    const data: SearXNGResponse = await response.json()

    // Separate general results and image results, and limit to maxResults
    const generalResults = data.results
      .filter(result => !result.img_src)
      .slice(0, maxResults)
    const imageResults = data.results
      .filter(result => result.img_src)
      .slice(0, maxResults)

    // Format the results to match the expected SearchResults structure
    return {
      results: generalResults.map(
        (result: SearXNGResult): SearchResult => ({
          title: result.title,
          url: result.url,
          content: result.content,
          relevance: 1,
          depth: 1
        })
      ),
      query: data.query,
      images: imageResults
        .map(result => ({
          url: result.img_src?.startsWith('http') 
            ? result.img_src 
            : `${apiUrl}${result.img_src}`
        }))
        .filter((img): img is SearchImage => 
          typeof img === 'object' && 
          'url' in img && 
          typeof img.url === 'string'
        ),
      number_of_results: data.number_of_results || 0
    }
  } catch (error) {
    console.error('SearXNG API error:', error)
    throw error
  }
}
