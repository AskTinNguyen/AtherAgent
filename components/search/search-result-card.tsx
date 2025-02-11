'use client'

import { type SearchResultItem } from '@/types/search'
import { motion } from 'framer-motion'
import * as React from 'react'

interface SearchResultCardProps {
  result: SearchResultItem
  index: number
}

function SearchResultCardContent({ result, index }: SearchResultCardProps) {
  // Memoize the error handler
  const handleImageError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement
    img.style.display = 'none'
  }, [])

  // Memoize the animation variants
  const animationVariants = React.useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.1 }
  }), [index])

  return (
    <motion.div
      {...animationVariants}
    >
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        <div className="h-full p-4 rounded-lg border hover:border-blue-500 transition-all duration-200 hover:shadow-md bg-card">
          <div className="flex items-center gap-2 mb-3">
            {result.favicon && (
              <img
                src={result.favicon}
                alt=""
                className="w-4 h-4 rounded-sm"
                onError={handleImageError}
              />
            )}
            <h3 className="font-medium line-clamp-2 leading-tight">
              {result.title}
            </h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {result.content}
            </p>
            {result.publishedDate && (
              <p className="text-xs text-muted-foreground">
                {new Date(result.publishedDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </a>
    </motion.div>
  )
}

// Wrap with memo to prevent unnecessary re-renders
export const SearchResultCard = React.memo(SearchResultCardContent) 