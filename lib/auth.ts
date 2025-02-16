import { authOptions } from '@/lib/auth/auth-options'
import { getServerSession } from 'next-auth'

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

    // Get NextAuth session
    const session = await getServerSession(authOptions)
    
    return {
      userId: session?.user?.id || 'anonymous',
      userEmail: session?.user?.email || null,
      isAuthenticated: !!session?.user?.id,
      session
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