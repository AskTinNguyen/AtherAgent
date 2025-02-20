import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get usage data for the authenticated user
    const { data: usageData, error: usageError } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (usageError) {
      console.error('Error fetching usage data:', usageError)
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    return NextResponse.json(usageData || { searches: 0, messages: 0 })
  } catch (error) {
    console.error('Error in usage route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update usage stats for the authenticated user
    const { error: updateError } = await supabase.rpc('increment_usage_stats', {
      user_id: user.id
    })

    if (updateError) {
      console.error('Error updating usage stats:', updateError)
      return NextResponse.json({ error: 'Failed to update usage stats' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in usage route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 