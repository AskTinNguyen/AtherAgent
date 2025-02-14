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
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { menuItems } from '@/lib/config/menu-items'
import { useSidebarContext } from '@/lib/contexts/sidebar-context'
import { type Chat } from '@/lib/types/index'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, MessageSquare, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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

interface ChatItemProps {
  chat: Chat
  isExpanded: boolean
}

function ChatItem({ chat, isExpanded }: ChatItemProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = pathname === chat.path
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chatPath = chat.path || `/chat/${chat.id}`

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
      
      router.refresh()
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting chat:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete chat')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!chat.id || !chat.title) {
    return null
  }

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
          <MessageSquare className="h-4 w-4" />
        </Button>
      </Link>
    )
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

export function SidebarContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { isExpanded, activeFolder } = useSidebarContext()
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [chats, setChats] = useState<Chat[]>([])
  const enableSaveChatHistory = process.env.NEXT_PUBLIC_ENABLE_SAVE_CHAT_HISTORY === 'true'

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }))
  }

  const handleItemClick = (path?: string) => {
    if (path) {
      router.push(path)
    }
  }

  // Fetch chats with refresh handling
  const fetchChats = useCallback(async () => {
    if (enableSaveChatHistory) {
      try {
        const res = await fetch('/api/chat')
        if (!res.ok) {
          throw new Error('Failed to fetch chats')
        }
        const data = await res.json()
        setChats(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch chats:', err)
        setChats([])
      }
    }
  }, [enableSaveChatHistory])

  // Initial fetch and refresh on pathname changes
  useEffect(() => {
    fetchChats()
  }, [fetchChats, pathname])

  return (
    <ScrollArea className="flex-1 px-2">
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between px-4">
            <span className="text-xs font-semibold">FOLDERS</span>
            {isExpanded && (
              <Button variant="ghost" size="icon" className="h-4 w-4">
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="mt-2 space-y-1">
            {menuItems.map((folder) => (
              <div key={folder.id}>
                <Button
                  variant="ghost"
                  size={isExpanded ? 'default' : 'icon'}
                  className={cn(
                    'w-full justify-start',
                    activeFolder === folder.id && 'bg-accent'
                  )}
                  onClick={() => isExpanded && toggleFolder(folder.id)}
                >
                  {folder.icon && <folder.icon className="h-4 w-4" />}
                  {isExpanded && (
                    <>
                      <span className="ml-2 flex-1">{folder.name}</span>
                      {folder.items && (
                        expandedFolders[folder.id] ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                      )}
                    </>
                  )}
                </Button>
                {isExpanded && expandedFolders[folder.id] && folder.items && (
                  <div className="ml-4 mt-1 space-y-1">
                    {folder.items.map((item) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        size="default"
                        className="w-full justify-start"
                        onClick={() => handleItemClick(item.path)}
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span className="ml-2">{item.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {enableSaveChatHistory && (
          <>
            <Separator />

            <div>
              <div className="px-4">
                <span className="text-xs font-semibold">RECENT CHATS</span>
              </div>
              <div className="mt-2 space-y-1">
                {chats.map((chat) => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat}
                    isExpanded={isExpanded}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  )
}