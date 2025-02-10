'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { BookmarkType, EnhancedBookmark } from '@/lib/redis/types/bookmarks'
import {
  FolderOpen,
  Search,
  Tag,
  Trash2
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface BookmarkManagerProps {
  className?: string
}

export function BookmarkManager({ className }: BookmarkManagerProps): JSX.Element {
  const { data: session } = useSession()
  const [userId, setUserId] = useState<string>('anonymous')
  const pollingInterval = useRef<NodeJS.Timeout>()

  const [bookmarks, setBookmarks] = useState<EnhancedBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created' | 'accessed' | 'effectiveness'>('created')
  const [selectedType, setSelectedType] = useState<'all' | BookmarkType>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const ITEMS_PER_PAGE = 10

  // Categories and tags from bookmarks
  const [categories, setCategories] = useState<Set<string>>(new Set())
  const [tags, setTags] = useState<Set<string>>(new Set())

  // Get userId from cookie
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store'
        })
        const data = await response.json()
        setUserId(data.userId || 'anonymous')
      } catch (error) {
        console.error('Error getting user ID:', error)
        setUserId('anonymous')
      }
    }
    getUserId()
  }, [session])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
    setBookmarks([]) // Clear existing bookmarks when filters change
    setLastUpdate(Date.now()) // Force refresh when filters change
  }, [selectedCategory, selectedTag, sortBy, selectedType])

  const fetchBookmarks = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true)
      const offset = (page - 1) * ITEMS_PER_PAGE
      const queryParams = new URLSearchParams({
        userId,
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
        sortBy,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedTag !== 'all' && { tag: selectedTag }),
        ...(selectedType !== 'all' && { type: selectedType }),
        timestamp: lastUpdate.toString()
      })

      const response = await fetch(`/api/bookmarks?${queryParams}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) throw new Error('Failed to fetch bookmarks')
      
      const data = await response.json()
      
      // Update bookmarks with pagination
      setBookmarks(prev => {
        // If it's the first page or filters changed, replace all bookmarks
        if (page === 1) return data
        // Otherwise append new bookmarks
        return [...prev, ...data]
      })
      
      setHasMore(data.length === ITEMS_PER_PAGE)

      // Update categories and tags
      const newCategories = new Set<string>(['uncategorized'])
      const newTags = new Set<string>()
      data.forEach((bookmark: EnhancedBookmark) => {
        if (bookmark.organization.category) {
          newCategories.add(bookmark.organization.category)
        }
        bookmark.organization.tags.forEach(tag => newTags.add(tag))
      })
      setCategories(newCategories)
      setTags(newTags)

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookmarks')
    } finally {
      if (!isPolling) setLoading(false)
    }
  }, [userId, page, selectedCategory, selectedTag, sortBy, selectedType, lastUpdate])

  // Set up polling for updates
  useEffect(() => {
    // Initial fetch
    fetchBookmarks()

    // Set up polling every 5 seconds
    pollingInterval.current = setInterval(() => {
      fetchBookmarks(true)
    }, 5000)

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [fetchBookmarks])

  // Force refresh function
  const refreshBookmarks = useCallback(() => {
    setLastUpdate(Date.now())
    setPage(1)
    fetchBookmarks()
  }, [fetchBookmarks])

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks?userId=${userId}&bookmarkId=${bookmarkId}`, {
        method: 'DELETE',
        cache: 'no-store'
      })
      
      if (!response.ok) throw new Error('Failed to delete bookmark')
      
      // Remove from local state immediately
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
      
      // Force refresh to ensure sync
      refreshBookmarks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bookmark')
    }
  }

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = searchTerm === '' || 
      bookmark.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.metadata.data.sourceContext.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Type-specific metadata rendering
  const renderMetadata = (bookmark: EnhancedBookmark) => {
    const metadata = bookmark.metadata

    switch (metadata.type) {
      case 'research_suggestion':
        return (
          <div className="space-y-2">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Depth: {metadata.data.depthLevel}</span>
              <span>Relevance: {Math.round(metadata.data.relevanceScore * 100)}%</span>
            </div>
            {metadata.data.sourceQuality && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Authority: {Math.round(metadata.data.sourceQuality.authority * 100)}%</span>
                <span>Freshness: {Math.round(metadata.data.sourceQuality.freshness * 100)}%</span>
                <span>Coverage: {Math.round(metadata.data.sourceQuality.coverage * 100)}%</span>
              </div>
            )}
            {metadata.data.relatedTopics && metadata.data.relatedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {metadata.data.relatedTopics.map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )

      case 'search_result':
        return (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Search Score: {Math.round(metadata.data.searchScore * 100)}%</span>
            <span>Rank: #{metadata.data.resultRank}</span>
            <span>Query: {metadata.data.queryContext}</span>
          </div>
        )

      case 'chat_message':
        return (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Conversation: {metadata.data.conversationId}</span>
            <span>Time: {new Date(metadata.data.timestamp).toLocaleTimeString()}</span>
            {metadata.data.messageContext && (
              <span className="text-xs">Context: {metadata.data.messageContext}</span>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Update the renderBookmarkCard function
  const renderBookmarkCard = (bookmark: EnhancedBookmark) => (
    <Card key={bookmark.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{bookmark.content}</CardTitle>
              <Badge>{bookmark.metadata.type}</Badge>
            </div>
            <CardDescription className="mt-1">
              {bookmark.metadata.data.sourceContext}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteBookmark(bookmark.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <FolderOpen className="h-3 w-3 mr-1" />
              {bookmark.organization.category}
            </Badge>
            {bookmark.organization.tags.map(tag => (
              <Badge key={tag} variant="outline">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
          
          {renderMetadata(bookmark)}
          
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span>Created: {new Date(bookmark.analytics.createdAt).toLocaleDateString()}</span>
            <span>Last Accessed: {new Date(bookmark.analytics.lastAccessed).toLocaleDateString()}</span>
            <span>Used: {bookmark.analytics.useCount} times</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={className}>
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="research_suggestion">Research</SelectItem>
              <SelectItem value="search_result">Search</SelectItem>
              <SelectItem value="chat_message">Chat</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="accessed">Last Accessed</SelectItem>
              <SelectItem value="effectiveness">Effectiveness</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-4">
          <Select 
            value={selectedCategory} 
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Array.from(categories).map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedTag} 
            onValueChange={setSelectedTag}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {Array.from(tags).map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="text-destructive mb-4">
          Error: {error}
        </div>
      )}

      <ScrollArea className="h-[600px] pr-4">
        {loading && page === 1 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredBookmarks.map(renderBookmarkCard)}
            {hasMore && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  )
} 