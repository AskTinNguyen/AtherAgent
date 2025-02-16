'use client'

import { CHAT_ID } from '@/lib/constants'
import { ResearchProvider, useResearch } from '@/lib/contexts/research-context'
import type { ChatResearchState } from '@/lib/types/research'
import { Message, useChat } from 'ai/react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { DeepResearchVisualization } from './deep-research-visualization'
import { useSupabase } from './providers/supabase-provider'
import { ResearchInitializer } from './research-initializer'

export function ChatContent({
  id,
  savedMessages = [],
  query
}: {
  id: string
  savedMessages?: Message[]
  query?: string
}) {
  const { state: researchState } = useResearch()
  const pathname = usePathname()
  const isInChatSession = pathname.startsWith('/search/')
  const supabase = useSupabase()
  const { data: session } = useSession()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Get user ID from Supabase session
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          setUserId(session.user.id)
        }
      })
    }
  }, [supabase])

  // Add debug logging for authentication
  useEffect(() => {
    console.log('Auth Debug:', {
      hasSession: !!session,
      supabaseInitialized: !!supabase,
      userId
    })
  }, [session, supabase, userId])

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    stop,
    append,
    data,
    setData
  } = useChat({
    initialMessages: savedMessages,
    id: CHAT_ID,
    body: {
      id,
      searchMode: researchState.searchEnabled
    },
    onResponse: async (response) => {
      // This is called when the API response starts streaming
      if (userId) {
        try {
          console.log('Saving initial assistant message')
          const { error } = await supabase.from('chat_messages').insert({
            chat_id: id,
            content: '', // Will be updated with full content when streaming ends
            role: 'assistant',
            user_id: userId
          })
          if (error) {
            console.error('Failed to save initial assistant message:', error)
          }
        } catch (error) {
          console.error('Error saving initial assistant message:', error)
        }
      }
    },
    onFinish: async (message) => {
      window.history.replaceState({}, '', `/search/${id}`)
      
      // Save or update assistant message in Supabase
      if (userId) {
        try {
          console.log('Saving final assistant message:', {
            chat_id: id,
            content: message.content,
            role: message.role,
            user_id: userId
          })

          // First try to find if we already have a message for this response
          const { data: existingMessages, error: searchError } = await supabase
            .from('chat_messages')
            .select('id')
            .match({ 
              chat_id: id,
              role: 'assistant',
              content: ''
            })
            .order('created_at', { ascending: false })
            .limit(1)

          if (searchError) {
            console.error('Error searching for existing message:', searchError)
            return
          }

          if (existingMessages && existingMessages.length > 0) {
            // Update the existing empty message with the complete content
            const { error: updateError } = await supabase
              .from('chat_messages')
              .update({ content: message.content })
              .eq('id', existingMessages[0].id)

            if (updateError) {
              console.error('Failed to update assistant message:', updateError)
              toast.error(`Failed to save AI response: ${updateError.message}`)
            } else {
              console.log('Successfully updated assistant message')
            }
          } else {
            // Insert new message if no empty message was found
            const { error: insertError } = await supabase
              .from('chat_messages')
              .insert({
                chat_id: id,
                content: message.content,
                role: message.role,
                user_id: userId
              })

            if (insertError) {
              console.error('Failed to save new assistant message:', insertError)
              toast.error(`Failed to save AI response: ${insertError.message}`)
            } else {
              console.log('Successfully saved new assistant message')
            }
          }
        } catch (error) {
          console.error('Failed to save message to Supabase:', error)
          toast.error('Failed to save AI response')
        }
      } else {
        console.log('No user ID found:', { session })
      }
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: true
  })

  const { data: chatResearchState, mutate: mutateResearch } = useSWR<ChatResearchState>(
    `/api/chats/${id}/research`,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch research state')
      return res.json()
    }
  )

  useEffect(() => {
    setMessages(savedMessages)
  }, [id])

  const onQuerySelect = async (query: string) => {
    // Save user message to Supabase first
    if (userId) {
      try {
        console.log('Attempting to save user query:', {
          chat_id: id,
          content: query,
          role: 'user',
          user_id: userId
        })
        const { data, error } = await supabase.from('chat_messages').insert({
          chat_id: id,
          content: query,
          role: 'user',
          user_id: userId
        }).select()
        
        if (error) {
          console.error('Supabase error:', error)
          toast.error(`Failed to save message: ${error.message}`)
        } else {
          console.log('Successfully saved user query:', data)
        }
      } catch (error) {
        console.error('Failed to save user message to Supabase:', error)
        toast.error('Failed to save message')
      }
    } else {
      console.log('No user ID found:', { session })
    }
    
    append({
      role: 'user',
      content: query
    })
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined) // reset data to clear tool call
    
    // Save user message to Supabase first
    if (userId && input) {
      try {
        console.log('Attempting to save user input:', {
          chat_id: id,
          content: input,
          role: 'user',
          user_id: userId
        })

        // Test Supabase connection
        const { data: testData, error: testError } = await supabase
          .from('chat_messages')
          .select('id')
          .limit(1)

        if (testError) {
          console.error('Supabase connection test failed:', testError)
          toast.error(`Database connection error: ${testError.message}`)
          return
        }

        console.log('Supabase connection test successful:', testData)

        const { data, error } = await supabase.from('chat_messages').insert({
          chat_id: id,
          content: input,
          role: 'user',
          user_id: userId
        }).select()
        
        if (error) {
          console.error('Supabase error:', {
            error,
            errorMessage: error.message,
            details: error.details,
            hint: error.hint
          })
          toast.error(`Failed to save message: ${error.message}`)
        } else {
          console.log('Successfully saved user input:', data)
        }
      } catch (error) {
        console.error('Failed to save message to Supabase:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
        toast.error('Failed to save message')
      }
    } else {
      console.log('No user ID found:', {
        session,
        sessionData: (session as any)?.sessionData,
        userId
      })
    }
    
    handleSubmit(e)
  }

  const handleClearResearch = async (chatId: string, isCleared: boolean) => {
    try {
      await fetch(`/api/chats/${chatId}/research`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCleared })
      })
      await mutateResearch()
    } catch (error) {
      console.error('Failed to update research state:', error)
    }
  }

  return (
    <div className="flex min-h-screen">
      {isInChatSession && (
        <DeepResearchVisualization
          location="sidebar"
          chatId={id}
          initialClearedState={chatResearchState?.isCleared}
          onClearStateChange={handleClearResearch}
          onSuggestionSelect={onQuerySelect}
        />
      )}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-3xl pt-14 pb-60">
          <ChatMessages
            messages={messages}
            data={data}
            onQuerySelect={onQuerySelect}
            isLoading={isLoading}
            chatId={id}
            setMessages={setMessages}
          />
          <ChatPanel
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={onSubmit}
            isLoading={isLoading}
            messages={messages}
            setMessages={setMessages}
            stop={stop}
            query={query}
            append={append}
          />
        </div>
      </div>
    </div>
  )
}

export function Chat(props: {
  id: string
  savedMessages?: Message[]
  query?: string
}) {
  return (
    <ResearchProvider>
      <ResearchInitializer />
      <ChatContent {...props} />
    </ResearchProvider>
  )
}
