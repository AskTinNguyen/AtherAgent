import * as Tabs from '@radix-ui/react-tabs'
import { Layers } from 'lucide-react'
import { type ResearchActivity, type ResearchMemory, type ResearchSource, type SourceMetrics } from '../deep-research-provider'
import { ResearchHistoryTimeline } from '../research-history-timeline'
import { ResearchPathVisualization } from '../research-path-visualization'
import { ResearchSuggestions } from '../research-suggestions'

interface ResearchTabsProps {
  activity: ResearchActivity[]
  sources: ResearchSource[]
  chatId: string
  onSuggestionSelect?: (content: string) => void
  currentDepth: number
  maxDepth: number
  researchMemory: ResearchMemory[]
  sourceMetrics: SourceMetrics[]
}

const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter((c): c is string => typeof c === 'string').join(' ')

export function ResearchTabs({ 
  activity, 
  sources, 
  chatId, 
  onSuggestionSelect,
  currentDepth,
  maxDepth,
  researchMemory,
  sourceMetrics
}: ResearchTabsProps) {
  // Add debug logging
  console.log('ResearchTabs Props:', {
    activity,
    currentDepth,
    maxDepth,
    researchMemory,
    sourceMetrics
  })

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
        className="flex-1 overflow-y-auto"
      >
        <ResearchPathVisualization 
          activity={activity}
          currentDepth={currentDepth}
          maxDepth={maxDepth}
          researchMemory={researchMemory}
          sourceMetrics={sourceMetrics}
        />
      </Tabs.Content>

      <Tabs.Content 
        value="activity" 
        className="flex-1 overflow-y-auto"
      >
        <div className="space-y-4">
          {[...activity].reverse().map((item, index) => (
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
          {sources.map((source, index) => (
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
        <ResearchSuggestions chatId={chatId} onSuggestionSelect={onSuggestionSelect} />
      </Tabs.Content>

      <Tabs.Content 
        value="history" 
        className="flex-1 overflow-y-auto"
      >
        <ResearchHistoryTimeline />
      </Tabs.Content>
    </Tabs.Root>
  )
} 