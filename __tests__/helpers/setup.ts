import { afterEach, beforeAll, jest } from '@jest/globals'
import '@testing-library/jest-dom'

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}

  observe(target: Element): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

window.IntersectionObserver = MockIntersectionObserver

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}

  observe(target: Element, options?: ResizeObserverOptions): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
}

window.ResizeObserver = MockResizeObserver

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Set up environment variables for testing
beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
  
  // Mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)
  )
})

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks()
}) 