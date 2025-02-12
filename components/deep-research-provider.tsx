'use client'

import { ResearchProvider } from '@/lib/contexts/research-provider'
import { ResearchDepthConfig, ResearchSourceMetrics } from '@/lib/types/research'
import { calculateSourceMetrics, optimizeDepthStrategy, shouldIncreaseDepth } from '@/lib/utils/research-depth'
import { Children, cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import { type ResearchSuggestion } from './research-suggestions'

// Types
export interface ResearchState {
  isActive: boolean
  activity: ResearchActivity[]
  sources: ResearchSource[]
  currentDepth: number
  maxDepth: number
  completedSteps: number
  totalExpectedSteps: number
  depthConfig: ResearchDepthConfig
  sourceMetrics: ResearchSourceMetrics[]
  suggestions: ResearchSuggestion[]
  researchMemory: ResearchMemory[]
}

export interface ResearchActivity {
  timestamp: number
  message: string
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  depth?: number
  status?: 'pending' | 'complete' | 'error'
}

export interface ResearchSource {
  url: string
  title: string
  relevance: number
  content?: string
  query?: string
  publishedDate?: string
  quality?: {
    contentQuality: number
    sourceAuthority: number
    timeRelevance: number
  }
}

export interface ResearchMemory {
  depth: number
  context: string
  sourceUrls: string[]
}

export interface DeepResearchState {
  isActive: boolean
  activity: ResearchActivity[]
  sources: ResearchSource[]
  currentDepth: number
  maxDepth: number
  completedSteps: number
  totalExpectedSteps: number
  depthConfig: ResearchDepthConfig
  sourceMetrics: ResearchSourceMetrics[]
  suggestions: ResearchSuggestion[]
  researchMemory: ResearchMemory[]
}

type DeepResearchAction =
  | { type: 'TOGGLE_ACTIVE' }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'ADD_SOURCE'; payload: ResearchSource }
  | { type: 'SET_DEPTH'; payload: { current: number; max: number } }
  | { type: 'ADD_ACTIVITY'; payload: ResearchActivity & { completedSteps?: number; totalSteps?: number } }
  | { type: 'UPDATE_PROGRESS'; payload: { completed: number; total: number } }
  | { type: 'CLEAR_STATE' }
  | { type: 'OPTIMIZE_DEPTH' }
  | { type: 'INIT_PROGRESS'; payload: { totalSteps: number } }
  | { type: 'SET_SUGGESTIONS'; payload: ResearchSuggestion[] }
  | { type: 'ADD_MEMORY'; payload: ResearchMemory }
  | { type: 'UPDATE_MEMORY'; payload: { index: number; memory: ResearchMemory } }

interface DeepResearchContextType {
  state: DeepResearchState
  toggleActive: () => void
  setActive: (active: boolean) => void
  addActivity: (activity: ResearchActivity & { completedSteps?: number; totalSteps?: number }) => void
  addSource: (source: ResearchSource) => void
  setDepth: (current: number, max: number) => void
  initProgress: (maxDepth: number, totalSteps: number) => void
  updateProgress: (completed: number, total: number) => void
  clearState: () => void
  setSuggestions: (suggestions: ResearchSuggestion[]) => void
  addMemory: (memory: ResearchMemory) => void
  updateMemory: (index: number, memory: ResearchMemory) => void
}

// Initial state and reducer
const initialState: DeepResearchState = {
  isActive: false,
  activity: [],
  sources: [],
  currentDepth: 1,
  maxDepth: 7,
  completedSteps: 0,
  totalExpectedSteps: 0,
  depthConfig: {
    currentDepth: 1,
    maxDepth: 7,
    minRelevanceScore: 0.6,
    adaptiveThreshold: 0.7,
    depthScores: {
      1: 0
    }
  },
  sourceMetrics: [],
  suggestions: [],
  researchMemory: []
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
                ? { ...item, status: 'complete', timestamp: new Date().toISOString() }
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
                ? { ...item, status: 'complete', timestamp: new Date().toISOString() }
                : item
            )
          : state.activity,
        ...(action.payload && {
          completedSteps: 0,
          currentDepth: 1
        })
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
      
      const quality = {
        contentQuality: metrics.contentQuality,
        sourceAuthority: calculateSourceAuthority(url, state.sources),
        timeRelevance: calculateFreshness(publishedDate)
      }
      
      const newSourceMetrics: ResearchSourceMetrics = {
        relevanceScore: metrics.relevanceScore,
        depthLevel: state.currentDepth,
        contentQuality: quality.contentQuality,
        timeRelevance: quality.timeRelevance,
        sourceAuthority: quality.sourceAuthority,
        crossValidation: calculateSourceAuthority(url, state.sources),
        coverage: metrics.contentQuality * quality.timeRelevance
      }
      
      const updatedSourceMetrics = [...state.sourceMetrics]
      if (existingSourceIndex !== -1) {
        updatedSourceMetrics[existingSourceIndex] = newSourceMetrics
      } else {
        updatedSourceMetrics.push(newSourceMetrics)
      }
      
      const newDepthConfig = optimizeDepthStrategy({
        ...state.depthConfig,
        currentDepth: state.currentDepth
      }, updatedSourceMetrics)
      
      const shouldIncrease = shouldIncreaseDepth(
        { ...newDepthConfig, currentDepth: state.currentDepth },
        updatedSourceMetrics
      )
      
      const newDepth = shouldIncrease ? state.currentDepth + 1 : state.currentDepth
      
      const newDepthScores = {
        ...newDepthConfig.depthScores,
        [state.currentDepth]: metrics.relevanceScore
      }
      
      const newSource = { 
        url, 
        title, 
        relevance, 
        content, 
        query, 
        publishedDate, 
        timestamp: Date.now(), 
        quality 
      }
      
      return {
        ...state,
        sources: existingSourceIndex !== -1
          ? state.sources.map((source, index) => 
              index === existingSourceIndex ? newSource : source
            )
          : [...state.sources, newSource],
        sourceMetrics: updatedSourceMetrics,
        currentDepth: newDepth,
        depthConfig: {
          ...newDepthConfig,
          currentDepth: newDepth,
          depthScores: newDepthScores
        }
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
    case 'ADD_ACTIVITY': {
      if (!action.payload) {
        console.error('ADD_ACTIVITY: No payload provided')
        return state
      }

      const newActivity = {
        ...action.payload,
        depth: action.payload.depth || state.currentDepth,
        timestamp: action.payload.timestamp || new Date().toISOString()
      }

      // Validate activity data
      if (!newActivity.message || !newActivity.type) {
        console.error('ADD_ACTIVITY: Invalid activity data', newActivity)
        return state
      }

      // Prevent duplicate activities
      const isDuplicate = state.activity.some(
        item => 
          item.message === newActivity.message && 
          item.type === newActivity.type &&
          item.depth === newActivity.depth
      )

      if (isDuplicate) {
        return {
          ...state,
          completedSteps: action.payload.completedSteps ?? state.completedSteps,
          totalExpectedSteps: action.payload.totalSteps ?? state.totalExpectedSteps
        }
      }

      // Log activity addition
      console.log('Adding activity:', newActivity)

      return {
        ...state,
        activity: [...state.activity, newActivity],
        completedSteps: action.payload.completedSteps ?? 
          (newActivity.status === 'complete' ? state.completedSteps + 1 : state.completedSteps),
        totalExpectedSteps: action.payload.totalSteps ?? state.totalExpectedSteps
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
        currentDepth: 1,
        depthConfig: {
          ...state.depthConfig,
          currentDepth: 1,
          depthScores: { 1: 0 }
        }
      }
    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload
      }
    case 'ADD_MEMORY':
      return {
        ...state,
        researchMemory: [...state.researchMemory, action.payload]
      }
    case 'UPDATE_MEMORY':
      return {
        ...state,
        researchMemory: state.researchMemory.map((memory, index) =>
          index === action.payload.index ? action.payload.memory : memory
        )
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

  // Add debug logging
  useEffect(() => {
    console.log('DeepResearch Provider State:', {
      isActive: state.isActive,
      currentDepth: state.currentDepth,
      activity: state.activity.length,
      sources: state.sources.length
    })
  }, [state])

  // Add initialization effect
  useEffect(() => {
    // Initialize the research state
    dispatch({ 
      type: 'INIT_PROGRESS', 
      payload: { totalSteps: 7 } 
    })
    
    // Log initial state
    console.log('DeepResearch Provider Initialized:', state)
  }, [])

  const toggleActive = useCallback(() => {
    dispatch({ type: 'TOGGLE_ACTIVE' })
  }, [])

  const setActive = useCallback((active: boolean) => {
    dispatch({ type: 'SET_ACTIVE', payload: active })
  }, [])

  const addActivity = useCallback(
    (activity: ResearchActivity & { completedSteps?: number; totalSteps?: number }) => {
      dispatch({ type: 'ADD_ACTIVITY', payload: activity })
    },
    []
  )

  const addSource = useCallback((source: ResearchSource) => {
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

  const addMemory = useCallback((memory: ResearchMemory) => {
    dispatch({ type: 'ADD_MEMORY', payload: memory })
  }, [])

  const updateMemory = useCallback((index: number, memory: ResearchMemory) => {
    dispatch({ type: 'UPDATE_MEMORY', payload: { index, memory } })
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
        setSuggestions,
        addMemory,
        updateMemory
      }}
    >
      {children}
    </DeepResearchContext.Provider>
  )
}

// Hook to use the context
export function useDeepResearch() {
  const context = useContext(DeepResearchContext)
  if (!context) {
    throw new Error('useDeepResearch must be used within a DeepResearchProvider')
  }

  // Add debug logging
  console.log('DeepResearch Context:', {
    isActive: context.state.isActive,
    activityCount: context.state.activity.length,
    sourcesCount: context.state.sources.length,
    currentDepth: context.state.currentDepth,
    maxDepth: context.state.maxDepth
  })

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
  onDepthChange?: (chatId: string, currentDepth: number, maxDepth: number) => Promise<void>
}

function DeepResearchWrapper({ 
  children, 
  chatId, 
  onClearStateChange,
  initialClearedState,
  onDepthChange
}: DeepResearchWrapperProps) {
  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup when wrapper unmounts
      console.log('DeepResearch Wrapper cleanup')
    }
  }, [])

  return (
    <DeepResearchProvider>
      <ResearchProvider
        chatId={chatId}
        onClearStateChange={onClearStateChange}
        initialClearedState={initialClearedState}
        onDepthChange={onDepthChange}
      >
        <DeepResearchStateManager 
          chatId={chatId}
          onClearStateChange={onClearStateChange}
          initialClearedState={initialClearedState}
          onDepthChange={onDepthChange}
        >
          {children}
        </DeepResearchStateManager>
      </ResearchProvider>
    </DeepResearchProvider>
  )
}

// Exports
export {
  DeepResearchProvider,
  DeepResearchWrapper,
  useDeepResearch,
  useDeepResearchProgress,
  type DeepResearchState,
  type ResearchActivity, type ResearchMemory, type ResearchSource
}

// Utility functions for source quality calculation
function calculateFreshness(publishedDate?: string): number {
  if (!publishedDate) return 0
  const date = new Date(publishedDate)
  const now = new Date()
  const ageInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, 1 - ageInDays / 365) // Score decreases with age, minimum 0
}

function calculateSourceAuthority(url: string, sources: ResearchSource[]): number {
  const domain = new URL(url).hostname
  const relatedSources = sources.filter(source => {
    try {
      return new URL(source.url).hostname === domain
    } catch {
      return false
    }
  })
  return Math.min(1, relatedSources.length / 3) // Score increases with more related sources, max 1
}

