'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function AuthStatus() {
  const { data: session, status } = useSession()
  const supabase = useSupabase()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const isLoading = status === 'loading'

  useEffect(() => {
    async function getSupabaseSession() {
      try {
        const { data: { session: supabaseSession }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (supabaseSession?.user?.email) {
          setUserEmail(supabaseSession.user.email)
        }
      } catch (e) {
        console.error('Error getting Supabase session:', e)
        setError(e instanceof Error ? e : new Error('Failed to get Supabase session'))
      }
    }
    
    if (status === 'authenticated' && session?.user?.email) {
      setUserEmail(session.user.email)
    } else {
      getSupabaseSession()
    }

    // Subscribe to auth changes
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (e) {
      console.error('Error setting up auth subscription:', e)
      setError(e instanceof Error ? e : new Error('Failed to set up auth subscription'))
      return () => {}
    }
  }, [status, session, supabase.auth])

  if (isLoading) return null

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-red-50 p-4 shadow-lg">
        <p className="text-sm font-medium text-red-600">
          Authentication Error: {error.message}
        </p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-background/80 p-4 shadow-lg backdrop-blur">
      <p className="text-sm font-medium">
        {userEmail ? (
          <span className="text-green-600 dark:text-green-400">
            Signed in as {userEmail}
          </span>
        ) : (
          <span className="text-yellow-600 dark:text-yellow-400">
            Not signed in
          </span>
        )}
      </p>
    </div>
  )
} 