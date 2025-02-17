import { addResearchSource, getChatResearchState, updateChatResearchState } from '@/lib/redis/research'
import { SearchResults, searchTool } from '@/lib/tools/search'
import { ResearchLoopOptions, ResearchSource } from '@/types/research'
import { LRUCache } from 'lru-cache'
import { nanoid } from 'nanoid'

// Cache for search results
const searchCache = new LRUCache<string, SearchResults>({
  max: 100, // Maximum number of items
  ttl: 1000 * 60 * 5 // 5 minutes TTL
})

// Cache for processed sources
const sourceCache = new LRUCache<string, ResearchSource[]>({
  max: 100,
  ttl: 1000 * 60 * 15 // 15 minutes TTL
})

export async function executeResearchLoop(
  chatId: string,
  query: string,
  options: ResearchLoopOptions = {}
): Promise<void> {
  const searchId = nanoid()
  const state = await getChatResearchState(chatId)
  
  if (state.isCleared || !query.trim()) {
    return
  }

  // Generate cache key based on query and options
  const cacheKey = JSON.stringify({
    query: query.trim().toLowerCase(),
    options
  })

  // Check cache first
  const cachedResults = searchCache.get(cacheKey)
  if (cachedResults) {
    await processSearchResults(chatId, searchId, cachedResults, options)
    return
  }

  try {
    const results = await searchTool.execute({
      query: query.trim(),
      max_results: 20,
      time_range: options.timeRange,
      search_depth: options.searchDepth
    })

    // Cache results
    searchCache.set(cacheKey, results)
    
    await processSearchResults(chatId, searchId, results, options)
  } catch (error) {
    console.error('Search error:', error)
    await updateChatResearchState(chatId, true)
  }
}

async function processSearchResults(
  chatId: string,
  searchId: string,
  results: SearchResults,
  options: ResearchLoopOptions
): Promise<void> {
  const sourceCacheKey = `${chatId}:${searchId}`
  const cachedSources = sourceCache.get(sourceCacheKey)
  
  if (cachedSources) {
    for (const source of cachedSources) {
      await addResearchSource(chatId, source)
    }
    return
  }

  const sources: ResearchSource[] = []
  
  for (const result of results.results) {
    if (!result.url || !result.title) continue
    
    const source: Omit<ResearchSource, 'id' | 'chatId' | 'createdAt'> = {
      url: result.url,
      title: result.title,
      description: result.description || '',
      relevance: result.relevance || 0,
      type: result.type || 'webpage',
      status: 'pending'
    }
    
    sources.push(source as ResearchSource)
    await addResearchSource(chatId, source)
  }

  // Cache processed sources
  sourceCache.set(sourceCacheKey, sources)
} 