'use client'

import * as Tabs from '@radix-ui/react-tabs'
import { ChevronLeft, ChevronRight, Layers, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDeepResearch } from './deep-research-provider'
import { ResearchHistoryTimeline } from './research-history-timeline'
import { ResearchPathVisualization } from './research-path-visualization'
import { ResearchSuggestions } from './research-suggestions'

type DeepResearchVisualizationProps = {
  location: 'sidebar' | 'header'
  chatId: string
  onClearStateChange?: (chatId: string, isCleared: boolean) => Promise<void>
  initialClearedState?: boolean
  onSuggestionSelect?: (content: string) => void
}

const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter((c): c is string => typeof c === 'string').join(' ')

export function DeepResearchVisualization({ 
  location, 
  chatId,
  onClearStateChange,
  initialClearedState = false,
  onSuggestionSelect
}: DeepResearchVisualizationProps) {
  const { state, clearState, setActive, initProgress } = useDeepResearch()
  // Controls the width of the panel - when collapsed it's 48px (w-12), when expanded it's 541px
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [hasBeenCleared, setHasBeenCleared] = useState(initialClearedState)
  const {
    isActive,
    activity,
    sources,
    currentDepth,
    maxDepth,
    completedSteps,
    totalExpectedSteps,
  } = state

  const handleClearAll = useCallback(async () => {
    if (confirm('Are you sure you want to clear research history for this chat? This cannot be undone.')) {
      try {
        // Update database first
        if (onClearStateChange) {
          await onClearStateChange(chatId, true)
        }
        
        // Then update local state
        setActive(false)
        clearState()
        initProgress(7, 0)
        setHasBeenCleared(true)
        sessionStorage.setItem(`deepResearchCleared_${chatId}`, 'true')
      } catch (error) {
        console.error('Failed to clear research state:', error)
        alert('Failed to clear research history. Please try again.')
      }
    }
  }, [clearState, setActive, initProgress, chatId, onClearStateChange])

  // Effect to check cleared state when chatId changes
  useEffect(() => {
    const isChatCleared = initialClearedState || sessionStorage.getItem(`deepResearchCleared_${chatId}`) === 'true'
    setHasBeenCleared(isChatCleared)
  }, [chatId, initialClearedState])

  // Early return if this chat's research was cleared
  if (hasBeenCleared || (!isActive && activity.length === 0 && sources.length === 0)) {
    return null
  }

  // Only show content if we have data or research is active for this chat
  const hasContent = activity.length > 0 || sources.length > 0
  if (!hasContent && !isActive) {
    return null
  }

  // Deduplicate activity items based on timestamp, message, and depth
  const uniqueActivity = activity.reduce<typeof activity>((acc, item) => {
    const isDuplicate = acc.some(
      existing => 
        existing.timestamp === item.timestamp && 
        existing.message === item.message &&
        existing.depth === item.depth
    )
    if (!isDuplicate) {
      acc.push(item)
    }
    return acc
  }, [])

  // Deduplicate sources based on URL and relevance
  const uniqueSources = sources.reduce<typeof sources>((acc, item) => {
    const isDuplicate = acc.some(
      existing => 
        existing.url === item.url && 
        existing.relevance === item.relevance
    )
    if (!isDuplicate) {
      acc.push(item)
    }
    return acc
  }, [])

  return (
    <div className={location === 'header' ? 'block lg:hidden' : 'hidden lg:block'}>
      <div className={cn(
        "fixed bg-background transition-all duration-200",
        isFullScreen 
          ? "inset-0 z-50" 
          : "top-14 h-[calc(100vh-3.5rem)]",
        location === 'sidebar' ? "left-0 border-r" : "right-0 border-l",
        isCollapsed ? "w-9" : isFullScreen ? "w-full" : "w-[440px]"
      )}>
        {/* Collapse and Fullscreen Toggle Buttons */}
        <div className="absolute z-20 flex flex-col gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-2 rounded-full border bg-background hover:bg-accent",
              location === 'sidebar' 
                ? "-right-4 top-[calc(50vh-7rem)]" 
                : "-left-4 top-[calc(50vh-7rem)]"
            )}
          >
            {location === 'sidebar' 
              ? (isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)
              : (isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)
            }
          </button>
          {!isCollapsed && (
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className={cn(
                "p-2 rounded-full border bg-background hover:bg-accent",
                location === 'sidebar' 
                  ? "-right-4 top-[calc(50vh-4rem)]" 
                  : "-left-4 top-[calc(50vh-4rem)]"
              )}
              title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
              {isFullScreen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20H5a2 2 0 01-2-2v-4m14 6h4a2 2 0 002-2v-4M5 4h4M15 4h4a2 2 0 012 2v4M5 16v4m14-4v4" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0-4l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className={cn(
          "h-full overflow-hidden transition-all duration-200",
          isCollapsed ? "opacity-0 invisible" : "opacity-100 visible p-4"
        )}>
          {/* Research Status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                'size-2 rounded-full',
                isActive ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <span className="text-sm font-medium">
                {isActive ? 'Research Active' : 'Research Inactive'}
              </span>
            </div>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
              title="Clear all research history"
            >
              <Trash2 className="h-3 w-3" />
              Clear All
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-4">
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ 
                  width: `${(completedSteps / totalExpectedSteps) * 100}%` 
                }}
              />
            </div>
          </div>

          <Tabs.Root defaultValue="activity" className="h-[calc(100vh-11rem)] flex flex-col">
            <Tabs.List className="flex w-full border-b mb-2">
              <Tabs.Trigger
                value="path"
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors"
              >
                Path
              </Tabs.Trigger>
              <Tabs.Trigger
                value="activity"
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors"
              >
                Activity
              </Tabs.Trigger>
              <Tabs.Trigger
                value="sources"
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors"
              >
                Sources
              </Tabs.Trigger>
              <Tabs.Trigger
                value="suggestions"
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors"
              >
                Suggestions
              </Tabs.Trigger>
              <Tabs.Trigger
                value="history"
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-colors"
              >
                History
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content 
              value="path" 
              className="flex-1 overflow-y-auto"
            >
              <ResearchPathVisualization />
            </Tabs.Content>

            <Tabs.Content 
              value="activity" 
              className="flex-1 overflow-y-auto"
            >
              <div className="space-y-4">
                {[...uniqueActivity].reverse().map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                  >
                    {item.type === 'search' ? (
                      <div className="flex items-center gap-1 shrink-0 mt-1">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium text-primary">{item.depth}</span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'size-2 rounded-full shrink-0 mt-1.5',
                          item.status === 'pending' && 'bg-yellow-500',
                          item.status === 'complete' && 'bg-green-500',
                          item.status === 'error' && 'bg-red-500',
                        )}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                        {item.type === 'search' 
                          ? item.message.replace(/^Depth \d+: /, '') // Remove the "Depth X: " prefix
                          : item.message
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Content>

            <Tabs.Content 
              value="sources" 
              className="flex-1 overflow-y-auto"
            >
              <div className="space-y-4">
                {uniqueSources.map((source, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-1"
                  >
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline break-words"
                    >
                      {source.title}
                    </a>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground truncate">
                        {new URL(source.url).hostname}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Relevance: {Math.round(source.relevance * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Content>

            <Tabs.Content 
              value="suggestions" 
              className="flex-1 overflow-y-auto"
            >
              <ResearchSuggestions onSuggestionSelect={onSuggestionSelect} />
            </Tabs.Content>

            <Tabs.Content 
              value="history" 
              className="flex-1 overflow-y-auto"
            >
              <ResearchHistoryTimeline />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  )
} 