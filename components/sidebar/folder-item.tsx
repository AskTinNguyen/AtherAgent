"use client"

import { Droppable } from "@/components/dnd/droppable"
import { Button } from "@/components/ui/button"
import { DragItem, ItemTypes } from "@/lib/contexts/drag-drop-context"
import { Folder } from "@/lib/redis/types/folders"
import type { Chat } from '@/lib/types/index'
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Folder as FolderIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { ChatItem } from "./chat-item"

interface FolderItemProps {
  folder: Folder
  isActive?: boolean
  isExpanded?: boolean
  isOpen?: boolean
  onDrop?: (chatId: string) => Promise<void>
  onToggle?: () => void
  className?: string
}

export function FolderItem({
  folder,
  isActive = false,
  isExpanded = true,
  isOpen = false,
  onDrop,
  onToggle,
  className = ""
}: FolderItemProps) {
  const [isOver, setIsOver] = useState(false)
  const [folderChats, setFolderChats] = useState<Record<string, Chat>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleDrop = async (item: DragItem) => {
    if (item.type === ItemTypes.CHAT && onDrop) {
      await onDrop(item.id)
    }
  }

  const fetchChatDetails = useCallback(async () => {
    if (!isOpen || folder.chats.length === 0) return

    setIsLoading(true)
    try {
      const chatPromises = folder.chats.map(async chatId => {
        try {
          const res = await fetch(`/api/chat/${chatId}`)
          if (!res.ok) throw new Error('Failed to fetch chat')
          const chat = await res.json()
          return { id: chatId, chat }
        } catch (err) {
          console.error(`Error fetching chat ${chatId}:`, err)
          return { 
            id: chatId, 
            chat: {
              id: chatId,
              title: "Error loading chat",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              order: Date.now()
            } 
          }
        }
      })

      const chats = await Promise.all(chatPromises)
      const chatMap = chats.reduce((acc, { id, chat }) => {
        acc[id] = chat
        return acc
      }, {} as Record<string, Chat>)

      setFolderChats(chatMap)
    } catch (err) {
      console.error('Error fetching chat details:', err)
    } finally {
      setIsLoading(false)
    }
  }, [folder.chats, isOpen])

  useEffect(() => {
    fetchChatDetails()
  }, [fetchChatDetails])

  // Compact view for collapsed sidebar
  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "w-full h-8 my-1",
          isActive && "bg-accent"
        )}
        title={folder.name}
      >
        <FolderIcon className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="space-y-1">
      <Droppable
        accept={[ItemTypes.CHAT]}
        onDrop={handleDrop}
        isValidDrop={(item: DragItem) => !folder.chats.includes(item.id)}
        className={cn(
          'flex items-center hover:bg-muted cursor-pointer p-2 rounded border relative group',
          isActive ? 'bg-muted/70 border-border' : 'border-transparent',
          isOver && 'border-primary',
          className
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-2 h-6 px-2"
          onClick={onToggle}
        >
          <FolderIcon className="h-4 w-4" />
          <span className="flex-1 text-left truncate">{folder.name}</span>
          {folder.chats.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {folder.chats.length}
            </span>
          )}
          {/* Always show chevron if folder has chats */}
          {folder.chats.length > 0 && (
            isOpen ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </Droppable>

      {/* Show chats when folder is open */}
      {isOpen && folder.chats.length > 0 && (
        <div className="pl-4 space-y-1">
          {folder.chats.map(chatId => {
            const chat = folderChats[chatId]
            return (
              <ChatItem
                key={chatId}
                chat={chat || {
                  id: chatId,
                  title: isLoading ? "Loading..." : "Error loading chat",
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  order: Date.now()
                }}
                isExpanded={isExpanded}
              />
            )
          })}
        </div>
      )}
    </div>
  )
} 