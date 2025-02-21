import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/bookmarks',
  '/api/tasks'
]

// Define auth routes that should redirect if already authenticated
const authRoutes = [
  '/login',
  '/auth/signin'
]

export async function middleware(request: NextRequest) {
  // Check if auth is disabled
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return NextResponse.next()
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables in middleware')
      return NextResponse.next()
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              domain: options.domain,
              path: options.path,
              maxAge: options.maxAge,
              httpOnly: options.httpOnly,
              secure: options.secure,
              sameSite: options.sameSite,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              domain: options.domain,
              path: options.path,
              maxAge: -1,
              httpOnly: options.httpOnly,
              secure: options.secure,
              sameSite: options.sameSite,
            })
          },
        },
      }
    )

    // Get the current path
    const path = new URL(request.url).pathname

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const isAuthenticated = !!user && !userError

    // Handle protected routes
    if (protectedRoutes.some(route => path.startsWith(route))) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', path)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Handle auth routes (login, signin)
    if (authRoutes.some(route => path.startsWith(route))) {
      if (isAuthenticated) {
        // Redirect to home if already authenticated
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login for protected routes
    const path = new URL(request.url).pathname
    if (protectedRoutes.some(route => path.startsWith(route))) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 