'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  BarChart2,
  Bookmark,
  Brain,
  CheckSquare,
  Database,
  HelpCircle,
  LogIn,
  LogOut
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from './providers/supabase-provider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { UsageStats } from './usage-stats'

export function ClientHeaderActions() {
  const { user, setShowSignInModal, signOut } = useAuth()
  const [showUsage, setShowUsage] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isSearchActive = pathname?.startsWith('/search')

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <style jsx global>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            .icon-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}</style>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "text-muted-foreground hover:text-primary",
                    isSearchActive && "text-primary"
                  )}
                  onClick={() => router.push('/search')}
                >
                  <Brain 
                    className={cn(
                      "w-5 h-5",
                      isSearchActive && "text-primary icon-pulse"
                    )} 
                  />
                  <span className="sr-only">Chat Search</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Chat Search
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary"
                >
                  <CheckSquare className="w-5 h-5" />
                  <span className="sr-only">Tasks</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Tasks (Coming Soon)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Database className="w-5 h-5" />
                  <span className="sr-only">Knowledge Base</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Knowledge Base (Coming Soon)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="sr-only">Tips & Tutorials</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Tips & Tutorials (Coming Soon)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => router.push('/bookmarks')}
                >
                  <Bookmark className="w-5 h-5" />
                  <span className="sr-only">View Bookmarks</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                View Bookmarks
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setShowUsage(true)}
                >
                  <BarChart2 className="w-5 h-5" />
                  <span className="sr-only">View API Usage</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                View API Usage
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-primary"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="sr-only">Sign Out</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Sign Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <UsageStats open={showUsage} onOpenChange={setShowUsage} />
        </>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowSignInModal(true)}
              >
                <LogIn className="w-5 h-5" />
                <span className="sr-only">Sign In</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Sign In
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

export default ClientHeaderActions 