'use client'

import { useResearchContext } from '@/lib/contexts/research-provider'
import { createClient } from '@/lib/supabase/client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface ResearchRealtimeSyncProps {
  chatId: string
}

export function ResearchRealtimeSync({ chatId }: ResearchRealtimeSyncProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const { dispatch } = useResearchContext()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!userId) return

    // Subscribe to research state changes
    const stateChannel = supabase
      .channel(`research_state:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'research_states',
          filter: `session_id=eq.${chatId}`
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            // Update local state with new data
            dispatch({
              type: 'SET_STATE',
              payload: {
                state: {
                  currentDepth: payload.new.metrics.currentDepth,
                  maxDepth: payload.new.metrics.maxDepth,
                  sources: [], // Will be updated by sources subscription
                  isActive: payload.new.metrics.isActive
                },
                metrics: payload.new.metrics
              }
            })
          }
        }
      )

    // Subscribe to search results (activities)
    const searchChannel = supabase
      .channel(`search_results:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'search_results',
          filter: `session_id=eq.${chatId}`
        },
        (payload) => {
          if (payload.new) {
            dispatch({
              type: 'ADD_ACTIVITY',
              payload: {
                type: 'search',
                status: 'complete',
                message: payload.new.query,
                timestamp: payload.new.created_at,
                depth: payload.new.depth_level
              }
            })
          }
        }
      )

    // Subscribe to sources
    const sourcesChannel = supabase
      .channel(`sources:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sources',
          filter: `session_id=eq.${chatId}`
        },
        (payload) => {
          if (payload.new) {
            dispatch({
              type: 'ADD_SOURCE',
              payload: payload.new.url
            })
          }
        }
      )

    // Start all subscriptions
    Promise.all([
      stateChannel.subscribe(),
      searchChannel.subscribe(),
      sourcesChannel.subscribe()
    ]).catch(console.error)

    // Cleanup subscriptions
    return () => {
      stateChannel.unsubscribe()
      searchChannel.unsubscribe()
      sourcesChannel.unsubscribe()
    }
  }, [chatId, userId, dispatch, supabase])

  return null // This is a side-effect component
} 