'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { useResearch } from '@/lib/contexts/research-context'
import { ResearchActivity, ResearchSource } from '@/lib/types/research-enhanced'
import { useEffect, useState } from 'react'

// Type guards
function isValidResearchActivity(data: any): data is ResearchActivity {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.type === 'string' &&
    typeof data.status === 'string' &&
    typeof data.message === 'string' &&
    typeof data.timestamp === 'string'
  )
}

function isValidResearchSource(data: any): data is ResearchSource {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.url === 'string' &&
    typeof data.title === 'string' &&
    typeof data.relevance === 'number'
  )
}

export function ResearchRealtimeSync() {
  const supabase = useSupabase()
  const [userId, setUserId] = useState<string | null>(null)
  const { state, addActivity, addSource } = useResearch()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!error && user) {
        setUserId(user.id)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!userId || !state.isActive) return

    // Subscribe to research activities
    const activityChannel = supabase
      .channel('research_activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'research_activities',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && isValidResearchActivity(payload.new)) {
            addActivity(payload.new)
          }
        }
      )
      .subscribe()

    // Subscribe to research sources
    const sourcesChannel = supabase
      .channel('research_sources')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'research_sources',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && isValidResearchSource(payload.new)) {
            addSource(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      activityChannel.unsubscribe()
      sourcesChannel.unsubscribe()
    }
  }, [userId, state.isActive, addActivity, addSource, supabase])

  return null
} 