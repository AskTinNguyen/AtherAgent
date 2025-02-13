'use client'

import { createContext, ReactNode, useContext, useReducer, useState } from 'react'


// Export types
export interface ActivityItem {
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
}

export interface ResearchState {
  currentDepth: number
  maxDepth: number
  sources: string[]
  isActive: boolean
}

export interface ResearchMetrics {
  sourcesAnalyzed: number
  qualityScore: number
  coverageScore: number
  relevanceScore: number
}

// Types
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

type ResearchAction =
  | { type: 'SET_DEPTH'; payload: number }
  | { type: 'ADD_SOURCE'; payload: string }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'ADD_ACTIVITY'; payload: ActivityItem }
  | { type: 'UPDATE_METRICS'; payload: Partial<ResearchMetrics> }

interface ActivityContextType {
  state: ActivityState
  addActivity: (activity: ActivityItem & { completedSteps?: number; totalSteps?: number }) => void
  useActivity: (activity: ActivityItem) => void
  updateProgress: (completed: number, total: number) => void
  clearActivities: () => void
  initProgress: (totalSteps: number) => void
}

interface ResearchContextType {
  state: ResearchState
  activity: ActivityItem[]
  metrics: ResearchMetrics
  dispatch: (action: ResearchAction) => void
}

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

// Provider check utilities
function assertContextExists<T>(
  context: T | null,
  contextName: string
): asserts context is T {
  if (context === null) {
    throw new Error(
      `${contextName} must be used within its Provider. ` +
      'Please ensure the component is wrapped in ResearchActivityProvider.'
    )
  }
}

// Combined Provider
export function ResearchActivityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(researchReducer, initialResearchState)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [metrics, setMetrics] = useState<ResearchMetrics>(initialMetrics)
  const [activityState, activityDispatch] = useReducer(activityReducer, initialState)

  const activityContextValue: ActivityContextType = {
    state: activityState,
    addActivity: (activity) => activityDispatch({ type: 'ADD_ACTIVITY', payload: activity }),
    useActivity: (activity) => activityDispatch({ type: 'USE_ACTIVITY', payload: activity }),
    updateProgress: (completed, total) => activityDispatch({ type: 'UPDATE_PROGRESS', payload: { completed, total } }),
    clearActivities: () => activityDispatch({ type: 'CLEAR_ACTIVITIES' }),
    initProgress: (totalSteps) => activityDispatch({ type: 'INIT_PROGRESS', payload: { totalSteps } })
  }

  const researchContextValue: ResearchContextType = {
    state,
    activity,
    metrics,
    dispatch: (action: ResearchAction) => {
      dispatch(action)
      if (action.type === 'ADD_ACTIVITY') {
        setActivity(prev => [...prev, action.payload])
      } else if (action.type === 'UPDATE_METRICS') {
        setMetrics(prev => ({ ...prev, ...action.payload }))
      }
    }
  }

  return (
    <ResearchContext.Provider value={researchContextValue}>
      <ActivityContext.Provider value={activityContextValue}>
        {children}
      </ActivityContext.Provider>
    </ResearchContext.Provider>
  )
}

// Hooks with enhanced error messages
export function useActivity() {
  const context = useContext(ActivityContext)
  assertContextExists(context, 'useActivity')
  return context
}

export function useResearchContext() {
  const context = useContext(ResearchContext)
  assertContextExists(context, 'useResearchContext')
  return context
} 