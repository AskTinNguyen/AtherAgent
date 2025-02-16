import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (typeof window !== 'undefined') {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        `Supabase client creation failed: Missing environment variables.
         NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'defined' : 'missing'}
         NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'defined' : 'missing'}`
      )
    }

    if (!supabaseInstance) {
      supabaseInstance = createBrowserClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      )
    }
    return supabaseInstance
  }

  // For server-side usage
  return createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  throw new Error(error.message || 'An error occurred while accessing the database')
}

// Type-safe database helper functions
export const createBrowserHelpers = (supabase: ReturnType<typeof createBrowserClient<Database>>) => ({
  from: supabase.from.bind(supabase),
  rpc: supabase.rpc.bind(supabase),
  auth: supabase.auth,
}) 