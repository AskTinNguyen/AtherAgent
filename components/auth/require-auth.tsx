'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { SupabaseAuthDialog } from './supabase-auth-dialog'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [session, setSession] = useState<any>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { data: nextAuthSession } = useSession()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If user is authenticated with NextAuth, don't check Supabase
        if (nextAuthSession) {
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }

        // Check Supabase auth
        const { data: { session: supabaseSession } } = await supabase.auth.getSession()
        if (!supabaseSession) {
          setShowAuthDialog(true)
          setIsLoading(false)
          return
        }
        setSession(supabaseSession)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth error:', error)
        setShowAuthDialog(true)
      } finally {
        setIsLoading(false)
      }
    }

    // Only set up Supabase auth listener if not using NextAuth
    if (!nextAuthSession) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setSession(session)
          setIsAuthenticated(true)
          setShowAuthDialog(false)
          setIsLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setIsAuthenticated(false)
          setShowAuthDialog(true)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    checkAuth()
  }, [supabase, router, nextAuthSession])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[200px]">
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center min-h-[200px]">
            <p className="text-muted-foreground">Please sign in to continue</p>
          </div>
        </div>
        <SupabaseAuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog}
        />
      </>
    )
  }

  // Clone children with session prop
  const childrenWithSession = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { initialSession: session })
    }
    return child
  })

  return <>{childrenWithSession}</>
} 