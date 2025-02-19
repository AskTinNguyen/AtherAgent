'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ResearchData {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export function ResearchRealtimeSync() {
  const { user } = useSupabase()
  const [researchData, setResearchData] = useState<ResearchData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const supabase = createClientComponentClient()

    // Initial fetch
    const fetchResearch = async () => {
      try {
        const { data, error } = await supabase
          .from('research')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (error) throw error
        setResearchData(data || [])
      } catch (error) {
        console.error('Error fetching research:', error)
        toast.error('Failed to fetch research data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResearch()

    // Set up realtime subscription
    const channel = supabase
      .channel('research_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'research',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Change received!', payload)
          switch (payload.eventType) {
            case 'INSERT':
              setResearchData((current) => [payload.new as ResearchData, ...current])
              break
            case 'UPDATE':
              setResearchData((current) =>
                current.map((item) =>
                  item.id === payload.new.id ? (payload.new as ResearchData) : item
                )
              )
              break
            case 'DELETE':
              setResearchData((current) =>
                current.filter((item) => item.id !== payload.old.id)
              )
              break
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  if (isLoading) {
    return <div>Loading research data...</div>
  }

  return (
    <div>
      <h2>Research Items ({researchData.length})</h2>
      <ul>
        {researchData.map((item) => (
          <li key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.content}</p>
            <small>Last updated: {new Date(item.updated_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  )
} 