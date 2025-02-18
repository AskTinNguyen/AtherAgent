'use client'

import { type ReactNode, useCallback } from 'react'
import { ResearchActivityProvider } from './research-activity-context'
import { useResearch } from './research-context'
import { DepthProvider } from './research-depth-context'

interface ResearchProviderProps {
  children: ReactNode
  chatId: string
  onClearStateChange?: (chatId: string, isCleared: boolean) => Promise<void>
  initialClearedState?: boolean
  onDepthChange?: (chatId: string, currentDepth: number, maxDepth: number) => Promise<void>
}

export function ResearchProvider({
  children,
  chatId,
  onClearStateChange,
  initialClearedState = false,
  onDepthChange
}: ResearchProviderProps) {
  const { 
    state,
    addActivity: handleAddActivity,
    addSource: handleAddSource,
    setDepth: handleSetDepth
  } = useResearch()

  const handleDepthChange = useCallback((current: number, max: number) => {
    handleSetDepth(current, max)
    onDepthChange?.(chatId, current, max)
  }, [chatId, handleSetDepth, onDepthChange])

  return (
    <DepthProvider
      onDepthChange={handleDepthChange}
    >
      <ResearchActivityProvider
        onAddActivity={handleAddActivity}
        onSetDepth={(depth: number) => handleSetDepth(depth, state.depth.max)}
      >
        {children}
      </ResearchActivityProvider>
    </DepthProvider>
  )
}

// Re-export hooks for convenience
export { useResearchActivity } from './research-activity-context'
export { useDepth } from './research-depth-context'
// Mark as deprecated but keep for backward compatibility
/** @deprecated Use useResearch() from research-context instead */
export { useSources } from './research-sources-context'

