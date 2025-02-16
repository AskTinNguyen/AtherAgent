import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from './database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              domain: options.domain,
              path: options.path,
              maxAge: options.maxAge,
              httpOnly: options.httpOnly,
              secure: options.secure,
              sameSite: options.sameSite,
            })
          } catch (error) {
            // Handle cookie setting error
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              domain: options.domain,
              path: options.path,
              maxAge: -1, // Expire immediately
              httpOnly: options.httpOnly,
              secure: options.secure,
              sameSite: options.sameSite,
            })
          } catch (error) {
            // Handle cookie removal error
          }
        },
      },
    }
  )
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  throw new Error(error.message || 'An error occurred while accessing the database')
}

// Type-safe database helper functions
export const createServerHelpers = (supabase: SupabaseClient<Database>) => ({
  from: supabase.from.bind(supabase),
  rpc: supabase.rpc.bind(supabase),
  auth: supabase.auth,
}) 