'use client'

import { type ReactNode } from 'react'
import { ActivityProvider } from './research-activity-context'
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
    <ActivityProvider>
      <SourcesProvider>
        <DepthProvider>
          {children}
        </DepthProvider>
      </SourcesProvider>
    </ActivityProvider>
  )
}

// Re-export hooks for convenience
export { useActivity } from './research-activity-context'
export { useDepth } from './research-depth-context'
export { useSources } from './research-sources-context'

