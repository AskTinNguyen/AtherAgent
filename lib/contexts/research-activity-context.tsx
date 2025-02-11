'use client'

import { createContext, useContext, useReducer, type ReactNode } from 'react'

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

// Initial state
const initialState: ActivityState = {
  activities: [],
  completedSteps: 0,
  totalExpectedSteps: 0
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

// Context
const ActivityContext = createContext<ActivityContextType | null>(null)

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

// Hook
export function useActivity() {
  const context = useContext(ActivityContext)
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider')
  }
  return context
} 