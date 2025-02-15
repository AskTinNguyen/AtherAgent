'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useSidebarContext } from '@/lib/contexts/sidebar-context'
import { Plus } from 'lucide-react'
import { History } from '../history'

export function SidebarContent() {
  const { isCollapsed } = useSidebarContext()

  if (isCollapsed) {
    return null
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 my-4">
        <Button className="w-full justify-start" variant="ghost">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1 my-2">
        <History location="sidebar" />
      </ScrollArea>
    </div>
  )
}