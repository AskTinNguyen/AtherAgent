import { getRedisClient } from '@/lib/redis/config'
import { createClient } from '@/lib/supabase/client'
import { Redis } from 'ioredis'

type RedisResearchState = {
  chatId: string
  state: string
  activities: string[]
  sources: string[]
}

type RedisBookmark = {
  id: string
  userId: string
  url: string
  title: string
  content: string
  metadata: Record<string, any>
}

// Create a singleton instance for the migration
const supabase = createClient()

async function migrateResearchData(redis: Redis) {
  console.log('Starting research data migration...')
  
  // Get all research state keys
  const stateKeys = await redis.keys('research:state:*')
  
  for (const stateKey of stateKeys) {
    const chatId = stateKey.split(':')[2]
    const activitiesKey = `research:activities:${chatId}`
    const sourcesKey = `research:sources:${chatId}`
    
    // Get state data
    const stateData = await redis.hgetall(stateKey)
    const activities = await redis.zrange(activitiesKey, 0, -1)
    const sources = await redis.zrange(sourcesKey, 0, -1)
    
    // Create research session in Supabase
    const { data: session, error: sessionError } = await supabase
      .from('research_sessions')
      .insert({
        chat_id: chatId,
        user_id: stateData.userId,
        metadata: JSON.parse(stateData.metadata || '{}')
      })
      .select()
      .single()
      
    if (sessionError) {
      console.error(`Error creating research session for chat ${chatId}:`, sessionError)
      continue
    }
    
    // Migrate research state
    const { error: stateError } = await supabase
      .from('research_states')
      .insert({
        session_id: session.id,
        previous_results: JSON.parse(stateData.previousResults || 'null'),
        visualization_data: JSON.parse(stateData.visualizationData || 'null'),
        metrics: JSON.parse(stateData.metrics || '{}')
      })
      
    if (stateError) {
      console.error(`Error migrating research state for chat ${chatId}:`, stateError)
    }
    
    // Migrate activities as search results
    for (const activity of activities) {
      const activityData = JSON.parse(activity)
      const { error: searchError } = await supabase
        .from('search_results')
        .insert({
          session_id: session.id,
          query: activityData.query,
          results: activityData.results,
          depth_level: activityData.depthLevel || 1
        })
        
      if (searchError) {
        console.error(`Error migrating search result for chat ${chatId}:`, searchError)
      }
    }
    
    // Migrate sources
    for (const source of sources) {
      const sourceData = JSON.parse(source)
      const { error: sourceError } = await supabase
        .from('sources')
        .insert({
          session_id: session.id,
          url: sourceData.url,
          title: sourceData.title,
          content: sourceData.content,
          relevance: sourceData.relevance || 0,
          metadata: sourceData.metadata || {}
        })
        
      if (sourceError) {
        console.error(`Error migrating source for chat ${chatId}:`, sourceError)
      }
    }
    
    console.log(`Successfully migrated research data for chat ${chatId}`)
  }
}

async function migrateBookmarks(redis: Redis) {
  console.log('Starting bookmarks migration...')
  
  // Get all user bookmark keys
  const userBookmarkKeys = await redis.keys('user:bookmarks:*')
  
  for (const userBookmarkKey of userBookmarkKeys) {
    const userId = userBookmarkKey.split(':')[2]
    const bookmarkIds = await redis.zrange(userBookmarkKey, 0, -1)
    
    for (const bookmarkId of bookmarkIds) {
      const bookmarkKey = `bookmark:${bookmarkId}`
      const bookmarkData = await redis.hgetall(bookmarkKey)
      
      if (!bookmarkData) continue
      
      // Create research session for bookmark
      const { data: session, error: sessionError } = await supabase
        .from('research_sessions')
        .insert({
          chat_id: `bookmark:${bookmarkId}`,
          user_id: userId,
          metadata: {
            type: 'bookmark',
            original_id: bookmarkId
          }
        })
        .select()
        .single()
        
      if (sessionError) {
        console.error(`Error creating session for bookmark ${bookmarkId}:`, sessionError)
        continue
      }
      
      // Add bookmark as a source
      const { error: sourceError } = await supabase
        .from('sources')
        .insert({
          session_id: session.id,
          url: bookmarkData.url,
          title: bookmarkData.title,
          content: bookmarkData.content,
          metadata: JSON.parse(bookmarkData.metadata || '{}')
        })
        
      if (sourceError) {
        console.error(`Error migrating bookmark ${bookmarkId}:`, sourceError)
      } else {
        console.log(`Successfully migrated bookmark ${bookmarkId}`)
      }
    }
  }
}

async function main() {
  try {
    const redis = await getRedisClient()
    
    // Migrate research data
    await migrateResearchData(redis)
    
    // Migrate bookmarks
    await migrateBookmarks(redis)
    
    console.log('Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main() 