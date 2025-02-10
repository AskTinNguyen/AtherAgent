'use client'

import type { ExtendedMessage, SearchResultItem, SearchResults as TypeSearchResults } from '@/lib/types'
import { extractSearchSources } from '@/lib/utils/search'
import { ToolInvocation } from 'ai'
import { Eye, EyeOff } from 'lucide-react'
import React from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { useDeepResearch, useDeepResearchProgress } from './deep-research-provider'
import { SearchSkeleton } from './default-skeleton'
import { RankedSearchResults } from './ranked-search-results'
import { SearchResults } from './search-results'
import { SearchResultsImageSection } from './search-results-image'
import { Section, ToolArgsSection } from './section'
import { Button } from './ui/button'

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

  // Tool and search state
  const isToolLoading = tool.state === 'call'
  const searchResults: TypeSearchResults | undefined = 
    tool.state === 'result' ? tool.result : undefined
  const query = tool.args?.query as string | undefined
  const includeDomains = tool.args?.includeDomains as string[] | undefined
  const includeDomainsString = includeDomains
    ? ` [${includeDomains.join(', ')}]`
    : ''

  // Helper function to calculate relevance score
  const calculateRelevance = React.useCallback((result: { title: string; content?: string }, query: string | undefined): number => {
    if (!query) return 0.5
    
    const queryTerms = query.toLowerCase().split(' ')
    const titleMatch = queryTerms.filter(term => 
      result.title.toLowerCase().includes(term)
    ).length / queryTerms.length
    
    const contentMatch = result.content 
      ? queryTerms.filter(term => 
          result.content?.toLowerCase().includes(term)
        ).length / queryTerms.length
      : 0
    
    return (titleMatch * 0.6 + contentMatch * 0.4)
  }, [])

  // Process search results (sources and messages)
  const processSearchResults = React.useCallback(async () => {
    if (!query || tool.state !== 'result' || !searchResults?.results) return
    
    const resultsKey = `${tool.toolCallId}-results`
    if (sourcesProcessedRef.current[resultsKey]) return
    
    try {
      // Consolidate all search results including direct URLs
      const allResults: SearchResultItem[] = [
        ...searchResults.results,
        ...(searchResults.directUrls || []).map((url: string) => ({
          url,
          title: 'Direct Source',
          snippet: 'Direct source reference',
          content: undefined
        }))
      ]

      // Add sources to Deep Research context
      const sourcesToAdd = allResults.map(result => ({
        url: result.url,
        title: result.title,
        relevance: calculateRelevance({
          title: result.title,
          content: result.content
        }, query),
        timestamp: Date.now()
      }))

      // Add all sources in one batch operation
      await Promise.all(sourcesToAdd.map(source => addSource(source)))

      // Update message with search sources
      const message = messages.find(msg => 
        msg.toolInvocations?.some(t => t.toolCallId === tool.toolCallId)
      )

      if (message) {
        const searchSources = extractSearchSources(
          allResults,
          message.id,
          query
        )
        
        // Create new messages array with updated message
        const updatedMessages: ExtendedMessage[] = messages.map(msg => {
          if (msg.id === message.id) {
            // Create updated message with search sources
            const updatedMessage: ExtendedMessage = {
              ...msg,
              searchSources
            }
            return updatedMessage
          }
          return msg
        })
        
        // Update messages state
        setMessages(updatedMessages)
      }

      // Mark as processed
      sourcesProcessedRef.current[resultsKey] = true

      // Handle research continuation
      if (shouldContinueResearch) {
        const analysisKey = `${tool.toolCallId}-analysis`
        if (!activityAddedRef.current[analysisKey]) {
          addActivity({
            type: 'analyze',
            status: 'pending',
            message: 'Analyzing results to determine next research direction...',
            timestamp: new Date().toISOString(),
            depth: currentDepth
          })
          activityAddedRef.current[analysisKey] = true
          setDepth(nextDepth, maxDepth)
        }
      }
    } catch (error) {
      console.error('Error processing search results:', error)
    }
  }, [
    query,
    tool.state,
    tool.toolCallId,
    searchResults,
    addSource,
    calculateRelevance,
    messages,
    setMessages,
    shouldContinueResearch,
    addActivity,
    currentDepth,
    nextDepth,
    maxDepth,
    setDepth
  ])

  // Track search activities
  React.useEffect(() => {
    if (!query) return

    const activityKey = `${tool.toolCallId}-${tool.state}`
    if (activityAddedRef.current[activityKey]) return

    if (tool.state === 'call') {
      addActivity({
        type: 'search',
        status: 'pending',
        message: `Depth ${currentDepth}: Searching for: ${query}`,
        timestamp: new Date().toISOString(),
        depth: currentDepth
      })
      activityAddedRef.current[activityKey] = true
    } else if (tool.state === 'result') {
      addActivity({
        type: 'search',
        status: 'complete',
        message: `Depth ${currentDepth}: Found ${searchResults?.results?.length ?? 0} results for: ${query}`,
        timestamp: new Date().toISOString(),
        depth: currentDepth
      })
      activityAddedRef.current[activityKey] = true
    }
  }, [tool.state, tool.toolCallId, query, currentDepth, addActivity, searchResults?.results?.length])

  // Process results when available
  React.useEffect(() => {
    processSearchResults()
  }, [processSearchResults])

  // Update previous results when new results come in
  React.useEffect(() => {
    if (searchResults?.results && searchResults.results.length > 0) {
      setPreviousResults(prevResults => {
        // Only update if the results are different
        const currentUrls = new Set(searchResults.results.map(r => r.url))
        const prevUrls = new Set(prevResults.map(r => r.url))
        const hasChanges = 
          currentUrls.size !== prevUrls.size || 
          ![...currentUrls].every(url => prevUrls.has(url))
        return hasChanges ? prevResults : searchResults.results
      })
    }
  }, [searchResults?.results])

  const header = (
    <ToolArgsSection
      tool="search"
      number={searchResults?.results?.length}
    >{`${query}${includeDomainsString}`}</ToolArgsSection>
  )

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      header={header}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      {searchResults?.images && searchResults.images.length > 0 && (
        <Section>
          <SearchResultsImageSection
            images={searchResults.images}
            query={query ?? ''}
          />
        </Section>
      )}
      {isToolLoading ? (
        <SearchSkeleton />
      ) : searchResults && searchResults.results ? (
        <>
          <div className="flex items-center justify-between gap-2 mb-4 px-1">
            <h2 className="text-sm font-medium">Sources</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRankedAnalysis(!showRankedAnalysis)}
              className="text-muted-foreground hover:text-foreground rounded-md h-8"
            >
              {showRankedAnalysis ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Analysis
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Analysis
                </>
              )}
            </Button>
          </div>

          {showRankedAnalysis ? (
            <RankedSearchResults
              results={searchResults.results.map(result => ({
                ...result,
                metrics: {
                  relevanceScore: calculateRelevance({ 
                    title: result.title, 
                    content: result.content 
                  }, query),
                  depthLevel: currentDepth,
                  contentQuality: result.content ? 
                    Math.min((result.content.length / 1000) * 0.5 + 0.3, 1) : 0.3,
                  timeRelevance: 0.7,
                  sourceAuthority: 0.6
                },
                timestamp: Date.now()
              }))}
              currentDepth={currentDepth}
              maxDepth={maxDepth}
            />
          ) : (
            <SearchResults 
              results={searchResults.results}
              previousResults={previousResults}
              showDiff={true}
            />
          )}
        </>
      ) : null}
    </CollapsibleMessage>
  )
}
