import { useAuth } from '@/components/providers/supabase-provider'
import { useEffect, useState } from 'react'

interface AuthLoadingWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  timeout?: number
  onTimeout?: () => void
  requireAuth?: boolean
}

export function AuthLoadingWrapper({
  children,
  fallback,
  timeout = 5000,
  onTimeout,
  requireAuth = true
}: AuthLoadingWrapperProps) {
  const { isLoading, isAuthenticated, setShowSignInModal } = useAuth()
  const [showContent, setShowContent] = useState(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // Show sign in modal if auth is required but user is not authenticated
        setShowSignInModal(true)
      } else {
        // Show content if either auth is not required or user is authenticated
        setShowContent(true)
      }
    } else {
      // Set timeout for loading state
      timeoutId = setTimeout(() => {
        setHasTimedOut(true)
        onTimeout?.()
      }, timeout)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isLoading, isAuthenticated, requireAuth, timeout, onTimeout, setShowSignInModal])

  if (hasTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <p className="text-muted-foreground mb-4">
          Taking longer than expected to load...
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:underline"
        >
          Refresh the page
        </button>
      </div>
    )
  }

  if (!showContent) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  return <>{children}</>
} 