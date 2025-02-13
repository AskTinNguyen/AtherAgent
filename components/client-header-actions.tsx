'use client'

import { Button } from '@/components/ui/button'
import { useResearch } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import { BarChart2, Bookmark, Brain } from 'lucide-react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { UsageStats } from './usage-stats'

export function ClientHeaderActions() {
  const { data: session } = useSession()
  const [showUsage, setShowUsage] = useState(false)
  const router = useRouter()
  const { state, startResearch } = useResearch()

  return (
    <div className="flex items-center gap-2">
      {session ? (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "text-muted-foreground hover:text-primary",
                    state.isActive && "text-primary"
                  )}
                  onClick={() => startResearch()}
                >
                  <Brain className={cn(
                    "w-5 h-5",
                    state.isActive && "animate-pulse"
                  )} />
                  <span className="sr-only">Toggle Research Panel</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{state.isActive ? 'Research Panel Active' : 'Toggle Research Panel'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-primary"
            onClick={() => router.push('/bookmarks')}
          >
            <Bookmark className="w-5 h-5" />
            <span className="sr-only">View Bookmarks</span>
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-primary"
            onClick={() => setShowUsage(true)}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="sr-only">View API Usage</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
          <UsageStats open={showUsage} onOpenChange={setShowUsage} />
        </>
      ) : (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => signIn()}
        >
          Sign In
        </Button>
      )}
    </div>
  )
}

export default ClientHeaderActions 