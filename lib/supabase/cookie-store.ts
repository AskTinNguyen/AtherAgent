import { type CookieOptions } from '@supabase/ssr'
import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export interface CookieStore {
  get(name: string): RequestCookie | undefined
  set(name: string, value: string, options: CookieOptions): void
  remove(name: string, options: CookieOptions): void
}

// Implementation for App Router (Server Components)
export class ServerCookieStore implements CookieStore {
  private getCookieStore(): ReadonlyRequestCookies {
    // Using require instead of import for runtime access
    const { cookies } = require('next/headers')
    return cookies()
  }

  get(name: string): RequestCookie | undefined {
    try {
      return this.getCookieStore().get(name)
    } catch (error) {
      console.error('Error getting cookie:', error)
      return undefined
    }
  }

  set(name: string, value: string, options: CookieOptions): void {
    try {
      this.getCookieStore().set({
        name,
        value,
        ...options,
      })
    } catch (error) {
      console.error('Error setting cookie:', error)
    }
  }

  remove(name: string, options: CookieOptions): void {
    try {
      this.getCookieStore().set({
        name,
        value: '',
        ...options,
        maxAge: -1,
      })
    } catch (error) {
      console.error('Error removing cookie:', error)
    }
  }
}

// Implementation for Pages Router
export class RequestCookieStore implements CookieStore {
  constructor(
    private req: { cookies: { [key: string]: string } },
    private res: { setHeader: (name: string, value: string) => void }
  ) {}

  get(name: string): RequestCookie | undefined {
    const value = this.req.cookies[name]
    return value ? { name, value } as RequestCookie : undefined
  }

  set(name: string, value: string, options: CookieOptions): void {
    this.res.setHeader(
      'Set-Cookie',
      `${name}=${value}; ${this.serializeCookieOptions(options)}`
    )
  }

  remove(name: string, options: CookieOptions): void {
    this.res.setHeader(
      'Set-Cookie',
      `${name}=; ${this.serializeCookieOptions({ ...options, maxAge: -1 })}`
    )
  }

  private serializeCookieOptions(options: CookieOptions): string {
    const parts: string[] = []
    
    if (options.domain) parts.push(`Domain=${options.domain}`)
    if (options.path) parts.push(`Path=${options.path}`)
    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`)
    if (options.httpOnly) parts.push('HttpOnly')
    if (options.secure) parts.push('Secure')
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
    
    return parts.join('; ')
  }
} 