/**
 * Base API response interface that all responses should extend
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

/**
 * Chat-related response types
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  id?: string
  createdAt?: string
  metadata?: Record<string, any>
}

export interface Chat {
  id: string
  title?: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  metadata?: {
    model?: string
    systemPrompt?: string
    [key: string]: any
  }
}

export type ChatListResponse = ApiResponse<Chat[]>
export type ChatResponse = ApiResponse<Chat>
export type ChatValidateResponse = ApiResponse<{ valid: boolean }>

/**
 * Research-related response types
 */
export interface ResearchSuggestion {
  id: string
  content: string
  type: 'search' | 'insight' | 'followup'
  confidence: number
  metadata?: Record<string, any>
}

export interface ResearchState {
  chatId: string
  suggestions: ResearchSuggestion[]
  depth: {
    current: number
    max: number
  }
  status: 'idle' | 'researching' | 'complete'
  updatedAt: string
}

export type ResearchStateResponse = ApiResponse<ResearchState>
export type ResearchSuggestionsResponse = ApiResponse<ResearchSuggestion[]>

/**
 * Folder-related response types
 */
export interface Folder {
  id: string
  name: string
  parentId?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface FolderWithChats extends Folder {
  chats: Chat[]
}

export type FolderListResponse = ApiResponse<Folder[]>
export type FolderResponse = ApiResponse<Folder>
export type FolderWithChatsResponse = ApiResponse<FolderWithChats>

/**
 * Bookmark-related response types
 */
export interface Bookmark {
  id: string
  url: string
  title: string
  snippet?: string
  source?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export type BookmarkListResponse = ApiResponse<Bookmark[]>
export type BookmarkResponse = ApiResponse<Bookmark>
export type BookmarkCheckResponse = ApiResponse<{
  exists: boolean
  bookmark?: Bookmark
}>

/**
 * Usage-related response types
 */
export interface UsageStats {
  totalRequests: number
  totalTokens: number
  modelUsage: {
    [modelName: string]: {
      requests: number
      tokens: number
    }
  }
  periodStart: string
  periodEnd: string
}

export type UsageStatsResponse = ApiResponse<UsageStats>

/**
 * Upload-related response types
 */
export interface UploadResult {
  url: string
  filename: string
  size: number
  mimeType: string
}

export type UploadResponse = ApiResponse<UploadResult>

/**
 * Search-related response types
 */
export interface SearchResult {
  url: string
  title: string
  snippet: string
  source?: string
  relevance?: number
  metadata?: {
    author?: string
    publishDate?: string
    [key: string]: any
  }
}

export interface SearchResponse extends ApiResponse<SearchResult[]> {
  metadata?: {
    totalResults: number
    searchTime: number
    nextCursor?: string
  }
}
