import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '../supabase/server'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Allow bypass if auth is disabled
        if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
          return {
            id: 'bypass',
            email: 'bypass@example.com',
            name: 'Bypass User',
            accessToken: 'bypass',
            refreshToken: 'bypass',
          }
        }

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const supabase = await createClient()
          const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !user || !session) {
            console.error('Auth error:', error)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'User',
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Skip token refresh if auth is disabled
      if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
        return token
      }

      if (user) {
        token.id = user.id
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }

      // Check if token needs refresh
      if (token.accessToken) {
        try {
          const supabase = await createClient()
          
          // First try to get the existing session
          const { data: { session: existingSession } } = await supabase.auth.getSession()
          
          if (!existingSession) {
            // Only try to set session if there isn't one already
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token: token.accessToken,
              refresh_token: token.refreshToken!,
            })

            if (session && !error) {
              token.accessToken = session.access_token
              token.refreshToken = session.refresh_token
            } else if (error) {
              console.error('Token refresh error:', error)
              token.accessToken = undefined
              token.refreshToken = undefined
            }
          } else {
            // Use the existing session's tokens
            token.accessToken = existingSession.access_token
            token.refreshToken = existingSession.refresh_token
          }
        } catch (error) {
          console.error('Token refresh error:', error)
          token.accessToken = undefined
          token.refreshToken = undefined
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.accessToken = token.accessToken as string
        session.user.refreshToken = token.refreshToken as string
      }
      return session
    }
  },
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signOut() {
      // Skip signout if auth is disabled
      if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
        return
      }

      try {
        const supabase = await createClient()
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Sign out error:', error)
      }
    }
  }
} 