/**
 * Enhanced Bookmark Types for Deep Research Integration
 */

// Core Types
export type BookmarkType = 'research_suggestion' | 'search_result' | 'chat_message' | 'source' | 'path' | 'depth'
export type BookmarkPermission = 'read' | 'write' | 'admin'

// Base Metadata Type
export interface BaseMetadata {
  sourceContext: string
  tags?: string[]
}

// Research Context Types
export interface ResearchMetadata extends BaseMetadata {
  depthLevel: number
  relevanceScore: number
  relatedTopics: string[]
  previousQueries: string[]
  sourceQuality: {
    relevance: number
    authority: number
    freshness: number
    coverage: number
  }
}

// Search Result Types
export interface SearchMetadata extends BaseMetadata {
  queryContext: string
  searchScore: number
  resultRank: number
  sourceQuality: {
    relevance: number
    authority: number
    freshness: number
    coverage: number
  }
}

// Chat Message Types
export interface ChatMetadata extends BaseMetadata {
  messageContext: string
  conversationId: string
  timestamp: string
}

export type BookmarkMetadata = 
  | { type: 'research_suggestion', data: ResearchMetadata }
  | { type: 'search_result', data: SearchMetadata }
  | { type: 'chat_message', data: ChatMetadata }

// Analytics Types
export interface BookmarkAnalytics {
  createdAt: string
  lastAccessed: string
  useCount: number
  effectiveness: number
  pathProgress?: number
  sourceRelevance?: number
}

// Organization Types
export interface BookmarkOrganization {
  category: string
  tags: string[]
  folderId?: string
  collectionId?: string
  order?: number
}

// Sharing Types
export interface BookmarkSharing {
  isShared: boolean
  sharedWith: Array<{
    userId: string
    permission: BookmarkPermission
  }>
  sharedAt?: string
  lastAccessedBy?: string
}

// Version Control
export interface BookmarkVersion {
  version: number
  schemaVersion: string
  lastUpdated: string
  migrationHistory: Array<{
    from: string
    to: string
    date: string
  }>
}

/**
 * Main Enhanced Bookmark Interface
 */
export interface EnhancedBookmark {
  // Core Properties
  id: string
  userId: string
  type: BookmarkType
  content: string
  
  // Enhanced Properties
  metadata: BookmarkMetadata
  analytics: BookmarkAnalytics
  organization: BookmarkOrganization
  sharing: BookmarkSharing
  version: BookmarkVersion
}

/**
 * Redis Key Patterns
 */
export const BOOKMARK_REDIS_KEYS = {
  // Core Keys (Existing)
  userBookmarks: (userId: string) => `user:${userId}:bookmarks`,
  bookmarkDetails: (bookmarkId: string) => `bookmark:${bookmarkId}`,
  
  // Organization Keys
  bookmarkCategories: (userId: string) => `user:${userId}:bookmark:categories`,
  bookmarkCollections: (userId: string) => `user:${userId}:bookmark:collections`,
  bookmarkFolders: (userId: string) => `user:${userId}:bookmark:folders`,
  bookmarkTags: (userId: string) => `user:${userId}:bookmark:tags`,
  
  // Sharing Keys
  sharedBookmarks: (userId: string) => `user:${userId}:bookmark:shared`,
  bookmarkPermissions: (bookmarkId: string) => `bookmark:${bookmarkId}:permissions`,
  
  // Analytics Keys
  bookmarkAnalytics: (bookmarkId: string) => `bookmark:${bookmarkId}:analytics`,
  userBookmarkStats: (userId: string) => `user:${userId}:bookmark:stats`,
  
  // Research Context Keys
  bookmarkResearchContext: (bookmarkId: string) => `bookmark:${bookmarkId}:research`,
  bookmarkRelations: (bookmarkId: string) => `bookmark:${bookmarkId}:relations`,
  
  // Migration Keys
  bookmarkVersions: (bookmarkId: string) => `bookmark:${bookmarkId}:version`
} as const

/**
 * Type Guards and Utilities
 */
export function isEnhancedBookmark(bookmark: any): bookmark is EnhancedBookmark {
  return (
    bookmark &&
    typeof bookmark.id === 'string' &&
    typeof bookmark.userId === 'string' &&
    typeof bookmark.type === 'string' &&
    typeof bookmark.content === 'string' &&
    bookmark.metadata &&
    bookmark.analytics &&
    bookmark.organization &&
    bookmark.sharing &&
    bookmark.version
  )
}

/**
 * Migration Types
 */
export interface BookmarkMigrationData {
  oldVersion: string
  newVersion: string
  migratedAt: string
  changes: Array<{
    field: string
    from: any
    to: any
  }>
}

/**
 * Redis Storage Format
 */
export interface BookmarkRedisSchema {
  // Core Data (Hash)
  core: {
    id: string
    userId: string
    type: BookmarkType
    content: string
    createdAt: string
    schemaVersion: string
  }
  
  // Metadata (Hash)
  metadata: {
    type: string
    sourceContext: string
    tags: string // JSON stringified
    // Research specific
    depthLevel?: string
    relevanceScore?: string
    relatedTopics?: string // JSON stringified
    previousQueries?: string // JSON stringified
    sourceQuality?: string // JSON stringified
    // Search specific
    queryContext?: string
    searchScore?: string
    resultRank?: string
    // Chat specific
    messageContext?: string
    conversationId?: string
    timestamp?: string
  }
  
  // Analytics (Hash)
  analytics: {
    lastAccessed: string
    useCount: string
    effectiveness: string
    pathProgress: string
    sourceRelevance: string
  }
  
  // Organization (Sorted Set)
  organization: {
    category: string
    tags: string // JSON stringified
    folderId: string
    collectionId: string
    order: string
  }
  
  // Sharing (Hash)
  sharing: {
    isShared: string
    sharedWith: string // JSON stringified
    sharedAt: string
    lastAccessedBy: string
  }
} 