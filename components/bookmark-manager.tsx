'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { RequireAuth } from './auth/require-auth'

interface Bookmark {
  id: string
  title: string
  url: string
  created_at: string
  user_id: string
}

export function BookmarkManager() {
  const { user } = useSupabase()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadBookmarks() {
      if (!user) return

      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setBookmarks(data || [])
      } catch (error) {
        console.error('Error loading bookmarks:', error)
        toast.error('Failed to load bookmarks')
      } finally {
        setIsLoading(false)
      }
    }

    loadBookmarks()
  }, [user])

  const handleBookmarkClick = (bookmark: Bookmark) => {
    router.push(bookmark.url)
  }

  return (
    <RequireAuth>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Your Bookmarks</CardTitle>
          <CardDescription>
            Access your saved research and conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : bookmarks.length > 0 ? (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <Button
                    key={bookmark.id}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      'hover:bg-muted/50'
                    )}
                    onClick={() => handleBookmarkClick(bookmark)}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{bookmark.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(bookmark.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32">
                <p className="text-muted-foreground">No bookmarks yet</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </RequireAuth>
  )
} 