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
    animationState?: {
      isExpanded: boolean
      currentFocus: 'depth' | 'quality' | 'reliability' | null
      progressAnimation: number
    }
  }
  interactionState: {
    selectedHighlight: string | null
    expandedSections: string[]
    comparisonMode: 'side-by-side' | 'overlay' | 'timeline'
    visualMode: 'compact' | 'detailed' | 'presentation'
  }
  visualEnhancements: {
    depthLevels: {
      level: number
      nodes: string[]
      connections: Array<{ from: string, to: string }>
    }[]
    insightClusters: Array<{
      id: string
      relatedFindings: string[]
      clusterStrength: number
      visualPosition: { x: number, y: number }
    }>
    timelineData: Array<{
      timestamp: number
      snapshot: string
      significance: number
      branchPoint?: boolean
    }>
  }
}

export interface HighlightData {
  content: string
  type: 'new' | 'refined' | 'validated'
  sourceUrl?: string
  confidence: number
  visualState?: {
    isHighlighted: boolean
    isExpanded: boolean
    relationStrength: number
    clusterPosition?: { x: number, y: number }
  }
  metadata?: {
    category?: string
    tags: string[]
    importance: number
    lastModified: number
    relatedHighlights: string[]
  }
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
        sourceReliability: 0,
        animationState: {
          isExpanded: false,
          currentFocus: null,
          progressAnimation: 0
        }
      },
      interactionState: {
        selectedHighlight: null,
        expandedSections: [],
        comparisonMode: 'side-by-side',
        visualMode: 'detailed'
      },
      visualEnhancements: {
        depthLevels: this.generateDepthLevels(diffs),
        insightClusters: this.generateInsightClusters(diffs),
        timelineData: this.generateTimelineData(diffs)
      }
    }

    // Process new findings with enhanced visual states
    diffs.added.forEach((content, index) => {
      visualization.diffHighlights.newFindings.push({
        content,
        type: 'new',
        confidence: this.calculateConfidence(content),
        visualState: {
          isHighlighted: false,
          isExpanded: false,
          relationStrength: 1,
          clusterPosition: this.calculateClusterPosition(index, diffs.added.length)
        },
        metadata: {
          category: this.inferCategory(content),
          tags: this.extractTags(content),
          importance: this.calculateImportance(content),
          lastModified: Date.now(),
          relatedHighlights: this.findRelatedHighlights(content, diffs)
        }
      })
    })

    // Similar enhanced processing for refinements and validations
    diffs.modified.forEach(({ before, after }, index) => {
      visualization.diffHighlights.refinements.push({
        content: after,
        type: 'refined',
        confidence: this.calculateConfidence(after),
        visualState: {
          isHighlighted: false,
          isExpanded: false,
          relationStrength: this.calculateRelationStrength(before, after),
          clusterPosition: this.calculateClusterPosition(index, diffs.modified.length)
        },
        metadata: {
          category: this.inferCategory(after),
          tags: this.extractTags(after),
          importance: this.calculateImportance(after),
          lastModified: Date.now(),
          relatedHighlights: this.findRelatedHighlights(after, diffs)
        }
      })
    })

    // Calculate evolution metrics with animation states
    const evolutionMetrics = this.calculateEvolutionMetrics()
    visualization.evolutionMetrics = {
      ...evolutionMetrics,
      animationState: {
        isExpanded: false,
        currentFocus: null,
        progressAnimation: evolutionMetrics.depthProgress
      }
    }

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

  private generateDepthLevels(diffs: DiffResult) {
    const levels: VisualizationData['visualEnhancements']['depthLevels'] = []
    const maxDepth = 3 // Configurable based on research depth

    for (let i = 0; i < maxDepth; i++) {
      levels.push({
        level: i + 1,
        nodes: [],
        connections: []
      })
    }

    // Populate levels based on content analysis
    return levels
  }

  private generateInsightClusters(diffs: DiffResult) {
    const clusters: VisualizationData['visualEnhancements']['insightClusters'] = []
    // Implement clustering logic based on content similarity and relationships
    return clusters
  }

  private generateTimelineData(diffs: DiffResult) {
    const timeline: VisualizationData['visualEnhancements']['timelineData'] = []
    // Generate timeline data points based on changes and significance
    return timeline
  }

  private calculateClusterPosition(index: number, total: number) {
    // Calculate optimal 2D position for visualization layout
    const angle = (index / total) * 2 * Math.PI
    const radius = 100 // Configurable based on visualization size
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    }
  }

  private calculateRelationStrength(before: string, after: string): number {
    // Implement similarity calculation between before and after content
    return 0.5 // Placeholder
  }

  private inferCategory(content: string): string {
    // Implement category inference logic
    return 'general'
  }

  private extractTags(content: string): string[] {
    // Implement tag extraction logic
    return []
  }

  private calculateImportance(content: string): number {
    // Implement importance calculation based on content analysis
    return 0.5
  }

  private findRelatedHighlights(content: string, diffs: DiffResult): string[] {
    // Implement related highlights finding logic
    return []
  }
} 