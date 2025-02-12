'use client'

import { cn } from '@/lib/utils'
import { useCallback, useState } from 'react'
import { type ResearchState } from '../deep-research-provider'
import { MetricsGrid } from './metrics-grid'
import { ResearchContent } from './research-content'
import { ResearchHeader } from './research-header'
import { ResearchTabs } from './research-tabs'

interface ResearchCommandCenterProps {
  location: 'sidebar' | 'header'
  chatId: string
  state: ResearchState
  onClearState: () => void
  onSetActive: (active: boolean) => void
  onInitProgress: (max: number, current: number) => void
  onClearStateChange?: (chatId: string, isCleared: boolean) => Promise<void>
  initialClearedState?: boolean
  onSuggestionSelect?: (content: string) => void
  isCollapsed: boolean
}

export function ResearchCommandCenter({
  location,
  chatId,
  state,
  onClearState,
  onSetActive,
  onInitProgress,
  onClearStateChange,
  initialClearedState = false,
  onSuggestionSelect,
  isCollapsed
}: ResearchCommandCenterProps) {
  const [isFullScreen, setIsFullScreen] = useState(false)

  const handleClearAll = useCallback(async () => {
    if (!confirm('Are you sure you want to clear research history for this chat? This cannot be undone.')) 
      return

    try {
      if (onClearStateChange) {
        await onClearStateChange(chatId, true)
      }
      
      onSetActive(false)
      onClearState()
      onInitProgress(7, 0)
      sessionStorage.setItem(`deepResearchCleared_${chatId}`, 'true')
    } catch (error) {
      console.error('Failed to clear research state:', error)
      alert('Failed to clear research history. Please try again.')
    }
  }, [chatId, onClearState, onSetActive, onInitProgress, onClearStateChange])

  return (
    <div className={cn(
      "h-full bg-background transition-all duration-200 ease-in-out",
      !isCollapsed && "border-r shadow-lg",
      isFullScreen ? "w-full" : "w-[440px]",
      isCollapsed ? "w-0 opacity-0" : "opacity-100"
    )}>
      <div className={cn(
        "flex flex-col h-full",
        isCollapsed && "hidden"
      )}>
        <ResearchHeader 
          isActive={state.isActive}
          isCollapsed={isCollapsed}
          isFullScreen={isFullScreen}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
          onFullScreen={() => setIsFullScreen(!isFullScreen)}
          onClearAll={handleClearAll}
          location={location}
        />

        <div className="flex-1 overflow-y-auto">
          <MetricsGrid 
            currentDepth={state.currentDepth}
            maxDepth={state.maxDepth}
            completedSteps={state.completedSteps}
            totalExpectedSteps={state.totalExpectedSteps}
          />

          <ResearchContent 
            activity={state.activity}
            sources={state.sources}
          />

          <ResearchTabs
            activity={state.activity}
            sources={state.sources}
            chatId={chatId}
            onSuggestionSelect={onSuggestionSelect}
            currentDepth={state.currentDepth}
            maxDepth={state.maxDepth}
            researchMemory={state.researchMemory}
            sourceMetrics={state.sourceMetrics}
          />
        </div>
      </div>
    </div>
  )
} 