'use client'

import { ResearchDiffView } from '@/components/research-diff-view'
import { useDeepResearchProgress } from '@/lib/hooks/use-deep-research'
import { ResearchDiffSystem, type VisualizationData } from '@/lib/utils/research-diff'
import { extractSearchSources } from '@/lib/utils/search'
import { type SearchResultItem, type SearchSource, type SearchResults as TypeSearchResults } from '@/types/search'
import { type Message } from 'ai'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import * as React from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { useDeepResearch } from './deep-research-provider'
import { SearchSkeleton } from './default-skeleton'
import { RankedSearchResults } from './ranked-search-results'
import { Button } from './ui/button'

interface ToolInvocation {
  state: string
  result?: TypeSearchResults
  args?: {
    query?: string
    includeDomains?: string[]
  }
  toolCallId?: string
}

interface ExtendedMessage extends Message {
  searchSources?: SearchSource[]
}

interface SearchSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  messages: ExtendedMessage[]
  setMessages: (messages: ExtendedMessage[]) => void
  chatId: string
}

export function SearchSection({
  tool,
  isOpen,
  onOpenChange,
  messages,
  setMessages,
  chatId
}: SearchSectionProps) {
  const { state, addActivity, addSource, setDepth } = useDeepResearch()
  const { currentDepth } = state
  const { shouldContinueResearch, nextDepth, maxDepth } = useDeepResearchProgress(currentDepth, 7, chatId)
  const activityAddedRef = React.useRef<{[key: string]: boolean}>({})
  const sourcesProcessedRef = React.useRef<{[key: string]: boolean}>({})
  const [showRankedAnalysis, setShowRankedAnalysis] = React.useState(false)
  const [previousResults, setPreviousResults] = React.useState<SearchResultItem[]>([])
  const diffSystemRef = React.useRef<ResearchDiffSystem>(new ResearchDiffSystem())
  const [diffVisualization, setDiffVisualization] = React.useState<VisualizationData | null>(null)

  // Tool and search state
  const isToolLoading = tool.state === 'call'
  const searchResults: TypeSearchResults | undefined = 
    tool.state === 'result' ? tool.result : undefined
  const query = tool.args?.query as string | undefined
  const includeDomains = tool.args?.includeDomains as string[] | undefined
  const includeDomainsString = includeDomains
    ? ` [${includeDomains.join(', ')}]`
    : ''

  // Process search results and update sources
  React.useEffect(() => {
    if (!searchResults?.results || searchResults.results.length === 0) return

    // Extract and process sources
    const sources = extractSearchSources(searchResults.results)
    
    // Update message with sources
    const message = messages.find(m => m.id === tool.toolCallId)
    if (message && !sourcesProcessedRef.current[message.id]) {
      sourcesProcessedRef.current[message.id] = true

      // Create new messages array with updated message
      const updatedMessages: ExtendedMessage[] = messages.map(msg => {
        if (msg.id === message.id) {
          return {
            ...msg,
            searchSources: sources
          }
        }
        return msg
      })

      setMessages(updatedMessages)
    }

    // Track changes and update visualization
    const metrics = diffSystemRef.current.trackChanges(searchResults.results)
    const diffs = diffSystemRef.current.compareResults(previousResults, searchResults.results)
    const visualization = diffSystemRef.current.visualizeDiffs(diffs)
    
    setDiffVisualization(visualization)
    setPreviousResults(searchResults.results)

    // Add activity for significant changes
    if (metrics.newInsights > 0 || metrics.refinements > 0) {
      addActivity({
        type: 'analyze',
        status: 'complete',
        message: `Found ${metrics.newInsights} new insights and ${metrics.refinements} refinements`,
        timestamp: new Date().toISOString(),
        depth: currentDepth
      })
    }
  }, [searchResults, messages, tool.toolCallId, addActivity, currentDepth, setMessages])

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          Search Results{includeDomainsString}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowRankedAnalysis(!showRankedAnalysis)}
        >
          {showRankedAnalysis ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <CollapsibleMessage
        role="assistant"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        header={header}
        className="overflow-hidden"
      >
        {isToolLoading ? (
          <SearchSkeleton />
        ) : searchResults ? (
          <div className="space-y-6">
            {showRankedAnalysis ? (
              <RankedSearchResults
                results={searchResults.results}
                query={query}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.results.map((result, index) => (
                  <motion.div
                    key={result.url + index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full"
                    >
                      <div className="h-full p-4 rounded-lg border hover:border-blue-500 transition-all duration-200 hover:shadow-md bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          {result.favicon && (
                            <img
                              src={result.favicon}
                              alt=""
                              className="w-4 h-4 rounded-sm"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement
                                img.style.display = 'none'
                              }}
                            />
                          )}
                          <h3 className="font-medium line-clamp-2 leading-tight">
                            {result.title}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {result.content}
                          </p>
                          {result.publishedDate && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(result.publishedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Research Progress */}
            {diffVisualization && (
              <ResearchDiffView
                diffResult={diffSystemRef.current.compareResults(previousResults, searchResults.results)}
                visualization={diffVisualization}
                className="mt-6 border-t pt-6"
              />
            )}
          </div>
        ) : null}
      </CollapsibleMessage>
    </div>
  )
}
