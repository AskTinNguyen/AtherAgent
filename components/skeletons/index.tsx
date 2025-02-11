'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SearchResultCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-4">
        {/* Header with favicon and title */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-sm" /> {/* Favicon */}
          <Skeleton className="h-4 flex-1" /> {/* Title */}
        </div>
        
        {/* Content preview */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-[70%]" />
        </div>

        {/* Footer with metrics */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Skeleton className="h-4 w-24" /> {/* Source info */}
          <Skeleton className="h-4 w-16" /> {/* Metrics */}
        </div>
      </CardContent>
    </Card>
  )
}

export function SearchResultsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <SearchResultCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function ResearchDiffSkeleton() {
  return (
    <div className="rounded-lg border border-yellow-500/20 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" /> {/* Title */}
          <Skeleton className="h-4 w-16" /> {/* Changes count */}
        </div>
        
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" /> {/* Metric name */}
                <Skeleton className="h-3 w-8" /> {/* Metric value */}
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" /> {/* Progress bar */}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RankedResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, index) => (
        <Card key={index} className={index === 0 ? "ring-2 ring-primary/20" : ""}>
          <CardContent className="p-4 space-y-4">
            {/* Title and source info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" /> {/* Title */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" /> {/* Avatar */}
                  <Skeleton className="h-3 w-24" /> {/* Source name */}
                </div>
                {/* Content preview */}
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-[90%]" />
                  <Skeleton className="h-3 w-[75%]" />
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 pt-2 border-t">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4" /> {/* Icon */}
                  <Skeleton className="h-3 w-16" /> {/* Metric */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function SearchResultsImageSkeleton() {
  return (
    <div className="flex flex-wrap">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="w-1/2 md:w-1/4 p-1">
          <Card className="flex-1 min-h-40">
            <CardContent className="p-2">
              <Skeleton className="w-full aspect-video mb-2" /> {/* Image */}
              <Skeleton className="h-3 w-full mb-1" /> {/* Title line 1 */}
              <Skeleton className="h-3 w-[80%]" /> {/* Title line 2 */}
              <div className="mt-2 flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full" /> {/* Avatar */}
                <Skeleton className="h-3 w-24" /> {/* Channel name */}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

// Re-export existing skeletons
export { DefaultSkeleton, SearchSkeleton } from '../default-skeleton'
export { HistorySkeleton } from '../history-skeleton'
