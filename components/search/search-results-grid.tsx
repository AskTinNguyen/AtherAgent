'use client'

import { ErrorBoundary } from '@/components/shared/error-boundary'
import { type SearchResultItem } from '@/types/search'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'
import { SearchResultsGridSkeleton } from '../skeletons'
import { SearchResultCard } from './search-result-card'

interface SearchResultsGridProps {
  results: SearchResultItem[]
  isLoading?: boolean
  chatId: string
}

type ResultSource = 'redis' | 'supabase' | 'initial'

function SearchResultsGridContent({ 
  results: initialResults, 
  isLoading = false,
  chatId 
}: SearchResultsGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [results, setResults] = React.useState<SearchResultItem[]>(initialResults)
  const [isFetching, setIsFetching] = React.useState(false)
  const [resultSource, setResultSource] = React.useState<ResultSource>('initial')
  const [shouldShowLoading, setShouldShowLoading] = React.useState(false)

  // Handle delayed loading state
  React.useEffect(() => {
    if (isFetching) {
      const timer = setTimeout(() => setShouldShowLoading(true), 200)
      return () => clearTimeout(timer)
    } else {
      setShouldShowLoading(false)
    }
  }, [isFetching])

  // Save initial results to Redis and Supabase when they change
  React.useEffect(() => {
    if (initialResults.length > 0 && chatId) {
      const query = searchParams.get('q')
      if (!query) return

      const saveResults = async () => {
        try {
          // Save to Redis
          await fetch(`/api/search/${chatId}/results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              results: initialResults
            })
          })

          // Save to Supabase
          await fetch(`/api/search/${chatId}/sources`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              results: initialResults.map(result => ({
                ...result,
                chatId,
                query
              }))
            })
          })
        } catch (error) {
          console.error('Error saving search results:', error)
        }
      }

      saveResults()
    }
  }, [initialResults, chatId, searchParams])

  // Fetch results from Redis/Supabase when query changes
  React.useEffect(() => {
    const query = searchParams.get('q')
    if (!query || !chatId) return

    const fetchResults = async () => {
      setIsFetching(true)
      try {
        // First try Redis cache
        const redisResponse = await fetch(`/api/search/${chatId}/results?q=${encodeURIComponent(query)}`)
        
        if (redisResponse.ok) {
          const redisResults = await redisResponse.json()
          if (redisResults && Array.isArray(redisResults)) {
            setResults(redisResults)
            setResultSource('redis')
            return
          }
        }

        // If Redis fails or returns no results, try Supabase
        const supabaseResponse = await fetch(`/api/search/${chatId}/sources?q=${encodeURIComponent(query)}`)
        if (supabaseResponse.ok) {
          const supabaseResults = await supabaseResponse.json()
          if (supabaseResults && Array.isArray(supabaseResults)) {
            setResults(supabaseResults)
            setResultSource('supabase')
            return
          }
        }

        // If both fail, keep using initial results
        setResults(initialResults)
        setResultSource('initial')
      } catch (error) {
        console.error('Error fetching search results:', error)
        toast.error('Failed to fetch search results')
        setResults(initialResults)
        setResultSource('initial')
      } finally {
        setIsFetching(false)
      }
    }

    fetchResults()
  }, [chatId, searchParams, initialResults])

  // Memoize the grid layout calculation
  const gridItems = React.useMemo(() => 
    results.map((result, index) => (
      <SearchResultCard
        key={`${result.url}-${index}`}
        result={result}
        index={index}
      />
    )),
    [results]
  )

  if (isLoading || shouldShowLoading) {
    return <SearchResultsGridSkeleton />
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No search results found
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gridItems}
      {resultSource !== 'initial' && (
        <div className="col-span-full text-xs text-muted-foreground text-center mt-2">
          Results from {resultSource === 'redis' ? 'cache' : 'database'}
        </div>
      )}
    </div>
  )
}

// Add proper error boundary wrapper
export function SearchResultsGrid(props: SearchResultsGridProps) {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<SearchResultsGridSkeleton />}>
        <SearchResultsGridContent {...props} />
      </React.Suspense>
    </ErrorBoundary>
  )
} 