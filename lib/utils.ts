import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createModelId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num)
}

export function normalizeDate(date: Date | string): Date {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function sanitizeUrl(url: string): string {
  try {
    const sanitized = new URL(url)
    return sanitized.toString()
  } catch (e) {
    // If URL is invalid, return empty string
    return ''
  }
} 