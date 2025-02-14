'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSidebarContext } from '@/lib/contexts/sidebar-context'
import { generateId } from 'ai'
import { ChevronLeft, ChevronRight, PlusCircle, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function SidebarHeader() {
  const router = useRouter()
  const { isExpanded, toggleSidebar, updateSearchQuery } = useSidebarContext()

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearchQuery(e.target.value)
  }, [updateSearchQuery])

  const handleNewChat = useCallback(() => {
    const id = generateId()
    router.push(`/chat/${id}`)
  }, [router])

  const enableSaveChatHistory = process.env.NEXT_PUBLIC_ENABLE_SAVE_CHAT_HISTORY === 'true'

  return (
    <div className="flex flex-col space-y-2 py-4 px-2">
      <div className="px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:flex hidden"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          {isExpanded && <span className="font-bold">AtherAgent</span>}
        </div>
      </div>
      {isExpanded && enableSaveChatHistory && (
        <>
          <div className="px-4">
            <Button 
              variant="secondary" 
              className="w-full justify-start" 
              onClick={handleNewChat}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
          <div className="px-4 relative">
            <Search className="absolute left-7 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-9"
              onChange={handleSearchChange}
            />
          </div>
        </>
      )}
    </div>
  )
} 