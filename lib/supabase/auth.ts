import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type AuthError, type Session, type User } from '@supabase/supabase-js'
import { createClient } from './server'

// Types
export interface AuthSession {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface AuthUser {
  id: string
  email: string | null
  name: string | null
}

// Test user for development/testing purposes
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

// Server-side auth utilities
export async function getServerSession() {
  try {
    // Check for auth bypass flag
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      return {
        user: TEST_USER,
        session: null,
        error: null
      }
    }

    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    return {
      user: session?.user ?? null,
      session,
      error
    }
  } catch (error) {
    console.error('Error getting server session:', error)
    return {
      user: null,
      session: null,
      error: error as AuthError
    }
  }
}

// Client-side auth utilities
export function createClientAuth() {
  const supabase = createClientComponentClient()
  
  return {
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    },

    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      return { error }
    },

    getSession: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error }
    },

    onAuthStateChange: (callback: (session: Session | null) => void) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session)
      })
      return subscription
    }
  }
}

// Middleware auth check
export async function checkAuth() {
  try {
    const { user, error } = await getServerSession()
    
    if (error || !user) {
      return {
        isAuthenticated: false,
        user: null
      }
    }

    return {
      isAuthenticated: true,
      user
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return {
      isAuthenticated: false,
      user: null
    }
  }
}

// Helper to get current user ID safely
export async function getCurrentUserId(): Promise<string | null> {
  const { user } = await getServerSession()
  return user?.id ?? null
}

// Development/testing utilities
export function getTestUser() {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH !== 'true') {
    throw new Error('Test user only available in development mode')
  }
  return TEST_USER
} 