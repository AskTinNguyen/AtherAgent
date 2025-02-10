import { ResearchSourceMetrics } from '../types/research'

interface CompositeScore {
  total: number
  breakdown: {
    relevance: number
    quality: number
    time: number
    authority: number
    depth: number
  }
}

export function calculateCompositeScore(
  metrics: ResearchSourceMetrics,
  currentDepth: number,
  maxDepth: number
): CompositeScore {
  // Depth bonus: reward results from deeper levels, but with diminishing returns
  const depthProgress = currentDepth / maxDepth
  const depthBonus = Math.log10((metrics.depthLevel + 1)) / Math.log10((maxDepth + 1))
  
  // Calculate weighted scores
  const weights = {
    relevance: 0.35,   // Highest weight for query relevance
    quality: 0.25,     // Content quality is important
    time: 0.15,        // Time relevance has moderate importance
    authority: 0.15,   // Source authority has moderate importance
    depth: 0.10        // Depth bonus has lowest weight
  }
  
  const breakdown = {
    relevance: metrics.relevanceScore * weights.relevance,
    quality: metrics.contentQuality * weights.quality,
    time: metrics.timeRelevance * weights.time,
    authority: metrics.sourceAuthority * weights.authority,
    depth: depthBonus * weights.depth
  }
  
  // Calculate total score
  const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0)
  
  return {
    total: Math.round(total * 100) / 100, // Round to 2 decimal places
    breakdown
  }
}

export function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-500'
  if (score >= 0.6) return 'text-blue-500'
  if (score >= 0.4) return 'text-yellow-500'
  return 'text-gray-500'
}

export function getScoreLabel(score: number): string {
  if (score >= 0.8) return 'Excellent'
  if (score >= 0.6) return 'Good'
  if (score >= 0.4) return 'Fair'
  return 'Basic'
}

export function getMetricIcon(metricType: keyof CompositeScore['breakdown']): string {
  switch (metricType) {
    case 'relevance':
      return '🎯'
    case 'quality':
      return '📊'
    case 'time':
      return '⏰'
    case 'authority':
      return '🏛️'
    case 'depth':
      return '🔍'
    default:
      return '•'
  }
}

export function sortByCompositeScore(
  results: Array<{ metrics: ResearchSourceMetrics }>,
  currentDepth: number,
  maxDepth: number
): Array<{ metrics: ResearchSourceMetrics; score: CompositeScore }> {
  return results
    .map(result => ({
      ...result,
      score: calculateCompositeScore(result.metrics, currentDepth, maxDepth)
    }))
    .sort((a, b) => b.score.total - a.score.total)
} 