'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { menuItems } from '@/lib/config/menu-items'
import { useSidebarContext } from '@/lib/contexts/sidebar-context'
import { type Chat } from '@/lib/types/index'
import { Plus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ChatItem } from './chat-item'
import { FolderItem } from './folder-item'

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

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to delete chat')
      }
      
      router.refresh()
      if (pathname.includes(chatId)) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }

  const handleAddChatToFolder = async (folderId: string, chatId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to add chat to folder')
      }

      router.refresh()
    } catch (error) {
      console.error('Error adding chat to folder:', error)
      throw error
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
              <FolderItem
                key={folder.id}
                folder={{
                  id: folder.id,
                  name: folder.name,
                  order: 0,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  chats: []
                }}
                isActive={activeFolder === folder.id}
                isExpanded={isExpanded}
                onToggle={() => toggleFolder(folder.id)}
                onDrop={(chatId) => handleAddChatToFolder(folder.id, chatId)}
              />
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
                    isActive={pathname === `/chat/${chat.id}`}
                    isExpanded={isExpanded}
                    onDelete={() => handleDeleteChat(chat.id)}
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