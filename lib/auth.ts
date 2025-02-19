import { getServerSession } from '@/lib/supabase/auth'

// Test user for development/testing purposes
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

export async function getUser() {
  const { user } = await getServerSession()
  return user ?? null
}

export async function getUserId() {
  const user = await getUser()
  return user?.id ?? null
}

// Development mode utilities
export function getTestUser() {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH !== 'true') {
    throw new Error('Test user only available in development mode')
  }
  return TEST_USER
} 