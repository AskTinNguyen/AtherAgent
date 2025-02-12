import { cookies } from 'next/headers'

export async function getAuth() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    const userId = sessionCookie?.value || 'anonymous'

    return {
      userId,
      isAuthenticated: userId !== 'anonymous'
    }
  } catch (error) {
    console.error('Error getting auth:', error)
    return {
      userId: 'anonymous',
      isAuthenticated: false
    }
  }
} 