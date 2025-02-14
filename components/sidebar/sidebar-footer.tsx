'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebarContext } from '@/lib/contexts/sidebar-context'
import { BarChart2, LogOut, Settings } from 'lucide-react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { DarkModeToggle } from '../mode-toggle'
import { IconLogo } from '../ui/icons'
import { UsageStats } from '../usage-stats'

export function SidebarFooter() {
  const { isExpanded } = useSidebarContext()
  const [showUsage, setShowUsage] = useState(false)
  const { data: session } = useSession()

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
                  {session ? (
                    <>
                      <p className="text-sm font-medium">{session.user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                    </>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => signIn()}
                      className="bg-transparent hover:bg-accent/50"
                    >
                      Sign In
                    </Button>
                  )}
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
                {session && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => signOut()}
                    title="Sign Out"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <IconLogo className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              {!session ? (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => signIn()}
                  className="bg-transparent hover:bg-accent/50"
                  title="Sign In"
                >
                  <IconLogo className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => signOut()}
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
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