'use client'

import { Button } from '@/components/ui/button'
import { type SearchResultItem } from '@/types/search'
import { API_PATHS, createApiUrl } from '@/lib/config/api-paths'
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

  const checkBookmark = async (url: string) => {
    try {
      const response = await fetch(API_PATHS.bookmark.check(url))
      if (!response.ok) throw new Error('Failed to check bookmark')
      return await response.json()
    } catch (error) {
      console.error('Error checking bookmark:', error)
      return { exists: false }
    }
  }

  const toggleBookmark = async (url: string, title: string, snippet: string) => {
    try {
      const { exists, bookmark } = await checkBookmark(url)
      
      if (exists && bookmark) {
        const response = await fetch(API_PATHS.bookmark.byId(bookmark.id), {
          method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to remove bookmark')
        return false
      } else {
        const response = await fetch(API_PATHS.bookmark.base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            title,
            snippet,
            source: 'search'
          })
        })
        if (!response.ok) throw new Error('Failed to add bookmark')
        return true
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      return null
    }
  }

  // Check if the result is already bookmarked on mount
  React.useEffect(() => {
    const checkBookmarkStatus = async () => {
      const { exists, bookmark } = await checkBookmark(result.url)
      setIsBookmarked(exists)
      if (exists) {
        setBookmarkId(bookmark.id)
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

  const handleBookmarkToggle = async () => {
    const newBookmarkStatus = await toggleBookmark(result.url, result.title, result.snippet)
    if (newBookmarkStatus !== null) {
      setIsBookmarked(newBookmarkStatus)
      if (newBookmarkStatus) {
        toast.success('Result added to bookmarks')
      } else {
        toast.success('Result removed from bookmarks')
      }
    } else {
      toast.error('Failed to update bookmark')
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
        onClick={handleBookmarkToggle}
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