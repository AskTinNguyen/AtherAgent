'use client'

import { type ReactNode } from 'react'
import { ResearchActivityProvider } from './research-activity-context'
import { DepthProvider } from './research-depth-context'
import { SourcesProvider } from './research-sources-context'

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
  return (
    <ResearchActivityProvider>
      <SourcesProvider>
        <DepthProvider>
          {children}
        </DepthProvider>
      </SourcesProvider>
    </ResearchActivityProvider>
  )
}

// Re-export hooks for convenience
export { useActivity, useResearchContext } from './research-activity-context'
export { useDepth } from './research-depth-context'
export { useSources } from './research-sources-context'

