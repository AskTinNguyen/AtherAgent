'use client'

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
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface BookmarkManagerProps {
  className?: string
}

export function BookmarkManager({ className }: BookmarkManagerProps): JSX.Element {
  const { data: session } = useSession()
  const userId = session?.user?.email || 'anonymous'
  const ITEMS_PER_PAGE = 10

  const [bookmarks, setBookmarks] = useState<EnhancedBookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('created')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedType, setSelectedType] = useState('all')

  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState('')

  // Categories and tags from bookmarks
  const [categories, setCategories] = useState<Set<string>>(new Set())
  const [tags, setTags] = useState<Set<string>>(new Set())

  const fetchBookmarks = useCallback(async () => {
    try {
      setIsLoading(true)
      const offset = (page - 1) * ITEMS_PER_PAGE
      const queryParams = new URLSearchParams({
        userId,
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
        sortBy,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedTag !== 'all' && { tag: selectedTag }),
        ...(selectedType !== 'all' && { type: selectedType })
      })

      const response = await fetch(`/api/bookmarks?${queryParams}`)
      
      if (!response.ok) throw new Error('Failed to fetch bookmarks')
      
      const data = await response.json()
      
      setBookmarks(prev => {
        if (page === 1) return data
        return [...prev, ...data]
      })

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
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
      setError('Failed to fetch bookmarks')
    } finally {
      setIsLoading(false)
    }
  }, [userId, page, sortBy, selectedCategory, selectedTag, selectedType])

  // Load bookmarks when filters change
  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  // Manual refresh function
  const refreshBookmarks = () => {
    setPage(1)
    fetchBookmarks()
  }

  const deleteBookmark = async (bookmarkId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/bookmarks?userId=${userId}&bookmarkId=${bookmarkId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete bookmark')

      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
      toast.success('Bookmark deleted')
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      toast.error('Failed to delete bookmark')
    }
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
            onClick={() => deleteBookmark(bookmark.id)}
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
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-none p-4 space-y-4 border-t">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="research_suggestion">Research</SelectItem>
              <SelectItem value="search_result">Search</SelectItem>
              <SelectItem value="chat_message">Chat</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="accessed">Accessed</SelectItem>
              <SelectItem value="effectiveness">Effective</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Category" />
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

          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Tag" />
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
        <div className="text-destructive p-4 text-sm">
          Error: {error}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
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
          </>
        )}
        </div>
      </ScrollArea>
    </div>
  )
} 