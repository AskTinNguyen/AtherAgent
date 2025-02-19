import { createServerClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'
import { type CookieStore, RequestCookieStore, ServerCookieStore } from './cookie-store'
import { type Database } from './database.types'

// Create a Supabase client with the provided cookie store
function createClientWithStore(cookieStore: CookieStore) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options) {
          cookieStore.remove(name, options)
        },
      },
    }
  )
}

// For use in app directory (Server Components)
export async function createClient() {
  return createClientWithStore(new ServerCookieStore())
}

// For use in pages directory or API routes
export function createClientFromRequest(
  req: { cookies: { [key: string]: string } },
  res: { setHeader: (name: string, value: string) => void }
) {
  return createClientWithStore(new RequestCookieStore(req, res))
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