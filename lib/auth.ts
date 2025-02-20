import { createClient } from '@/lib/supabase/server'

// Test user for development/testing purposes
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

export async function getAuth() {
  try {
    // Check for auth bypass flag
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      return {
        userId: TEST_USER.id,
        userEmail: TEST_USER.email,
        isAuthenticated: true,
        session: {
          user: TEST_USER,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        }
      }
    }

    // Get Supabase session
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw error
    }
    
    return {
      userId: user?.id || 'anonymous',
      userEmail: user?.email || null,
      isAuthenticated: !!user?.id,
      session: user ? {
        user: {
          id: user.id,
          email: user.email,
          name: user.email?.split('@')[0] || 'User'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      } : null
    }
  } catch (error) {
    console.error('Error getting auth:', error)
    return {
      userId: 'anonymous',
      userEmail: null,
      isAuthenticated: false,
      session: null
    }
  }
} 