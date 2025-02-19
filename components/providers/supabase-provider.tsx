'use client'

import { createClientAuth, type AuthSession } from '@/lib/supabase/auth'
import { type Database } from '@/lib/supabase/database.types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createContext, useContext, useEffect, useState } from 'react'

interface SupabaseContext {
  session: AuthSession['session']
  user: AuthSession['user']
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  auth: ReturnType<typeof createClientComponentClient<Database>>['auth']
  from: ReturnType<typeof createClientComponentClient<Database>>['from']
}

const supabase = createClientComponentClient<Database>()

const SupabaseContext = createContext<SupabaseContext>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => ({ data: null, error: new Error('No provider') }),
  signOut: async () => ({ error: new Error('No provider') }),
  auth: supabase.auth,
  from: supabase.from,
})

export function useSupabase() {
  return useContext(SupabaseContext)
}

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<AuthSession['session']>(null)
  const [user, setUser] = useState<AuthSession['user']>(null)
  const [isLoading, setIsLoading] = useState(true)
  const auth = createClientAuth()

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ session, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      }
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Subscribe to auth changes
    const subscription = auth.onAuthStateChange((session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value: SupabaseContext = {
    session,
    user,
    isLoading,
    signIn: auth.signIn,
    signOut: auth.signOut,
    auth: supabase.auth,
    from: supabase.from,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
} 