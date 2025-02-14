"use client"

import { Draggable } from "@/components/dnd/draggable"
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
import { DragItem, ItemTypes } from "@/lib/contexts/drag-drop-context"
import { Chat } from "@/lib/redis/types/folders"
import { cn } from "@/lib/utils"
import { MessageCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface ChatItemProps {
  chat: Chat
  isActive?: boolean
  isExpanded?: boolean
  onDelete?: () => Promise<void>
  className?: string
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

export function ChatItem({
  chat,
  isActive = false,
  isExpanded = true,
  onDelete,
  className = ""
}: ChatItemProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chatPath = `/chat/${chat.id}`

  const dragItem: DragItem = {
    type: ItemTypes.CHAT,
    id: chat.id,
    index: chat.order
  }

  const handleDelete = async () => {
    if (!chat.id) {
      setError('Invalid chat ID')
      return
    }

    try {
      setIsDeleting(true)
      setError(null)
      await onDelete?.()
    } catch (error) {
      console.error('Error deleting chat:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete chat')
    } finally {
      setIsDeleting(false)
    }
  }

  // Compact view for collapsed sidebar
  if (!isExpanded) {
    return (
      <Link href={chatPath}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-full h-8 my-1",
            isActive && "bg-accent"
          )}
          title={chat.title}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </Link>
    )
  }

  return (
    <Draggable item={dragItem}>
      <div
        className={cn(
          'flex items-center hover:bg-muted cursor-pointer p-2 rounded border relative group',
          isActive ? 'bg-muted/70 border-border' : 'border-transparent',
          className
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
        
        {onDelete && (
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
        )}
      </div>
    </Draggable>
  )
} 