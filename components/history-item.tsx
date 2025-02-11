'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Chat } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

type HistoryItemProps = {
  chat: Chat
}

const formatDateWithTime = (date: Date | string) => {
  const parsedDate = new Date(date)
  const now = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (
    parsedDate.getDate() === now.getDate() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getFullYear() === now.getFullYear()
  ) {
    return `Today, ${formatTime(parsedDate)}`
  } else if (
    parsedDate.getDate() === yesterday.getDate() &&
    parsedDate.getMonth() === yesterday.getMonth() &&
    parsedDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday, ${formatTime(parsedDate)}`
  } else {
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

const HistoryItem: React.FC<HistoryItemProps> = ({ chat }) => {
  const pathname = usePathname()
  const isActive = pathname === chat.path
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ensure path is always defined and properly formatted
  const chatPath = chat.path || `/search/${chat.id}`

  const handleDelete = async () => {
    if (!chat.id) {
      setError('Invalid chat ID')
      return
    }

    try {
      setIsDeleting(true)
      setError(null)
      
      const response = await fetch(`/api/chat/${chat.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to delete chat')
      }
      
      // Refresh the page to update the history
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting chat:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete chat')
    } finally {
      setIsDeleting(false)
    }
  }

  // Don't render invalid chat items
  if (!chat.id || !chat.title) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center hover:bg-muted cursor-pointer p-2 rounded border relative group',
        isActive ? 'bg-muted/70 border-border' : 'border-transparent'
      )}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Link
        href={chatPath}
        className="flex-1 min-w-0 overflow-hidden"
      >
        <div className="text-xs font-medium truncate select-none">
          {chat.title}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDateWithTime(chat.createdAt)}
        </div>
      </Link>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 p-0 opacity-0 transition-opacity shrink-0 z-10 relative",
              showDelete && "opacity-100",
              isDeleting && "pointer-events-none"
            )}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
              {error && (
                <div className="text-destructive mt-2">
                  Error: {error}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default HistoryItem
