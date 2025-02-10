import { SearchResult } from '@/lib/types'

export type DiffType = 'unchanged' | 'added' | 'refined' | 'removed'

export interface ResultDiff {
  type: DiffType
  result: SearchResult
  changes?: {
    title?: boolean
    content?: boolean
    relevance?: number
    depth?: number
  }
  metadata?: {
    previousRelevance?: number
    previousDepth?: number
    refinementReason?: string
  }
}

export interface DiffResult {
  additions: ResultDiff[]
  refinements: ResultDiff[]
  removals: ResultDiff[]
  unchanged: ResultDiff[]
  metrics: DiffMetrics
}

export interface DiffMetrics {
  totalChanges: number
  newInsights: number
  refinements: number
  relevanceImprovement: number
  depthProgress: number
}

export interface DiffVisualizationProps {
  previousResults: SearchResult[]
  currentResults: SearchResult[]
  diffResult: DiffResult
  onResultSelect?: (result: SearchResult) => void
  showMetrics?: boolean
  highlightChanges?: boolean
}

export interface DiffHighlight {
  type: DiffType
  text: string
  metadata?: {
    relevance?: number
    depth?: number
    reason?: string
  }
}

// Configuration for diff visualization
export interface DiffViewConfig {
  showInlineChanges: boolean
  showMetrics: boolean
  groupByChangeType: boolean
  sortByRelevance: boolean
  highlightThreshold: number
} 