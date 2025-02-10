import { SearchSource } from '@/lib/types'

interface SearchResult {
  url: string
  title?: string
  snippet?: string
}

export function extractSearchSources(
  results: SearchResult[],
  messageId: string,
  searchQuery?: string
): SearchSource[] {
  return results.map(result => ({
    url: result.url,
    title: result.title,
    snippet: result.snippet,
    timestamp: Date.now(),
    messageId,
    searchQuery
  }))
}

export function formatSourceAsMarkdown(source: SearchSource): string {
  return `[${source.title || source.url}](${source.url})`
} 