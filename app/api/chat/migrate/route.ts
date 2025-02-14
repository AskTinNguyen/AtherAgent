import { ChatMigration } from '@/lib/redis/migrations/chat-structure'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const results = await ChatMigration.migrate()
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
} 