import { nanoid } from 'nanoid'
import { getRedisClient } from '../config'
import {
    BOOKMARK_REDIS_KEYS,
    BookmarkMetadata,
    BookmarkRedisSchema,
    BookmarkType,
    EnhancedBookmark
} from '../types/bookmarks'

const CURRENT_SCHEMA_VERSION = '1.0.0'

/**
 * Creates default values for new bookmark properties
 */
function createDefaultBookmarkProperties(
  type: BookmarkType,
  userId: string,
  content: string,
  metadata?: Partial<BookmarkMetadata>
): EnhancedBookmark {
  const now = new Date().toISOString()
  
  // Create default metadata based on type
  let defaultMetadata: BookmarkMetadata
  switch (type) {
    case 'research_suggestion':
      defaultMetadata = {
        type: 'research_suggestion',
        data: {
          sourceContext: metadata?.data?.sourceContext ?? '',
          tags: metadata?.data?.tags ?? [],
          depthLevel: (metadata as any)?.data?.depthLevel ?? 0,
          relevanceScore: (metadata as any)?.data?.relevanceScore ?? 0,
          relatedTopics: (metadata as any)?.data?.relatedTopics ?? [],
          previousQueries: (metadata as any)?.data?.previousQueries ?? [],
          sourceQuality: (metadata as any)?.data?.sourceQuality ?? {
            relevance: 0,
            authority: 0,
            freshness: 0,
            coverage: 0
          }
        }
      }
      break
    
    case 'search_result':
      defaultMetadata = {
        type: 'search_result',
        data: {
          sourceContext: metadata?.data?.sourceContext ?? '',
          tags: metadata?.data?.tags ?? [],
          queryContext: (metadata as any)?.data?.queryContext ?? '',
          searchScore: (metadata as any)?.data?.searchScore ?? 0,
          resultRank: (metadata as any)?.data?.resultRank ?? 0
        }
      }
      break
    
    case 'chat_message':
      defaultMetadata = {
        type: 'chat_message',
        data: {
          sourceContext: metadata?.data?.sourceContext ?? '',
          tags: metadata?.data?.tags ?? [],
          messageContext: (metadata as any)?.data?.messageContext ?? '',
          conversationId: (metadata as any)?.data?.conversationId ?? '',
          timestamp: (metadata as any)?.data?.timestamp ?? now
        }
      }
      break
    
    default:
      defaultMetadata = {
        type: 'research_suggestion',
        data: {
          sourceContext: metadata?.data?.sourceContext ?? '',
          tags: metadata?.data?.tags ?? [],
          depthLevel: 0,
          relevanceScore: 0,
          relatedTopics: [],
          previousQueries: [],
          sourceQuality: {
            relevance: 0,
            authority: 0,
            freshness: 0,
            coverage: 0
          }
        }
      }
  }
  
  return {
    id: nanoid(),
    userId,
    type,
    content,
    metadata: defaultMetadata,
    analytics: {
      createdAt: now,
      lastAccessed: now,
      useCount: 0,
      effectiveness: 0
    },
    organization: {
      category: 'uncategorized',
      tags: defaultMetadata.data.tags ?? [],
      folderId: undefined,
      collectionId: undefined,
      order: 0
    },
    sharing: {
      isShared: false,
      sharedWith: [],
      sharedAt: undefined,
      lastAccessedBy: undefined
    },
    version: {
      version: 1,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      lastUpdated: now,
      migrationHistory: []
    }
  }
}

/**
 * Converts an EnhancedBookmark to Redis storage format
 */
function bookmarkToRedisSchema(bookmark: EnhancedBookmark): BookmarkRedisSchema {
  return {
    core: {
      id: bookmark.id,
      userId: bookmark.userId,
      type: bookmark.type,
      content: bookmark.content,
      createdAt: bookmark.analytics.createdAt,
      schemaVersion: bookmark.version.schemaVersion
    },
    metadata: {
      type: bookmark.metadata.type,
      sourceContext: bookmark.metadata.data.sourceContext,
      tags: JSON.stringify(bookmark.metadata.data.tags || []),
      ...(bookmark.metadata.type === 'research_suggestion' && {
        depthLevel: bookmark.metadata.data.depthLevel.toString(),
        relevanceScore: bookmark.metadata.data.relevanceScore.toString(),
        relatedTopics: JSON.stringify(bookmark.metadata.data.relatedTopics),
        previousQueries: JSON.stringify(bookmark.metadata.data.previousQueries),
        sourceQuality: JSON.stringify(bookmark.metadata.data.sourceQuality)
      }),
      ...(bookmark.metadata.type === 'search_result' && {
        queryContext: bookmark.metadata.data.queryContext,
        searchScore: bookmark.metadata.data.searchScore.toString(),
        resultRank: bookmark.metadata.data.resultRank.toString()
      }),
      ...(bookmark.metadata.type === 'chat_message' && {
        messageContext: bookmark.metadata.data.messageContext,
        conversationId: bookmark.metadata.data.conversationId,
        timestamp: bookmark.metadata.data.timestamp
      })
    },
    analytics: {
      lastAccessed: bookmark.analytics.lastAccessed,
      useCount: bookmark.analytics.useCount.toString(),
      effectiveness: bookmark.analytics.effectiveness.toString(),
      pathProgress: bookmark.analytics.pathProgress?.toString() ?? '0',
      sourceRelevance: bookmark.analytics.sourceRelevance?.toString() ?? '0'
    },
    organization: {
      category: bookmark.organization.category,
      tags: JSON.stringify(bookmark.organization.tags),
      folderId: bookmark.organization.folderId ?? '',
      collectionId: bookmark.organization.collectionId ?? '',
      order: bookmark.organization.order?.toString() ?? '0'
    },
    sharing: {
      isShared: bookmark.sharing.isShared.toString(),
      sharedWith: JSON.stringify(bookmark.sharing.sharedWith),
      sharedAt: bookmark.sharing.sharedAt ?? '',
      lastAccessedBy: bookmark.sharing.lastAccessedBy ?? ''
    }
  }
}

/**
 * Converts Redis storage format back to EnhancedBookmark
 */
function redisSchemaToBookmark(
  schema: BookmarkRedisSchema,
  includeVersion = true
): EnhancedBookmark {
  let metadata: BookmarkMetadata
  
  switch (schema.metadata.type) {
    case 'research_suggestion':
      metadata = {
        type: 'research_suggestion',
        data: {
          sourceContext: schema.metadata.sourceContext,
          tags: JSON.parse(schema.metadata.tags || '[]'),
          depthLevel: parseInt(schema.metadata.depthLevel || '0', 10),
          relevanceScore: parseFloat(schema.metadata.relevanceScore || '0'),
          relatedTopics: JSON.parse(schema.metadata.relatedTopics || '[]'),
          previousQueries: JSON.parse(schema.metadata.previousQueries || '[]'),
          sourceQuality: JSON.parse(schema.metadata.sourceQuality || '{"relevance":0,"authority":0,"freshness":0,"coverage":0}')
        }
      }
      break
      
    case 'search_result':
      metadata = {
        type: 'search_result',
        data: {
          sourceContext: schema.metadata.sourceContext,
          tags: JSON.parse(schema.metadata.tags || '[]'),
          queryContext: schema.metadata.queryContext || '',
          searchScore: parseFloat(schema.metadata.searchScore || '0'),
          resultRank: parseInt(schema.metadata.resultRank || '0', 10)
        }
      }
      break
      
    case 'chat_message':
      metadata = {
        type: 'chat_message',
        data: {
          sourceContext: schema.metadata.sourceContext,
          tags: JSON.parse(schema.metadata.tags || '[]'),
          messageContext: schema.metadata.messageContext || '',
          conversationId: schema.metadata.conversationId || '',
          timestamp: schema.metadata.timestamp || new Date().toISOString()
        }
      }
      break
      
    default:
      metadata = {
        type: 'research_suggestion',
        data: {
          sourceContext: schema.metadata.sourceContext,
          tags: JSON.parse(schema.metadata.tags || '[]'),
          depthLevel: 0,
          relevanceScore: 0,
          relatedTopics: [],
          previousQueries: [],
          sourceQuality: { relevance: 0, authority: 0, freshness: 0, coverage: 0 }
        }
      }
  }

  return {
    id: schema.core.id,
    userId: schema.core.userId,
    type: schema.core.type as BookmarkType,
    content: schema.core.content,
    metadata,
    analytics: {
      createdAt: schema.core.createdAt,
      lastAccessed: schema.analytics.lastAccessed,
      useCount: parseInt(schema.analytics.useCount, 10),
      effectiveness: parseFloat(schema.analytics.effectiveness),
      pathProgress: schema.analytics.pathProgress ? parseFloat(schema.analytics.pathProgress) : undefined,
      sourceRelevance: schema.analytics.sourceRelevance ? parseFloat(schema.analytics.sourceRelevance) : undefined
    },
    organization: {
      category: schema.organization.category,
      tags: JSON.parse(schema.organization.tags),
      folderId: schema.organization.folderId || undefined,
      collectionId: schema.organization.collectionId || undefined,
      order: schema.organization.order ? parseInt(schema.organization.order, 10) : undefined
    },
    sharing: {
      isShared: schema.sharing.isShared === 'true',
      sharedWith: JSON.parse(schema.sharing.sharedWith),
      sharedAt: schema.sharing.sharedAt || undefined,
      lastAccessedBy: schema.sharing.lastAccessedBy || undefined
    },
    version: includeVersion ? {
      version: 1,
      schemaVersion: schema.core.schemaVersion,
      lastUpdated: new Date().toISOString(),
      migrationHistory: []
    } : undefined as any
  }
}

/**
 * Creates a new bookmark with enhanced features
 */
export async function createBookmark(
  userId: string,
  type: BookmarkType,
  content: string,
  metadata?: Partial<BookmarkMetadata>
): Promise<EnhancedBookmark> {
  const redis = await getRedisClient()
  const bookmark = createDefaultBookmarkProperties(type, userId, content, metadata)
  const redisSchema = bookmarkToRedisSchema(bookmark)
  
  try {
    // Store core bookmark data
    await redis.hmset(
      BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmark.id),
      redisSchema.core
    )
    
    // Store metadata
    await redis.hmset(
      BOOKMARK_REDIS_KEYS.bookmarkResearchContext(bookmark.id),
      redisSchema.metadata
    )
    
    // Store analytics
    await redis.hmset(
      BOOKMARK_REDIS_KEYS.bookmarkAnalytics(bookmark.id),
      redisSchema.analytics
    )
    
    // Store organization data
    await redis.hmset(
      `${BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmark.id)}:organization`,
      redisSchema.organization
    )
    
    // Store sharing data
    await redis.hmset(
      BOOKMARK_REDIS_KEYS.bookmarkPermissions(bookmark.id),
      redisSchema.sharing
    )
    
    // Add to user's bookmark list with timestamp score for ordering
    await redis.zadd(
      BOOKMARK_REDIS_KEYS.userBookmarks(userId),
      Date.now(),
      bookmark.id
    )
    
    // Add to category if not uncategorized
    if (bookmark.organization.category !== 'uncategorized') {
      await redis.zadd(
        BOOKMARK_REDIS_KEYS.bookmarkCategories(userId),
        Date.now(),
        bookmark.organization.category
      )
    }
    
    return bookmark
  } catch (error) {
    console.error('Failed to create bookmark:', error)
    throw error
  }
}

/**
 * Retrieves a bookmark by ID with all enhanced features
 */
export async function getBookmark(bookmarkId: string): Promise<EnhancedBookmark | null> {
  const redis = await getRedisClient()
  
  try {
    // Get all bookmark components
    const [core, metadata, analytics, organization, sharing] = await Promise.all([
      redis.hgetall(BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmarkId)),
      redis.hgetall(BOOKMARK_REDIS_KEYS.bookmarkResearchContext(bookmarkId)),
      redis.hgetall(BOOKMARK_REDIS_KEYS.bookmarkAnalytics(bookmarkId)),
      redis.hgetall(`${BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmarkId)}:organization`),
      redis.hgetall(BOOKMARK_REDIS_KEYS.bookmarkPermissions(bookmarkId))
    ])
    
    if (!core || !metadata || !analytics || !organization || !sharing) {
      return null
    }
    
    const redisSchema: BookmarkRedisSchema = {
      core: core as any,
      metadata: metadata as any,
      analytics: analytics as any,
      organization: organization as any,
      sharing: sharing as any
    }
    
    // Update last accessed time
    const now = new Date().toISOString()
    await redis.hmset(BOOKMARK_REDIS_KEYS.bookmarkAnalytics(bookmarkId), {
      lastAccessed: now
    })
    
    return redisSchemaToBookmark(redisSchema)
  } catch (error) {
    console.error('Failed to get bookmark:', error)
    return null
  }
}

/**
 * Retrieves all bookmarks for a user with enhanced features
 */
export async function getUserBookmarks(
  userId: string,
  options: {
    category?: string
    tag?: string
    type?: BookmarkType | 'all'
    sortBy?: 'created' | 'accessed' | 'effectiveness'
    limit?: number
    offset?: number
  } = {}
): Promise<EnhancedBookmark[]> {
  const redis = await getRedisClient()
  const { category, tag, type, sortBy = 'created', limit = 10, offset = 0 } = options

  try {
    // Get bookmark IDs from sorted set
    const bookmarkIds = await redis.zrange(
      `user:${userId}:bookmarks`,
      0,
      -1,
      { rev: true }
    )

    if (!bookmarkIds.length) {
      return []
    }

    // Get all bookmarks
    const bookmarks = await Promise.all(
      bookmarkIds.map(id => getBookmark(id))
    )

    // Filter out null results and apply filters
    let filteredBookmarks = bookmarks.filter((bookmark): bookmark is EnhancedBookmark => {
      if (!bookmark) return false
      
      // Apply category filter if specified
      if (category && category !== 'all' && bookmark.organization.category !== category) {
        return false
      }
      
      // Apply tag filter if specified
      if (tag && tag !== 'all' && !bookmark.organization.tags.includes(tag)) {
        return false
      }
      
      // Apply type filter if specified
      if (type && type !== 'all' && bookmark.metadata.type !== type) {
        return false
      }
      
      return true
    })

    // Apply sorting
    filteredBookmarks.sort((a: EnhancedBookmark, b: EnhancedBookmark) => {
      switch (sortBy) {
        case 'accessed':
          return new Date(b.analytics.lastAccessed).getTime() - new Date(a.analytics.lastAccessed).getTime()
        case 'effectiveness':
          return b.analytics.useCount - a.analytics.useCount
        case 'created':
        default:
          return new Date(b.analytics.createdAt).getTime() - new Date(a.analytics.createdAt).getTime()
      }
    })

    // Apply pagination
    return filteredBookmarks.slice(offset, offset + limit)
  } catch (error) {
    console.error('Failed to get user bookmarks:', error)
    throw error
  }
}

/**
 * Updates a bookmark's properties
 */
export async function updateBookmark(
  bookmarkId: string,
  updates: Partial<EnhancedBookmark>
): Promise<EnhancedBookmark | null> {
  const redis = await getRedisClient()
  
  // Get existing bookmark
  const existing = await getBookmark(bookmarkId)
  if (!existing) {
    return null
  }
  
  // Merge updates with existing data
  const updated: EnhancedBookmark = {
    ...existing,
    ...updates,
    metadata: { ...existing.metadata, ...updates.metadata },
    analytics: { ...existing.analytics, ...updates.analytics },
    organization: { ...existing.organization, ...updates.organization },
    sharing: { ...existing.sharing, ...updates.sharing },
    version: {
      ...existing.version,
      version: existing.version.version + 1,
      lastUpdated: new Date().toISOString()
    }
  }
  
  const redisSchema = bookmarkToRedisSchema(updated)
  
  try {
    // Update all components
    await Promise.all([
      redis.hmset(BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmarkId), redisSchema.core),
      redis.hmset(BOOKMARK_REDIS_KEYS.bookmarkResearchContext(bookmarkId), redisSchema.metadata),
      redis.hmset(BOOKMARK_REDIS_KEYS.bookmarkAnalytics(bookmarkId), redisSchema.analytics),
      redis.hmset(`${BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmarkId)}:organization`, redisSchema.organization),
      redis.hmset(BOOKMARK_REDIS_KEYS.bookmarkPermissions(bookmarkId), redisSchema.sharing)
    ])
    
    return updated
  } catch (error) {
    console.error('Failed to update bookmark:', error)
    return null
  }
}

/**
 * Deletes a bookmark and all its associated data
 */
export async function deleteBookmark(bookmarkId: string, userId: string): Promise<boolean> {
  const redis = await getRedisClient()
  const bookmark = await getBookmark(bookmarkId)
  
  if (!bookmark || bookmark.userId !== userId) {
    return false
  }
  
  try {
    // Remove from all storage locations in parallel
    await Promise.all([
      redis.del(BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmarkId)),
      redis.del(BOOKMARK_REDIS_KEYS.bookmarkResearchContext(bookmarkId)),
      redis.del(BOOKMARK_REDIS_KEYS.bookmarkAnalytics(bookmarkId)),
      redis.del(`${BOOKMARK_REDIS_KEYS.bookmarkDetails(bookmarkId)}:organization`),
      redis.del(BOOKMARK_REDIS_KEYS.bookmarkPermissions(bookmarkId)),
      redis.zrem(BOOKMARK_REDIS_KEYS.userBookmarks(userId), bookmarkId)
    ])
    
    return true
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
    return false
  }
} 