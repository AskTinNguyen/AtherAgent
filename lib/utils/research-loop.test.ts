import type { SearchResult } from '@/lib/types'
import { describe, expect, jest, test } from '@jest/globals'
import fetch, { Response } from 'node-fetch'
import type { ResearchIteration } from './research-loop'
import { checkDiminishingReturns, executeResearchTools } from './research-loop'

// Make fetch available globally
if (!global.fetch) {
  (global as any).fetch = fetch
  (global as any).Response = Response
}

// Store the original env
const originalEnv = process.env

beforeAll(() => {
  // Setup test environment
  process.env = {
    ...originalEnv,
    TAVILY_API_KEY: 'test-api-key'
  }
})

afterAll(() => {
  // Restore original env
  process.env = originalEnv
  // Clean up mocks
  jest.clearAllMocks()
})

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
})

interface MockSearchResults {
  results: SearchResult[]
  query: string
  images: never[]
  number_of_results: number
}

// Mock the search tool with a complete mock implementation
jest.mock('../tools/search', () => ({
  searchTool: {
    execute: jest.fn().mockImplementation(async (_args: unknown, _options: unknown): Promise<MockSearchResults> => {
      // This mock completely bypasses the need for fetch
      return {
        results: [
          {
            url: 'https://example1.com',
            title: 'Example 1',
            content: 'Content 1',
            relevance: 0.9,
            depth: 1
          },
          {
            url: 'https://example2.com',
            title: 'Example 2',
            content: 'Content 2',
            relevance: 0.8,
            depth: 1
          }
        ],
        query: 'test query',
        images: [],
        number_of_results: 2
      }
    })
  }
}))

// Mock TransformStream
class MockTransformStream {
  readable: any
  writable: any

  constructor() {
    this.readable = {
      getReader: () => ({
        read: async () => ({ done: true })
      })
    }
    this.writable = {
      getWriter: () => ({
        write: async () => {},
        close: async () => {}
      })
    }
  }
}

global.TransformStream = MockTransformStream as any

describe('checkDiminishingReturns', () => {
  test('should return true when there is significant overlap', () => {
    const currentResults = [{
      tool: 'search',
      data: {
        results: [
          { url: 'https://example1.com', title: 'Example 1', content: 'Content 1' },
          { url: 'https://example2.com', title: 'Example 2', content: 'Content 2' },
          { url: 'https://example3.com', title: 'Example 3', content: 'Content 3' }
        ]
      }
    }]
    
    const previousIterations: ResearchIteration[] = [{
      query: 'test query',
      results: [{
        tool: 'search',
        data: {
          results: [
            { url: 'https://example1.com', title: 'Example 1', content: 'Content 1' },
            { url: 'https://example2.com', title: 'Example 2', content: 'Content 2' }
          ]
        }
      }],
      timestamp: Date.now()
    }]

    const result = checkDiminishingReturns(currentResults, previousIterations)
    expect(result).toBe(true)
  })

  test('should return false when there is minimal overlap', () => {
    const currentResults = [{
      tool: 'search',
      data: {
        results: [
          { url: 'https://example4.com', title: 'Example 4', content: 'Content 4' },
          { url: 'https://example5.com', title: 'Example 5', content: 'Content 5' }
        ]
      }
    }]
    
    const previousIterations: ResearchIteration[] = [{
      query: 'test query',
      results: [{
        tool: 'search',
        data: {
          results: [
            { url: 'https://example1.com', title: 'Example 1', content: 'Content 1' },
            { url: 'https://example2.com', title: 'Example 2', content: 'Content 2' }
          ]
        }
      }],
      timestamp: Date.now()
    }]

    const result = checkDiminishingReturns(currentResults, previousIterations)
    expect(result).toBe(false)
  })
})

describe('executeResearchTools', () => {
  test('should execute search and return results', async () => {
    const query = 'test query'
    const results = await executeResearchTools(query, { search: true })
    
    expect(results).toHaveLength(1)
    expect(results[0].tool).toBe('search')
    expect(results[0].data.results).toHaveLength(2)
  })
}) 