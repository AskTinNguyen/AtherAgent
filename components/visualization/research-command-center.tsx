'use client'

import { type ResearchState } from '@/lib/types/deep-research'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MetricsGrid } from './metrics-grid'
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

// Constants
const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const CHECK_INTERVAL = 60000 // Check every minute

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
  const lastUpdateTimeRef = useRef(Date.now())

  // Track state updates with ref to avoid unnecessary re-renders
  useEffect(() => {
    lastUpdateTimeRef.current = Date.now()
  }, [state])

  // Handle state clearing
  const handleClearAll = useCallback(async () => {
    onClearState()
    onSetActive(false)
    if (onClearStateChange) {
      await onClearStateChange(chatId, true)
    }
  }, [onClearState, onSetActive, onClearStateChange, chatId])

  // Auto-collapse when inactive for too long
  useEffect(() => {
    // Only set up inactivity check if state is active
    if (!state.isActive) return

    const checkInactivity = () => {
      const now = Date.now()
      if (now - lastUpdateTimeRef.current > INACTIVITY_TIMEOUT) {
        onSetActive(false)
      }
    }

    const interval = setInterval(checkInactivity, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [state.isActive, onSetActive])

  // Handle fullscreen toggle
  const handleFullScreenToggle = useCallback(() => {
    setIsFullScreen(prev => !prev)
  }, [])

  return (
    <div className={cn(
      "h-full bg-background transition-all duration-300 ease-in-out",
      !isCollapsed && "border-r shadow-lg",
      isFullScreen ? [
        "fixed top-16 left-0 right-0 bottom-0 z-50",
        "max-h-[calc(100vh-4rem)]"
      ] : "w-[440px]",
      isCollapsed ? "lg:w-0 lg:opacity-0" : "opacity-100"
    )}>
      <div className={cn(
        "flex flex-col h-full",
        isCollapsed && "lg:hidden"
      )}>
        <ResearchHeader 
          isActive={state.isActive}
          isCollapsed={isCollapsed}
          isFullScreen={isFullScreen}
          onCollapse={() => setIsFullScreen(false)}
          onFullScreen={handleFullScreenToggle}
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

          <ResearchTabs
            chatId={chatId}
            onSuggestionSelect={onSuggestionSelect}
            isFullScreen={isFullScreen}
          />
        </div>
      </div>
    </div>
  )
} 