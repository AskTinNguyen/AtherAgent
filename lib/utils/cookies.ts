import { CookieOptions } from '@supabase/ssr'
import Cookies from 'js-cookie'

export const AUTH_COOKIE_NAME = 'sb-auth-token'
export const REFRESH_COOKIE_NAME = 'sb-refresh-token'

// Define strict types for our cookie configuration
type SameSiteOption = 'Strict' | 'Lax' | 'None'

interface CookieConfig {
  name: string
  value: string
  path?: string
  secure?: boolean
  sameSite?: SameSiteOption
  maxAge?: number
  httpOnly?: boolean
  domain?: string
}

// Cookie adapter to handle type conversions
const cookieAdapter = {
  toJsCookieOptions(options: Partial<CookieConfig>): Cookies.CookieAttributes {
    const { sameSite, maxAge, ...rest } = options
    return {
      ...rest,
      sameSite: sameSite as Cookies.CookieAttributes['sameSite'],
      expires: maxAge ? new Date(Date.now() + maxAge * 1000) : undefined
    }
  },

  fromSupabaseOptions(options?: Partial<CookieOptions>): Partial<CookieConfig> {
    if (!options) return {}
    const { sameSite, ...rest } = options
    
    let convertedSameSite: SameSiteOption | undefined = undefined
    if (typeof sameSite === 'string') {
      convertedSameSite = sameSite.charAt(0).toUpperCase() + sameSite.slice(1) as SameSiteOption
    } else if (sameSite === true) {
      convertedSameSite = 'Strict'
    }

    return {
      ...rest,
      sameSite: convertedSameSite
    }
  }
}

export const cookieConfig: Omit<CookieConfig, 'name' | 'value'> = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  httpOnly: false // Allow JS access for client-side checks
}

export const cookies = {
  set: (name: string, value: string, options?: Partial<CookieOptions>) => {
    const adaptedOptions = cookieAdapter.fromSupabaseOptions(options)
    const jsCookieOptions = cookieAdapter.toJsCookieOptions({
      ...cookieConfig,
      ...adaptedOptions
    })
    Cookies.set(name, value, jsCookieOptions)
  },

  get: (name: string) => {
    return Cookies.get(name)
  },

  remove: (name: string) => {
    const jsCookieOptions = cookieAdapter.toJsCookieOptions(cookieConfig)
    Cookies.remove(name, jsCookieOptions)
  },

  // Check if auth cookie exists and is valid
  checkAuth: () => {
    const authToken = Cookies.get(AUTH_COOKIE_NAME)
    if (!authToken) return false

    try {
      // Basic JWT structure check
      const [header, payload, signature] = authToken.split('.')
      if (!header || !payload || !signature) return false

      // Check expiration
      const decodedPayload = JSON.parse(atob(payload))
      if (!decodedPayload.exp) return false

      const expirationTime = decodedPayload.exp * 1000 // Convert to milliseconds
      return Date.now() < expirationTime
    } catch {
      return false
    }
  }
}
