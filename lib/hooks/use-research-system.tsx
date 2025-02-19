import { useResearchContext } from '@/lib/contexts/research-activity-context'
import { useResearch } from '@/lib/contexts/research-context'
import { useDepth } from '@/lib/contexts/research-depth-context'
import {
    type ResearchState as BaseResearchState,
    type ResearchActivity,
    type ResearchSource,
    type SourceMetrics
} from '@/lib/types/research-enhanced'
import { useCallback, useMemo } from 'react'

export interface ResearchSystemError {
  code: 'CONTEXT_ERROR' | 'VALIDATION_ERROR' | 'OPERATION_ERROR'
  message: string
  details?: unknown
}

export interface ResearchSystemState {
  isActive: boolean
  searchEnabled: boolean
  progress: {
    completed: number
    total: number
  }
  depth: {
    current: number
    max: number
  }
  error?: ResearchSystemError
}

export interface ResearchSystemActions {
  // Core research actions
  setMessages: (messages: BaseResearchState['messages']) => void
  addMessage: (message: { role: 'user' | 'assistant'; content: string; timestamp?: string }) => void
  toggleSearch: () => void
  clearState: () => void
  
  // Activity management
  addActivity: (activity: ResearchActivity) => void
  clearActivities: () => void
  
  // Depth management
  setDepth: (current: number, max: number) => void
  optimizeDepth: (metrics: SourceMetrics[]) => void
  
  // Source management
  addSource: (source: ResearchSource) => void
  getSources: () => ResearchSource[]
  getSourceMetrics: () => SourceMetrics[]
  clearSources: () => void
}

export type ResearchSystem = {
  state: ResearchSystemState
  actions: ResearchSystemActions
}

export function useResearchSystem(): ResearchSystem {
  // Compose existing hooks
  const research = useResearch()
  const activity = useResearchContext()
  const depth = useDepth()

  // Memoize the state object to prevent unnecessary re-renders
  const state = useMemo<ResearchSystemState>(() => ({
    isActive: research.state.isActive,
    searchEnabled: research.state.searchEnabled,
    progress: {
      completed: research.state.completedSteps,
      total: research.state.totalExpectedSteps
    },
    depth: {
      current: research.state.depth.current,
      max: research.state.depth.max
    }
  }), [
    research.state.isActive,
    research.state.searchEnabled,
    research.state.completedSteps,
    research.state.totalExpectedSteps,
    research.state.depth.current,
    research.state.depth.max
  ])

  // Memoize complex or frequently used actions
  const actions = useMemo<ResearchSystemActions>(() => ({
    // Core research actions
    setMessages: research.setMessages,
    addMessage: research.addMessage,
    toggleSearch: research.toggleSearch,
    clearState: research.clearState,

    // Activity management
    addActivity: useCallback((activityData: ResearchActivity) => {
      research.addActivity(activityData)
      activity.addActivity(activityData)
    }, [research.addActivity, activity.addActivity]),
    clearActivities: activity.clearActivities,

    // Depth management
    setDepth: useCallback((current: number, max: number) => {
      research.setDepth(current, max)
      depth.setDepth(current, max)
    }, [research.setDepth, depth.setDepth]),
    optimizeDepth: useCallback((metrics: SourceMetrics[]) => {
      // Type assertion since we know the metrics structure matches
      research.optimizeDepth(metrics as any)
      depth.optimizeDepth(metrics as any)
    }, [research.optimizeDepth, depth.optimizeDepth]),

    // Source management
    addSource: research.addSource,
    getSources: research.getSources,
    getSourceMetrics: research.getSourceMetrics,
    clearSources: research.clearSources
  }), [research, activity, depth])

  return { state, actions }
}

// Export a helper hook for accessing specific parts of the system
export function useResearchFeature<K extends keyof ResearchSystemActions>(
  feature: K
): ResearchSystemActions[K] {
  const { actions } = useResearchSystem()
  return actions[feature]
} 