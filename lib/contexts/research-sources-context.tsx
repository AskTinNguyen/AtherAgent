'use client'

import { ResearchSourceMetrics } from '@/lib/types/research'
import { calculateSourceMetrics } from '@/lib/utils/research-depth'
import { createContext, useContext, useReducer, type ReactNode } from 'react'

// Types
interface SourceQuality {
  contentQuality: number
  sourceAuthority: number
  timeRelevance: number
}

interface SourceItem {
  url: string
  title: string
  relevance: number
  content?: string
  query?: string
  publishedDate?: string
  timestamp: number
  quality: SourceQuality
}

interface SourcesState {
  sources: SourceItem[]
  sourceMetrics: ResearchSourceMetrics[]
}

type SourcesAction =
  | { type: 'ADD_SOURCE'; payload: Omit<SourceItem, 'quality' | 'timestamp'> }
  | { type: 'CLEAR_SOURCES' }

interface SourcesContextType {
  state: SourcesState
  addSource: (source: Omit<SourceItem, 'quality' | 'timestamp'>) => void
  clearSources: () => void
}

// Helper functions
function calculateFreshness(publishedDate?: string): number {
  if (!publishedDate) return 0.5
  const date = new Date(publishedDate)
  const now = new Date()
  const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth()
  return Math.max(0, 1 - monthsDiff / 24) // Linear decay over 2 years
}

function calculateSourceAuthority(url: string, sources: SourceItem[]): number {
  const domain = new URL(url).hostname
  const domainSources = sources.filter(s => {
    try {
      return new URL(s.url).hostname === domain
    } catch {
      return false
    }
  })
  return Math.min(1, domainSources.length * 0.2) // Increases with more sources from same domain
}

// Initial state
const initialState: SourcesState = {
  sources: [],
  sourceMetrics: []
}

// Reducer
function sourcesReducer(state: SourcesState, action: SourcesAction): SourcesState {
  switch (action.type) {
    case 'ADD_SOURCE': {
      const { url, title, relevance, content, query, publishedDate } = action.payload
      const existingSource = state.sources.find(s => s.url === url)
      if (existingSource) return state

      const metrics = calculateSourceMetrics(
        content || '',
        query || '',
        url,
        publishedDate
      )
      
      const quality: SourceQuality = {
        contentQuality: metrics.contentQuality,
        sourceAuthority: calculateSourceAuthority(url, state.sources),
        timeRelevance: calculateFreshness(publishedDate)
      }
      
      const newSourceMetrics: ResearchSourceMetrics = {
        relevanceScore: metrics.relevanceScore,
        depthLevel: 1, // This will be managed by the depth context
        contentQuality: quality.contentQuality,
        timeRelevance: quality.timeRelevance,
        sourceAuthority: quality.sourceAuthority,
        crossValidation: calculateSourceAuthority(url, state.sources),
        coverage: metrics.contentQuality * quality.timeRelevance
      }

      return {
        sources: [
          ...state.sources,
          { url, title, relevance, content, query, publishedDate, timestamp: Date.now(), quality }
        ],
        sourceMetrics: [...state.sourceMetrics, newSourceMetrics]
      }
    }
    case 'CLEAR_SOURCES':
      return initialState
    default:
      return state
  }
}

// Context
const SourcesContext = createContext<SourcesContextType | null>(null)

// Provider
export function SourcesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sourcesReducer, initialState)

  const addSource = (source: Omit<SourceItem, 'quality' | 'timestamp'>) => {
    dispatch({ type: 'ADD_SOURCE', payload: source })
  }

  const clearSources = () => {
    dispatch({ type: 'CLEAR_SOURCES' })
  }

  return (
    <SourcesContext.Provider
      value={{
        state,
        addSource,
        clearSources
      }}
    >
      {children}
    </SourcesContext.Provider>
  )
}

// Hook
export function useSources() {
  const context = useContext(SourcesContext)
  if (!context) {
    throw new Error('useSources must be used within a SourcesProvider')
  }
  return context
} 