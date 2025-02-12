'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDeepResearch } from './deep-research-provider'
import { ErrorBoundary } from './shared/error-boundary'
import { Button } from './ui/button'
import { ResearchCommandCenter } from './visualization/research-command-center'

interface DeepResearchVisualizationProps {
  location: 'sidebar' | 'header'
  chatId: string
  onClearStateChange?: (chatId: string, isCleared: boolean) => Promise<void>
  initialClearedState?: boolean
  onSuggestionSelect?: (content: string) => void
}

export function DeepResearchVisualization({
  location,
  chatId,
  onClearStateChange,
  initialClearedState = false,
  onSuggestionSelect
}: DeepResearchVisualizationProps) {
  const { state, clearState, setActive, initProgress } = useDeepResearch()
  const [isCollapsed, setIsCollapsed] = useState(true) // Start collapsed

  // Add initialization effect
  useEffect(() => {
    // Initialize with inactive state and default progress
    setActive(false)
    initProgress(7, 0)
    
    console.log('DeepResearch: Initialized state')
  }, [setActive, initProgress])

  // Show panel when there's research activity
  useEffect(() => {
    if (state.activity.length > 0 && isCollapsed) {
      setIsCollapsed(false)
    }
  }, [state.activity.length, isCollapsed])

  // Hide if no activity or cleared
  if (initialClearedState || (!state.isActive && state.activity.length === 0)) {
    return null
  }

  return (
    <ErrorBoundary>
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

      {/* Chevron Button - Only show if there's activity */}
      {state.activity.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="fixed left-2 top-[calc(50vh-2rem)] rounded-full text-foreground/30 z-50"
        >
          <ChevronLeft 
            size={32} 
            className={cn(
              "glow-effect",
              isCollapsed && "rotate-180"
            )}
          />
        </Button>
      )}

      {/* Panel Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40",
        location === 'header' ? 'block lg:hidden' : 'hidden lg:block',
        isCollapsed && "w-0 pointer-events-none"
      )}>
        <ResearchCommandCenter
          location={location}
          chatId={chatId}
          state={state}
          onClearState={clearState}
          onSetActive={setActive}
          onInitProgress={initProgress}
          onClearStateChange={onClearStateChange}
          initialClearedState={initialClearedState}
          onSuggestionSelect={onSuggestionSelect}
          isCollapsed={isCollapsed}
        />
      </div>
    </ErrorBoundary>
  )
} 