// Define our research types
export type SuggestionType = 'depth' | 'cross_reference' | 'refinement' | 'path'
export type ActivityType = 'search' | 'thought' | 'extract' | 'analyze' | 'reasoning' | 'synthesis'
export type ActivityStatus = 'pending' | 'complete' | 'error'

export interface MessageContext {
  id: string
  session_id: string
  main_topic: string
  related_topics: string[]
  relevance_score: number
  created_at: string
  updated_at: string
}

export interface ResearchSource {
  id: string
  url: string
  title: string
  relevance: number
  content?: string
  query?: string
  publishedDate?: string
  timestamp: string
  quality: {
    contentQuality: number
    sourceAuthority: number
    timeRelevance: number
  }
}

export interface SourceMetrics {
  contentQuality: number
  sourceAuthority: number
  timeRelevance: number
  depthLevel: number
  overallScore: number
}

export interface ResearchSuggestion {
  id: string
  session_id: string
  context_id: string
  type: SuggestionType
  content: string
  confidence: number
  metadata: {
    depth_level?: number
    related_topics?: string[]
    search_queries?: string[]
  }
  created_at: string
  used_at?: string
}

export interface ResearchActivity {
  type: ActivityType
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
  completedSteps?: number
  totalSteps?: number
  metadata?: Record<string, any>
}

export interface ResearchSessionConfig {
  sessionId: string
  timestamp: number
  status: 'idle' | 'running' | 'completed'
}

export interface ResearchConfiguration {
  targetDepth: number
  maxAllowedDepth: number
  timestamp: number
}

// Define our enhanced research state
export interface ResearchState {
  isActive: boolean
  searchEnabled: boolean
  // Current research progress
  depth: {
    current: number
    max: number
    config: {
      minRelevanceScore: number
      adaptiveThreshold: number
      depthScores: Record<number, number>
    }
  }
  // Configuration for next research
  configuration: ResearchConfiguration
  // Session management
  session: ResearchSessionConfig
  // Existing fields
  activity: ResearchActivity[]
  sources: ResearchSource[]
  sourceMetrics: SourceMetrics[]
  suggestions: ResearchSuggestion[]
  messages: {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }[]
  completedSteps: number
  totalExpectedSteps: number
}

