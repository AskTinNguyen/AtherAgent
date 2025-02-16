'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSupabase } from './supabase-provider'

interface StorageContextType {
  isReady: boolean
  error: Error | null
}

const StorageContext = createContext<StorageContextType>({
  isReady: false,
  error: null
})

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const supabase = useSupabase()

  useEffect(() => {
    async function initializeStorage() {
      try {
        // Test Supabase storage access
        if (!process.env.NEXT_PUBLIC_DISABLE_AUTH) {
          await supabase.storage.listBuckets()
        }
        
        // If we get here, storage is working
        setIsReady(true)
      } catch (err) {
        console.error('Storage initialization error:', err)
        setError(err instanceof Error ? err : new Error('Failed to initialize storage'))
      }
    }

    initializeStorage()
  }, [supabase])

  return (
    <StorageContext.Provider value={{ isReady, error }}>
      {children}
    </StorageContext.Provider>
  )
}

export function useStorage() {
  const context = useContext(StorageContext)
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider')
  }
  return context
} 