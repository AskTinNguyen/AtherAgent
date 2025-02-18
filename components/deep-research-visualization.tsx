'use client'

import { ResearchActivityProvider } from '@/lib/contexts/research-activity-context'
import { useResearch } from '@/lib/contexts/research-context'
import { usePanelCollapse } from '@/lib/hooks/use-panel-collapse'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ErrorBoundary } from './shared/error-boundary'
import { PanelControls } from './visualization/panel-controls'
import { ResearchCommandCenter } from './visualization/research-command-center'

interface DeepResearchVisualizationProps {
  location: 'sidebar' | 'header'
  chatId: string
  initialClearedState?: boolean
  onClearStateChange?: (chatId: string, isCleared: boolean) => Promise<void>
  onSuggestionSelect?: (content: string) => void
}

function DeepResearchVisualizationContent({
  location,
  chatId,
  initialClearedState = false,
  onClearStateChange,
  onSuggestionSelect
}: DeepResearchVisualizationProps) {
  const { state, clearState } = useResearch()
  const [isInitialized, setIsInitialized] = useState(false)
  const pathname = usePathname()

  const { isCollapsed, toggleCollapse } = usePanelCollapse({
    chatId,
    isActive: state.isActive
  })

  // Handle initialization and state clearing once on mount
  useEffect(() => {
    // Only run initialization once
    if (initialClearedState && !state.isActive) {
      clearState()
    }
    setIsInitialized(true)
  }, []) // Empty deps since this should only run once on mount

  const handleSetActive = useCallback((active: boolean) => {
    console.log('Setting active state:', active)
  }, [])

  const handleInitProgress = useCallback((max: number, current: number) => {
    console.log('Initializing progress:', { max, current })
  }, [])

  // Check if we're in a chat session
  const isInChatSession = pathname.startsWith('/search/') || chatId !== 'global'

  // Only show in chat sessions and when not explicitly cleared
  if (!isInChatSession || initialClearedState) {
    return null
  }

  return (
    <ErrorBoundary>
      <ResearchActivityProvider>
        <style jsx global>{`
          @keyframes glow {
            0%, 100% { 
              opacity: 0.3;
              filter: brightness(1);
            }
            50% { 
              opacity: 1;
              filter: brightness(1.5) drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
            }
          }
          .glow-effect {
            animation: glow 2s ease-in-out infinite;
          }
        `}</style>

        <PanelControls
          isActive={state.isActive}
          isCollapsed={isCollapsed}
          onToggle={toggleCollapse}
        />

        {/* Panel Container */}
        <div className={cn(
          "fixed top-14 bottom-0 left-0 z-30 transition-all duration-300 ease-in-out",
          // Desktop: Show panel and handle collapse
          "hidden lg:block",
          isCollapsed ? "lg:w-0 lg:opacity-0" : "lg:w-[440px] lg:opacity-100",
          // Mobile: Full width when shown
          "w-full md:w-[440px]"
        )}>
          <ResearchCommandCenter
            location={location}
            chatId={chatId}
            state={state}
            onClearState={clearState}
            onSetActive={handleSetActive}
            onInitProgress={handleInitProgress}
            initialClearedState={initialClearedState}
            onClearStateChange={onClearStateChange}
            onSuggestionSelect={onSuggestionSelect}
            isCollapsed={isCollapsed}
          />
        </div>
      </ResearchActivityProvider>
    </ErrorBoundary>
  )
}

// Export a wrapped version that ensures ResearchProvider context is available
export function DeepResearchVisualization(props: DeepResearchVisualizationProps) {
  return <DeepResearchVisualizationContent {...props} />
} 