import { type ResearchContext } from '@/lib/ai/research-processor'
import { type retrieveTool } from '@/lib/tools/retrieve'
import { type searchTool } from '@/lib/tools/search'
import { type videoSearchTool } from '@/lib/tools/video-search'
import { type CoreMessage } from 'ai'
import { type ToolResultContent } from './index'

// Research Tools Configuration
export interface ResearchTools {
  search: typeof searchTool
  retrieve: typeof retrieveTool
  videoSearch: typeof videoSearchTool
}

// Search Tool Parameters
export interface SearchToolParams {
  query: string
  search_depth: 'basic' | 'advanced'
  include_domains: string[]
  exclude_domains: string[]
}

// Valid tool names derived from ResearchTools
export type ToolName = keyof ResearchTools

// Researcher Configuration
export interface ResearcherConfig {
  messages: CoreMessage[]
  model: string
  searchMode: boolean
  context?: ResearchContext
  maxIterations?: number
}

// Researcher Return Type
export interface ResearcherReturn {
  role: 'system' | 'user' | 'assistant'
  content: string
  data?: ToolResultContent
}

// Research Iteration Type
export interface ResearchIteration {
  query: string
  results: ToolResultContent[]
  timestamp: number
}

// Researcher State
export interface ResearcherState {
  iterations: ResearchIteration[]
  currentDepth: number
  maxDepth: number
  recentFindings: string[]
} 