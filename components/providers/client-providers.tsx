'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { BookmarkProvider } from '@/lib/contexts/bookmark-context'
import { ErrorBoundary } from 'react-error-boundary'
import { SignInModal } from '../auth/sign-in-modal'
import { StorageProvider } from './storage-provider'
import SupabaseProvider, { useAuth } from './supabase-provider'

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg max-w-md">
        <h2 className="text-red-600 dark:text-red-400 font-semibold mb-2">Application Error</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">{error.message}</p>
      </div>
    </div>
  )
}

export function ClientProviders({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SupabaseProvider>
        <AuthStateHandler>
          <StorageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <BookmarkProvider>
                {children}
                <Toaster />
                <SignInModalWrapper />
              </BookmarkProvider>
            </ThemeProvider>
          </StorageProvider>
        </AuthStateHandler>
      </SupabaseProvider>
    </ErrorBoundary>
  )
}

function AuthStateHandler({ children }: { children: React.ReactNode }) {
  const { isLoading, user, session } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    )
  }

  // If we're on a page that requires auth and user isn't authenticated,
  // the useAuth hook will handle the redirect
  return children
}

function SignInModalWrapper() {
  const { showSignInModal, setShowSignInModal } = useAuth()
  return (
    <SignInModal 
      isOpen={showSignInModal} 
      onClose={() => setShowSignInModal(false)} 
    />
  )
} 