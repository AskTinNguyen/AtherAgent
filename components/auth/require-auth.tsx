'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SupabaseAuthDialog } from './supabase-auth-dialog'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { user, isLoading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      // Store the current path for redirect after login
      const currentPath = window.location.pathname
      if (currentPath !== '/login') {
        setShowAuthDialog(true)
      }
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Please sign in to access this content</p>
        </div>
        <SupabaseAuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
        />
      </>
    )
  }

  return <>{children}</>
} 