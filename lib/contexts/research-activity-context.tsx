'use client'

import { type ResearchActivity } from '@/lib/types/research-enhanced'
import { createContext, useCallback, useContext, useReducer, type ReactNode } from 'react'

interface ActivityState {
  activities: ResearchActivity[]
  currentDepth: number
}

type ActivityAction =
  | { type: 'ADD_ACTIVITY'; payload: ResearchActivity }
  | { type: 'SET_DEPTH'; payload: number }
  | { type: 'CLEAR_ACTIVITIES' }

interface ActivityContextType {
  state: ActivityState
  addActivity: (activity: ResearchActivity) => void
  setDepth: (depth: number) => void
  clearActivities: () => void
}

interface ResearchActivityProviderProps {
  children: ReactNode
  onAddActivity?: (activity: ResearchActivity) => void
  onSetDepth?: (depth: number) => void
}

const initialState: ActivityState = {
  activities: [],
  currentDepth: 1
}

function activityReducer(state: ActivityState, action: ActivityAction): ActivityState {
  switch (action.type) {
    case 'ADD_ACTIVITY':
      return {
        ...state,
        activities: [...state.activities, {
          ...action.payload,
          depth: action.payload.depth || state.currentDepth
        }]
      }

    case 'SET_DEPTH':
      return {
        ...state,
        currentDepth: action.payload
      }

    case 'CLEAR_ACTIVITIES':
      return initialState

    default:
      return state
  }
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

export function ResearchActivityProvider({ 
  children,
  onAddActivity,
  onSetDepth
}: ResearchActivityProviderProps) {
  const [state, dispatch] = useReducer(activityReducer, initialState)

  const addActivity = useCallback((activity: ResearchActivity) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: activity })
    // Notify parent through props
    onAddActivity?.(activity)
  }, [onAddActivity])

  const setDepth = useCallback((depth: number) => {
    dispatch({ type: 'SET_DEPTH', payload: depth })
    // Notify parent through props
    onSetDepth?.(depth)
  }, [onSetDepth])

  const clearActivities = useCallback(() => {
    dispatch({ type: 'CLEAR_ACTIVITIES' })
  }, [])

  return (
    <ActivityContext.Provider
      value={{
        state,
        addActivity,
        setDepth,
        clearActivities
      }}
    >
      {children}
    </ActivityContext.Provider>
  )
}

export function useResearchActivity() {
  const context = useContext(ActivityContext)
  if (context === undefined) {
    throw new Error(
      'useResearchActivity must be used within a ResearchActivityProvider. ' +
      'Make sure it is wrapped in the ResearchProvider.'
    )
  }
  return context
} 