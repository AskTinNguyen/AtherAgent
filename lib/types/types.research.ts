import { ResearchSuggestion } from '@/components/research-suggestions'
import { type ExtendedMessage } from './types.core'
import { type VisualizationData } from './types.visualization'

// Core Research Types
export type ResearchStage = 'overview' | 'deep-research' | 'verification'

export interface ResearchState {
  isActive: boolean
  activity: ResearchActivity[]
  sources: ResearchSource[]
  currentDepth: number
  maxDepth: number
  completedSteps: number
  totalExpectedSteps: number
  depthConfig: ResearchDepthConfig
  sourceMetrics: ResearchSourceMetrics[]
  suggestions: ResearchSuggestion[]
  researchMemory: ResearchMemory[]
  gateStatus: ResearchGateStatus
  iterationMetrics: ResearchIterationMetrics
  researchProgress: ResearchProgress
}

// Research Configuration Types
export interface ResearchDepthConfig {
  maxDepth: number
  depthIncrement: number
  depthThresholds: {
    overview: number
    deepResearch: number
    verification: number
  }
}

export interface ResearchDepthRules {
  minRelevanceForNextDepth: number
  maxSourcesPerDepth: number
  depthTimeoutMs: number
  qualityThreshold: number
}

// Research Activity Types
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
  | 'visualization_update'
  | 'research_path'
  | 'depth_transition'

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
  completedSteps?: number
  totalSteps?: number
}

export interface ResearchActivityMetadata {
  aiModel?: string
  confidence?: number
  relatedTopics?: string[]
  sourceContext?: string
  previousActivities?: string[]
  visualizationData?: VisualizationData
  researchPath?: {
    currentStep: number
    totalSteps: number
    pathType: string
    branchingFactor?: number
  }
}

// Research Source Types
export interface ResearchSource {
  id: string
  url: string
  title?: string
  relevance?: number
  snippet?: string
  query?: string
  publishedDate?: string
  quality?: {
    contentQuality: number
    sourceAuthority: number
    timeRelevance: number
  }
}

export interface ResearchSourceMetrics {
  sourceId: string
  quality: number
  relevance: number
  timeRelevance: number
}

// Research Progress Types
export interface ResearchProgress {
  currentStage: ResearchStage
  stageProgress: number
  remainingQuestions: string[]
}

export interface ResearchIterationMetrics {
  startTime: number
  repetitionCount: number
  toolCallCounts: Record<string, number>
  failedAttempts: Record<string, number>
}

// Quality Gate Types
export interface ResearchGateStatus {
  currentGate: number
  gateResults: Record<number, {
    passed: boolean
    score: number
    feedback: string
    timestamp: number
  }>
}

export interface QualityGate {
  gateNumber: number
  name: string
  criteria: GateCriteria
  evaluator: (state: ResearchState) => Promise<GateEvaluation>
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

// Research Memory and Context
export interface ResearchMemory {
  depth: number
  context: string
  sourceUrls: string[]
}

export interface DeepResearchContextType {
  state: ResearchState
  toggleActive: () => void
  setActive: (active: boolean) => void
  addActivity: (activity: ResearchActivity) => void
  addSource: (source: ResearchSource) => void
  setDepth: (current: number, max: number) => void
  initProgress: (maxDepth: number, totalSteps: number) => void
  updateProgress: (completed: number, total: number) => void
  clearState: () => void
  setSuggestions: (suggestions: ResearchSuggestion[]) => void
  addMemory: (memory: ResearchMemory) => void
  updateMemory: (index: number, memory: ResearchMemory) => void
  evaluateGate: (gateNumber: number) => void
  setResearchStage: (stage: ResearchStage, progress: number) => void
  updateRemainingQuestions: (questions: string[]) => void
  incrementToolCall: (toolName: string) => void
  incrementFailedAttempt: (toolName: string) => void
}

// Redis Keys
export const REDIS_KEYS = {
  researchState: (chatId: string) => `chat:${chatId}:research:state`,
  researchActivities: (chatId: string) => `chat:${chatId}:research:activities`,
  researchSources: (chatId: string) => `chat:${chatId}:research:sources`,
} as const

// Research Suggestions and Results
export interface AutocompleteSuggestion {
  id: string
  text: string
  confidence: number
  source?: ResearchSource
}

// Tool Result Types
export interface ToolResultContent {
  type: 'text'
  text: string
}

// Search Types
export interface SearchProps {
  tool: {
    id: string
    name: string
    description: string
    state: 'idle' | 'loading' | 'error' | 'success'
  }
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  messages: ExtendedMessage[]
  setMessages: (messages: ExtendedMessage[]) => void
  chatId: string
  onSubmit: () => Promise<void>
  onClear: () => void
}

export interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  score: number
  content: string
}

export interface ImageResult {
  id: string
  url: string
  title: string
  description: string
}

export interface SearchResults {
  results: SearchResult[]
}

export interface ImageResults {
  images: ImageResult[]
}