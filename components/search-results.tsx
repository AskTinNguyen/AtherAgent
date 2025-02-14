'use client'

import { ErrorBoundary } from '@/components/shared/error-boundary'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SourcesProvider, useSources } from '@/lib/contexts/research-sources-context'
import { compareSearchResults } from '@/lib/diff'
import { DiffResult } from '@/lib/diff/types'
import { SearchResult as BaseSearchResult } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export interface SearchResult extends BaseSearchResult {
  quality?: {
    relevance: number
    authority: number
    freshness: number
    coverage: number
  }
}

export interface SearchResultsProps {
  results: SearchResult[]
  previousResults?: SearchResult[]
  showDiff?: boolean
  className?: string
  userId?: string
}

// Ensure search parameters are properly initialized
const DEFAULT_SEARCH_PARAMS = {
  include_domains: [] as string[],
  exclude_domains: [] as string[],
  max_results: 20,
  search_depth: 'advanced' as const
}

function SearchResultsContent({ 
  results,
  previousResults,
  showDiff = false,
  className,
  userId = 'anonymous'
}: SearchResultsProps) {
  const { state: sourcesState, addSource } = useSources()
  const [showAllResults, setShowAllResults] = useState(false)
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [starredResults, setStarredResults] = useState<Set<string>>(new Set())

  // Calculate diffs when results or previousResults change
  useEffect(() => {
    if (previousResults && showDiff) {
      const diff = compareSearchResults(previousResults, results)
      setDiffResult(diff)
    }
  }, [results, previousResults, showDiff])

  // Add results to sources context
  useEffect(() => {
    results.forEach(result => {
      if (!sourcesState.sources.some(s => s.url === result.url)) {
        addSource({
          url: result.url,
          title: result.title || '',
          relevance: result.relevance,
          content: result.content,
          query: result.metadata?.query,
          publishedDate: result.timestamp ? new Date(result.timestamp).toISOString() : undefined
        })
      }
    })
  }, [results, sourcesState.sources, addSource])

  const handleViewMore = () => {
    setShowAllResults(true)
  }

  const handleBookmark = async (result: SearchResult) => {
    try {
      if (starredResults.has(result.url)) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?userId=${userId}&bookmarkId=${result.url}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) throw new Error('Failed to remove bookmark')
        
        setStarredResults(prev => {
          const next = new Set(prev)
          next.delete(result.url)
          return next
        })
        toast.success('Result removed from bookmarks')
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'search_result',
            content: result.title || result.content,
            metadata: {
              type: 'search_result',
              data: {
                sourceContext: result.content,
                queryContext: result.metadata?.query || '',
                searchScore: result.relevance,
                resultRank: result.depth,
                sourceQuality: result.quality ? {
                  relevance: result.quality.relevance || 0,
                  authority: result.quality.authority || 0,
                  freshness: result.quality.freshness || 0,
                  coverage: result.quality.coverage || 0
                } : undefined
              }
            }
          })
        })
        
        if (!response.ok) throw new Error('Failed to add bookmark')
        
        setStarredResults(prev => new Set(prev).add(result.url))
        toast.success('Result added to bookmarks')
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      toast.error('Failed to update bookmark')
    }
  }

  const displayedResults = showAllResults ? results : results.slice(0, 3)
  const additionalResultsCount = results.length > 3 ? results.length - 3 : 0
  
  const displayUrlName = (url: string) => {
    const hostname = new URL(url).hostname
    const parts = hostname.split('.')
    return parts.length > 2 ? parts.slice(1, -1).join('.') : parts[0]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Research Progress Section */}
      {diffResult && (
        <div className="rounded-lg border border-yellow-500/20 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Research Progress</h3>
              <span className="text-xs text-muted-foreground">
                {diffResult.metrics.totalChanges} changes
              </span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* New Insights */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">New Insights</span>
                  <span>{diffResult.metrics.newInsights}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-green-500"
                    style={{ 
                      width: `${(diffResult.metrics.newInsights / diffResult.metrics.totalChanges) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Refinements */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Refinements</span>
                  <span>{diffResult.metrics.refinements}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-blue-500"
                    style={{ 
                      width: `${(diffResult.metrics.refinements / diffResult.metrics.totalChanges) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Relevance Improvement */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Relevance Improvement</span>
                  <span>{(diffResult.metrics.relevanceImprovement * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-yellow-500"
                    style={{ 
                      width: `${Math.max(0, Math.min(100, diffResult.metrics.relevanceImprovement * 100))}%` 
                    }}
                  />
                </div>
              </div>

              {/* Depth Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Depth Progress</span>
                  <span>+{diffResult.metrics.depthProgress} levels</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-purple-500"
                    style={{ 
                      width: `${Math.min(100, (diffResult.metrics.depthProgress / 10) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Stack */}
      <div className="space-y-2">
        {displayedResults.map((result, index) => {
          // Only show new results (additions)
          const isNewResult = diffResult?.additions.some(d => d.result.url === result.url)
          if (!isNewResult) return null

          return (
            <div className="w-full" key={result.url}>
              <Card className="transition-colors group hover:shadow-md ring-1 ring-green-500 dark:ring-green-400">
                <CardContent className="p-4 relative">
                  <div className="space-y-3">
                    {/* Title Row with Star */}
                    <div className="flex items-start justify-between gap-4">
                      <Link 
                        href={result.url}
                        target="_blank"
                        className="flex-1"
                      >
                        <h3 className="text-sm font-bold leading-tight line-clamp-2 hover:underline">
                          {result.title || result.content}
                        </h3>
                      </Link>
                      <div className="flex items-start gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-6 w-6 transition-opacity",
                            !starredResults.has(result.url) && "opacity-0 group-hover:opacity-100"
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBookmark(result)
                          }}
                        >
                          <Star 
                            className={cn(
                              "h-4 w-4",
                              starredResults.has(result.url)
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-muted-foreground"
                            )}
                          />
                        </Button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {result.content}
                    </p>

                    {/* Footer with Source Info */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage
                            src={`https://www.google.com/s2/favicons?domain=${
                              new URL(result.url).hostname
                            }`}
                            alt={displayUrlName(result.url)}
                          />
                          <AvatarFallback>
                            {displayUrlName(result.url)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-xs opacity-60">
                          {displayUrlName(result.url)}
                        </div>
                      </div>
                      {result.quality && (
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            Relevance: {Math.round(result.quality.relevance * 100)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}

        {/* View More Button */}
        {!showAllResults && additionalResultsCount > 0 && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:bg-accent/50 transition-colors"
            onClick={handleViewMore}
          >
            View {additionalResultsCount} more results
          </Button>
        )}
      </div>
    </div>
  )
}

export function SearchResults(props: SearchResultsProps) {
  return (
    <ErrorBoundary>
      <SourcesProvider>
        <SearchResultsContent {...props} />
      </SourcesProvider>
    </ErrorBoundary>
  )
}
