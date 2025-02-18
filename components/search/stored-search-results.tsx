'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { type SearchResultItem } from '@/types/search'
import { AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'
import { SearchResultsGridSkeleton } from '../skeletons'
import { SearchResultCard } from './search-result-card'

interface StoredSearchResultsProps {
  chatId: string
  onResultsFound?: (results: SearchResultItem[]) => void
}

export function StoredSearchResults({ chatId, onResultsFound }: StoredSearchResultsProps) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  const [results, setResults] = React.useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const toastIdRef = React.useRef<string | number>('')

  React.useEffect(() => {
    async function fetchStoredResults() {
      if (!chatId) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = await createClient()
        
        console.log('Querying sources for research session:', chatId)
        
        // Query sources directly using chatId as research_session_id (since Chat component uses the same ID)
        const { data, error } = await supabase
          .from('sources')
          .select(`
            id,
            url,
            title,
            content,
            relevance,
            metadata,
            created_at,
            session_id
          `)
          .eq('session_id', chatId)
          .order('relevance', { ascending: false })

        if (error) {
          console.error('Error querying sources:', {
            error,
            sessionId: chatId,
            query
          })
          throw error
        }

        console.log('Sources query result:', {
          resultCount: data?.length ?? 0,
          sessionId: chatId,
          firstResult: data?.[0],
          query
        })

        if (data && data.length > 0) {
          // Transform the data to match SearchResultItem type
          const searchResults: SearchResultItem[] = data.map(source => ({
            url: source.url || '',
            title: source.title || '',
            content: source.content || '',
            relevance: source.relevance || 0,
            domain: source.metadata?.domain || new URL(source.url).hostname,
            favicon: source.metadata?.favicon || '',
            publishedDate: source.metadata?.publishedDate || source.created_at,
            depth: source.metadata?.depth || 1
          }))

          setResults(searchResults)
          onResultsFound?.(searchResults)
          
          // Show success toast
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current)
          }
          toastIdRef.current = toast.success('Restored previous search results', {
            duration: Infinity,
            position: 'bottom-right'
          })
        } else {
          setError('No results found')
          // Show no results toast
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current)
          }
          toastIdRef.current = toast('No stored results found', {
            duration: Infinity,
            position: 'bottom-right'
          })
        }
      } catch (error) {
        console.error('Error fetching stored sources:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        setError(`Database error: ${errorMessage}`)
        
        // Show error toast
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current)
        }
        toastIdRef.current = toast.error(`Cannot access database: ${errorMessage}`, {
          duration: Infinity,
          position: 'bottom-right'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStoredResults()

    // Cleanup toasts when unmounting
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }
    }
  }, [chatId, query, onResultsFound])

  if (isLoading) {
    return <SearchResultsGridSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Always show the component, even with no results
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground text-center">
        {results.length > 0 
          ? query
            ? `Showing stored results from previous search: "${query}"`
            : "Showing previously stored search results"
          : 'No stored results available'}
      </div>
      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result, index) => (
            <SearchResultCard
              key={`${result.url}-${index}`}
              result={result}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
} 