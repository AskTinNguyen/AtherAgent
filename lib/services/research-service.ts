import { ActivityItem, ResearchMetrics, ResearchState } from '@/lib/contexts/research-activity-context'
import { createClient } from '@/lib/supabase/server'; //TIN: use server in order to allow RLS Supabase policies to be correctly enforced, handling authentication context from cookies

export interface ResearchSession {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export class ResearchService {
  private static async getOrCreateSession(id: string, userId: string): Promise<ResearchSession> {
    const supabase = await createClient()
    
    // Try to find existing session
    const { data: existingSession } = await supabase
      .from('research_sessions')
      .select()
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (existingSession) {
      return existingSession as ResearchSession
    }
    
    // Create new session if none exists
    const { data: newSession, error } = await supabase
      .from('research_sessions')
      .insert({
        id,
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

  static async getSession(id: string, userId: string): Promise<ResearchSession | null> {
    const supabase = await createClient()
    
    const { data: session } = await supabase
      .from('research_sessions')
      .select()
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    return session as ResearchSession | null
  }

  static async getResearchState(id: string, userId: string): Promise<{
    state: ResearchState
    activities: ActivityItem[]
    metrics: ResearchMetrics
  }> {
    const session = await this.getOrCreateSession(id, userId)
    const supabase = await createClient()
    
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
    id: string,
    userId: string,
    state: ResearchState,
    metrics: ResearchMetrics
  ): Promise<void> {
    const session = await this.getOrCreateSession(id, userId)
    const supabase = await createClient()
    
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
    id: string,
    userId: string,
    activity: ActivityItem
  ): Promise<void> {
    if (activity.type !== 'search') return // Only store search activities
    
    const session = await this.getOrCreateSession(id, userId)
    const supabase = await createClient()
    
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
    id: string,
    userId: string,
    url: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const session = await this.getOrCreateSession(id, userId)
    const supabase = await createClient()
    
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
  
  static async clearResearchState(id: string, userId: string): Promise<void> {
    const session = await this.getOrCreateSession(id, userId)
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('research_states')
      .delete()
      .eq('session_id', session.id)
    
    if (error) {
      throw new Error(`Failed to clear research state: ${error.message}`)
    }
  }

  static async updateState(
    id: string,
    userId: string,
    state: ResearchState
  ): Promise<void> {
    const session = await this.getOrCreateSession(id, userId)
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('research_states')
      .upsert({
        session_id: session.id,
        previous_results: state.previousResults,
        visualization_data: state.visualizationData,
        metrics: state.metrics
      })
    
    if (error) {
      throw new Error(`Failed to update state: ${error.message}`)
    }
  }

  static async getState(id: string, userId: string): Promise<ResearchState | null> {
    const session = await this.getSession(id, userId)
    if (!session) return null
    
    const supabase = await createClient()
    
    const { data: state } = await supabase
      .from('research_states')
      .select()
      .eq('session_id', session.id)
      .single()
    
    if (!state) return null
    
    return {
      previousResults: state.previous_results,
      visualizationData: state.visualization_data,
      metrics: state.metrics as ResearchMetrics
    }
  }
} 