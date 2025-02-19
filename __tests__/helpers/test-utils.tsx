import { Database } from '@/lib/types/database'
import { createClient } from '@supabase/supabase-js'
import { screen, within } from '@testing-library/dom'
import '@testing-library/jest-dom'
import { render as rtlRender } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement } from 'react'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
    })),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  })),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => 'Check',
  ChevronDown: () => 'ChevronDown',
  ChevronUp: () => 'ChevronUp',
  ArrowUpDown: () => 'ArrowUpDown',
  Filter: () => 'Filter',
  MoreHorizontal: () => 'MoreHorizontal',
  SortAsc: () => 'SortAsc',
  SortDesc: () => 'SortDesc',
  X: () => 'X',
}))

// Create a custom render function that includes providers
function render(ui: ReactElement, options = {}) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Add providers here as needed
    return <>{children}</>
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...options }),
    user: userEvent.setup(),
  }
}

// Export testing utilities
export { render, screen, within }

// Export mocked Supabase client
export const mockSupabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Helper to create a mock session
export const createMockSession = (userId: string) => ({
  user: {
    id: userId,
    email: 'test@example.com',
    role: 'authenticated',
  },
  expires_at: Date.now() + 3600,
  refresh_token: 'mock-refresh-token',
  access_token: 'mock-access-token',
})

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to mock fetch responses
export const mockFetch = (data: any) => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  )
}

// Helper to clear mocks
export const clearMocks = () => {
  jest.clearAllMocks()
  if (global.fetch) {
    ;(global.fetch as jest.Mock).mockClear()
  }
}

// Helper to create a mock error response
export const createErrorResponse = (message: string, status = 400) => ({
  error: {
    message,
    status,
  },
})

// Helper to simulate loading states
export const createLoadingState = (duration: number) =>
  new Promise(resolve => setTimeout(resolve, duration))

// Helper to mock form submission
export const mockFormSubmit = (event: { preventDefault: () => void }) => {
  event.preventDefault()
  return Promise.resolve()
}

// Helper to create mock form data
export const createMockFormData = (data: Record<string, any>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value as string)
  })
  return formData
}

// Helper to simulate network errors
export const simulateNetworkError = () => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.reject(new Error('Network error'))
  )
}

// Helper to create mock API responses
export const createMockApiResponse = <T,>(data: T, status = 200) => ({
  data,
  status,
  ok: status >= 200 && status < 300,
  headers: new Headers(),
  statusText: status === 200 ? 'OK' : 'Error',
}) 