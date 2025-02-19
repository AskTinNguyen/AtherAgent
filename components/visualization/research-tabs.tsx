import { useResearch } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import * as Tabs from '@radix-ui/react-tabs'
import { Layers } from 'lucide-react'
import { ResearchHistoryTimeline } from '../research-history-timeline'
import { ResearchSuggestions } from '../research-suggestions'
import { ResearchPathVisualization } from './research-path-visualization'

interface ResearchTabsProps {
  chatId: string
  onSuggestionSelect?: (content: string) => void
  isFullScreen?: boolean
}

export function ResearchTabs({ 
  chatId, 
  onSuggestionSelect,
  isFullScreen = false
}: ResearchTabsProps) {
  const { state } = useResearch()
  const { activity, sources } = state

  const tabContentClass = cn(
    "flex-1 overflow-y-auto transition-all duration-300",
    isFullScreen 
      ? "container mx-auto max-w-screen-2xl px-6 py-8"
      : "px-4 py-6"
  )

  return (
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
        className={tabContentClass}
      >
        <div className={cn(
          "h-full",
          isFullScreen && "max-w-screen-xl mx-auto"
        )}>
          <ResearchPathVisualization />
        </div>
      </Tabs.Content>

      <Tabs.Content 
        value="activity" 
        className={tabContentClass}
      >
        <div className={cn(
          "space-y-4",
          isFullScreen && "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 space-y-0"
        )}>
          {[...activity].reverse().map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              {item.type === 'search' ? (
                <div className="flex items-center gap-1.5 shrink-0 mt-1">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">{item.depth}</span>
                </div>
              ) : (
                <div
                  className={cn(
                    'size-2.5 rounded-full shrink-0 mt-2',
                    item.status === 'pending' && 'bg-yellow-500',
                    item.status === 'complete' && 'bg-green-500',
                    item.status === 'error' && 'bg-red-500',
                  )}
                />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm leading-relaxed text-foreground break-words whitespace-pre-wrap">
                  {item.type === 'search' 
                    ? item.message.replace(/^Depth \d+: /, '')
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
        className={tabContentClass}
      >
        <div className={cn(
          "space-y-4",
          isFullScreen && "grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 space-y-0"
        )}>
          {sources.map((source, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 p-4 rounded-lg hover:bg-muted/50 transition-colors border"
            >
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline break-words text-primary"
              >
                {source.title}
              </a>
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground truncate">
                  {new URL(source.url).hostname}
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Relevance: {Math.round(source.relevance * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Tabs.Content>

      <Tabs.Content 
        value="suggestions" 
        className={tabContentClass}
      >
        <ResearchSuggestions 
          chatId={chatId} 
          onSuggestionSelect={onSuggestionSelect}
          isFullScreen={isFullScreen}
        />
      </Tabs.Content>

      <Tabs.Content 
        value="history" 
        className={tabContentClass}
      >
        <div className={cn(
          "h-full",
          isFullScreen && "max-w-screen-xl mx-auto"
        )}>
          <ResearchHistoryTimeline />
        </div>
      </Tabs.Content>
    </Tabs.Root>
  )
} 