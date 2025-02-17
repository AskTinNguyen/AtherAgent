import type {
    BaseSearchResult,
    DatabaseSource,
    ImageMetadata,
    SearchMetadata
} from '@/lib/types/search.types'
import { sanitizeUrl } from '@/lib/utils'

export function extractKeywords(content: string): string[] {
  const stopWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'])
  const words = content.toLowerCase().split(/\W+/)
  const filteredWords = words.filter(word => word.length > 2 && !stopWords.has(word))
  const wordFreq = new Map<string, number>()
  
  filteredWords.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  })
  
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

export function createBaseMetadata(
  source_type: 'web' | 'academic' | 'image',
  content?: string | null,
  last_updated?: string
): SearchMetadata {
  const now = new Date().toISOString()
  return {
    source_type,
    last_updated: last_updated || now,
    language: 'en',
    word_count: content ? content.split(/\s+/).length : 0,
    keywords: extractKeywords(content || ''),
    fetch_metadata: {
      status_code: 200,
      content_type: source_type === 'image' ? 'image/*' : 'text/html',
      encoding: source_type === 'image' ? 'binary' : 'utf-8'
    }
  }
}

export function createImageMetadata(): ImageMetadata {
  return {
    source_type: 'image',
    last_updated: new Date().toISOString(),
    language: 'en',
    word_count: 0,
    keywords: [],
    fetch_metadata: {
      status_code: 200,
      content_type: 'image/*',
      encoding: 'binary'
    }
  }
}

export function prepareForDatabase(
  result: BaseSearchResult,
  options: {
    session_id: string
    message_id?: string
    search_query?: string
    depth_level?: number
  }
): DatabaseSource {
  if (!result.url || !result.title) {
    throw new Error('Search result must have a URL and title')
  }

  return {
    session_id: options.session_id,
    message_id: options.message_id,
    url: sanitizeUrl(result.url) || result.url,
    title: result.title,
    content: result.description,
    relevance: result.relevance,
    metadata: result.metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_processed: true,
    search_query: options.search_query,
    search_source: result.search_source,
    depth_level: options.depth_level ?? 1
  }
}

export function prepareSources(
  searchResults: { 
    results: BaseSearchResult[],
    images: BaseSearchResult[]
  },
  options: {
    session_id: string,
    message_id?: string,
    search_query: string,
    depth_level?: number
  }
): DatabaseSource[] {
  const { results, images } = searchResults
  const { session_id, message_id, search_query, depth_level = 1 } = options

  const sources: DatabaseSource[] = []

  // Add webpage results
  results.forEach(result => {
    if (!result.url) return
    sources.push({
      session_id,
      message_id,
      url: sanitizeUrl(result.url),
      title: result.title || 'Untitled',
      content: result.description || null,
      metadata: result.metadata,
      search_query,
      search_source: result.search_source,
      depth_level,
      relevance: result.relevance || 1,
      created_at: new Date().toISOString(),
      is_processed: false
    })
  })

  // Add image results
  images.forEach(image => {
    if (!image.url) return
    sources.push({
      session_id,
      message_id,
      url: sanitizeUrl(image.url),
      title: image.title || 'Image',
      content: image.description || null,
      metadata: image.metadata,
      search_query,
      search_source: image.search_source,
      depth_level,
      relevance: image.relevance || 1,
      created_at: new Date().toISOString(),
      is_processed: false
    })
  })

  return sources
} 