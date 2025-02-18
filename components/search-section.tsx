'use client'

import { SearchHeader } from '@/components/search/search-header'
import { SearchResultsGrid } from '@/components/search/search-results-grid'
import {
  useActivity,
  useDepth,
  useSources
} from '@/lib/contexts/research-provider'
import { createClient } from '@/lib/supabase/client'
import { searchTool } from '@/lib/tools/search'
import {
  ResearchDiffSystem,
  type VisualizationData
} from '@/lib/utils/research-diff'
import { extractSearchSources } from '@/lib/utils/search'
import {
  type SearchResultItem,
  type SearchSource,
  type SearchResults as TypeSearchResults
} from '@/types/search'
import { type Message } from 'ai'
import { BarChart, Grid2X2, Image as ImageIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { RankedSearchResults } from './ranked-search-results'
import { SearchResultsImageSection } from './search-results-image'
import { StoredSearchResults } from './search/stored-search-results'
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

const STORAGE_KEY = 'search_results'

export function SearchSection({
  tool,
  isOpen,
  onOpenChange,
  messages,
  setMessages,
  chatId
}: SearchSectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q')

  const isLoading = tool.state === 'call'
  const searchResults = tool.state === 'result' ? tool.result : undefined
  const query = tool.args?.query
  const includeDomains = tool.args?.includeDomains

  const { state: sourcesState, addSource } = useSources()
  const { state: activityState, addActivity } = useActivity()
  const { state: depthState, optimizeDepth } = useDepth()

  const [viewMode, setViewMode] = React.useState<'grid' | 'ranked' | 'image'>(
    'grid'
  )
  const [showDiff, setShowDiff] = React.useState(true)
  const [showRankedAnalysis, setShowRankedAnalysis] = React.useState(false)
  const [previousResults, setPreviousResults] = React.useState<
    SearchResultItem[]
  >([])
  const diffSystemRef = React.useRef<ResearchDiffSystem>(
    new ResearchDiffSystem()
  )
  const [diffVisualization, setDiffVisualization] =
    React.useState<VisualizationData | null>(null)
  const sourcesProcessedRef = React.useRef<{ [key: string]: boolean }>({})

  const includeDomainsString = React.useMemo(
    () => (includeDomains ? ` [${includeDomains.join(', ')}]` : ''),
    [includeDomains]
  )

  // Split into separate effects for different concerns

  // 1. Process search results and update messages
  React.useEffect(() => {
    if (!searchResults?.results || !tool.toolCallId) return
    if (sourcesProcessedRef.current[tool.toolCallId]) return

    const sources = extractSearchSources(searchResults.results)
    const message = messages.find(m => m.id === tool.toolCallId)
    if (!message) return

    sourcesProcessedRef.current[tool.toolCallId] = true

    setMessages(
      messages.map(msg =>
        msg.id === message.id ? { ...msg, searchSources: sources } : msg
      )
    )
  }, [searchResults, tool.toolCallId, messages, setMessages])

  // 2. Update sources context
  React.useEffect(() => {
    if (!searchResults?.results || !tool.toolCallId) return
    if (!sourcesProcessedRef.current[tool.toolCallId]) return

    const sources = extractSearchSources(searchResults.results)
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
  }, [searchResults, tool.toolCallId, query, addSource])

  // 3. Handle diff visualization
  React.useEffect(() => {
    if (!searchResults?.results) return

    const diffs = diffSystemRef.current.compareResults(
      previousResults,
      searchResults.results
    )
    const visualization = diffSystemRef.current.visualizeDiffs(diffs)

    setDiffVisualization(visualization)
    setPreviousResults(searchResults.results)
  }, [searchResults, previousResults])

  // 4. Handle metrics and depth optimization
  const { currentDepth } = depthState
  React.useEffect(() => {
    if (!searchResults?.results) return

    const metrics = diffSystemRef.current.trackChanges(searchResults.results)

    if (metrics.newInsights > 0 || metrics.refinements > 0) {
      addActivity({
        type: 'analyze',
        status: 'complete',
        message: `Found ${metrics.newInsights} new insights and ${metrics.refinements} refinements`,
        timestamp: new Date().toISOString(),
        depth: currentDepth
      })
    }

    // Debounce depth optimization
    const timeoutId = setTimeout(() => {
      optimizeDepth(sourcesState.sourceMetrics)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [searchResults, currentDepth, optimizeDepth, sourcesState.sourceMetrics])

  // Store search results in Redis when they change
  React.useEffect(() => {
    if (searchResults?.results && query) {
      const payload = {
        query,
        results: {
          ...searchResults,
          results: searchResults.results.map(result => ({
            ...result,
            content: result.content || '',
            title: result.title || '',
            url: result.url || '',
            relevance: result.relevance || 0,
            depth: result.depth || 1,
            domain: result.domain || '',
            favicon: result.favicon || '',
            publishedDate: result.publishedDate || null
          }))
        }
      }

      fetch(`/api/search/${chatId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(error => {
        console.error('Error storing search results:', error)
      })
    }
  }, [searchResults, query, chatId])

  // Restore search results from Redis on mount or when URL parameters change
  React.useEffect(() => {
    if (q && !searchResults) {
      fetch(`/api/search/${chatId}/results?q=${encodeURIComponent(q)}`)
        .then(async response => {
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to restore search results: ${errorText}`)
          }
          return response.json()
        })
        .then(data => {
          if (data && data.results) {
            // Create a synthetic tool invocation with the correct type
            const syntheticTool = {
              state: 'result' as const,
              toolName: 'search' as const,
              toolCallId: 'restored-search',
              args: {
                query: q,
                includeDomains: searchParams
                  .get('domains')
                  ?.split(',')
                  .filter(Boolean)
              },
              result: data
            }

            // Update the tool state
            if (setMessages && messages) {
              const newMessage: ExtendedMessage = {
                id: 'restored-search',
                role: 'assistant',
                content: `Restored search results for: ${q}`,
                toolInvocations: [syntheticTool]
              }
              setMessages([...messages, newMessage])
            }
          }
        })
        .catch(error => {
          console.error('Error restoring search results:', error)
        })
    }
  }, [q, searchResults, chatId, setMessages, messages])

  // Clear stored results when chat changes
  React.useEffect(() => {
    return () => {
      fetch(`/api/search/${chatId}/results`, {
        method: 'DELETE'
      }).catch(error => {
        console.error('Error clearing stored search results:', error)
      })
    }
  }, [chatId])

  // Persist search state in URL
  React.useEffect(() => {
    if (searchResults?.results && query) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('q', query)
      if (includeDomains?.length) {
        params.set('domains', includeDomains.join(','))
      }
      router.push(`?${params.toString()}`, { scroll: false })
    }
  }, [searchResults, query, includeDomains, router])

  // Recover search from URL parameters
  const recoverSearch = React.useCallback(
    async (query: string, domains?: string[]) => {
      try {
        const results = await searchTool.execute(
          {
            query,
            search_depth: 'basic',
            include_domains: domains || [],
            exclude_domains: [],
            topic: 'general',
            time_range: 'year',
            include_answer: false,
            include_images: false,
            include_image_descriptions: false,
            include_raw_content: false,
            max_results: 10,
            days: 365
          },
          {
            toolCallId: 'recover-search',
            messages: []
          }
        )

        if (results.results?.length) {
          // Update the search results in the parent component's state
          if (setMessages && messages) {
            const newMessage = {
              id: 'recover-search',
              role: 'assistant' as const,
              content: `Recovered search results for: ${query}`,
              searchSources: extractSearchSources(results.results)
            }
            setMessages([...messages, newMessage])
          }
        }
      } catch (error) {
        console.error('Failed to recover search:', error)
      }
    },
    [setMessages, messages]
  )

  // Restore search state from URL on mount
  React.useEffect(() => {
    const urlDomains = searchParams.get('domains')?.split(',').filter(Boolean)

    if (q && !searchResults) {
      recoverSearch(q, urlDomains)
    }
  }, [q, searchResults, recoverSearch])

  // Load results from local storage on mount
  React.useEffect(() => {
    const storedResults = localStorage.getItem(STORAGE_KEY)
    if (storedResults && !searchResults) {
      const parsed = JSON.parse(storedResults)
      if (parsed.chatId === chatId) {
        // Only restore if it's for the same chat session
        setPreviousResults(parsed.results)
      }
    }
  }, [chatId, searchResults])

  // Save results to local storage when they change
  React.useEffect(() => {
    if (searchResults?.results) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          chatId,
          results: searchResults.results,
          timestamp: Date.now()
        })
      )
    }
  }, [searchResults, chatId])

  // Memoized values
  const isToolLoading = React.useMemo(() => tool.state === 'call', [tool.state])

  // Memoized callbacks
  const handleToggleRankedAnalysis = React.useCallback(() => {
    setShowRankedAnalysis(prev => !prev)
  }, [])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      onOpenChange(open)
    },
    [onOpenChange]
  )

  // Add after Redis fetch fails
  const fetchFromSupabase = async () => {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('chat_id', chatId)
        .eq('query', q)
        .single()
      
      if (data && !error) {
        // Handle successful Supabase data retrieval
      }
    } catch (error) {
      console.error('Supabase fetch error:', error)
    }
  }

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      header={
        <SearchHeader
          showRankedAnalysis={showRankedAnalysis}
          onToggleRankedAnalysis={() =>
            setShowRankedAnalysis(!showRankedAnalysis)
          }
          includeDomainsString={includeDomainsString}
        />
      }
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      {/* StoredSearchResults is now always rendered */}
      <div className="mb-6 border-b pb-4">
        <StoredSearchResults 
          chatId={chatId}
          onResultsFound={(results) => {
            if (!searchResults && setMessages && messages) {
              const newMessage: ExtendedMessage = {
                id: 'restored-search',
                role: 'assistant',
                content: `Restored search results for: ${q}`,
                searchSources: extractSearchSources(results)
              }
              setMessages([...messages, newMessage])
            }
          }}
        />
      </div>

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
            Images ({searchResults?.images?.length || 0})
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
        ) : searchResults ? (
          <>
            {viewMode === 'grid' && searchResults.results && (
              <SearchResultsGrid 
                results={searchResults.results}
                chatId={chatId}
              />
            )}
            {viewMode === 'ranked' && searchResults.results && (
              <RankedSearchResults
                results={searchResults.results}
                query={query}
                showMetrics={true}
              />
            )}
            {viewMode === 'image' && searchResults.images && searchResults.images.length > 0 ? (
              <SearchResultsImageSection
                images={searchResults.images}
                query={query}
                isLoading={isLoading}
              />
            ) : viewMode === 'image' ? (
              <div className="text-muted-foreground text-center py-4">
                No images found for this search
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </CollapsibleMessage>
  )
}
