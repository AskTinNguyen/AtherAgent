'use client'

import { createClient } from '@/lib/supabase/client'
import { AUTH_COOKIE_NAME, cookies, REFRESH_COOKIE_NAME } from '@/lib/utils/cookies'
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client cannot be used in server-side code')
  }

  try {
    if (!supabaseInstance) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error(
          `Missing required environment variables:
           NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'missing'}
           NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'defined' : 'missing'}`
        )
      }
      supabaseInstance = createClient()
    }
    return supabaseInstance
  } catch (error) {
    console.error('Error initializing Supabase client:', error)
    throw error
  }
}

interface SupabaseContextType {
  supabase: ReturnType<typeof createClient> | null
  session: Session | null
  user: User | null
  isLoading: boolean
  showSignInModal: boolean
  setShowSignInModal: (show: boolean) => void
  signOut: () => Promise<void>
}

const Context = createContext<SupabaseContextType>({
  supabase: null,
  session: null,
  user: null,
  isLoading: true,
  showSignInModal: false,
  setShowSignInModal: () => {},
  signOut: async () => {}
})

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignInModal, setShowSignInModal] = useState(false)

  // Initialize Supabase client
  useEffect(() => {
    try {
      const client = getSupabaseClient()
      setSupabase(client)
      setIsInitialized(true)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to initialize Supabase client'
      console.error('Supabase initialization error:', e)
      setError(new Error(errorMessage))
      setIsLoading(false)
    }
  }, [])

  // Handle session initialization and auth state
  useEffect(() => {
    if (!supabase || !isInitialized) return

    const initSession = async () => {
      try {
        // Check for existing cookies
        const authToken = cookies.get(AUTH_COOKIE_NAME)
        const refreshToken = cookies.get(REFRESH_COOKIE_NAME)

        let currentSession = null

        // If we have tokens in cookies, try to use them
        if (authToken && refreshToken) {
          const { data: { session: tokenSession }, error: tokenError } = 
            await supabase.auth.setSession({
              access_token: authToken,
              refresh_token: refreshToken
            })
          
          if (!tokenError) {
            currentSession = tokenSession
          }
        }

        // If no valid tokens in cookies, try to get session normally
        if (!currentSession) {
          const { data: { session: normalSession }, error: sessionError } = 
            await supabase.auth.getSession()
          
          if (!sessionError) {
            currentSession = normalSession
          }
        }

        // Update state with session and user
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
      } catch (e) {
        console.error('Error getting initial session:', e)
        setError(new Error('Failed to initialize session'))
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [supabase, isInitialized])

  // Handle auth state changes
  useEffect(() => {
    if (!supabase || !isInitialized || process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      
      if (event === 'SIGNED_OUT') {
        cookies.remove(AUTH_COOKIE_NAME)
        cookies.remove(REFRESH_COOKIE_NAME)
        router.push('/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession) {
          cookies.set(AUTH_COOKIE_NAME, currentSession.access_token)
          cookies.set(REFRESH_COOKIE_NAME, currentSession.refresh_token)
        }
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase, isInitialized])

  const signOut = async () => {
    if (!supabase) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear cookies
      cookies.remove(AUTH_COOKIE_NAME)
      cookies.remove(REFRESH_COOKIE_NAME)
      
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md">
        <h3 className="font-bold">Supabase Initialization Error</h3>
        <p>{error.message}</p>
        <p className="text-sm mt-2">
          Please check your environment variables and make sure they are properly configured.
        </p>
      </div>
    )
  }

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    )
  }

  return (
    <Context.Provider value={{ 
      supabase, 
      session, 
      user,
      isLoading: false,
      showSignInModal,
      setShowSignInModal,
      signOut
    }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (!context.supabase) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context.supabase
}

export const useSession = () => {
  const context = useContext(Context)
  return context.session
}

export const useUser = () => {
  const context = useContext(Context)
  return context.user
}

export const useAuth = () => {
  const context = useContext(Context)
  return {
    session: context.session,
    user: context.user,
    isLoading: context.isLoading,
    showSignInModal: context.showSignInModal,
    setShowSignInModal: context.setShowSignInModal,
    signOut: context.signOut,
    isAuthenticated: !!context.session?.user
  }
} 