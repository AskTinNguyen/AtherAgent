import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!params.id) {
    return Response.json(
      { error: 'Missing suggestion ID' },
      { status: 400 }
    )
  }

  try {
    // Get authenticated Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      console.error('Authentication error:', authError)
      return Response.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    // First verify the suggestion exists and belongs to the user
    const { data: suggestion, error: fetchError } = await supabase
      .from('research_suggestions')
      .select('id, session_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !suggestion) {
      console.error('Error fetching suggestion:', fetchError)
      return Response.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }
    
    // Update the suggestion with used_at timestamp
    const { error: updateError } = await supabase
      .from('research_suggestions')
      .update({
        used_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('session_id', suggestion.session_id)
    
    if (updateError) {
      console.error('Error updating suggestion:', updateError)
      return Response.json(
        { error: 'Failed to update suggestion', details: updateError.message },
        { status: 500 }
      )
    }
    
    return Response.json({ 
      success: true,
      suggestion_id: params.id,
      updated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error marking suggestion as used:', error)
    return Response.json(
      { 
        error: 'Failed to mark suggestion as used',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 