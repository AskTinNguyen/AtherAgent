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
}

export interface ResearchDepthRules {
  minRelevanceForNextDepth: number
  maxSourcesPerDepth: number
  depthTimeoutMs: number
  qualityThreshold: number
}

// Redis key patterns
export const REDIS_KEYS = {
  researchState: (chatId: string) => `chat:${chatId}:research:state`,
  researchActivities: (chatId: string) => `chat:${chatId}:research:activities`,
  researchSources: (chatId: string) => `chat:${chatId}:research:sources`,
} as const 