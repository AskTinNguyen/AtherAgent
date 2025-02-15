import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const { id } = params

    // Allow public chats or authenticated users
    const isPublicChat = id.startsWith('public_')
    if (!isPublicChat && !session) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      )
    }

    // Fetch research state
    // Add your research state fetching logic here
    const researchState = {
      status: 'idle',
      results: []
    }

    return NextResponse.json(researchState)
  } catch (error) {
    console.error('[API] Research error:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Research processing error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
}
