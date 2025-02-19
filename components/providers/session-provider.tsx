'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { createContext, useContext, useEffect, useState } from 'react'

// Create a context for Supabase session
export const SupabaseSessionContext = createContext<any>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [supabaseSession, setSupabaseSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial Supabase session:', session)
        setSupabaseSession(session)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session })
      if (event === 'SIGNED_IN') {
        // Fetch fresh session when signed in
        const { data: { session: freshSession } } = await supabase.auth.getSession()
        console.log('Fresh session after sign in:', freshSession)
        setSupabaseSession(freshSession)
      } else if (event === 'SIGNED_OUT') {
        setSupabaseSession(null)
      } else if (session) {
        setSupabaseSession(session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (isLoading) {
    return null // Or a loading spinner if needed
  }

  return (
    <NextAuthSessionProvider>
      <SupabaseSessionContext.Provider value={supabaseSession}>
        {children}
      </SupabaseSessionContext.Provider>
    </NextAuthSessionProvider>
  )
}

// Custom hook to access Supabase session
export const useSupabaseSession = () => {
  const session = useContext(SupabaseSessionContext)
  return session
}

export default SessionProvider 