'use client'

import { ResearchDepthConfig, ResearchSourceMetrics } from '@/lib/types/research'
import { calculateSourceMetrics, optimizeDepthStrategy, shouldIncreaseDepth } from '@/lib/utils/research-depth'
import { Children, cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import { type ResearchSuggestion } from './research-suggestions'

// Types
interface ActivityItem {
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
}

interface SourceItem {
  url: string
  title: string
  relevance: number
  content?: string
  query?: string
  publishedDate?: string
  timestamp: number
}

interface DeepResearchState {
  isActive: boolean
  activity: ActivityItem[]
  sources: SourceItem[]
  currentDepth: number
  maxDepth: number
  completedSteps: number
  totalExpectedSteps: number
  depthConfig: ResearchDepthConfig
  sourceMetrics: ResearchSourceMetrics[]
  suggestions: ResearchSuggestion[]
}

type DeepResearchAction =
  | { type: 'TOGGLE_ACTIVE' }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'ADD_SOURCE'; payload: SourceItem }
  | { type: 'SET_DEPTH'; payload: { current: number; max: number } }
  | { type: 'ADD_ACTIVITY'; payload: ActivityItem & { completedSteps?: number; totalSteps?: number } }
  | { type: 'UPDATE_PROGRESS'; payload: { completed: number; total: number } }
  | { type: 'CLEAR_STATE' }
  | { type: 'OPTIMIZE_DEPTH' }
  | { type: 'INIT_PROGRESS'; payload: { totalSteps: number } }
  | { type: 'SET_SUGGESTIONS'; payload: ResearchSuggestion[] }

interface DeepResearchContextType {
  state: DeepResearchState
  toggleActive: () => void
  setActive: (active: boolean) => void
  addActivity: (activity: ActivityItem & { completedSteps?: number; totalSteps?: number }) => void
  addSource: (source: SourceItem) => void
  setDepth: (current: number, max: number) => void
  initProgress: (maxDepth: number, totalSteps: number) => void
  updateProgress: (completed: number, total: number) => void
  clearState: () => void
  setSuggestions: (suggestions: ResearchSuggestion[]) => void
}

// Initial state and reducer
const initialState: DeepResearchState = {
  isActive: false,
  activity: [],
  sources: [],
  currentDepth: 0,
  maxDepth: 7,
  completedSteps: 0,
  totalExpectedSteps: 0,
  depthConfig: {
    currentDepth: 1,
    maxDepth: 7,
    minRelevanceScore: 0.6,
    adaptiveThreshold: 0.7,
    depthScores: {}
  },
  sourceMetrics: [],
  suggestions: []
}

function deepResearchReducer(state: DeepResearchState, action: DeepResearchAction): DeepResearchState {
  switch (action.type) {
    case 'TOGGLE_ACTIVE':
      return {
        ...state,
        isActive: !state.isActive,
        activity: state.isActive 
          ? state.activity.map(item => 
              item.status === 'pending' 
                ? { ...item, status: 'complete' }
                : item
            )
          : state.activity
      }
    case 'SET_ACTIVE':
      return {
        ...state,
        isActive: action.payload,
        activity: !action.payload 
          ? state.activity.map(item => 
              item.status === 'pending' 
                ? { ...item, status: 'complete' }
                : item
            )
          : state.activity
      }
    case 'ADD_SOURCE': {
      const { url, title, relevance } = action.payload
      const existingSource = state.sources.find(s => s.url === url)
      if (existingSource) return state

      const metrics = calculateSourceMetrics(
        action.payload.content || '',
        action.payload.query || '',
        url,
        action.payload.publishedDate
      )
      
      const newSourceMetrics = [...state.sourceMetrics, { ...metrics, depthLevel: state.depthConfig.currentDepth }]
      const newDepthConfig = optimizeDepthStrategy(state.depthConfig, newSourceMetrics)
      
      return {
        ...state,
        sources: [
          ...state.sources,
          { url, title, relevance, timestamp: Date.now() }
        ],
        sourceMetrics: newSourceMetrics,
        depthConfig: newDepthConfig
      }
    }
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
    case 'ADD_ACTIVITY':
      return {
        ...state,
        activity: [...state.activity, action.payload],
        completedSteps: action.payload.completedSteps ?? state.completedSteps,
        totalExpectedSteps: action.payload.totalSteps ?? state.totalExpectedSteps
      }
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        completedSteps: action.payload.completed,
        totalExpectedSteps: action.payload.total
      }
    case 'CLEAR_STATE':
      return initialState
    case 'OPTIMIZE_DEPTH': {
      if (!shouldIncreaseDepth(state.depthConfig, state.sourceMetrics)) {
        return state
      }
      
      const newDepth = state.depthConfig.currentDepth + 1
      return {
        ...state,
        depthConfig: {
          ...state.depthConfig,
          currentDepth: newDepth,
          depthScores: {
            ...state.depthConfig.depthScores,
            [newDepth]: 0
          }
        }
      }
    }
    case 'INIT_PROGRESS':
      return {
        ...state,
        maxDepth: 7,
        totalExpectedSteps: action.payload.totalSteps,
        completedSteps: 0,
        currentDepth: 0
      }
    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload
      }
    default:
      return state
  }
}

// Context
const DeepResearchContext = createContext<DeepResearchContextType | undefined>(undefined)

// Provider Component
function DeepResearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(deepResearchReducer, initialState)

  const toggleActive = useCallback(() => {
    dispatch({ type: 'TOGGLE_ACTIVE' })
  }, [])

  const setActive = useCallback((active: boolean) => {
    dispatch({ type: 'SET_ACTIVE', payload: active })
  }, [])

  const addActivity = useCallback(
    (activity: ActivityItem & { completedSteps?: number; totalSteps?: number }) => {
      dispatch({ type: 'ADD_ACTIVITY', payload: activity })
    },
    []
  )

  const addSource = useCallback((source: SourceItem) => {
    dispatch({ type: 'ADD_SOURCE', payload: source })
  }, [])

  const setDepth = useCallback((current: number, max: number) => {
    dispatch({ type: 'SET_DEPTH', payload: { current, max } })
  }, [])

  const initProgress = useCallback((maxDepth: number, totalSteps: number) => {
    dispatch({ type: 'INIT_PROGRESS', payload: { totalSteps } })
  }, [])

  const updateProgress = useCallback((completed: number, total: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { completed, total } })
  }, [])

  const clearState = useCallback(() => {
    dispatch({ type: 'CLEAR_STATE' })
  }, [])

  const setSuggestions = useCallback((suggestions: ResearchSuggestion[]) => {
    dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions })
  }, [])

  return (
    <DeepResearchContext.Provider
      value={{
        state,
        toggleActive,
        setActive,
        addActivity,
        addSource,
        setDepth,
        initProgress,
        updateProgress,
        clearState,
        setSuggestions
      }}
    >
      {children}
    </DeepResearchContext.Provider>
  )
}

// Hook to use the context
function useDeepResearch() {
  const context = useContext(DeepResearchContext)
  if (context === undefined) {
    throw new Error('useDeepResearch must be used within a DeepResearchProvider')
  }
  return context
}

// State Manager Component
interface DeepResearchStateManagerProps {
  children: ReactNode
  chatId: string
  onClearStateChange?: (chatId: string, isCleared: boolean) => Promise<void>
  initialClearedState?: boolean
  onDepthChange?: (chatId: string, currentDepth: number, maxDepth: number) => Promise<void>
}

// Add this interface before DeepResearchStateManager
interface SetDepthProps {
  setDepth: (current: number, max: number) => void;
}

function DeepResearchStateManager({ 
  children, 
  chatId,
  onClearStateChange,
  initialClearedState = false,
  onDepthChange
}: DeepResearchStateManagerProps) {
  const { state, clearState, setActive, initProgress, setDepth: originalSetDepth } = useDeepResearch()
  const [isCleared, setIsCleared] = useState(false)
  const [hasBeenCleared, setHasBeenCleared] = useState(initialClearedState)

  const getChatClearedKey = useCallback((id: string) => `deepResearchCleared_${id}`, [])
  
  const setChatCleared = useCallback(async (id: string, cleared: boolean) => {
    if (typeof window !== 'undefined') {
      if (cleared) {
        window.sessionStorage.setItem(getChatClearedKey(id), 'true')
      } else {
        window.sessionStorage.removeItem(getChatClearedKey(id))
      }
    }
    
    if (onClearStateChange) {
      try {
        await onClearStateChange(id, cleared)
      } catch (error) {
        console.error('Failed to update research cleared state in database:', error)
      }
    }
  }, [getChatClearedKey, onClearStateChange])

  const setDepth = useCallback(async (current: number, max: number) => {
    originalSetDepth(current, max)
    if (onDepthChange) {
      try {
        await onDepthChange(chatId, current, max)
      } catch (error) {
        console.error('Failed to update research depth in database:', error)
      }
    }
  }, [chatId, originalSetDepth, onDepthChange])
  
  const isChatCleared = useCallback((id: string) => {
    if (typeof window === 'undefined') return initialClearedState
    return window.sessionStorage.getItem(getChatClearedKey(id)) === 'true' || initialClearedState
  }, [getChatClearedKey, initialClearedState])
  
  const clearChatState = useCallback(async (id: string) => {
    await setChatCleared(id, true)
    clearState()
    setActive(false)
    initProgress(7, 0)
  }, [clearState, setActive, initProgress, setChatCleared])

  useEffect(() => {
    if (!state.isActive && isCleared) {
      clearChatState(chatId)
      setIsCleared(false)
      setHasBeenCleared(true)
    }
  }, [state.isActive, isCleared, chatId, clearChatState])

  useEffect(() => {
    const wasCleared = isChatCleared(chatId)
    if (wasCleared) {
      setHasBeenCleared(true)
      clearState()
      setActive(false)
    }
  }, [chatId, clearState, setActive, isChatCleared])

  useEffect(() => {
    if (hasBeenCleared && state.activity.length > 0) {
      clearChatState(chatId)
    }
  }, [hasBeenCleared, state.activity.length, chatId, clearChatState])

  useEffect(() => {
    return () => {
      if (hasBeenCleared) {
        clearState()
        setActive(false)
      }
    }
  }, [clearState, setActive, hasBeenCleared])

  return (
    <>
      {Children.map(children, (child: ReactNode) => {
        if (isValidElement(child)) {
          // Only pass setDepth to custom components (non-DOM elements)
          if (typeof child.type === 'function') {
            return cloneElement(child, {
              setDepth
            } as SetDepthProps)
          }
        }
        return child
      })}
    </>
  )
}

// Progress Hook
function useDeepResearchProgress(
  currentDepth: number, 
  maxDepth: number = 7, 
  chatId: string,
  initialClearedState?: boolean
) {
  const { setDepth, state, clearState, setActive } = useDeepResearch()
  const [hasBeenCleared, setHasBeenCleared] = useState(() => {
    if (typeof window === 'undefined') return initialClearedState || false
    return initialClearedState || window.sessionStorage.getItem(`deepResearchCleared_${chatId}`) === 'true'
  })
  
  const shouldContinueResearch = currentDepth < maxDepth && !hasBeenCleared
  
  const updateDepth = useCallback(() => {
    if (shouldContinueResearch) {
      setDepth(currentDepth + 1, maxDepth)
    }
  }, [currentDepth, maxDepth, setDepth, shouldContinueResearch])

  const resetProgress = useCallback(() => {
    setActive(false)
    clearState()
    setDepth(0, maxDepth)
    setHasBeenCleared(true)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(`deepResearchCleared_${chatId}`, 'true')
    }
  }, [clearState, setActive, setDepth, maxDepth, chatId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(`deepResearchCleared_${chatId}`, hasBeenCleared.toString())
    }
  }, [hasBeenCleared, chatId])

  return {
    shouldContinueResearch,
    nextDepth: currentDepth + 1,
    maxDepth,
    updateDepth,
    resetProgress,
    currentDepth: state.currentDepth,
    hasBeenCleared
  }
}

// Wrapper Component
interface DeepResearchWrapperProps {
  children: ReactNode
  chatId: string
  onClearStateChange?: (chatId: string, isCleared: boolean) => Promise<void>
  initialClearedState?: boolean
}

function DeepResearchWrapper({ 
  children, 
  chatId, 
  onClearStateChange,
  initialClearedState 
}: DeepResearchWrapperProps) {
  return (
    <DeepResearchProvider>
      <DeepResearchStateManager 
        chatId={chatId}
        onClearStateChange={onClearStateChange}
        initialClearedState={initialClearedState}
      >
        {children}
      </DeepResearchStateManager>
    </DeepResearchProvider>
  )
}

// Exports
export {
    DeepResearchProvider,
    DeepResearchWrapper,
    useDeepResearch,
    useDeepResearchProgress,
    type ActivityItem, type DeepResearchState, type SourceItem
}

