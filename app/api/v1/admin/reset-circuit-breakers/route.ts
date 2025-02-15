import { resetCircuitBreakers } from '@/lib/utils/api-circuit-breakers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    resetCircuitBreakers()
    return NextResponse.json({ success: true, message: 'Circuit breakers reset successfully' })
  } catch (error) {
    console.error('Error resetting circuit breakers:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to reset circuit breakers' },
      { status: 500 }
    )
  }
} 