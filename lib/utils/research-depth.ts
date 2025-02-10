import { ResearchDepthConfig, ResearchDepthRules, ResearchSourceMetrics } from '../types/research'

const DEFAULT_DEPTH_RULES: ResearchDepthRules = {
  minRelevanceForNextDepth: 0.7,
  maxSourcesPerDepth: 5,
  depthTimeoutMs: 30000,
  qualityThreshold: 0.6
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

export function shouldIncreaseDepth(
  config: ResearchDepthConfig,
  metrics: ResearchSourceMetrics[],
  rules: ResearchDepthRules = DEFAULT_DEPTH_RULES
): boolean {
  if (config.currentDepth >= config.maxDepth) return false
  
  // Calculate average metrics for current depth
  const currentDepthMetrics = metrics.filter(m => m.depthLevel === config.currentDepth)
  if (currentDepthMetrics.length < rules.maxSourcesPerDepth) return false
  
  const avgRelevance = currentDepthMetrics.reduce((sum, m) => sum + m.relevanceScore, 0) / currentDepthMetrics.length
  const avgQuality = currentDepthMetrics.reduce((sum, m) => sum + m.contentQuality, 0) / currentDepthMetrics.length
  
  // Adaptive threshold based on depth
  const depthFactor = 1 - (config.currentDepth / config.maxDepth) * 0.3
  const effectiveThreshold = rules.minRelevanceForNextDepth * depthFactor
  
  return avgRelevance >= effectiveThreshold && avgQuality >= rules.qualityThreshold
}

export function optimizeDepthStrategy(
  config: ResearchDepthConfig,
  metrics: ResearchSourceMetrics[]
): ResearchDepthConfig {
  const newConfig = { ...config }
  
  // Calculate success rate for each depth level
  Object.keys(config.depthScores).forEach(depthKey => {
    const depth = parseInt(depthKey)
    const depthMetrics = metrics.filter(m => m.depthLevel === depth)
    if (depthMetrics.length > 0) {
      const avgScore = depthMetrics.reduce((sum, m) => sum + m.relevanceScore, 0) / depthMetrics.length
      newConfig.depthScores[depth] = avgScore
    }
  })
  
  // Adjust adaptive threshold based on success rates
  const avgSuccess = Object.values(newConfig.depthScores).reduce((a, b) => a + b, 0) / 
                    Object.values(newConfig.depthScores).length
  newConfig.adaptiveThreshold = Math.max(0.5, Math.min(0.9, avgSuccess))
  
  // Adjust minimum relevance score based on depth performance
  newConfig.minRelevanceScore = Math.max(0.4, Math.min(0.8, avgSuccess - 0.1))
  
  return newConfig
} 