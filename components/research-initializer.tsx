'use client'

import { useResearch } from '@/lib/contexts/research-context'
import { useEffect } from 'react'

export function ResearchInitializer() {
  const { state, startResearch, stopResearch } = useResearch()

  // Only start/stop research when searchEnabled changes
  useEffect(() => {
    if (state.searchEnabled && !state.isActive) {
      startResearch()
    } else if (!state.searchEnabled && state.isActive) {
      stopResearch()
    }
  }, [state.searchEnabled, state.isActive, startResearch, stopResearch])

  // Log state changes in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Research State:', {
        isActive: state.isActive,
        searchEnabled: state.searchEnabled,
        depth: state.depth,
        activity: state.activity.length,
        sources: state.sources.length,
        progress: `${state.completedSteps}/${state.totalExpectedSteps}`
      })
    }
  }, [
    state.isActive,
    state.searchEnabled,
    state.depth.current,
    state.depth.max,
    state.activity.length,
    state.sources.length,
    state.completedSteps,
    state.totalExpectedSteps
  ])

  return null // This is a logic-only component
} 