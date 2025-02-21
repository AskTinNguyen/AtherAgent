'use client'

import { useResearch } from '@/lib/contexts/research-context'
import { usePanelCollapse } from '@/lib/hooks/use-panel-collapse'
import { type ResearchState as DeepResearchState } from '@/lib/types/deep-research'
import { type ResearchSuggestion } from '@/lib/types/research-enhanced'
import { cn } from '@/lib/utils'
import { Lightbulb, Star } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from './shared/error-boundary'
import { Card } from './ui/card'
import { PanelControls } from './visualization/panel-controls'
import { ResearchCommandCenter } from './visualization/research-command-center'

interface DeepResearchVisualizationProps {
  location: 'sidebar' | 'header'
  chatId: string
  initialClearedState?: boolean
  onClearStateChange?: (chatId: string, isCleared: boolean) => Promise<void>
  onSuggestionSelect?: (content: string) => void
}

// Helper function to convert between state types
function convertToDeepResearchState(state: any): DeepResearchState {
  return {
    ...state,
    currentDepth: state.depth.current,
    maxDepth: state.depth.max,
    depthConfig: state.depth.config,
    researchMemory: [],
    gateStatus: {
      currentGate: 0,
      gateResults: {}
    },
    iterationMetrics: {
      startTime: Date.now(),
      repetitionCount: 0,
      toolCallCounts: {},
      failedAttempts: {}
    },
    researchProgress: {
      currentStage: 'initial',
      stageProgress: 0,
      remainingQuestions: []
    }
  }
}

function SuggestionCard({ suggestion, onSelect }: { 
  suggestion: ResearchSuggestion
  onSelect: (suggestion: ResearchSuggestion) => void 
}) {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-colors hover:bg-muted/50",
        "flex flex-col gap-2"
      )}
      onClick={() => onSelect(suggestion)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium capitalize">
            {suggestion.type.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">
            {Math.round(suggestion.confidence * 100)}%
          </span>
        </div>
      </div>
      
      <p className="text-sm">{suggestion.content}</p>
      
      {suggestion.metadata.related_topics && (
        <div className="flex flex-wrap gap-1 mt-2">
          {suggestion.metadata.related_topics.map((topic: string) => (
            <span
              key={topic}
              className="px-2 py-1 text-xs bg-muted rounded-full"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

function DeepResearchVisualizationContent({
  location,
  chatId,
  initialClearedState = false,
  onClearStateChange,
  onSuggestionSelect
}: DeepResearchVisualizationProps) {
  const { 
    state, 
    clearState, 
    loadSuggestions, 
    markSuggestionUsed 
  } = useResearch()
  
  const [isLoading, setIsLoading] = useState(false)
  const hasInitialized = useRef(false)
  const pathname = usePathname()

  const { isCollapsed, toggleCollapse } = usePanelCollapse({
    chatId,
    isActive: state.isActive
  })

  // Handle initialization and state clearing once on mount
  useEffect(() => {
    const initializeSuggestions = async () => {
      if (!hasInitialized.current && chatId) {
        hasInitialized.current = true
        
        if (initialClearedState && !state.isActive) {
          clearState()
        }

        try {
          setIsLoading(true)
          await loadSuggestions(chatId)
        } catch (error) {
          console.error('Failed to load suggestions:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    initializeSuggestions()
  }, [chatId]) // Only depend on chatId to prevent loops

  const handleSetActive = useCallback((active: boolean) => {
    console.log('Setting active state:', active)
  }, [])

  const handleInitProgress = useCallback((max: number, current: number) => {
    console.log('Initializing progress:', { max, current })
  }, [])

  const handleSuggestionSelect = useCallback(async (suggestion: ResearchSuggestion) => {
    try {
      await markSuggestionUsed(suggestion.id)
      onSuggestionSelect?.(suggestion.content)
    } catch (error) {
      console.error('Error handling suggestion selection:', error)
    }
  }, [markSuggestionUsed, onSuggestionSelect])

  // Check if we're in a chat session
  const isInChatSession = pathname.startsWith('/search/') || chatId !== 'global'

  // Only show in chat sessions, when not explicitly cleared, and when search is enabled
  if (!isInChatSession || initialClearedState || !state.searchEnabled) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="research-visualization">
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
            state={convertToDeepResearchState(state)}
            onClearState={clearState}
            onSetActive={handleSetActive}
            onInitProgress={handleInitProgress}
            initialClearedState={initialClearedState}
            onClearStateChange={onClearStateChange}
            onSuggestionSelect={onSuggestionSelect}
            isCollapsed={isCollapsed}
          />

          {/* Suggestions Section */}
          {!isCollapsed && (
            <div className="mt-4 px-4 space-y-2">
              <h3 className="text-sm font-medium">Research Suggestions</h3>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading suggestions...</div>
                ) : state.suggestions.length > 0 ? (
                  state.suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onSelect={handleSuggestionSelect}
                    />
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No suggestions available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

// Export a wrapped version that ensures ResearchProvider context is available
export function DeepResearchVisualization(props: DeepResearchVisualizationProps) {
  return <DeepResearchVisualizationContent {...props} />
}