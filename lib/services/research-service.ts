import { ActivityItem, ResearchMetrics, ResearchState } from '@/lib/contexts/research-activity-context'
import { createClient } from '@/lib/supabase/client'

export interface ResearchSession {
  id: string
  chat_id: string
  user_id: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export class ResearchService {
  private static async getOrCreateSession(chatId: string, userId: string): Promise<ResearchSession> {
    const supabase = createClient()
    
    // Try to find existing session
    const { data: existingSession } = await supabase
      .from('research_sessions')
      .select()
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single()
    
    if (existingSession) {
      return existingSession as ResearchSession
    }
    
    // Create new session if none exists
    const { data: newSession, error } = await supabase
      .from('research_sessions')
      .insert({
        chat_id: chatId,
        user_id: userId,
        metadata: {}
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create research session: ${error.message}`)
    }
    
    return newSession as ResearchSession
  }
  
  static async getResearchState(chatId: string, userId: string): Promise<{
    state: ResearchState
    activities: ActivityItem[]
    metrics: ResearchMetrics
  }> {
    const session = await this.getOrCreateSession(chatId, userId)
    const supabase = createClient()
    
    // Get research state
    const { data: stateData } = await supabase
      .from('research_states')
      .select()
      .eq('session_id', session.id)
      .single()
    
    // Get search results (activities)
    const { data: searchResults } = await supabase
      .from('search_results')
      .select()
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
    
    // Get sources
    const { data: sources } = await supabase
      .from('sources')
      .select('url')
      .eq('session_id', session.id)
    
    const state: ResearchState = {
      currentDepth: stateData?.metrics?.currentDepth || 1,
      maxDepth: stateData?.metrics?.maxDepth || 7,
      sources: sources?.map(s => s.url) || [],
      isActive: Boolean(stateData?.metrics?.isActive)
    }
    
    const activities: ActivityItem[] = searchResults?.map(result => ({
      type: 'search',
      status: 'complete',
      message: result.query,
      timestamp: result.created_at,
      depth: result.depth_level
    })) || []
    
    const metrics: ResearchMetrics = stateData?.metrics || {
      sourcesAnalyzed: 0,
      qualityScore: 0,
      coverageScore: 0,
      relevanceScore: 0
    }
    
    return { state, activities, metrics }
  }
  
  static async updateResearchState(
    chatId: string,
    userId: string,
    state: ResearchState,
    metrics: ResearchMetrics
  ): Promise<void> {
    const session = await this.getOrCreateSession(chatId, userId)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('research_states')
      .upsert({
        session_id: session.id,
        metrics: {
          ...metrics,
          currentDepth: state.currentDepth,
          maxDepth: state.maxDepth,
          isActive: state.isActive
        },
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      throw new Error(`Failed to update research state: ${error.message}`)
    }
  }
  
  static async addActivity(
    chatId: string,
    userId: string,
    activity: ActivityItem
  ): Promise<void> {
    if (activity.type !== 'search') return // Only store search activities
    
    const session = await this.getOrCreateSession(chatId, userId)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('search_results')
      .insert({
        session_id: session.id,
        query: activity.message,
        results: [], // TODO: Add actual search results
        depth_level: activity.depth || 1,
        created_at: activity.timestamp
      })
    
    if (error) {
      throw new Error(`Failed to add activity: ${error.message}`)
    }
  }
  
  static async addSource(
    chatId: string,
    userId: string,
    url: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const session = await this.getOrCreateSession(chatId, userId)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('sources')
      .insert({
        session_id: session.id,
        url,
        metadata
      })
    
    if (error) {
      throw new Error(`Failed to add source: ${error.message}`)
    }
  }
  
  static async clearResearchState(chatId: string, userId: string): Promise<void> {
    const session = await this.getOrCreateSession(chatId, userId)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('research_states')
      .delete()
      .eq('session_id', session.id)
    
    if (error) {
      throw new Error(`Failed to clear research state: ${error.message}`)
    }
  }
} 