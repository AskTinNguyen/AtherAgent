'use client'

import { ResearchRealtimeSync } from '@/components/research-realtime-sync'
import { ResearchService } from '@/lib/services/research-service'
import { createClient } from '@/lib/supabase/client'
import { render, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { testHelpers, type TestSession, type TestUser } from '../helpers/supabase-test-helper'

// Mock next-auth session
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock research context
jest.mock('@/lib/contexts/research-provider', () => ({
  useResearchContext: () => ({
    dispatch: jest.fn()
  })
}))

// Create a singleton instance for tests
const supabase = createClient()

describe('Research Realtime Integration Tests', () => {
  let testUser: TestUser
  let testSession: TestSession
  
  beforeAll(async () => {
    testUser = await testHelpers.createTestUser()
    testSession = await testHelpers.createTestSession(testUser.id)
    
    // Mock session data
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: testUser.id,
          email: testUser.email
        },
        expires: '2025-01-01'
      },
      status: 'authenticated',
      update: jest.fn()
    })
  })
  
  afterAll(async () => {
    await testHelpers.cleanup(testUser.id)
    jest.resetAllMocks()
  })
  
  it('should receive real-time updates for research state changes', async () => {
    const mockDispatch = jest.fn()
    jest.spyOn(require('@/lib/contexts/research-provider'), 'useResearchContext')
      .mockReturnValue({ dispatch: mockDispatch })
    
    render(<ResearchRealtimeSync chatId={testSession.chatId} />)
    
    // Update research state
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
    
    // Wait for real-time update
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_STATE',
        payload: expect.objectContaining({
          state: expect.objectContaining({
            currentDepth: 2,
            maxDepth: 5,
            isActive: true
          })
        })
      })
    }, { timeout: 5000 })
  })
  
  it('should receive real-time updates for new search results', async () => {
    const mockDispatch = jest.fn()
    jest.spyOn(require('@/lib/contexts/research-provider'), 'useResearchContext')
      .mockReturnValue({ dispatch: mockDispatch })
    
    render(<ResearchRealtimeSync chatId={testSession.chatId} />)
    
    // Add new search activity
    const activity = {
      type: 'search' as const,
      status: 'complete' as const,
      message: 'test search query',
      timestamp: new Date().toISOString(),
      depth: 1
    }
    
    await ResearchService.addActivity(testSession.chatId, testUser.id, activity)
    
    // Wait for real-time update
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_ACTIVITY',
        payload: expect.objectContaining({
          type: 'search',
          message: 'test search query',
          depth: 1
        })
      })
    }, { timeout: 5000 })
  })
  
  it('should receive real-time updates for new sources', async () => {
    const mockDispatch = jest.fn()
    jest.spyOn(require('@/lib/contexts/research-provider'), 'useResearchContext')
      .mockReturnValue({ dispatch: mockDispatch })
    
    render(<ResearchRealtimeSync chatId={testSession.chatId} />)
    
    // Add new source
    const testData = testHelpers.generateTestData()
    await ResearchService.addSource(
      testSession.chatId,
      testUser.id,
      testData.source.url,
      testData.source.metadata
    )
    
    // Wait for real-time update
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_SOURCE',
        payload: testData.source.url
      })
    }, { timeout: 5000 })
  })
  
  it('should unsubscribe from channels on unmount', async () => {
    const unsubscribeSpy = jest.spyOn(supabase.channel(''), 'unsubscribe')
    
    const { unmount } = render(
      <ResearchRealtimeSync chatId={testSession.chatId} />
    )
    
    unmount()
    
    // Should call unsubscribe for all channels
    expect(unsubscribeSpy).toHaveBeenCalledTimes(3)
  })
}) 