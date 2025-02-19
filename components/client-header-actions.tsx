'use client'

import { Button } from '@/components/ui/button'
import { useResearch } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { BarChart2, Bookmark, Brain, Clipboard } from 'lucide-react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SupabaseAuthDialog } from './auth/supabase-auth-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { UsageStats } from './usage-stats'

export function ClientHeaderActions() {
  const { data: session } = useSession()
  const [showUsage, setShowUsage] = useState(false)
  const [supabaseUser, setSupabaseUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const router = useRouter()
  const { state } = useResearch()
  const supabase = createClientComponentClient()

  // Debug logging at the top level
  console.log('Auth Debug:', {
    hasSession: !!session,
    hasSupabaseUser: !!supabaseUser,
    sessionData: session,
    supabaseUserData: supabaseUser,
    userProfileData: userProfile
  })

  useEffect(() => {
    // Check Supabase session and fetch profile
    const checkSupabaseAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSupabaseUser(session?.user || null)
      
      if (session?.user?.id) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setUserProfile(profile)
      }
    }
    
    checkSupabaseAuth()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSupabaseUser(session?.user || null)
      
      if (session?.user?.id) {
        // Fetch user profile on auth state change
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Debug logging
  console.log('NextAuth session:', session)
  console.log('Supabase user:', supabaseUser)

  const handleSupabaseSignIn = () => {
    setShowAuthDialog(true)
  }

  const handleSupabaseSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Signed out from Supabase')
      router.refresh() // Refresh the page to update auth state
    } catch (error) {
      console.error('Supabase sign out error:', error)
      toast.error('Failed to sign out from Supabase')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {/* Show main actions if either auth is present */}
        {(!!session || !!supabaseUser) && (
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

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => router.push('/tasks')}
                  >
                    <Clipboard className="w-5 h-5" />
                    <span className="sr-only">Task Management</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Task Management</p>
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
          </>
        )}

        {/* Auth Buttons Section */}
        <div className="flex items-center gap-2">
          {/* NextAuth Section */}
          {session ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => signOut()}
            >
              NextAuth Sign Out
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => signIn()}
            >
              Sign in with NextAuth
            </Button>
          )}

          {/* Supabase Section */}
          {supabaseUser ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSupabaseSignOut}
                    className="flex items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      🤖
                    </span>
                    <span className="max-w-[150px] truncate">
                      {userProfile?.full_name || userProfile?.username || supabaseUser.email}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign out from Supabase</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleSupabaseSignIn}
                    className="flex items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      🤖
                    </span>
                    Sign in with Supabase
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign in to access Ather features</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <UsageStats open={showUsage} onOpenChange={setShowUsage} />
      </div>

      <SupabaseAuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />
    </div>
  )
}

export default ClientHeaderActions 