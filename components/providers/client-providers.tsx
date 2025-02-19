'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { SessionSync } from './session-sync'
import { StorageProvider } from './storage-provider'
import SupabaseProvider from './supabase-provider'

export function ClientProviders({
  children
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  )
} 