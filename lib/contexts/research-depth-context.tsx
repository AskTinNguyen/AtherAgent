'use client'

import { ResearchDepthConfig, ResearchSourceMetrics } from '@/lib/types/research'
import { optimizeDepthStrategy, shouldIncreaseDepth } from '@/lib/utils/research-depth'
import { createContext, useContext, useReducer, type ReactNode } from 'react'

// Types
interface DepthState {
  currentDepth: number
  maxDepth: number
  depthConfig: ResearchDepthConfig
}

type DepthAction =
  | { type: 'SET_DEPTH'; payload: { current: number; max: number } }
  | { type: 'OPTIMIZE_DEPTH'; payload: { sourceMetrics: ResearchSourceMetrics[] } }
  | { type: 'CLEAR_DEPTH' }

interface DepthContextType {
  state: DepthState
  setDepth: (current: number, max: number) => void
  optimizeDepth: (sourceMetrics: ResearchSourceMetrics[]) => void
  clearDepth: () => void
}

// Initial state
const initialState: DepthState = {
  currentDepth: 1,
  maxDepth: 7,
  depthConfig: {
    currentDepth: 1,
    maxDepth: 7,
    minRelevanceScore: 0.6,
    adaptiveThreshold: 0.7,
    depthScores: {
      1: 0
    }
  }
}

// Reducer
function depthReducer(state: DepthState, action: DepthAction): DepthState {
  switch (action.type) {
    case 'SET_DEPTH': {
      const { current, max } = action.payload
      return {
        ...state,
        currentDepth: current,
        maxDepth: max,
        depthConfig: {
          ...state.depthConfig,
          currentDepth: current,
          maxDepth: max
        }
      }
    }
    case 'OPTIMIZE_DEPTH': {
      const { sourceMetrics } = action.payload
      
      if (!shouldIncreaseDepth(state.depthConfig, sourceMetrics)) {
        return state
      }
      
      const newDepth = state.currentDepth + 1
      const newDepthConfig = optimizeDepthStrategy({
        ...state.depthConfig,
        currentDepth: newDepth
      }, sourceMetrics)

      return {
        ...state,
        currentDepth: newDepth,
        depthConfig: {
          ...newDepthConfig,
          depthScores: {
            ...newDepthConfig.depthScores,
            [newDepth]: 0
          }
        }
      }
    }
    case 'CLEAR_DEPTH':
      return initialState
    default:
      return state
  }
}

// Context
const DepthContext = createContext<DepthContextType | null>(null)

// Provider
export function DepthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(depthReducer, initialState)

  const setDepth = (current: number, max: number) => {
    dispatch({ type: 'SET_DEPTH', payload: { current, max } })
  }

  const optimizeDepth = (sourceMetrics: ResearchSourceMetrics[]) => {
    dispatch({ type: 'OPTIMIZE_DEPTH', payload: { sourceMetrics } })
  }

  const clearDepth = () => {
    dispatch({ type: 'CLEAR_DEPTH' })
  }

  return (
    <DepthContext.Provider
      value={{
        state,
        setDepth,
        optimizeDepth,
        clearDepth
      }}
    >
      {children}
    </DepthContext.Provider>
  )
}

// Hook
export function useDepth() {
  const context = useContext(DepthContext)
  if (!context) {
    throw new Error('useDepth must be used within a DepthProvider')
  }
  return context
} 