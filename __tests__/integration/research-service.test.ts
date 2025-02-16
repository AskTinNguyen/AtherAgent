import { ResearchService } from '@/lib/services/research-service'
import { testHelpers, type TestSession, type TestUser } from '../helpers/supabase-test-helper'

describe('ResearchService Integration Tests', () => {
  let testUser: TestUser
  let testSession: TestSession
  
  beforeAll(async () => {
    // Create test user and session
    testUser = await testHelpers.createTestUser()
    testSession = await testHelpers.createTestSession(testUser.id)
  })
  
  afterAll(async () => {
    // Clean up test data
    await testHelpers.cleanup(testUser.id)
  })
  
  describe('getResearchState', () => {
    it('should return initial state for new session', async () => {
      const result = await ResearchService.getResearchState(
        testSession.chatId,
        testUser.id
      )
      
      expect(result).toEqual({
        state: {
          currentDepth: 1,
          maxDepth: 7,
          sources: [],
          isActive: false
        },
        activities: [],
        metrics: {
          sourcesAnalyzed: 0,
          qualityScore: 0,
          coverageScore: 0,
          relevanceScore: 0
        }
      })
    })
  })
  
  describe('updateResearchState', () => {
    it('should update research state and metrics', async () => {
      const testData = testHelpers.generateTestData()
      
      await ResearchService.updateResearchState(
        testSession.chatId,
        testUser.id,
        {
          currentDepth: 2,
          maxDepth: 5,
          sources: [],
          isActive: true
        },
        testData.researchState.metrics
      )
      
      const result = await ResearchService.getResearchState(
        testSession.chatId,
        testUser.id
      )
      
      expect(result.state.currentDepth).toBe(2)
      expect(result.state.maxDepth).toBe(5)
      expect(result.state.isActive).toBe(true)
      expect(result.metrics).toEqual(testData.researchState.metrics)
    })
  })
  
  describe('addActivity', () => {
    it('should add search activity', async () => {
      const activity = {
        type: 'search' as const,
        status: 'complete' as const,
        message: 'test search query',
        timestamp: new Date().toISOString(),
        depth: 1
      }
      
      await ResearchService.addActivity(testSession.chatId, testUser.id, activity)
      
      const result = await ResearchService.getResearchState(
        testSession.chatId,
        testUser.id
      )
      
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0]).toMatchObject({
        type: 'search',
        status: 'complete',
        message: 'test search query',
        depth: 1
      })
    })
    
    it('should not add non-search activities', async () => {
      const activity = {
        type: 'thought' as const,
        status: 'complete' as const,
        message: 'test thought',
        timestamp: new Date().toISOString()
      }
      
      await ResearchService.addActivity(testSession.chatId, testUser.id, activity)
      
      const result = await ResearchService.getResearchState(
        testSession.chatId,
        testUser.id
      )
      
      // Should still have only one activity (from previous test)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].type).toBe('search')
    })
  })
  
  describe('addSource', () => {
    it('should add source to research session', async () => {
      const testData = testHelpers.generateTestData()
      
      await ResearchService.addSource(
        testSession.chatId,
        testUser.id,
        testData.source.url,
        testData.source.metadata
      )
      
      const result = await ResearchService.getResearchState(
        testSession.chatId,
        testUser.id
      )
      
      expect(result.state.sources).toHaveLength(1)
      expect(result.state.sources[0]).toBe(testData.source.url)
    })
  })
  
  describe('clearResearchState', () => {
    it('should clear research state', async () => {
      await ResearchService.clearResearchState(testSession.chatId, testUser.id)
      
      const result = await ResearchService.getResearchState(
        testSession.chatId,
        testUser.id
      )
      
      expect(result).toEqual({
        state: {
          currentDepth: 1,
          maxDepth: 7,
          sources: [],
          isActive: false
        },
        activities: [],
        metrics: {
          sourcesAnalyzed: 0,
          qualityScore: 0,
          coverageScore: 0,
          relevanceScore: 0
        }
      })
    })
  })
}) 