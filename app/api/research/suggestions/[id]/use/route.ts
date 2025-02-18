import { createClient } from '@/lib/supabase/client'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('research_suggestions')
      .update({
        used_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    if (error) {
      console.error('Error updating suggestion:', error)
      return Response.json(
        { error: 'Failed to update suggestion' },
        { status: 500 }
      )
    }
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error marking suggestion as used:', error)
    return Response.json(
      { error: 'Failed to mark suggestion as used' },
      { status: 500 }
    )
  }
} 