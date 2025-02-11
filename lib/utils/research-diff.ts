import { type SearchResultItem } from '@/types/search'

export interface DiffResult {
  added: string[]
  removed: string[]
  modified: {
    before: string
    after: string
  }[]
  unchanged: string[]
}

export interface ChangeMetrics {
  newInsights: number
  refinements: number
  contradictions: number
  validations: number
  depthProgress: number
}

export interface VisualizationData {
  diffHighlights: {
    newFindings: HighlightData[]
    refinements: HighlightData[]
    validations: HighlightData[]
  }
  evolutionMetrics: {
    depthProgress: number
    qualityImprovement: number
    sourceReliability: number
  }
}

export interface HighlightData {
  content: string
  type: 'new' | 'refined' | 'validated'
  sourceUrl?: string
  confidence: number
}

export class ResearchDiffSystem {
  private previousResults: SearchResultItem[] = []
  private changeHistory: ChangeMetrics[] = []
  private lastDepthProgress: number = 0

  compareResults(oldResults: SearchResultItem[], newResults: SearchResultItem[]): DiffResult {
    const added: string[] = []
    const removed: string[] = []
    const modified: { before: string; after: string }[] = []
    const unchanged: string[] = []

    // Create maps for efficient lookup
    const oldMap = new Map(oldResults.map(r => [r.url, r]))
    const newMap = new Map(newResults.map(r => [r.url, r]))

    // Find added and modified results
    for (const result of newResults) {
      const oldResult = oldMap.get(result.url)
      if (!oldResult) {
        added.push(result.content || '')
      } else if (oldResult.content !== result.content) {
        modified.push({
          before: oldResult.content || '',
          after: result.content || ''
        })
      } else {
        unchanged.push(result.content || '')
      }
    }

    // Find removed results
    for (const result of oldResults) {
      if (!newMap.has(result.url)) {
        removed.push(result.content || '')
      }
    }

    return { added, removed, modified, unchanged }
  }

  trackChanges(researchPath: SearchResultItem[]): ChangeMetrics {
    const metrics: ChangeMetrics = {
      newInsights: 0,
      refinements: 0,
      contradictions: 0,
      validations: 0,
      depthProgress: 0
    }

    const diff = this.compareResults(this.previousResults, researchPath)
    
    // Track new insights
    metrics.newInsights = diff.added.length

    // Track refinements
    metrics.refinements = diff.modified.length

    // Track validations (unchanged content that appears in multiple sources)
    metrics.validations = diff.unchanged.length

    // Calculate depth progress
    metrics.depthProgress = this.calculateDepthProgress(researchPath)

    // Store metrics in history
    this.changeHistory.push(metrics)
    
    // Update previous results for next comparison
    this.previousResults = [...researchPath]

    return metrics
  }

  visualizeDiffs(diffs: DiffResult): VisualizationData {
    const visualization: VisualizationData = {
      diffHighlights: {
        newFindings: [],
        refinements: [],
        validations: []
      },
      evolutionMetrics: {
        depthProgress: 0,
        qualityImprovement: 0,
        sourceReliability: 0
      }
    }

    // Process new findings
    diffs.added.forEach(content => {
      visualization.diffHighlights.newFindings.push({
        content,
        type: 'new',
        confidence: this.calculateConfidence(content)
      })
    })

    // Process refinements
    diffs.modified.forEach(({ before, after }) => {
      visualization.diffHighlights.refinements.push({
        content: after,
        type: 'refined',
        confidence: this.calculateConfidence(after)
      })
    })

    // Process validations
    diffs.unchanged.forEach(content => {
      visualization.diffHighlights.validations.push({
        content,
        type: 'validated',
        confidence: 1.0 // Validated content has highest confidence
      })
    })

    // Calculate evolution metrics
    visualization.evolutionMetrics = this.calculateEvolutionMetrics()

    return visualization
  }

  private calculateDepthProgress(currentResults: SearchResultItem[]): number {
    if (this.previousResults.length === 0) {
      // Initialize with base progress for first results
      return currentResults.length > 0 ? 0.1 : 0
    }
    
    const avgPrevDepth = this.calculateAverageDepth(this.previousResults)
    const avgCurrentDepth = this.calculateAverageDepth(currentResults)
    
    // Normalize progress to be between 0 and 1
    const rawProgress = avgCurrentDepth > avgPrevDepth 
      ? (avgCurrentDepth - avgPrevDepth) / avgPrevDepth
      : 0
    
    // Accumulate progress over time
    return Math.min(1, this.lastDepthProgress + rawProgress)
  }

  private calculateAverageDepth(results: SearchResultItem[]): number {
    if (results.length === 0) return 0
    
    // Enhanced depth calculation considering content length and complexity
    return results.reduce((sum, r) => {
      const contentLength = (r.content?.length || 0) / 1000 // Normalize by 1000 chars
      const hasLinks = (r.content?.match(/https?:\/\//g)?.length || 0) > 0
      const baseDepth = r.depth || 1
      
      return sum + (baseDepth * (1 + contentLength * 0.2 + (hasLinks ? 0.1 : 0)))
    }, 0) / results.length
  }

  private calculateConfidence(content: string): number {
    // Enhanced confidence calculation
    const metrics = {
      // Length score (0-0.4)
      length: Math.min(content.length / 2000, 0.4),
      
      // Structure score (0-0.2)
      structure: content.includes('\n') ? 0.2 : 0,
      
      // Link presence (0-0.1)
      links: Math.min((content.match(/https?:\/\//g)?.length || 0) * 0.02, 0.1),
      
      // Sentence complexity (0-0.2)
      complexity: Math.min(
        content.split(/[.!?]+/).filter(s => s.trim().length > 0).length * 0.02,
        0.2
      ),
      
      // Information density (0-0.1)
      density: Math.min(
        new Set(content.toLowerCase().split(/\s+/)).size / content.split(/\s+/).length,
        0.1
      )
    }

    // Calculate total confidence score
    const totalScore = Object.values(metrics).reduce((sum, score) => sum + score, 0)
    
    // Ensure minimum confidence of 0.3 for non-empty content
    return content.trim().length > 0 ? Math.max(0.3, totalScore) : 0
  }

  private calculateEvolutionMetrics(): VisualizationData['evolutionMetrics'] {
    if (this.changeHistory.length === 0) {
      return {
        depthProgress: 0,
        qualityImprovement: 0,
        sourceReliability: 0
      }
    }

    const recentMetrics = this.changeHistory.slice(-3)
    const latestMetrics = this.changeHistory[this.changeHistory.length - 1]
    
    // Update depth progress
    this.lastDepthProgress = latestMetrics.depthProgress
    const depthProgress = this.lastDepthProgress

    // Calculate quality improvement based on insight and validation trends
    const qualityImprovement = this.calculateQualityTrend(recentMetrics)

    // Calculate source reliability based on validation ratio and consistency
    const sourceReliability = this.calculateReliabilityScore(recentMetrics)

    return {
      depthProgress,
      qualityImprovement,
      sourceReliability
    }
  }

  private calculateQualityTrend(metrics: ChangeMetrics[]): number {
    if (metrics.length < 2) return 0.5 // Start at middle point

    // Calculate trend of insights and validations
    const trends = metrics.map((m, i) => {
      if (i === 0) return 0
      const prev = metrics[i - 1]
      const insightChange = m.newInsights - prev.newInsights
      const validationChange = m.validations - prev.validations
      return (insightChange + validationChange) / Math.max(prev.newInsights + prev.validations, 1)
    })

    // Average the trends and normalize to 0-1
    const avgTrend = trends.reduce((sum, t) => sum + t, 0) / (metrics.length - 1)
    return Math.max(0, Math.min(1, avgTrend + 0.5)) // Center around 0.5
  }

  private calculateReliabilityScore(metrics: ChangeMetrics[]): number {
    // Calculate validation ratio
    const totalValidations = metrics.reduce((sum, m) => sum + m.validations, 0)
    const totalChanges = metrics.reduce((sum, m) => 
      sum + m.newInsights + m.refinements + m.validations, 0
    )
    const validationRatio = totalChanges > 0 ? totalValidations / totalChanges : 0

    // Calculate consistency (how stable the findings are)
    const consistency = metrics.reduce((sum, m, i) => {
      if (i === 0) return 0
      const prev = metrics[i - 1]
      const changeRatio = Math.min(
        (m.refinements + m.contradictions) / Math.max(prev.newInsights, 1),
        1
      )
      return sum + (1 - changeRatio)
    }, 0) / Math.max(metrics.length - 1, 1)

    // Combine validation ratio and consistency
    return (validationRatio * 0.6 + consistency * 0.4)
  }
} 