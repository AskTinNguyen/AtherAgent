'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function SessionSync() {
  const { data: nextAuthSession } = useSession()
  const supabase = useSupabase()
  const [lastSyncedToken, setLastSyncedToken] = useState<string | null>(null)
  const [isInitialSync, setIsInitialSync] = useState(true)

  useEffect(() => {
    const syncSessions = async () => {
      try {
        // Only proceed if we have NextAuth tokens
        if (nextAuthSession?.user?.accessToken && nextAuthSession?.user?.refreshToken) {
          // Check if we need to sync (either initial sync or token changed)
          if (isInitialSync || lastSyncedToken !== nextAuthSession.user.accessToken) {
            console.log('Syncing sessions...')
            
            // Set the Supabase session
            const { error } = await supabase.auth.setSession({
              access_token: nextAuthSession.user.accessToken,
              refresh_token: nextAuthSession.user.refreshToken,
            })

            if (error) {
              console.error('Error syncing sessions:', error)
              toast.error('Failed to sync authentication state')
              return
            }

            // Update last synced token
            setLastSyncedToken(nextAuthSession.user.accessToken)
            setIsInitialSync(false)
            console.log('Sessions synced successfully')
          }
        } else if (!isInitialSync && !nextAuthSession?.user) {
          // If we had a session before and now it's gone, sign out from Supabase
          console.log('NextAuth session ended, signing out from Supabase...')
          await supabase.auth.signOut()
          setLastSyncedToken(null)
        }
      } catch (error) {
        console.error('Session sync error:', error)
        toast.error('Failed to sync authentication state')
      }
    }

    syncSessions()
  }, [nextAuthSession, supabase.auth, isInitialSync, lastSyncedToken])

  // Subscribe to Supabase auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth state changed:', { event, session })
      
      if (event === 'SIGNED_OUT') {
        setLastSyncedToken(null)
        setIsInitialSync(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return null
} 