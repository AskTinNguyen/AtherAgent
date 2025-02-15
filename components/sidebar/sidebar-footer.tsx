'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebarContext } from '@/lib/contexts/sidebar-context'
import { BarChart2, Settings } from 'lucide-react'
import { useState } from 'react'
import { DarkModeToggle } from '../mode-toggle'
import { IconLogo } from '../ui/icons'
import { UsageStats } from '../usage-stats'

export function SidebarFooter() {
  const { isExpanded } = useSidebarContext()
  const [showUsage, setShowUsage] = useState(false)

  return (
    <div className="mt-auto">
      <Separator />
      <div className="p-4">
        <div className="flex items-center justify-between">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    <IconLogo className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 leading-none">
                  <p className="text-sm font-medium">Guest User</p>
                  <p className="text-xs text-muted-foreground">Local Session</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DarkModeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setShowUsage(true)}
                  title="View API Usage"
                >
                  <BarChart2 className="h-5 w-5" />
                  <span className="sr-only">View API Usage</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <IconLogo className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <DarkModeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowUsage(true)}
                title="View API Usage"
              >
                <BarChart2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <UsageStats open={showUsage} onOpenChange={setShowUsage} />
    </div>
  )
} 