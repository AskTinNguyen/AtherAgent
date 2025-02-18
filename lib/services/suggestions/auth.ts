import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete(name, options)
        }
      }
    }
  )
}

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabase()
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  if (authError || !session) {
    throw new Error('Authentication required')
  }

  return { supabase, session }
} 