/**
 * Validates and normalizes a date string
 */
export function validateDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return new Date().toISOString()
    }
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

/**
 * Gets current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Calculates time difference in seconds
 */
export function getTimeDifferenceInSeconds(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.abs((d2.getTime() - d1.getTime()) / 1000)
}

/**
 * Checks if a date is older than specified seconds
 */
export function isOlderThan(date: string, seconds: number): boolean {
  const now = new Date()
  const then = new Date(date)
  return (now.getTime() - then.getTime()) / 1000 > seconds
}

/**
 * Formats a date for display
 */
export function formatDate(date: string, locale: string = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Gets relative time string (e.g. "2 hours ago")
 */
export function getRelativeTimeString(date: string, locale: string = 'en-US'): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute')
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour')
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, 'day')
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, 'month')
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return rtf.format(-diffInYears, 'year')
}

/**
 * Adds seconds to a date
 */
export function addSeconds(date: string, seconds: number): string {
  const d = new Date(date)
  d.setSeconds(d.getSeconds() + seconds)
  return d.toISOString()
}

/**
 * Gets expiration date for TTL
 */
export function getExpirationDate(ttlInSeconds: number): string {
  return addSeconds(getCurrentTimestamp(), ttlInSeconds)
} 