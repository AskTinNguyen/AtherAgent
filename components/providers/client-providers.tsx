'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SessionSync } from './session-sync'
import { StorageProvider } from './storage-provider'
import SupabaseProvider from './supabase-provider'

export function ClientProviders({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseProvider>
      <StorageProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionSync />
          {children}
          <Toaster />
        </ThemeProvider>
      </StorageProvider>
    </SupabaseProvider>
  )
} 