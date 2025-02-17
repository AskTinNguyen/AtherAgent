import { getSourcesByMessage } from '@/lib/supabase/search-sources'
import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id
    
    // Get sources from Supabase for specific message
    const sources = await getSourcesByMessage(messageId)
    
    return new Response(JSON.stringify({
      success: true,
      sources
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error fetching message sources:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch message sources'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 