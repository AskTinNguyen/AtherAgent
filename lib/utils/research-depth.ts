import { ResearchSource, type SourceMetrics } from '@/lib/types/research-enhanced'
import { ResearchDepthRules, ResearchSourceMetrics } from '../types/research'

const DEFAULT_DEPTH_RULES: ResearchDepthRules = {
  minRelevanceForNextDepth: 0.6,
  maxSourcesPerDepth: 3,
  depthTimeoutMs: 30000,
  qualityThreshold: 0.5
}

export function calculateSourceMetrics(
  content: string,
  query: string,
  url: string,
  publishedDate?: string
): ResearchSourceMetrics {
  const metrics: ResearchSourceMetrics = {
    relevanceScore: calculateRelevanceScore(content, query),
    depthLevel: 1,
    contentQuality: calculateContentQuality(content),
    timeRelevance: calculateTimeRelevance(publishedDate),
    sourceAuthority: calculateSourceAuthority(url)
  }
  return metrics
}

function calculateRelevanceScore(content: string, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/)
  const contentLower = content.toLowerCase()
  
  // Exact phrase match bonus
  const exactMatchBonus = contentLower.includes(query.toLowerCase()) ? 0.3 : 0
  
  // Term frequency scoring
  const termScores = queryTerms.map(term => {
    const count = (contentLower.match(new RegExp(term, 'g')) || []).length
    return Math.min(count / (content.length / 500), 1) // Normalize by content length
  })
  
  // Semantic relevance (placeholder for future ML-based scoring)
  const averageTermScore = termScores.reduce((a, b) => a + b, 0) / termScores.length
  
  return Math.min(averageTermScore + exactMatchBonus, 1)
}

function calculateContentQuality(content: string): number {
  // Implement content quality metrics:
  // 1. Text length and structure
  const lengthScore = Math.min(content.length / 2000, 1)
  
  // 2. Paragraph structure
  const paragraphs = content.split('\n\n')
  const structureScore = Math.min(paragraphs.length / 5, 1)
  
  // 3. Content diversity (unique words ratio)
  const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size
  const totalWords = content.split(/\s+/).length
  const diversityScore = uniqueWords / totalWords
  
  return (lengthScore + structureScore + diversityScore) / 3
}

function calculateTimeRelevance(publishedDate?: string): number {
  if (!publishedDate) return 0.5 // Default score for unknown dates
  
  const published = new Date(publishedDate)
  const now = new Date()
  const ageInDays = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)
  
  // Score based on recency
  if (ageInDays < 7) return 1
  if (ageInDays < 30) return 0.9
  if (ageInDays < 90) return 0.8
  if (ageInDays < 365) return 0.6
  return 0.4
}

function calculateSourceAuthority(url: string): number {
  // Domain authority scoring (placeholder for future integration with domain authority APIs)
  const domain = new URL(url).hostname
  
  // Example authority rules (to be expanded)
  if (domain.endsWith('.edu')) return 0.9
  if (domain.endsWith('.gov')) return 0.9
  if (domain.endsWith('.org')) return 0.8
  
  // Check for known high-authority domains
  const highAuthorityDomains = [
    'wikipedia.org',
    'github.com',
    'stackoverflow.com',
    'medium.com',
    'arxiv.org'
  ]
  
  if (highAuthorityDomains.some(d => domain.includes(d))) return 0.8
  
  return 0.5 // Default score for unknown domains
}

interface DepthConfig {
  currentDepth: number
  maxDepth: number
  minRelevanceScore: number
  adaptiveThreshold: number
  depthScores: Record<number, number>
}

export function shouldIncreaseDepth(
  config: DepthConfig,
  metrics: SourceMetrics[]
): boolean {
  if (config.currentDepth >= config.maxDepth) return false
  if (metrics.length === 0) return false

  // Calculate average score for current depth
  const currentDepthMetrics = metrics.filter(m => m.depthLevel === config.currentDepth)
  if (currentDepthMetrics.length === 0) return false

  const averageScore = currentDepthMetrics.reduce(
    (sum, m) => sum + m.overallScore,
    0
  ) / currentDepthMetrics.length

  // Check if we should increase depth based on scores
  return (
    averageScore >= config.adaptiveThreshold &&
    averageScore > (config.depthScores[config.currentDepth] || 0)
  )
}

export function optimizeDepthStrategy(
  config: DepthConfig,
  metrics: SourceMetrics[]
): {
  minRelevanceScore: number
  adaptiveThreshold: number
  depthScores: Record<number, number>
} {
  // Calculate average scores for each depth level
  const depthScores: Record<number, number> = {}
  for (let depth = 1; depth <= config.currentDepth; depth++) {
    const depthMetrics = metrics.filter(m => m.depthLevel === depth)
    if (depthMetrics.length > 0) {
      depthScores[depth] = depthMetrics.reduce(
        (sum, m) => sum + m.overallScore,
        0
      ) / depthMetrics.length
    }
  }

  // Adjust thresholds based on performance
  const overallAverage = Object.values(depthScores).reduce(
    (sum, score) => sum + score,
    0
  ) / Object.values(depthScores).length

  return {
    minRelevanceScore: Math.max(0.4, Math.min(overallAverage - 0.1, 0.8)),
    adaptiveThreshold: Math.max(0.5, Math.min(overallAverage + 0.1, 0.9)),
    depthScores
  }
}

// Check if facts are cross-validated across multiple sources
export async function checkCrossValidation(sources: ResearchSource[]): Promise<boolean> {
  // Basic implementation - in production this should use more sophisticated NLP
  const sourcesByDomain = new Map<string, ResearchSource[]>()
  
  // Group sources by domain
  sources.forEach(source => {
    try {
      const domain = new URL(source.url).hostname
      const domainSources = sourcesByDomain.get(domain) || []
      domainSources.push(source)
      sourcesByDomain.set(domain, domainSources)
    } catch {
      // Skip invalid URLs
    }
  })
  
  // Consider facts cross-validated if we have sources from at least 2 different domains
  return sourcesByDomain.size >= 2
} 