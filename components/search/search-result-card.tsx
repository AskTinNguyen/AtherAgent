'use client'

import { Button } from '@/components/ui/button'
import { useBookmarks } from '@/lib/contexts/bookmark-context'
import { type SearchResultItem } from '@/types/search'
import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

interface SearchResultCardProps {
  result: SearchResultItem
  index: number
}

function SearchResultCardContent({ result, index }: SearchResultCardProps) {
  const { bookmarkState, checkBookmarkStatus, invalidateBookmark } = useBookmarks()
  const bookmarkData = bookmarkState[result.url]
  const isBookmarked = bookmarkData?.isBookmarked || false
  const bookmarkId = bookmarkData?.bookmarkId || null

  // Check bookmark status on mount
  React.useEffect(() => {
    checkBookmarkStatus(result.url)
  }, [result.url, checkBookmarkStatus])

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

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?bookmarkId=${bookmarkId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to remove bookmark')
        }
        
        invalidateBookmark(result.url)
        toast.success('Bookmark removed')
      } else {
        // Add bookmark with proper schema
        const bookmarkData = {
          type: 'search_result',
          content: result.title || result.content,
          metadata: {
            type: 'search_result',
            data: {
              sourceContext: result.content,
              tags: [],
              queryContext: '',
              searchScore: result.relevance || 0,
              resultRank: result.depth || 0,
              sourceQuality: {
                relevance: 0,
                authority: 0,
                freshness: 0,
                coverage: 0
              }
            }
          }
        }

        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookmarkData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to add bookmark')
        }
        
        invalidateBookmark(result.url)
        toast.success('Bookmark added')
      }
    } catch (error) {
      console.error('Bookmark operation failed:', error)
      toast.error('Failed to update bookmark')
      // Force a fresh check of the bookmark status
      checkBookmarkStatus(result.url)
    }
  }

  return (
    <motion.div
      {...animationVariants}
      className="relative overflow-hidden"
    >
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 z-10"
        onClick={handleBookmark}
      >
        <Bookmark 
          className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} 
        />
      </Button>
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