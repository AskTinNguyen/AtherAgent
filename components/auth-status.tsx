'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { useState } from 'react'

export function AuthStatus() {
  const { user, isLoading } = useSupabase()
  const [error, setError] = useState<Error | null>(null)

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-red-50 p-4 shadow-lg">
        <p className="text-sm font-medium text-red-600">
          Authentication Error: {error.message}
        </p>
      </div>
    )
  }

  if (isLoading) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-background/80 p-4 shadow-lg backdrop-blur">
      <p className="text-sm font-medium">
        {user ? (
          <span className="text-green-600 dark:text-green-400">
            Signed in as {user.email}
          </span>
        ) : (
          <span className="text-yellow-600 dark:text-yellow-400">
            Not signed in
          </span>
        )}
      </p>
    </div>
  )
} 