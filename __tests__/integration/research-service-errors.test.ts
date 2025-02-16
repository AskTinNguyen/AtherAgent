import { ResearchService } from '@/lib/services/research-service'
import { createClient } from '@/lib/supabase/client'
import { testHelpers, type TestSession, type TestUser } from '../helpers/supabase-test-helper'

// Create a singleton instance for tests
const supabase = createClient()

describe('ResearchService Error Handling', () => {
  let testUser: TestUser
  let testSession: TestSession
  
  beforeAll(async () => {
    testUser = await testHelpers.createTestUser()
    testSession = await testHelpers.createTestSession(testUser.id)
  })
  
  afterAll(async () => {
    await testHelpers.cleanup(testUser.id)
  })

  describe('Authentication Errors', () => {
    it('should handle invalid user ID', async () => {
      await expect(
        ResearchService.getResearchState(testSession.chatId, 'invalid-user-id')
      ).rejects.toThrow('Unauthorized')
    })

    it('should handle expired session', async () => {
      // Simulate expired session by signing out
      await supabase.auth.signOut()
      
      await expect(
        ResearchService.getResearchState(testSession.chatId, testUser.id)
      ).rejects.toThrow('Session expired')
    })
  })

  describe('Data Validation Errors', () => {
    it('should handle invalid research state data', async () => {
      await expect(
        ResearchService.updateResearchState(
          testSession.chatId,
          testUser.id,
          {
            currentDepth: -1, // Invalid depth
            maxDepth: 5,
            sources: [],
            isActive: true
          },
          {
            sourcesAnalyzed: -1, // Invalid count
            qualityScore: 2, // Invalid score (> 1)
            coverageScore: 0.5,
            relevanceScore: 0.5
          }
        )
      ).rejects.toThrow('Invalid research state data')
    })

    it('should handle invalid activity data', async () => {
      await expect(
        ResearchService.addActivity(testSession.chatId, testUser.id, {
          type: 'invalid-type' as any,
          status: 'complete',
          message: '',
          timestamp: 'invalid-date'
        })
      ).rejects.toThrow('Invalid activity data')
    })
  })

  describe('Database Errors', () => {
    it('should handle database connection errors', async () => {
      // Create a new client with invalid credentials for testing
      const invalidClient = createClient()
      // @ts-ignore - Temporarily modify for testing
      invalidClient.supabaseKey = 'invalid-key'

      await expect(
        ResearchService.getResearchState(testSession.chatId, testUser.id)
      ).rejects.toThrow('Database connection error')
    })

    it('should handle concurrent update conflicts', async () => {
      // Simulate concurrent updates
      const promises = [
        ResearchService.updateResearchState(
          testSession.chatId,
          testUser.id,
          {
            currentDepth: 2,
            maxDepth: 5,
            sources: [],
            isActive: true
          },
          testHelpers.generateTestData().researchState.metrics
        ),
        ResearchService.updateResearchState(
          testSession.chatId,
          testUser.id,
          {
            currentDepth: 3,
            maxDepth: 5,
            sources: [],
            isActive: true
          },
          testHelpers.generateTestData().researchState.metrics
        )
      ]

      await expect(Promise.all(promises)).rejects.toThrow('Concurrent update conflict')
    })
  })

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      // Make multiple rapid requests
      const promises = Array(10).fill(null).map(() => 
        ResearchService.getResearchState(testSession.chatId, testUser.id)
      )

      await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded')
    })
  })
}) 