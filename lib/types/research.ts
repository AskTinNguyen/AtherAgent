import { ResearchState } from '@/lib/contexts/research-context'

export type ResearchActivityType = 
  | 'search' 
  | 'extract' 
  | 'analyze' 
  | 'reasoning' 
  | 'synthesis' 
  | 'thought'
  | 'user_prompt'
  | 'ai_response'
  | 'ai_suggestion'
  | 'visualization_update'  // For tracking visualization panel changes
  | 'research_path'        // For tracking research path progression
  | 'depth_transition'     // For tracking depth level changes

export interface ResearchActivityMetadata {
  aiModel?: string
  confidence?: number
  relatedTopics?: string[]
  sourceContext?: string
  previousActivities?: string[]
  visualizationData?: {
    type: 'path' | 'depth' | 'suggestion' | 'analysis'
    depthLevel?: number
    pathProgress?: number
    relatedActivities?: string[]
    displayTimestamp?: string
    displayDuration?: number
    interactionType?: 'auto' | 'user_triggered'
  }
  researchPath?: {
    currentStep: number
    totalSteps: number
    pathType: string
    branchingFactor?: number
  }
}

export interface ResearchActivity {
  id: string
  chatId: string
  type: ResearchActivityType
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
  createdAt: string
  metadata?: ResearchActivityMetadata
  parentActivityId?: string
}

export interface ChatResearchActivity {
  id: string
  chatId: string
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
  createdAt: string
}

export interface ChatResearchSource {
  id: string
  chatId: string
  url: string
  title: string
  relevance: number
  createdAt: string
}

export interface ChatResearchState {
  isCleared: boolean
  clearedAt?: string
  activities: ChatResearchActivity[]
  sources: ChatResearchSource[]
}

export interface ResearchDepthConfig {
  currentDepth: number
  maxDepth: number
  minRelevanceScore: number
  adaptiveThreshold: number
  depthScores: Record<number, number>
}

export interface ResearchSourceMetrics {
  relevanceScore: number
  depthLevel: number
  contentQuality: number
  timeRelevance: number
  sourceAuthority: number
  crossValidation?: number
  coverage?: number
}

export interface ResearchDepthRules {
  minRelevanceForNextDepth: number
  maxSourcesPerDepth: number
  depthTimeoutMs: number
  qualityThreshold: number
}

export interface QualityGate {
  gateNumber: number
  name: string
  criteria: GateCriteria
  evaluator: (state: EnhancedResearchState) => Promise<GateEvaluation>
}

export interface GateCriteria {
  minSources?: number
  minRelevanceScore?: number
  requiredCoverage?: string[]
  minSourcesPerTopic?: number
  crossValidation?: boolean
  depthScore?: number
  qualityThreshold?: number
}

export interface GateEvaluation {
  passed: boolean
  score: number
  feedback: string
  decision: GateDecision
}

export type GateDecision = 
  | 'CONTINUE_OVERVIEW'
  | 'PROCEED_TO_DEEP_RESEARCH'
  | 'CONTINUE_RESEARCH'
  | 'PREPARE_REPORT'
  | 'INCREASE_DEPTH'
  | 'FINALIZE'

export interface EnhancedResearchState extends ResearchState {
  gateStatus: {
    currentGate: number
    gateResults: Record<number, {
      passed: boolean
      score: number
      feedback: string
      timestamp: number
    }>
  }
  iterationMetrics: {
    startTime: number
    repetitionCount: number
    toolCallCounts: Record<string, number>
    failedAttempts: Record<string, number>
  }
  researchProgress: {
    currentStage: ResearchStage
    stageProgress: number
    remainingQuestions: string[]
  }
}

export type ResearchStage = 'overview' | 'deep_research' | 'verification' | 'report'

// Redis key patterns
export const REDIS_KEYS = {
  researchState: (chatId: string) => `chat:${chatId}:research:state`,
  researchActivities: (chatId: string) => `chat:${chatId}:research:activities`,
  researchSources: (chatId: string) => `chat:${chatId}:research:sources`,
} as const 

// Add interface for suggestions
export interface ResearchSuggestion {
  type: 'path' | 'source' | 'depth' | 'refinement' | 'related' | 'cross_reference'
  content: string
  confidence: number
  metadata: ResearchSuggestionMetadata
  context?: {
    previousContent?: string
    nextSteps?: string[]
    rationale?: string
  }
}

export interface ResearchSuggestionMetadata {
  sourceUrl?: string
  depthLevel: number
  category: string
  relevanceScore: number
  timestamp: number
  sourceContext?: string
  relatedTopics?: string[]
  previousQueries?: string[]
  suggestionId?: string
}

// Update the base ResearchState to include suggestions
export interface ExtendedResearchState extends ResearchState {
  suggestions: ResearchSuggestion[]
  depth: {
    current: number
    max: number
    config: {
      minRelevanceScore: number
      adaptiveThreshold: number
      depthScores: Record<number, number>
    }
  }
} 