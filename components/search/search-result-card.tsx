'use client'

import { Button } from '@/components/ui/button'
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
  const [isBookmarked, setIsBookmarked] = React.useState(false)
  const [bookmarkId, setBookmarkId] = React.useState<string | null>(null)

  // Check if the result is already bookmarked on mount
  React.useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const response = await fetch(`/api/bookmarks/check?url=${encodeURIComponent(result.url)}`)
        if (response.ok) {
          const data = await response.json()
          setIsBookmarked(data.isBookmarked)
          if (data.isBookmarked) {
            setBookmarkId(data.bookmarkId)
          }
        }
      } catch (error) {
        console.error('Failed to check bookmark status:', error)
      }
    }
    
    checkBookmarkStatus()
  }, [result.url])

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
    e.preventDefault() // Prevent the card click from triggering
    e.stopPropagation()
    
    try {
      if (isBookmarked && bookmarkId) {
        // Remove bookmark using the generated bookmarkId
        const response = await fetch(`/api/bookmarks?bookmarkId=${bookmarkId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Delete bookmark error:', errorText)
          throw new Error('Failed to remove bookmark')
        }
        
        // Verify bookmark removal
        const verifyResponse = await fetch(`/api/bookmarks/verify?bookmarkId=${bookmarkId}`)
        const verifyData = await verifyResponse.json()
        
        if (!verifyData.isFullyDeleted) {
          console.error('Bookmark still exists in Redis after deletion')
          throw new Error('Failed to remove bookmark completely')
        }
        
        setBookmarkId(null)
        setIsBookmarked(false)
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
          const errorText = await response.text()
          console.error('Add bookmark error:', errorText)
          throw new Error('Failed to add bookmark')
        }
        
        const data = await response.json()
        setBookmarkId(data.id)
        setIsBookmarked(true)
        toast.success('Bookmark added')
      }
    } catch (error) {
      console.error('Bookmark operation failed:', error)
      toast.error('Failed to update bookmark')
      // Reset states on error by checking current status
      const checkResponse = await fetch(`/api/bookmarks/check?url=${encodeURIComponent(result.url)}`)
      if (checkResponse.ok) {
        const data = await checkResponse.json()
        setIsBookmarked(data.isBookmarked)
        setBookmarkId(data.isBookmarked ? data.bookmarkId : null)
      }
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