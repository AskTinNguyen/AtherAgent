'use client'

import { ResearchManager } from '@/lib/services/research-manager'
import { fetchStoredSuggestions, markSuggestionAsUsed } from '@/lib/services/suggestion-generator'
import { type ResearchActivity, type ResearchConfiguration as ResearchConfigType, type ResearchSource, type ResearchState, type ResearchSuggestion, type SourceMetrics } from '@/lib/types/research-enhanced'
import { optimizeDepthStrategy, shouldIncreaseDepth } from '@/lib/utils/research-depth'
import { createContext, useCallback, useContext, useEffect, useReducer, type ReactNode } from 'react'

// Constants
const STORAGE_KEY = 'research_depth_config'
const DEFAULT_MAX_DEPTH = 7
const DEFAULT_TARGET_DEPTH = 3

// Types for depth configuration
interface DepthConfig {
  currentDepth: number
  maxDepth: number
  minRelevanceScore: number
  adaptiveThreshold: number
  depthScores: Record<number, number>
}

// Session types
type SessionStatus = 'idle' | 'running' | 'completed' | 'interrupted'

interface SessionState {
  sessionId: string
  timestamp: number
  status: SessionStatus
}

// Initial state
const initialState: ResearchState = {
  isActive: false,
  searchEnabled: false,
  depth: {
    current: 1,
    max: DEFAULT_MAX_DEPTH,
    config: {
      minRelevanceScore: 0.6,
      adaptiveThreshold: 0.7,
      depthScores: { 1: 0 }
    }
  },
  configuration: {
    targetDepth: DEFAULT_TARGET_DEPTH,
    maxAllowedDepth: DEFAULT_MAX_DEPTH,
    timestamp: Date.now()
  },
  session: {
    sessionId: '',
    timestamp: Date.now(),
    status: 'idle'
  },
  activity: [],
  sources: [],
  sourceMetrics: [],
  suggestions: [],
  messages: [],
  completedSteps: 0,
  totalExpectedSteps: 0
}

// Actions
type ResearchAction =
  | { type: 'SET_MESSAGES'; payload: ResearchState['messages'] }
  | { type: 'ADD_MESSAGE'; payload: { role: 'user' | 'assistant'; content: string; timestamp?: string } }
  | { type: 'ADD_ACTIVITY'; payload: ResearchActivity }
  | { type: 'ADD_SOURCE'; payload: ResearchSource }
  | { type: 'SET_DEPTH'; payload: { current: number; max: number } }
  | { type: 'UPDATE_PROGRESS'; payload: { completed: number; total: number } }
  | { type: 'TOGGLE_SEARCH' }
  | { type: 'CLEAR_STATE' }
  | { type: 'CLEAR_SOURCES' }
  | { type: 'SET_SUGGESTIONS'; payload: ResearchSuggestion[] }
  | { type: 'MARK_SUGGESTION_USED'; payload: string }
  | { type: 'UPDATE_CONFIGURATION'; payload: ResearchConfigType }
  | { type: 'START_SESSION'; payload: { sessionId: string } }
  | { type: 'END_SESSION' }
  | { type: 'INTERRUPT_SESSION' }
  | { type: 'RESUME_SESSION'; payload: { sessionId: string } }

// Reducer
function researchReducer(state: ResearchState, action: ResearchAction): ResearchState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload
      }

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, {
          role: action.payload.role,
          content: action.payload.content,
          timestamp: action.payload.timestamp || new Date().toISOString()
        }]
      }

    case 'ADD_ACTIVITY':
      return {
        ...state,
        activity: [...state.activity, {
          ...action.payload,
          timestamp: new Date().toISOString()
        }]
      }

    case 'ADD_SOURCE': {
      const existingSourceIndex = state.sources.findIndex(s => s.url === action.payload.url)
      
      // Calculate metrics for the source
      const metrics: SourceMetrics = {
        contentQuality: action.payload.quality.contentQuality,
        sourceAuthority: action.payload.quality.sourceAuthority,
        timeRelevance: action.payload.quality.timeRelevance,
        depthLevel: state.depth.current,
        overallScore: (
          action.payload.quality.contentQuality +
          action.payload.quality.sourceAuthority +
          action.payload.quality.timeRelevance
        ) / 3
      }
      
      // Update sources and metrics
      const updatedSources = existingSourceIndex !== -1
        ? state.sources.map((source, index) => 
            index === existingSourceIndex ? action.payload : source
          )
        : [...state.sources, action.payload]
        
      const updatedMetrics = existingSourceIndex !== -1
        ? state.sourceMetrics.map((metric, index) =>
            index === existingSourceIndex ? metrics : metric
          )
        : [...state.sourceMetrics, metrics]
      
      return {
        ...state,
        sources: updatedSources,
        sourceMetrics: updatedMetrics
      }
    }

    case 'SET_DEPTH':
      return {
        ...state,
        depth: {
          ...state.depth,
          current: action.payload.current,
          max: action.payload.max
        }
      }

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        completedSteps: action.payload.completed,
        totalExpectedSteps: action.payload.total
      }

    case 'TOGGLE_SEARCH':
      return {
        ...state,
        searchEnabled: !state.searchEnabled,
        isActive: !state.searchEnabled // Sync isActive with searchEnabled
      }

    case 'CLEAR_STATE':
      return {
        ...initialState,
        searchEnabled: state.searchEnabled
      }

    case 'CLEAR_SOURCES':
      return {
        ...state,
        sources: [],
        sourceMetrics: []
      }

    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload
      }

    case 'MARK_SUGGESTION_USED':
      return {
        ...state,
        suggestions: state.suggestions.filter(s => s.id !== action.payload)
      }

    case 'UPDATE_CONFIGURATION':
      return {
        ...state,
        configuration: {
          ...action.payload,
          timestamp: Date.now()
        }
      }

    case 'START_SESSION':
      return {
        ...state,
        session: {
          sessionId: action.payload.sessionId,
          timestamp: Date.now(),
          status: 'running'
        },
        depth: {
          ...state.depth,
          current: 1,
          max: state.configuration.targetDepth
        }
      }

    case 'END_SESSION':
      return {
        ...state,
        session: {
          ...state.session,
          status: 'completed'
        }
      }

    case 'INTERRUPT_SESSION':
      return {
        ...state,
        session: {
          ...state.session,
          status: 'idle' // Reset to idle when interrupted
        }
      }

    case 'RESUME_SESSION':
      return {
        ...state,
        session: {
          sessionId: action.payload.sessionId,
          timestamp: Date.now(),
          status: 'running'
        }
      }

    default:
      return state
  }
}

// Context
interface ResearchContextType {
  state: ResearchState
  setMessages: (messages: ResearchState['messages']) => void
  addMessage: (message: { role: 'user' | 'assistant'; content: string; timestamp?: string }) => void
  addActivity: (activity: ResearchActivity) => void
  addSource: (source: ResearchSource) => void
  setDepth: (current: number, max: number) => void
  updateProgress: (completed: number, total: number) => void
  clearState: () => void
  optimizeDepth: (sourceMetrics: SourceMetrics[]) => void
  toggleSearch: () => void
  getSources: () => ResearchSource[]
  getSourceMetrics: () => SourceMetrics[]
  clearSources: () => void
  startResearch: () => void
  stopResearch: () => void
  setSuggestions: (suggestions: ResearchSuggestion[]) => void
  markSuggestionUsed: (suggestionId: string) => void
  loadSuggestions: (sessionId: string) => Promise<void>
  updateConfiguration: (config: ResearchConfigType) => void
  startSession: (sessionId: string) => void
  endSession: () => void
  interruptSession: () => void
  resumeSession: (sessionId: string) => void
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined)

// Provider
export function ResearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(researchReducer, initialState)

  // Load stored configuration on mount
  useEffect(() => {
    const storedConfig = ResearchManager.getStoredConfiguration()
    if (storedConfig) {
      dispatch({ type: 'UPDATE_CONFIGURATION', payload: storedConfig })
    }

    // Try to restore last active session
    const lastSession = ResearchManager.getLastActiveSession()
    if (lastSession?.status === 'running') {
      dispatch({ type: 'RESUME_SESSION', payload: { sessionId: lastSession.sessionId } })
    }

    // Clean up old sessions
    ResearchManager.cleanupOldSessions()
  }, [])

  const setMessages = useCallback((messages: ResearchState['messages']) => {
    if (!Array.isArray(messages)) {
      console.warn('Invalid messages format:', messages)
      return
    }
    dispatch({ type: 'SET_MESSAGES', payload: messages })
  }, [])

  const addMessage = useCallback((message: { role: 'user' | 'assistant'; content: string; timestamp?: string }) => {
    if (!message.content?.trim()) {
      console.warn('Empty message content:', message)
      return
    }
    dispatch({ type: 'ADD_MESSAGE', payload: message })
  }, [])

  const addActivity = useCallback((activity: ResearchActivity) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: activity })
  }, [])

  const addSource = useCallback((source: ResearchSource) => {
    dispatch({ type: 'ADD_SOURCE', payload: source })
    // Track source in session
    if (state.session.sessionId) {
      ResearchManager.addSessionSource(state.session.sessionId, source.url)
    }
  }, [state.session.sessionId])

  const setDepth = useCallback((current: number, max: number) => {
    dispatch({ type: 'SET_DEPTH', payload: { current, max } })
  }, [])

  const updateProgress = useCallback((completed: number, total: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { completed, total } })
  }, [])

  const clearState = useCallback(() => {
    dispatch({ type: 'CLEAR_STATE' })
  }, [])

  const toggleSearch = useCallback(() => {
    dispatch({ type: 'TOGGLE_SEARCH' })
  }, [])

  const optimizeDepth = useCallback((sourceMetrics: SourceMetrics[]) => {
    const { depth } = state
    
    if (!shouldIncreaseDepth({
      currentDepth: depth.current,
      maxDepth: depth.max,
      minRelevanceScore: depth.config.minRelevanceScore,
      adaptiveThreshold: depth.config.adaptiveThreshold,
      depthScores: depth.config.depthScores
    }, sourceMetrics)) {
      return
    }
    
    const newDepth = depth.current + 1
    const newConfig = optimizeDepthStrategy({
      currentDepth: newDepth,
      maxDepth: depth.max,
      minRelevanceScore: depth.config.minRelevanceScore,
      adaptiveThreshold: depth.config.adaptiveThreshold,
      depthScores: depth.config.depthScores
    }, sourceMetrics)

    setDepth(newDepth, depth.max)

    // Update session metrics
    if (state.session.sessionId) {
      const averageRelevance = sourceMetrics.reduce((acc, m) => acc + m.overallScore, 0) / sourceMetrics.length
      const completionRate = (newDepth / depth.max) * 100
      
      ResearchManager.updateSessionMetrics(state.session.sessionId, {
        averageRelevance,
        completionRate
      })
    }
  }, [state.depth, state.session.sessionId, setDepth])

  const getSources = useCallback(() => {
    return state.sources
  }, [state.sources])

  const getSourceMetrics = useCallback(() => {
    return state.sourceMetrics
  }, [state.sourceMetrics])

  const clearSources = useCallback(() => {
    dispatch({ type: 'CLEAR_SOURCES' })
  }, [])

  const updateConfiguration = useCallback((config: ResearchConfigType) => {
    dispatch({ type: 'UPDATE_CONFIGURATION', payload: config })
    // Persist configuration using ResearchManager
    ResearchManager.storeConfiguration(config)
  }, [])

  const startSession = useCallback((sessionId: string) => {
    const session = ResearchManager.createSession(state.configuration)
    dispatch({ type: 'START_SESSION', payload: { sessionId: session.sessionId } })
  }, [state.configuration])

  const endSession = useCallback(() => {
    if (state.session.sessionId) {
      ResearchManager.updateSessionStatus(state.session.sessionId, 'completed')
      dispatch({ type: 'END_SESSION' })
    }
  }, [state.session.sessionId])

  const interruptSession = useCallback(() => {
    if (state.session.sessionId) {
      ResearchManager.updateSessionStatus(state.session.sessionId, 'idle')
      dispatch({ type: 'INTERRUPT_SESSION' })
    }
  }, [state.session.sessionId])

  const resumeSession = useCallback((sessionId: string) => {
    const session = ResearchManager.getSession(sessionId)
    if (session) {
      ResearchManager.updateSessionStatus(sessionId, 'running')
      dispatch({ type: 'RESUME_SESSION', payload: { sessionId } })
    }
  }, [])

  const startResearch = useCallback(() => {
    if (!state.isActive) {
      const sessionId = `research_${Date.now()}`
      startSession(sessionId)
      dispatch({ type: 'TOGGLE_SEARCH' })
    }
  }, [state.isActive, startSession])

  const stopResearch = useCallback(() => {
    if (state.isActive) {
      endSession()
      dispatch({ type: 'TOGGLE_SEARCH' })
    }
  }, [state.isActive, endSession])

  const setSuggestions = useCallback((suggestions: ResearchSuggestion[]) => {
    dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions })
  }, [])

  const markSuggestionUsed = useCallback(async (suggestionId: string) => {
    try {
      await markSuggestionAsUsed(suggestionId)
      dispatch({ type: 'MARK_SUGGESTION_USED', payload: suggestionId })
    } catch (error) {
      console.error('Error marking suggestion as used:', error)
    }
  }, [])

  const loadSuggestions = useCallback(async (sessionId: string) => {
    try {
      const suggestions = await fetchStoredSuggestions(sessionId)
      setSuggestions(suggestions)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }, [setSuggestions])

  const value = {
    state,
    setMessages,
    addMessage,
    addActivity,
    addSource,
    setDepth,
    updateProgress,
    clearState,
    optimizeDepth,
    toggleSearch,
    getSources,
    getSourceMetrics,
    clearSources,
    startResearch,
    stopResearch,
    setSuggestions,
    markSuggestionUsed,
    loadSuggestions,
    updateConfiguration,
    startSession,
    endSession,
    interruptSession,
    resumeSession
  }

  return (
    <ResearchContext.Provider value={value}>
      {children}
    </ResearchContext.Provider>
  )
}

// Hook
export function useResearch() {
  const context = useContext(ResearchContext)
  if (context === undefined) {
    throw new Error('useResearch must be used within a ResearchProvider')
  }
  return context
} 