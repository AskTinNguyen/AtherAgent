'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ChatState {
  id: string
  user_id: string
  messages: any[]
  context: string
  created_at: string
  updated_at: string
}

export function useChatState(chatId: string) {
  const { user } = useSupabase()
  const [chatState, setChatState] = useState<ChatState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user || !chatId) return

    const supabase = createClientComponentClient()

    // Initial fetch
    const fetchChatState = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_states')
          .select('*')
          .eq('id', chatId)
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        setChatState(data)
      } catch (error) {
        console.error('Error fetching chat state:', error)
        setError(error as Error)
        toast.error('Failed to fetch chat state')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChatState()

    // Set up realtime subscription
    const channel = supabase
      .channel(`chat_state:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_states',
          filter: `id=eq.${chatId}`,
        },
        (payload) => {
          console.log('Chat state change received:', payload)
          if (payload.eventType === 'UPDATE') {
            setChatState(payload.new as ChatState)
          } else if (payload.eventType === 'DELETE') {
            setChatState(null)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user, chatId])

  const updateChatState = async (updates: Partial<ChatState>) => {
    if (!user || !chatId) return

    const supabase = createClientComponentClient()

    try {
      const { error } = await supabase
        .from('chat_states')
        .update(updates)
        .eq('id', chatId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating chat state:', error)
      toast.error('Failed to update chat state')
      throw error
    }
  }

  return {
    chatState,
    isLoading,
    error,
    updateChatState,
  }
} 