'use client'

import { createContext, ReactNode, useContext, useReducer, useState } from 'react'

// Types
interface ActivityItem {
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
}

interface ActivityState {
  activities: ActivityItem[]
  completedSteps: number
  totalExpectedSteps: number
}

type ActivityAction =
  | { type: 'ADD_ACTIVITY'; payload: ActivityItem & { completedSteps?: number; totalSteps?: number } }
  | { type: 'UPDATE_PROGRESS'; payload: { completed: number; total: number } }
  | { type: 'CLEAR_ACTIVITIES' }
  | { type: 'INIT_PROGRESS'; payload: { totalSteps: number } }
  | { type: 'USE_ACTIVITY'; payload: ActivityItem }

interface ActivityContextType {
  state: ActivityState
  addActivity: (activity: ActivityItem & { completedSteps?: number; totalSteps?: number }) => void
  useActivity: (activity: ActivityItem) => void
  updateProgress: (completed: number, total: number) => void
  clearActivities: () => void
  initProgress: (totalSteps: number) => void
}

interface ResearchState {
  currentDepth: number
  maxDepth: number
  sources: string[]
  isActive: boolean
}

interface ResearchMetrics {
  sourcesAnalyzed: number
  qualityScore: number
  coverageScore: number
  relevanceScore: number
}

interface ResearchContextType {
  state: ResearchState
  activity: ActivityItem[]
  metrics: ResearchMetrics
  dispatch: (action: ResearchAction) => void
}

type ResearchAction =
  | { type: 'SET_DEPTH'; payload: number }
  | { type: 'ADD_SOURCE'; payload: string }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'ADD_ACTIVITY'; payload: ActivityItem }
  | { type: 'UPDATE_METRICS'; payload: Partial<ResearchMetrics> }

// Initial state
const initialState: ActivityState = {
  activities: [],
  completedSteps: 0,
  totalExpectedSteps: 0
}

const initialResearchState: ResearchState = {
  currentDepth: 1,
  maxDepth: 7,
  sources: [],
  isActive: false
}

const initialMetrics: ResearchMetrics = {
  sourcesAnalyzed: 0,
  qualityScore: 0,
  coverageScore: 0,
  relevanceScore: 0
}

// Reducer
function activityReducer(state: ActivityState, action: ActivityAction): ActivityState {
  switch (action.type) {
    case 'ADD_ACTIVITY':
      return {
        ...state,
        activities: [...state.activities, action.payload],
        completedSteps: action.payload.completedSteps ?? state.completedSteps,
        totalExpectedSteps: action.payload.totalSteps ?? state.totalExpectedSteps
      }
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        completedSteps: action.payload.completed,
        totalExpectedSteps: action.payload.total
      }
    case 'CLEAR_ACTIVITIES':
      return initialState
    case 'INIT_PROGRESS':
      return {
        ...state,
        totalExpectedSteps: action.payload.totalSteps,
        completedSteps: 0
      }
    case 'USE_ACTIVITY':
      return {
        ...state,
        activities: [...state.activities, { ...action.payload, status: 'complete' }]
      }
    default:
      return state
  }
}

function researchReducer(state: ResearchState, action: ResearchAction): ResearchState {
  switch (action.type) {
    case 'SET_DEPTH':
      return { ...state, currentDepth: action.payload }
    case 'ADD_SOURCE':
      return { ...state, sources: [...state.sources, action.payload] }
    case 'SET_ACTIVE':
      return { ...state, isActive: action.payload }
    default:
      return state
  }
}

// Context
const ActivityContext = createContext<ActivityContextType | null>(null)
const ResearchContext = createContext<ResearchContextType | null>(null)

// Provider
export function ActivityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(activityReducer, initialState)

  const addActivity = (activity: ActivityItem & { completedSteps?: number; totalSteps?: number }) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: activity })
  }

  const useActivity = (activity: ActivityItem) => {
    dispatch({ type: 'USE_ACTIVITY', payload: activity })
  }

  const updateProgress = (completed: number, total: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { completed, total } })
  }

  const clearActivities = () => {
    dispatch({ type: 'CLEAR_ACTIVITIES' })
  }

  const initProgress = (totalSteps: number) => {
    dispatch({ type: 'INIT_PROGRESS', payload: { totalSteps } })
  }

  return (
    <ActivityContext.Provider
      value={{
        state,
        addActivity,
        useActivity,
        updateProgress,
        clearActivities,
        initProgress
      }}
    >
      {children}
    </ActivityContext.Provider>
  )
}

export function ResearchActivityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(researchReducer, initialResearchState)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [metrics, setMetrics] = useState<ResearchMetrics>(initialMetrics)

  const contextValue: ResearchContextType = {
    state,
    activity,
    metrics,
    dispatch: (action: ResearchAction) => {
      dispatch(action)
      if (action.type === 'ADD_ACTIVITY') {
        setActivity((prev: ActivityItem[]) => [...prev, action.payload])
      } else if (action.type === 'UPDATE_METRICS') {
        setMetrics((prev: ResearchMetrics) => ({ ...prev, ...action.payload }))
      }
    }
  }

  return (
    <ResearchContext.Provider value={contextValue}>
      {children}
    </ResearchContext.Provider>
  )
}

// Hook
export function useActivity() {
  const context = useContext(ActivityContext)
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider')
  }
  return context
}

export function useResearchContext() {
  const context = useContext(ResearchContext)
  if (!context) {
    throw new Error('useResearchContext must be used within a ResearchActivityProvider')
  }
  return context
} 