'use client'

import { SearchHeader } from '@/components/search/search-header'
import { SearchResultsGrid } from '@/components/search/search-results-grid'
import { useResearch } from '@/lib/contexts/research-context'
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

  const { 
    state: researchState, 
    addActivity, 
    optimizeDepth,
    addSource 
  } = useResearch()
  const { current: currentDepth } = researchState.depth

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

  // Add cache lock ref
  const cacheLockRef = React.useRef<{ [key: string]: boolean }>({})
  const getCacheLockKey = React.useCallback((chatId: string, query: string) => 
    `${chatId}:${query}`, [])

  // Add lock/unlock helpers
  const acquireLock = React.useCallback((key: string): boolean => {
    if (cacheLockRef.current[key]) return false
    cacheLockRef.current[key] = true
    return true
  }, [])

  const releaseLock = React.useCallback((key: string): void => {
    cacheLockRef.current[key] = false
  }, [])

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

  // 2. Update sources
  React.useEffect(() => {
    if (!searchResults?.results || !tool.toolCallId) return
    if (!sourcesProcessedRef.current[tool.toolCallId]) return

    const sources = extractSearchSources(searchResults.results)
    sources.forEach(source => {
      const searchResult = searchResults.results.find(r => r.url === source.url)
      if (searchResult) {
        const relevanceScore = searchResult.relevance || 0
        const publishedDate = searchResult.publishedDate ? new Date(searchResult.publishedDate) : new Date()
        const now = new Date()
        const ageInDays = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))
        const timeRelevanceScore = Math.max(0, 1 - (ageInDays / 365)) // Scale down for content older than a year

        addSource({
          id: crypto.randomUUID(),
          url: source.url,
          title: source.title,
          relevance: relevanceScore,
          content: source.content,
          query: query || '',
          publishedDate: searchResult.publishedDate || new Date().toISOString(),
          timestamp: new Date().toISOString(),
          quality: {
            contentQuality: relevanceScore,
            sourceAuthority: relevanceScore,
            timeRelevance: timeRelevanceScore
          }
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

    // Convert metrics to source metrics array
    const sourceMetrics = searchResults.results.map(result => {
      const relevanceScore = result.relevance || 0
      const publishedDate = result.publishedDate ? new Date(result.publishedDate) : new Date()
      const now = new Date()
      const ageInDays = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))
      const timeRelevanceScore = Math.max(0, 1 - (ageInDays / 365)) // Scale down for content older than a year
      
      return {
        contentQuality: relevanceScore,
        sourceAuthority: relevanceScore, // Use relevance as a proxy for authority
        timeRelevance: timeRelevanceScore,
        depthLevel: currentDepth,
        overallScore: (relevanceScore * 2 + timeRelevanceScore) / 3 // Weight relevance more heavily
      }
    })

    // Debounce depth optimization
    const timeoutId = setTimeout(() => {
      optimizeDepth(sourceMetrics)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [searchResults, currentDepth, optimizeDepth, addActivity])

  // Consolidate all search restoration logic into a single effect
  React.useEffect(() => {
    if (!q || searchResults) return; // Skip if no query or already have results

    const lockKey = getCacheLockKey(chatId, q);
    if (!acquireLock(lockKey)) {
      console.log('Search restoration already in progress for:', lockKey);
      return;
    }

    let isSubscribed = true; // For cleanup

    const restoreSearchResults = async () => {
      try {
        // 1. Try Redis first (through API)
        const redisResponse = await fetch(`/api/search/${chatId}/results?q=${encodeURIComponent(q)}`);
        if (redisResponse.ok) {
          const data = await redisResponse.json();
          if (data && data.results && isSubscribed) {
            handleRestoredResults(data);
            return;
          }
        }

        // 2. Try local storage
        const storedResults = localStorage.getItem(STORAGE_KEY);
        if (storedResults) {
          const parsed = JSON.parse(storedResults);
          if (parsed.chatId === chatId && parsed.results && isSubscribed) {
            handleRestoredResults({ results: parsed.results });
            return;
          }
        }

        // 3. Try Supabase as last resort
        const supabase = await createClient();
        const { data: supabaseData, error } = await supabase
          .from('search_results')
          .select('*')
          .eq('chat_id', chatId)
          .eq('query', q)
          .single();

        if (supabaseData && !error && isSubscribed) {
          handleRestoredResults(supabaseData);
          return;
        }

        // 4. If all else fails, perform a new search
        if (isSubscribed) {
          const results = await searchTool.execute(
            {
              query: q,
              search_depth: 'basic',
              include_domains: searchParams.get('domains')?.split(',').filter(Boolean) || [],
              exclude_domains: [],
              topic: 'general',
              time_range: 'year',
              include_answer: 'none' as const,
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
          );

          if (results.results && isSubscribed) {
            handleRestoredResults(results);
          }
        }
      } catch (error) {
        console.error('Error restoring search results:', error);
      } finally {
        releaseLock(lockKey);
      }
    };

    const handleRestoredResults = (data: any) => {
      if (setMessages && messages) {
        const newMessage: ExtendedMessage = {
          id: 'restored-search',
          role: 'assistant',
          content: `Restored search results for: ${q}`,
          searchSources: extractSearchSources(data.results),
          toolInvocations: [{
            state: 'result' as const,
            toolName: 'search' as const,
            toolCallId: 'restored-search',
            args: {
              query: q,
              includeDomains: searchParams.get('domains')?.split(',').filter(Boolean)
            },
            result: data
          }]
        };
        setMessages([...messages, newMessage]);
      }
    };

    restoreSearchResults();

    return () => {
      isSubscribed = false;
      releaseLock(lockKey);
    };
  }, [q, searchResults, chatId, setMessages, messages, acquireLock, releaseLock, getCacheLockKey, searchParams]);

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

  // Update depth optimization
  React.useEffect(() => {
    if (researchState.sourceMetrics.length === 0) return

    // Debounce depth optimization
    const timeoutId = setTimeout(() => {
      optimizeDepth(researchState.sourceMetrics)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [researchState.sourceMetrics, optimizeDepth])

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
      {/* Only show StoredSearchResults when we don't have results and aren't loading */}
      {!searchResults && !isLoading && (
        <div className="mb-6 border-b pb-4">
          <StoredSearchResults 
            chatId={chatId}
            onResultsFound={(results) => {
              // Only update if we still don't have results when this fires
              if (!searchResults && setMessages && messages) {
                const newMessage: ExtendedMessage = {
                  id: 'restored-search',
                  role: 'assistant',
                  content: `Restored search results for: ${q}`,
                  searchSources: extractSearchSources(results),
                  toolInvocations: [{
                    state: 'result' as const,
                    toolName: 'search' as const,
                    toolCallId: 'restored-search',
                    args: {
                      query: q,
                      includeDomains: searchParams.get('domains')?.split(',').filter(Boolean)
                    },
                    result: { results }
                  }]
                }
                setMessages([...messages, newMessage])
              }
            }}
          />
        </div>
      )}

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
