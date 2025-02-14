import { searchTool } from '../tools/search'

export interface ResearchIteration {
  query: string
  results: any[]
  timestamp: number
}

export interface QueryContext {
  currentQuery: string
  previousQueries: string[]
  currentDepth: number
  maxDepth: number
  recentFindings: string[]
}

// Check if we're getting diminishing returns from additional searches
export function checkDiminishingReturns(
  currentResults: any[],
  iterations: ResearchIteration[]
): boolean {
  if (iterations.length < 2) return false

  const previousResults = iterations[iterations.length - 1].results
  const currentUrls = new Set<string>()
  const previousUrls = new Set<string>()
  let overlapCount = 0

  // Track URLs from current results
  currentResults.forEach((result: any) => {
    if (result.data?.results) {
      result.data.results.forEach((r: any) => currentUrls.add(r.url))
    }
  })

  // Track URLs from previous results
  previousResults.forEach((result: any) => {
    if (result.data?.results) {
      result.data.results.forEach((r: any) => {
        const url = r.url
        previousUrls.add(url)
        if (currentUrls.has(url)) {
          overlapCount++
        }
      })
    }
  })

  // Calculate overlap ratio based on the smaller set size
  // This ensures we detect diminishing returns even when result sets are different sizes
  const minSetSize = Math.min(currentUrls.size, previousUrls.size)
  if (minSetSize === 0) return false
  
  const overlapRatio = overlapCount / minSetSize

  // If more than 50% overlap, consider it diminishing returns
  return overlapRatio > 0.5
}

// Refine the search query based on context and previous results
export function refineQuery(
  originalQuery: string,
  iterations: ResearchIteration[],
  context: QueryContext
): string {
  const { currentDepth, maxDepth, recentFindings } = context
  
  // Don't refine if we're at max depth
  if (currentDepth >= maxDepth) return originalQuery

  // Extract key terms from recent findings
  const keyTerms = extractKeyTerms(recentFindings)
  
  // Add depth-specific modifiers
  const depthModifiers = getDepthModifiers(currentDepth)
  
  // Combine original query with key terms and modifiers
  const refinedQuery = [
    originalQuery,
    ...keyTerms.slice(0, 2), // Add top 2 key terms
    ...depthModifiers
  ].join(' ')

  return refinedQuery
}

// Execute research tools with the given query
export async function executeResearchTools(
  query: string,
  options: { search?: boolean } = {}
): Promise<any[]> {
  const results: any[] = []

  if (options.search) {
    try {
      const searchResults = await searchTool.execute({
        query,
        max_results: 10,
        search_depth: 'advanced',
        include_domains: [],
        exclude_domains: []
      }, {
        toolCallId: `search-${Date.now()}`,
        messages: []
      })
      results.push({ tool: 'search', data: searchResults })
    } catch (error) {
      console.error('Search tool error:', error)
    }
  }

  return results
}

// Helper function to extract key terms from findings
function extractKeyTerms(findings: string[]): string[] {
  const terms = new Map<string, number>()
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])

  findings.forEach(finding => {
    const words = finding.toLowerCase().split(/\W+/)
    words.forEach(word => {
      if (word.length > 2 && !stopWords.has(word)) {
        terms.set(word, (terms.get(word) || 0) + 1)
      }
    })
  })

  return Array.from(terms.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)
}

// Helper function to get depth-specific search modifiers
function getDepthModifiers(depth: number): string[] {
  const modifiers: Record<number, string[]> = {
    1: ['overview', 'introduction'],
    2: ['detailed', 'analysis'],
    3: ['advanced', 'specific'],
    4: ['expert', 'technical'],
    5: ['research', 'academic']
  }

  return modifiers[depth] || []
} 