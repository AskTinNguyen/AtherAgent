'use client'

import { ResearchRealtimeSync } from '@/components/research-realtime-sync'
import { createClient } from '@/lib/supabase/client'
import { render, waitFor } from '@testing-library/react'
import { type TestSession, type TestUser } from '../helpers/supabase-test-helper'

// Mock Supabase client
jest.mock('@/lib/supabase/client')
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    onAuthStateChange: jest.fn()
  }
}
;(createClient as jest.Mock).mockReturnValue(mockSupabase)

describe('ResearchRealtimeSync', () => {
  const mockUser: TestUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  }

  const mockSession: TestSession = {
    user: mockUser,
    access_token: 'test-token',
    refresh_token: 'test-refresh-token'
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup Supabase auth mocks
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  it('initializes correctly with authenticated user', async () => {
    render(<ResearchRealtimeSync />)

    await waitFor(() => {
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
    })
  })

  // Add more test cases as needed
}) 