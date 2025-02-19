'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type SupabaseContextType = {
  supabase: ReturnType<typeof createClientComponentClient> | null
  session: Session | null
  isLoading: boolean
}

const Context = createContext<SupabaseContextType | null>(null)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [supabase] = useState(() => createClientComponentClient())

  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error.message)
          return
        }

        if (mounted) {
          if (initialSession) {
            console.log('Initial session found:', initialSession.user.email)
            setSession(initialSession)
          } else {
            console.log('No initial session found')
            if (!process.env.NEXT_PUBLIC_DISABLE_AUTH) {
              router.push('/login')
            }
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email)
        
        if (mounted) {
          setSession(currentSession)

          if (event === 'SIGNED_OUT') {
            router.push('/login')
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <Context.Provider value={{ supabase, session, isLoading }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context.supabase
}

export const useSession = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSession must be used within a SupabaseProvider')
  }
  return context.session
}

export const useSupabaseContext = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSupabaseContext must be used within a SupabaseProvider')
  }
  return context
} 