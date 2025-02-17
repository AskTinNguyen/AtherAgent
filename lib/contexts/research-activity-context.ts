export interface ResearchState {
  previousResults: any[] | null
  visualizationData: any | null
  metrics: ResearchMetrics
}

export interface ResearchMetrics {
  totalSources: number
  averageRelevance: number
  topKeywords: string[]
  searchDepth: number
  lastUpdated: string
}

export interface ActivityItem {
  id: string
  type: 'search' | 'analysis' | 'summary'
  message: string
  timestamp: string
  depth?: number
  metadata?: Record<string, any>
} 