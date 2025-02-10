import { BookmarkManager } from '@/components/bookmark-manager'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Bookmarks | Research Assistant',
  description: 'Manage your research bookmarks and saved content'
}

export default function BookmarksPage() {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Chat</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
        </div>
        <p className="text-muted-foreground">
          Manage and organize your saved research content and sources
        </p>
      </div>
      
      <BookmarkManager className="mt-6" />
    </div>
  )
} 