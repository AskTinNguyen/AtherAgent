'use client'

import { ResearchActivityProvider } from '@/lib/contexts/research-activity-context'
import { useResearch } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ErrorBoundary } from './shared/error-boundary'
import { Button } from './ui/button'
import { ResearchCommandCenter } from './visualization/research-command-center'

export function DeepResearchVisualization({
  location,
  chatId,
  initialClearedState = false,
  onClearStateChange,
  onSuggestionSelect
}: {
  location: 'sidebar' | 'header'
  chatId: string
  initialClearedState?: boolean
  onClearStateChange?: (chatId: string, isCleared: boolean) => Promise<void>
  onSuggestionSelect?: (query: string) => void
}) {
  const { state, clearState } = useResearch()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Handle initialization and state clearing
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
      
      // Handle initial cleared state
      if (initialClearedState && !state.isActive) {
        clearState()
      }
    }
  }, [clearState, initialClearedState, state.isActive, isInitialized])

  // Show panel when research becomes active
  useEffect(() => {
    if (state.isActive && isCollapsed) {
      setIsCollapsed(false)
    }
  }, [state.isActive, isCollapsed])

  // Handle command bar toggle event
  useEffect(() => {
    const handleTogglePanel = () => {
      setIsVisible(prev => !prev)
    }

    document.addEventListener('toggle-research-panel', handleTogglePanel)
    return () => {
      document.removeEventListener('toggle-research-panel', handleTogglePanel)
    }
  }, [])

  const handleSetActive = useCallback((active: boolean) => {
    // Implementation depends on your needs
    console.log('Setting active state:', active)
  }, [])

  const handleInitProgress = useCallback((max: number, current: number) => {
    // Implementation depends on your needs
    console.log('Initializing progress:', { max, current })
  }, [])

  // Only hide if explicitly cleared
  if (initialClearedState) {
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

        {/* Chevron Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "fixed left-2 top-[calc(50vh-2rem)] rounded-full text-foreground/30 z-50",
            !state.isActive && "opacity-50"
          )}
        >
          <ChevronLeft 
            size={32} 
            className={cn(
              "glow-effect",
              isCollapsed && "rotate-180",
              state.isActive && "text-primary"
            )}
          />
        </Button>

        {/* Panel Container */}
        <div className={cn(
          'research-visualization',
          !isVisible && 'hidden',
          "fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out",
          location === 'sidebar' ? 'hidden lg:block' : 'block lg:hidden',
          isCollapsed ? "w-0 opacity-0" : "w-[440px] opacity-100"
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