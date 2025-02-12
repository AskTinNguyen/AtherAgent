import { type SearchResultItem, type SearchSource } from '@/types/search'

export function extractSearchSources(results: SearchResultItem[]): SearchSource[] {
  return results.map(result => ({
    url: result.url,
    title: result.title || 'Untitled',
    content: result.content || '',
    publishedDate: result.publishedDate,
    domain: result.domain,
    favicon: result.favicon
  }))
}

export function calculateRelevanceScore(content: string, query: string): number {
  if (!query) return 0.5
  
  const queryTerms = query.toLowerCase().split(' ')
  const contentTerms = content.toLowerCase().split(' ')
  
  const matchCount = queryTerms.filter(term => 
    contentTerms.some(contentTerm => contentTerm.includes(term))
  ).length
  
  return matchCount / queryTerms.length
}

export function calculateSourceAuthority(url: string): number {
  // Simple domain authority calculation
  // This can be enhanced with actual domain authority metrics
  const domain = new URL(url).hostname
  const authorityFactors = {
    'edu': 0.9,
    'gov': 0.9,
    'org': 0.8,
    'com': 0.7
  }
  
  const extension = domain.split('.').pop() as keyof typeof authorityFactors
  return authorityFactors[extension] || 0.5
}

export function calculateTimeRelevance(publishedDate?: string): number {
  if (!publishedDate) return 0.5
  
  const published = new Date(publishedDate)
  const now = new Date()
  const ageInDays = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)
  
  // Score decreases with age, but never below 0.3
  return Math.max(0.3, 1 - (ageInDays / 365))
}

export function calculateContentQuality(content: string): number {
  // Basic quality metrics
  const lengthScore = Math.min(content.length / 1000, 1) // Cap at 1000 chars
  const structureScore = content.includes('\n') ? 0.2 : 0
  const linkScore = (content.match(/https?:\/\//g)?.length || 0) * 0.1
  
  return Math.min(1, lengthScore + structureScore + linkScore)
}

export function formatSourceAsMarkdown(source: SearchSource): string {
  return `[${source.title || source.url}](${source.url})`
} 