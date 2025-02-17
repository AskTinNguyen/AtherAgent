'use client'

import { ErrorBoundary } from '@/components/shared/error-boundary'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSources } from '@/lib/contexts/research-provider'
import { SearchResult as BaseSearchResult } from '@/lib/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useCallback, useMemo, useReducer } from 'react'
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

  // 1. Derive state instead of using useEffect + setState
  const displayedResults = useMemo(() => {
    const maxInitialResults = 3
    return results.slice(0, maxInitialResults)
  }, [results])

  // 2. Use reducers for complex state management
  const [state, dispatch] = useReducer(
    (state: { 
      showAll: boolean;
      starred: Set<string>;
    }, action: { type: 'SHOW_ALL' | 'TOGGLE_STAR'; url?: string }) => {
      switch (action.type) {
        case 'SHOW_ALL':
          return { ...state, showAll: true }
        case 'TOGGLE_STAR':
          if (!action.url) return state
          const newStarred = new Set(state.starred)
          if (newStarred.has(action.url)) {
            newStarred.delete(action.url)
          } else {
            newStarred.add(action.url)
          }
          return { ...state, starred: newStarred }
        default:
          return state
      }
    },
    { showAll: false, starred: new Set<string>() }
  )

  // 3. Compute values instead of storing in state
  const allResults = useMemo(() => 
    state.showAll ? results : displayedResults
  , [results, displayedResults, state.showAll])

  const additionalResultsCount = results.length - displayedResults.length

  // 4. Handle side effects in event handlers
  const handleViewMore = useCallback(() => {
    dispatch({ type: 'SHOW_ALL' })
  }, [])

  const handleToggleStar = useCallback(async (result: SearchResult) => {
    try {
      const isStarred = state.starred.has(result.url)
      const response = await fetch(
        `/api/bookmarks${isStarred ? `?userId=${userId}&bookmarkId=${result.url}` : ''}`,
        {
          method: isStarred ? 'DELETE' : 'POST',
          ...(isStarred ? {} : {
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
                  sourceQuality: result.quality
                }
              }
            })
          })
        }
      )

      if (!response.ok) throw new Error(`Failed to ${isStarred ? 'remove' : 'add'} bookmark`)
      
      dispatch({ type: 'TOGGLE_STAR', url: result.url })
      toast.success(`Result ${isStarred ? 'removed from' : 'added to'} bookmarks`)
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      toast.error('Failed to update bookmark')
    }
  }, [userId, state.starred])

  // 5. Use utility functions for complex computations
  const displayUrlName = useCallback((url: string) => {
    try {
      const hostname = new URL(url).hostname
      const parts = hostname.split('.')
      return parts.length > 2 ? parts.slice(1, -1).join('.') : parts[0]
    } catch {
      return url
    }
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Results Stack */}
      <div className="space-y-2">
        {allResults.map((result) => (
          <div className="w-full" key={result.url}>
            <Card className="transition-colors group hover:shadow-md">
              <CardContent className="p-4 relative">
                <div className="space-y-3">
                  {/* Title Row */}
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
                      <div className="text-xs text-muted-foreground">
                        Relevance: {Math.round(result.quality.relevance * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* View More Button */}
        {!state.showAll && additionalResultsCount > 0 && (
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
      <SearchResultsContent {...props} />
    </ErrorBoundary>
  )
}
