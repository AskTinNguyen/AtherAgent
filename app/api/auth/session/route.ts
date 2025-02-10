import { getAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to get no-cache headers
const getNoCacheHeaders = () => ({
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store'
})

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth()
    
    return new NextResponse(JSON.stringify({
      userId: auth.userId,
      isAuthenticated: auth.isAuthenticated
    }), {
      headers: getNoCacheHeaders()
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return new NextResponse(JSON.stringify({
      userId: 'anonymous',
      isAuthenticated: false
    }), {
      status: 500,
      headers: getNoCacheHeaders()
    })
  }
} 