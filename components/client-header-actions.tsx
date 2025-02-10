'use client'

import { Button } from '@/components/ui/button'
import { BarChart2 } from 'lucide-react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { UsageStats } from './usage-stats'

export function ClientHeaderActions() {
  const { data: session } = useSession()
  const [showUsage, setShowUsage] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {session ? (
        <>
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