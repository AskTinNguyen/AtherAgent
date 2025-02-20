'use client'

import { useAuth } from '@/components/providers/supabase-provider'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export function AuthStatus() {
  const { user, isLoading, signOut } = useAuth()

  if (isLoading) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground/50 hover:text-primary"
            onClick={user ? () => signOut() : undefined}
          >
            <User className={cn("h-[18px] w-[18px]", user ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400")} />
            <span className="sr-only">{user ? 'Sign Out' : 'Not Signed In'}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {user ? (
            <span>Signed in as {user.email}</span>
          ) : (
            <span>Not signed in</span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 