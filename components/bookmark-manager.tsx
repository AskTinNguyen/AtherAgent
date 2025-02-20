'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
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
import {
  BaseMetadata,
  BookmarkType,
  ChatMetadata,
  EnhancedBookmark,
  ResearchMetadata,
  SearchMetadata
} from '@/lib/redis/types/bookmarks'
import { cn } from '@/lib/utils'
import {
  FolderOpen,
  Search,
  Tag,
  Trash2
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface BookmarkManagerProps {
  className?: string
}

export function BookmarkManager({ className }: BookmarkManagerProps): JSX.Element {
  const supabase = useSupabase()
  const [userId, setUserId] = useState<string | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout>()

  const [bookmarks, setBookmarks] = useState<EnhancedBookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [selectedTag, setSelectedTag] = useState<string | undefined>()
  const [sortBy, setSortBy] = useState<'created' | 'accessed' | 'effectiveness'>('created')
  const [selectedType, setSelectedType] = useState<BookmarkType | undefined>()

  // Pagination
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const ITEMS_PER_PAGE = 10

  // Categories and tags from bookmarks
  const [categories, setCategories] = useState<Set<string>>(new Set())
  const [tags, setTags] = useState<Set<string>>(new Set())

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!error && user) {
        setUserId(user.id)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!userId) return

    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookmarks:', error)
        return
      }

      setBookmarks(data || [])
    }

    fetchBookmarks()

    // Subscribe to changes
    const channel = supabase
      .channel('bookmarks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => [payload.new as any, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, supabase])

  const fetchBookmarks = useCallback(async (isPolling = false) => {
    if (!userId) return

    const params = new URLSearchParams({
      type: selectedType || '',
      tag: selectedTag || '',
      category: selectedCategory || '',
      user_id: userId,
      limit: '10',
      offset: ((page - 1) * 10).toString(),
      sortBy
    })

    try {
      const response = await fetch(`/api/bookmarks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch bookmarks')
      
      const data = await response.json()
      if (!isPolling) {
        setBookmarks(data)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
      if (!isPolling) {
        setError('Failed to fetch bookmarks')
        setIsLoading(false)
      }
    }
  }, [userId, selectedType, selectedTag, selectedCategory, page, sortBy])

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

  const handleDelete = async (id: string) => {
    if (!userId) return

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting bookmark:', error)
      return
    }

    setBookmarks(prev => prev.filter(b => b.id !== id))
    toast.success('Bookmark deleted')
  }

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = searchTerm === '' || 
      bookmark.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bookmark.metadata.data as BaseMetadata).sourceContext.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Type-specific metadata rendering
  const renderMetadata = (bookmark: EnhancedBookmark) => {
    const metadata = bookmark.metadata
    const { sourceContext } = metadata.data as BaseMetadata

    switch (metadata.type) {
      case 'research_suggestion': {
        const data = metadata.data as ResearchMetadata
        return (
          <div className="space-y-2">
            {data.relatedTopics && data.relatedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.relatedTopics.map((topic: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
            {sourceContext && (
              <p className="text-sm text-muted-foreground">
                {sourceContext}
              </p>
            )}
          </div>
        )
      }

      case 'search_result': {
        const data = metadata.data as SearchMetadata
        return (
          <div className="space-y-2">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Search Score: {Math.round(data.searchScore * 100)}%</span>
              <span>Rank: #{data.resultRank}</span>
            </div>
            {data.sourceQuality && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {data.sourceQuality.authority !== undefined && (
                  <span>Authority: {Math.round(data.sourceQuality.authority * 100)}%</span>
                )}
                {data.sourceQuality.freshness !== undefined && (
                  <span>Freshness: {Math.round(data.sourceQuality.freshness * 100)}%</span>
                )}
                {data.sourceQuality.coverage !== undefined && (
                  <span>Coverage: {Math.round(data.sourceQuality.coverage * 100)}%</span>
                )}
              </div>
            )}
            {data.queryContext && (
              <p className="text-sm text-muted-foreground">
                Query: {data.queryContext}
              </p>
            )}
          </div>
        )
      }

      case 'chat_message': {
        const data = metadata.data as ChatMetadata
        return (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Conversation: {data.conversationId}</span>
            <span>Time: {new Date(data.timestamp).toLocaleTimeString()}</span>
            {data.messageContext && (
              <span className="text-xs">Context: {data.messageContext}</span>
            )}
          </div>
        )
      }

      default:
        return null
    }
  }

  // Update the renderBookmarkCard function
  const renderBookmarkCard = (bookmark: EnhancedBookmark, index: number) => (
    <Card key={bookmark.id} className={cn("mb-4", index % 2 === 1 && "bg-muted/50")}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{bookmark.content}</CardTitle>
              <Badge>{bookmark.metadata.type.replace('_', ' ')}</Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(bookmark.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Only show organization info if it's meaningful */}
          {bookmark.organization.category !== 'uncategorized' && bookmark.organization.tags.length > 0 && (
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
          )}
          
          {renderMetadata(bookmark)}
          
          {/* Only show analytics if they're meaningful */}
          {bookmark.analytics.useCount > 0 && (
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              <span>Last Used: {new Date(bookmark.analytics.lastAccessed).toLocaleDateString()}</span>
              <span>Used: {bookmark.analytics.useCount} times</span>
            </div>
          )}
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
        {isLoading && page === 1 ? (
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
            {filteredBookmarks.map((bookmark, index) => renderBookmarkCard(bookmark, index))}
            {hasMore && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setPage(p => p + 1)}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  )
} 