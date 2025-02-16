'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function SessionSync() {
  const { data: session } = useSession()
  const supabase = useSupabase()

  useEffect(() => {
    if (session?.user?.accessToken && session?.user?.refreshToken) {
      supabase.auth.setSession({
        access_token: session.user.accessToken,
        refresh_token: session.user.refreshToken,
      })
    }
  }, [session, supabase.auth])

  return null
} 