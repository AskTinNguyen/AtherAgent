'use client'

import { SearchHeader } from '@/components/search/search-header'
import { SearchResultsGrid } from '@/components/search/search-results-grid'
import { useActivity, useDepth, useSources } from '@/lib/contexts/research-provider'
import { ResearchDiffSystem, type VisualizationData } from '@/lib/utils/research-diff'
import { extractSearchSources } from '@/lib/utils/search'
import { type SearchResultItem, type SearchSource, type SearchResults as TypeSearchResults } from '@/types/search'
import { type Message } from 'ai'
import { BarChart, Grid2X2, Image as ImageIcon } from 'lucide-react'
import * as React from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { RankedSearchResults } from './ranked-search-results'
import { SearchResultsImageSection } from './search-results-image'
import {
  RankedResultsSkeleton,
  SearchResultsGridSkeleton,
  SearchResultsImageSkeleton
} from './skeletons'
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
  const isLoading = tool.state === 'call'
  const searchResults = tool.state === 'result' ? tool.result : undefined
  const query = tool.args?.query
  const includeDomains = tool.args?.includeDomains

  const { state: sourcesState, addSource } = useSources()
  const { state: activityState, addActivity } = useActivity()
  const { state: depthState, optimizeDepth } = useDepth()

  const [viewMode, setViewMode] = React.useState<'grid' | 'ranked' | 'image'>('grid')
  const [showDiff, setShowDiff] = React.useState(true)
  const [showRankedAnalysis, setShowRankedAnalysis] = React.useState(false)
  const [previousResults, setPreviousResults] = React.useState<SearchResultItem[]>([])
  const diffSystemRef = React.useRef<ResearchDiffSystem>(new ResearchDiffSystem())
  const [diffVisualization, setDiffVisualization] = React.useState<VisualizationData | null>(null)

  const includeDomainsString = React.useMemo(() => 
    includeDomains ? ` [${includeDomains.join(', ')}]` : '', 
    [includeDomains]
  )

  // Memoized helper functions
  const extractAndProcessSources = React.useCallback((searchResults: TypeSearchResults | undefined, messages: ExtendedMessage[], toolCallId: string | undefined) => {
    if (!searchResults?.results || searchResults.results.length === 0) return null
    
    const sources = extractSearchSources(searchResults.results)
    const message = messages.find(m => m.id === toolCallId)
    
    return { sources, message }
  }, [])

  // Local state
  const { currentDepth, maxDepth } = depthState
  const sourcesProcessedRef = React.useRef<{[key: string]: boolean}>({})

  // Memoized values
  const isToolLoading = React.useMemo(() => tool.state === 'call', [tool.state])

  // Memoized callbacks
  const handleToggleRankedAnalysis = React.useCallback(() => {
    setShowRankedAnalysis(prev => !prev)
  }, [])

  const handleOpenChange = React.useCallback((open: boolean) => {
    onOpenChange(open)
  }, [onOpenChange])

  // Process search results and update sources
  React.useEffect(() => {
    if (!searchResults) return

    const result = extractAndProcessSources(searchResults, messages, tool.toolCallId)
    if (!result) return
    
    const { sources, message } = result
    
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

      // Add sources to context
      sources.forEach(source => {
        const searchResult = searchResults.results.find(r => r.url === source.url)
        if (searchResult) {
          addSource({
            url: source.url,
            title: source.title,
            relevance: searchResult.relevance || 0,
            content: source.content,
            query: query,
            publishedDate: source.publishedDate
          })
        }
      })
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

    // Optimize depth based on new metrics
    optimizeDepth(sourcesState.sourceMetrics)
  }, [searchResults, messages, tool.toolCallId, query, addSource, currentDepth, addActivity, optimizeDepth, sourcesState.sourceMetrics, previousResults, extractAndProcessSources])

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      header={<SearchHeader 
        showRankedAnalysis={showRankedAnalysis}
        onToggleRankedAnalysis={() => setShowRankedAnalysis(!showRankedAnalysis)}
        includeDomainsString={includeDomainsString}
      />}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-6">
        {/* View Mode Controls */}
        <div className="flex gap-2 justify-end">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid2X2 className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'ranked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('ranked')}
          >
            <BarChart className="w-4 h-4 mr-2" />
            Ranked
          </Button>
          <Button
            variant={viewMode === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('image')}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Images
          </Button>
        </div>

        {/* Search Results */}
        {isLoading ? (
          viewMode === 'grid' ? (
            <SearchResultsGridSkeleton />
          ) : viewMode === 'ranked' ? (
            <RankedResultsSkeleton />
          ) : (
            <SearchResultsImageSkeleton />
          )
        ) : searchResults?.results ? (
          <>
            {viewMode === 'grid' && (
              <SearchResultsGrid results={searchResults.results} />
            )}
            {viewMode === 'ranked' && (
              <RankedSearchResults 
                results={searchResults.results}
                query={query}
                showMetrics={true}
              />
            )}
            {viewMode === 'image' && searchResults.images && (
              <SearchResultsImageSection 
                images={searchResults.images}
                query={query}
              />
            )}
          </>
        ) : null}
      </div>
    </CollapsibleMessage>
  )
}
