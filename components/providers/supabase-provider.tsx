'use client'

import { createClient } from '@/lib/supabase/client'
import { AuthChangeEvent } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client cannot be used in server-side code')
  }

  try {
    if (!supabaseInstance) {
      // Check environment variables before creating client
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

const Context = createContext<ReturnType<typeof createClient> | null>(null)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [error, setError] = useState<Error | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    try {
      const client = getSupabaseClient()
      setSupabase(client)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to initialize Supabase client'
      console.error('Supabase initialization error:', e)
      setError(new Error(errorMessage))
    }
  }, [])

  useEffect(() => {
    if (!supabase || process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

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

  if (!supabase) {
    return null // or a loading state
  }

  return (
    <Context.Provider value={supabase}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === null) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 