'use client'

import { ResearchSourceMetrics, type ResearchSuggestion } from '@/lib/types/research'
import { calculateSourceMetrics, optimizeDepthStrategy, shouldIncreaseDepth } from '@/lib/utils/research-depth'
import { createContext, useCallback, useContext, useReducer, type ReactNode } from 'react'
import { ResearchActivityProvider } from './research-activity-context'
import { DepthProvider } from './research-depth-context'
import { SourcesProvider } from './research-sources-context'

// Types
export interface ResearchActivity {
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
}

export interface ResearchSource {
  url: string
  title: string
  relevance: number
  content?: string
  query?: string
  publishedDate?: string
  timestamp: number
  quality: {
    contentQuality: number
    sourceAuthority: number
    timeRelevance: number
  }
}

export interface ResearchState {
  // Core state
  isActive: boolean
  searchEnabled: boolean
  
  // Depth management
  depth: {
    current: number
    max: number
    config: {
      minRelevanceScore: number
      adaptiveThreshold: number
      depthScores: Record<number, number>
    }
  }
  
  // Research data
  activity: ResearchActivity[]
  sources: ResearchSource[]
  sourceMetrics: ResearchSourceMetrics[]
  suggestions: ResearchSuggestion[]
  
  // Progress tracking
  completedSteps: number
  totalExpectedSteps: number
}

// Actions
type ResearchAction =
  | { type: 'TOGGLE_SEARCH' }
  | { type: 'SET_DEPTH'; payload: { current: number; max: number } }
  | { type: 'START_RESEARCH' }
  | { type: 'STOP_RESEARCH' }
  | { type: 'ADD_ACTIVITY'; payload: ResearchActivity & { completedSteps?: number; totalSteps?: number } }
  | { type: 'ADD_SOURCE'; payload: ResearchSource }
  | { type: 'UPDATE_PROGRESS'; payload: { completed: number; total: number } }
  | { type: 'CLEAR_STATE' }

// Initial state
const initialState: ResearchState = {
  isActive: false,
  searchEnabled: false,
  depth: {
    current: 1,
    max: 7,
    config: {
      minRelevanceScore: 0.6,
      adaptiveThreshold: 0.7,
      depthScores: { 1: 0 }
    }
  },
  activity: [],
  sources: [],
  sourceMetrics: [],
  suggestions: [],
  completedSteps: 0,
  totalExpectedSteps: 0
}

// Reducer
function researchReducer(state: ResearchState, action: ResearchAction): ResearchState {
  switch (action.type) {
    case 'TOGGLE_SEARCH':
      return {
        ...state,
        searchEnabled: !state.searchEnabled,
        // Reset research when disabling search
        ...(state.searchEnabled && {
          isActive: false,
          activity: [],
          sources: [],
          sourceMetrics: [],
          suggestions: [],
          completedSteps: 0,
          totalExpectedSteps: 0
        })
      }

    case 'SET_DEPTH':
      return {
        ...state,
        depth: {
          ...state.depth,
          current: action.payload.current,
          max: action.payload.max,
          config: {
            ...state.depth.config,
            depthScores: {
              ...state.depth.config.depthScores,
              [action.payload.current]: 0
            }
          }
        }
      }

    case 'START_RESEARCH':
      return {
        ...state,
        isActive: true,
        completedSteps: 0,
        activity: [
          ...state.activity,
          {
            type: 'search',
            status: 'pending',
            message: 'Initializing research...',
            timestamp: new Date().toISOString(),
            depth: state.depth.current
          }
        ]
      }

    case 'STOP_RESEARCH':
      return {
        ...state,
        isActive: false,
        activity: state.activity.map(item =>
          item.status === 'pending'
            ? { ...item, status: 'complete', timestamp: new Date().toISOString() }
            : item
        )
      }

    case 'ADD_ACTIVITY':
      return {
        ...state,
        activity: [...state.activity, {
          ...action.payload,
          timestamp: new Date().toISOString(),
          status: action.payload.status || 'pending'
        }],
        completedSteps: action.payload.completedSteps ?? 
          (action.payload.status === 'complete' ? state.completedSteps + 1 : state.completedSteps),
        totalExpectedSteps: action.payload.totalSteps ?? state.totalExpectedSteps
      }

    case 'ADD_SOURCE': {
      const { url, title, relevance, content, query, publishedDate } = action.payload
      const existingSourceIndex = state.sources.findIndex(s => s.url === url)
      
      const metrics = calculateSourceMetrics(
        content || '',
        query || '',
        url,
        publishedDate
      )
      
      const updatedSourceMetrics = [...state.sourceMetrics]
      if (existingSourceIndex !== -1) {
        updatedSourceMetrics[existingSourceIndex] = {
          ...metrics,
          depthLevel: state.depth.current
        }
      } else {
        updatedSourceMetrics.push({
          ...metrics,
          depthLevel: state.depth.current
        })
      }
      
      // Check if we should increase depth
      const shouldIncrease = shouldIncreaseDepth(
        { 
          currentDepth: state.depth.current,
          maxDepth: state.depth.max,
          ...state.depth.config
        },
        updatedSourceMetrics
      )
      
      const newDepth = shouldIncrease ? state.depth.current + 1 : state.depth.current
      
      // Optimize depth strategy
      const newConfig = optimizeDepthStrategy({
        currentDepth: newDepth,
        maxDepth: state.depth.max,
        ...state.depth.config
      }, updatedSourceMetrics)
      
      return {
        ...state,
        sources: existingSourceIndex !== -1
          ? state.sources.map((source, index) => 
              index === existingSourceIndex ? action.payload : source
            )
          : [...state.sources, action.payload],
        sourceMetrics: updatedSourceMetrics,
        depth: {
          ...state.depth,
          current: newDepth,
          config: {
            minRelevanceScore: newConfig.minRelevanceScore,
            adaptiveThreshold: newConfig.adaptiveThreshold,
            depthScores: newConfig.depthScores
          }
        }
      }
    }

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        completedSteps: action.payload.completed,
        totalExpectedSteps: action.payload.total
      }

    case 'CLEAR_STATE':
      return initialState

    default:
      return state
  }
}

// Context
interface ResearchContextType {
  state: ResearchState
  toggleSearch: () => void
  setDepth: (current: number, max: number) => void
  startResearch: () => void
  stopResearch: () => void
  addActivity: (activity: ResearchActivity & { completedSteps?: number; totalSteps?: number }) => void
  addSource: (source: ResearchSource) => void
  updateProgress: (completed: number, total: number) => void
  clearState: () => void
}

const ResearchContext = createContext<ResearchContextType | null>(null)

// Provider
export function ResearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(researchReducer, initialState)

  const toggleSearch = useCallback(() => {
    dispatch({ type: 'TOGGLE_SEARCH' })
  }, [])

  const setDepth = useCallback((current: number, max: number) => {
    dispatch({ type: 'SET_DEPTH', payload: { current, max } })
  }, [])

  const startResearch = useCallback(() => {
    dispatch({ type: 'START_RESEARCH' })
  }, [])

  const stopResearch = useCallback(() => {
    dispatch({ type: 'STOP_RESEARCH' })
  }, [])

  const addActivity = useCallback((activity: ResearchActivity & { completedSteps?: number; totalSteps?: number }) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: activity })
  }, [])

  const addSource = useCallback((source: ResearchSource) => {
    dispatch({ type: 'ADD_SOURCE', payload: source })
  }, [])

  const updateProgress = useCallback((completed: number, total: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { completed, total } })
  }, [])

  const clearState = useCallback(() => {
    dispatch({ type: 'CLEAR_STATE' })
  }, [])

  return (
    <ResearchContext.Provider
      value={{
        state,
        toggleSearch,
        setDepth,
        startResearch,
        stopResearch,
        addActivity,
        addSource,
        updateProgress,
        clearState
      }}
    >
      <ResearchActivityProvider>
        <DepthProvider>
          <SourcesProvider>
            {children}
          </SourcesProvider>
        </DepthProvider>
      </ResearchActivityProvider>
    </ResearchContext.Provider>
  )
}

// Hook
export function useResearch() {
  const context = useContext(ResearchContext)
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider')
  }
  return context
} 