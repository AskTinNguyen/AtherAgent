/**
 * Chat-related request types
 */
export interface CreateChatRequest {
  messages: {
    role: 'user' | 'assistant' | 'system'
    content: string
  }[]
  model?: string
  systemPrompt?: string
  metadata?: Record<string, any>
}

export interface UpdateChatRequest {
  title?: string
  messages?: {
    role: 'user' | 'assistant' | 'system'
    content: string
  }[]
  metadata?: Record<string, any>
}

/**
 * Research-related request types
 */
export interface ResearchRequest {
  query: string
  depth?: number
  maxResults?: number
  filters?: {
    dateRange?: {
      start: string
      end: string
    }
    sources?: string[]
    languages?: string[]
  }
}

export interface UpdateResearchStateRequest {
  depth?: {
    current: number
    max: number
  }
  status?: 'idle' | 'researching' | 'complete'
}

/**
 * Folder-related request types
 */
export interface CreateFolderRequest {
  name: string
  parentId?: string
  metadata?: Record<string, any>
}

export interface UpdateFolderRequest {
  name?: string
  parentId?: string
  metadata?: Record<string, any>
}

export interface AddChatToFolderRequest {
  chatId: string
  position?: number
}

/**
 * Bookmark-related request types
 */
export interface CreateBookmarkRequest {
  url: string
  title: string
  snippet?: string
  source?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateBookmarkRequest {
  title?: string
  snippet?: string
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * Usage-related request types
 */
export interface TrackUsageRequest {
  model: string
  tokens: number
  chatId?: string
  metadata?: {
    requestType?: string
    features?: string[]
    [key: string]: any
  }
}

/**
 * Search-related request types
 */
export interface SearchRequest {
  query: string
  filters?: {
    dateRange?: {
      start: string
      end: string
    }
    sources?: string[]
    languages?: string[]
    type?: 'web' | 'news' | 'academic'
  }
  pagination?: {
    cursor?: string
    limit?: number
  }
  options?: {
    includeMetadata?: boolean
    sortBy?: 'relevance' | 'date'
    [key: string]: any
  }
}
