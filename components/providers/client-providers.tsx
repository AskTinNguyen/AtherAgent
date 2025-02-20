'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SignInModal } from '../auth/sign-in-modal'
import { StorageProvider } from './storage-provider'
import SupabaseProvider, { useAuth } from './supabase-provider'

export function ClientProviders({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseProvider>
      <SupabaseInitializer>
        <StorageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <SignInModalWrapper />
          </ThemeProvider>
        </StorageProvider>
      </SupabaseInitializer>
    </SupabaseProvider>
  )
}

function SupabaseInitializer({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div> // You can replace this with a proper loading spinner
  }

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