'use client'

import { Button } from '@/components/ui/button'
import { useResearch } from '@/lib/contexts/research-context'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import { BarChart2, Bookmark, Brain, LogIn, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { UsageStats } from './usage-stats'

export function ClientHeaderActions() {
  const [user, setUser] = useState<User | null>(null)
  const [showUsage, setShowUsage] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState('')
  const router = useRouter()
  const { state, toggleSearch } = useResearch()
  const supabase = createClient()

  useEffect(() => {
    // Get authenticated user
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(user)
      } catch (err) {
        console.error('Error fetching user:', err)
        setUser(null)
      }
    }

    fetchUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // Verify the user with getUser after session change
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user) {
          setUser(user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error

      // Verify the user after sign in
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      
      setUser(user)
      setShowAuthDialog(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      router.refresh()
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {user ? (
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
                  onClick={() => toggleSearch()}
                >
                  <Brain className={cn(
                    "w-5 h-5",
                    state.isActive && "animate-pulse"
                  )} />
                  <span className="sr-only">Toggle Research Panel</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Toggle Research Panel
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
                  onClick={handleSignOut}
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
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogTrigger asChild>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <LogIn className="w-5 h-5" />
                    <span className="sr-only">Sign In</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Sign In
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign In</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                id="email"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                id="password"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={handleSignIn}>Sign In</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default ClientHeaderActions 