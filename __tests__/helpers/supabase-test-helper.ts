import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export interface TestUser {
  id: string
  email: string
}

export interface TestSession {
  id: string
  userId: string
}

// Create a singleton instance for tests
const supabase = createClient()

export const testHelpers = {
  // Create a test user
  async createTestUser(): Promise<TestUser> {
    const email = `test-${uuidv4()}@example.com`
    const password = 'testPassword123!'
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create test user')
    
    return {
      id: authData.user.id,
      email
    }
  },
  
  // Create a test research session
  async createTestSession(userId: string): Promise<TestSession> {
    const { data: session, error } = await supabase
      .from('research_sessions')
      .insert({
        user_id: userId,
        metadata: {}
      })
      .select()
      .single()
    
    if (error) throw error
    if (!session) throw new Error('Failed to create test session')
    
    return {
      id: session.id,
      userId
    }
  },
  
  // Clean up test data
  async cleanup(userId: string) {
    // Delete all research sessions for the user
    const { error: sessionError } = await supabase
      .from('research_sessions')
      .delete()
      .eq('user_id', userId)
    
    if (sessionError) throw sessionError
    
    // Delete the test user
    const { error: userError } = await supabase.auth.admin.deleteUser(userId)
    
    if (userError) throw userError
  },
  
  // Generate test data
  generateTestData() {
    return {
      searchResult: {
        query: 'test query',
        results: [{ title: 'Test Result', url: 'https://example.com' }],
        depth_level: 1
      },
      source: {
        url: 'https://example.com/test',
        title: 'Test Source',
        content: 'Test content',
        relevance: 0.8,
        metadata: { type: 'webpage' }
      },
      researchState: {
        metrics: {
          sourcesAnalyzed: 1,
          qualityScore: 0.8,
          coverageScore: 0.7,
          relevanceScore: 0.9,
          currentDepth: 1,
          maxDepth: 3,
          isActive: true
        }
      }
    }
  }
} 