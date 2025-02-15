'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DragDropProvider } from '@/lib/contexts/drag-drop-context'
import { useSidebarContext } from '@/lib/contexts/sidebar-context'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { BookmarkManager } from './bookmark-manager'
import { SidebarContent } from './sidebar/sidebar-content'
import { SidebarFooter } from './sidebar/sidebar-footer'
import { SidebarHeader } from './sidebar/sidebar-header'
import { IconLogo } from './ui/icons'
import { useState, useEffect } from 'react'

export function Sidebar() {
  const { isExpanded, toggleSidebar } = useSidebarContext()
  const [showBookmarks, setShowBookmarks] = useState(false)

  // Delay showing bookmarks until sidebar is expanded
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setShowBookmarks(true), 100)
      return () => clearTimeout(timer)
    } else {
      setShowBookmarks(false)
    }
  }, [isExpanded])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-30 h-screen border-r bg-background transition-all duration-300 hidden lg:flex",
          isExpanded ? "w-[400px]" : "w-0 border-0"
        )}
        aria-label="Navigation Sidebar"
      >
        <div className="flex flex-col h-full w-full">
          <SidebarHeader />
          <div className="flex-1 overflow-hidden">
            {isExpanded && (
              <DragDropProvider>
                <div className="h-full flex flex-col">
                  <SidebarContent />
                  <div className="flex-1 overflow-hidden">
                    {showBookmarks && <BookmarkManager className="h-full" />}
                  </div>
                </div>
              </DragDropProvider>
            )}
          </div>
          <SidebarFooter />
        </div>
      </aside>

      {/* Toggle Button when Sidebar is Hidden */}
      {!isExpanded && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-30 hidden lg:flex bg-transparent hover:bg-accent/50"
          aria-label="Expand sidebar"
        >
          <IconLogo className="h-5 w-5" />
        </Button>
      )}

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed left-4 top-4 z-40"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <div className="flex flex-col h-full">
            <SidebarHeader />
            <div className="flex-1 overflow-hidden">
              <DragDropProvider>
                <div className="h-full flex flex-col">
                  <SidebarContent />
                  <div className="flex-1 overflow-hidden">
                    {showBookmarks && <BookmarkManager className="h-full" />}
                  </div>
                </div>
              </DragDropProvider>
            </div>
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
