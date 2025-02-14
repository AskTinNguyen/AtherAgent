import { ResearchSuggestion } from '@/components/research-suggestions'
import { ResearchDepthConfig, ResearchSourceMetrics, ResearchStage } from './research'

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

export interface ResearchActivity {
  timestamp: number
  message: string
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  depth?: number
  status?: 'pending' | 'complete' | 'error'
  completedSteps?: number
  totalSteps?: number
}

export interface ResearchSource {
  url: string
  title: string
  relevance: number
  content?: string
  query?: string
  publishedDate?: string
  quality?: {
    contentQuality: number
    sourceAuthority: number
    timeRelevance: number
  }
}

export interface ResearchMemory {
  depth: number
  context: string
  sourceUrls: string[]
}

export interface DeepResearchContextType {
  state: ResearchState
  toggleActive: () => void
  setActive: (active: boolean) => void
  addActivity: (activity: ResearchActivity & { completedSteps?: number; totalSteps?: number }) => void
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