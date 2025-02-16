'use client'

import { type SearchResultItem } from '@/types/search'
import * as React from 'react'
import { SearchResultsGridSkeleton } from '../skeletons'
import { SearchResultCard } from './search-result-card'

interface SearchResultsGridProps {
  results: SearchResultItem[]
  isLoading?: boolean
}

function SearchResultsGridContent({ results, isLoading = false }: SearchResultsGridProps) {
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

  if (isLoading) {
    return <SearchResultsGridSkeleton />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gridItems}
    </div>
  )
}

// Add error boundary wrapper
export function SearchResultsGrid(props: SearchResultsGridProps) {
  return (
    <React.Suspense fallback={<SearchResultsGridSkeleton />}>
      <SearchResultsGridContent {...props} />
    </React.Suspense>
  )
} 