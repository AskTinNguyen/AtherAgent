'use client'

import { createClient } from '@/lib/supabase/client'
import { Message } from 'ai'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function useChatState(chatId: string) {
  const [supabase] = useState(() => createClient())
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('research_session_id', chatId)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true })

        if (error) throw error

        setMessages(data.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          createdAt: msg.created_at,
          annotations: msg.annotations
        })))
      } catch (error) {
        console.error('Error fetching messages:', error)
        toast.error('Failed to load chat messages')
      } finally {
        setIsLoading(false)
      }
    }

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `research_session_id=eq.${chatId} AND user_id=eq.${session.user.id}`
        }, 
        payload => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, {
              id: payload.new.id,
              content: payload.new.content,
              role: payload.new.role,
              createdAt: payload.new.created_at,
              annotations: payload.new.annotations
            }])
          }
        }
      )
      .subscribe()

    fetchMessages()

    return () => {
      channel.unsubscribe()
    }
  }, [chatId, supabase, session?.user?.id])

  const addMessage = async (message: Omit<Message, 'id'>) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to send messages')
      return
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          research_session_id: chatId,
          content: message.content,
          role: message.role,
          annotations: message.annotations,
          user_id: session.user.id
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error adding message:', error)
      toast.error('Failed to send message')
    }
  }

  return {
    messages,
    isLoading,
    addMessage,
    setMessages
  }
} 