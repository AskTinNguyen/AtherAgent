import { CoreMessage, Message } from 'ai'
import type { ResearchSource } from './types.research'

// Core type definitions
export type {
  FinishReason,
  TokenUsage,
  UsageInfo
} from './types.core'

export * from './types.storage'
export * from './types.ui'

// Re-export chat types
export type {
  Chat, ChatMetadata,
  ChatOperationResult, Message, MessageMetadata, MessageResearchData, MessageToolCall,
  MessageToolResult, MessageType, SaveChatOptions
} from './types.chat'

// Re-export research types
export type {
  AutocompleteSuggestion, EnhancedResearchState, ExtendedResearchState, GateCriteria, GateDecision, GateEvaluation, QualityGate, ResearchActivity, ResearchActivityMetadata, ResearchActivityType, ResearchDepthConfig,
  ResearchDepthRules, ResearchSource, ResearchSourceMetrics,
  ResearchStage, ResearchSuggestion,
  ResearchSuggestionMetadata, ToolResultContent
} from './types.research'

// Re-export search types
export type {
  ExaSearchResultItem, ExaSearchResults, SearchResultImage, SearchResultItem,
  SearchResults, SearXNGImageResult, SearXNGResponse, SearXNGResult, SearXNGSearchResults, SerperSearchResultItem, SerperSearchResults
} from './types.search'

// Feature-specific implementations
export * from './chart'
export * from './deep-research'
export * from './messages'
export * from './models'
export * from './research-command-center'
export * from './usage'
export * from './visualization'

// Attachment Types
export interface AttachmentFile {
  id: string
  file: File
  type: 'image' | 'document' | 'other'
  previewUrl?: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  progress?: number
  error?: string
}

// Extended Message Types
export interface MultimodalMessage extends Message {
  attachments?: AttachmentFile[]
  sources?: ResearchSource[]
}

export interface SearchSource {
  url: string
  title?: string
  snippet?: string
  timestamp: number
  messageId: string
  searchQuery?: string
}

export interface ExtendedMessage extends Message {
  searchSources?: SearchSource[]
}

export type ExtendedCoreMessage = Omit<CoreMessage, 'role' | 'content'> & {
  role: CoreMessage['role'] | 'data'
  content: CoreMessage['content'] | JSONValue
}

// Utility types
export type JSONValue = 
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

// Type guards and type predicates
export function isJSONValue(value: unknown): value is JSONValue {
  if (value === null) return true
  if (['string', 'number', 'boolean'].includes(typeof value)) return true
  if (Array.isArray(value)) return value.every(isJSONValue)
  if (typeof value === 'object') {
    return Object.values(value as object).every(isJSONValue)
  }
  return false
}

// Type version for tracking breaking changes
export const TYPE_VERSION = '1.0.0'

export * from './types.diff'

export * from './types.streaming'

export * from './types.agent'
