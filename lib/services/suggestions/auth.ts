import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies()
          cookieStore.set({
            name,
            value,
            ...options
          })
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies()
          cookieStore.set({
            name,
            value: '',
            ...options,
            maxAge: 0
          })
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