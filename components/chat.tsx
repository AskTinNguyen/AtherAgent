'use client'

import { CHAT_ID } from '@/lib/constants'
import { ResearchProvider, useResearch } from '@/lib/contexts/research-context'
import { ChatMessage, createChatMessage } from '@/lib/types/database'
import type { ChatResearchState } from '@/lib/types/research'
import { Message, useChat } from 'ai/react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { v4 as uuidv4 } from 'uuid'
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
  const { state: researchState, setMessages: setResearchMessages } = useResearch()
  const pathname = usePathname()
  const isInChatSession = pathname.startsWith('/search/')
  const supabase = useSupabase()
  const { data: session } = useSession()
  const [userId, setUserId] = useState<string | null>(null)
  const [researchSessionId, setResearchSessionId] = useState<string | null>(null)
  
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

  // Create or get research session
  useEffect(() => {
    const initializeResearchSession = async () => {
      if (!userId || !id) return

      try {
        // First, try to find existing research session
        const { data: existingSession, error: searchError } = await supabase
          .from('research_sessions')
          .select('id')
          .eq('id', id)  // Use id directly since it's already a UUID
          .single()

        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error finding research session:', {
            code: searchError.code,
            details: searchError.details,
            message: searchError.message,
            hint: searchError.hint
          })
          return
        }

        if (existingSession) {
          setResearchSessionId(existingSession.id)
        } else {
          // Create new research session using the id directly
          const { data: newSession, error: insertError } = await supabase
            .from('research_sessions')
            .insert({
              id, // Use the id directly as the session id
              user_id: userId,
              metadata: {
                created_at: new Date().toISOString()
              }
            })
            .select()

          console.log('Insert attempt result:', { newSession, insertError })

          if (insertError) {
            console.error('Error creating research session:', {
              code: insertError.code,
              details: insertError.details,
              message: insertError.message,
              hint: insertError.hint,
              data: { id, userId }
            })
            toast.error(`Failed to create research session: ${insertError.message}`)
            return
          }

          if (!newSession?.[0]?.id) {
            console.error('No session ID returned after insert')
            return
          }

          setResearchSessionId(newSession[0].id)
        }
      } catch (err) {
        const error = err as Error
        console.error('Error initializing research session:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          data: { id, userId }
        })
      }
    }

    initializeResearchSession()
  }, [userId, id, supabase])

  // Add debug logging
  useEffect(() => {
    console.log('Session Debug:', {
      hasSession: !!session,
      supabaseInitialized: !!supabase,
      userId,
      researchSessionId,
      id
    })
  }, [session, supabase, userId, researchSessionId, id])

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
    id: CHAT_ID, //The CHAT_ID constant is serving a different purpose than our database IDs - it's more like a namespace for the chat component
    body: {
      id,
      searchMode: researchState.searchEnabled
    },
    onResponse: async (response) => {
      if (userId && researchSessionId) {
        try {
          // When streaming starts, we create a placeholder message in the database
          // The content must be an empty string ('') NOT null, as the database has a not-null constraint
          // This empty string also serves as a marker to find this specific message later in onFinish
          // Get the last message (which should be the user's message)
          // Get the last message from the database instead of messages array
          const { data: lastMessages, error: fetchError } = await supabase
            .from('chat_messages')
            .select('id, role')
            .eq('research_session_id', researchSessionId)
            .eq('role', 'user')
            .order('created_at', { ascending: false })
            .limit(1)

          if (fetchError) {
            console.error('Error fetching last message:', fetchError)
          }

          const lastUserMessage = lastMessages?.[0]
          console.log('Last user message from DB:', lastUserMessage)
          
          console.log('Saving initial assistant message')
          const messageUuid = uuidv4()
          const newMessage = createChatMessage({
            id: messageUuid,
            user_id: userId,
            research_session_id: researchSessionId,
            content: '', // TIN: IMPORTANT: Must be empty string, not null - database constraint
            role: 'assistant',
            metadata: {
              model: 'gpt-4',
              temperature: 0.7,
              processing_time: 0,
              tokens_used: 0,
              timestamp: new Date().toISOString()
            }
          }, {
            sequence_number: messages?.length ? messages.length + 1 : 1,
            message_type: 'ai_response',
            parent_message_id: lastUserMessage?.id // Use DB message ID
          })
          
          const { error } = await supabase
            .from('chat_messages')
            .insert(newMessage)

          if (error) {
            console.error('Failed to save initial assistant message:', {
              code: error.code,
              details: error.details,
              message: error.message,
              hint: error.hint
            })
            toast.error(`Database error: ${error.message}`)
          }
        } catch (err) {
          const error = err as Error
          console.error('Error saving initial assistant message:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          })
          toast.error('Failed to save message due to an unexpected error')
        }
      }
    },
    onFinish: async (message) => {
      window.history.replaceState({}, '', `/search/${id}`)
      
      if (userId && researchSessionId) {
        try {
          console.log('Saving final assistant message, content length:', message.content.length)

          // Find the placeholder message we created in onResponse
          // We identify it by matching research_session_id, message_type, role
          // and most importantly, the empty string content we set earlier
          const { data: existingMessages, error: searchError } = await supabase
            .from('chat_messages')
            .select('*')
            .match({ 
              research_session_id: researchSessionId,
              message_type: 'ai_response',
              role: 'assistant',
              content: null // TIN: this must be null, not an empty string
            })
            .order('created_at', { ascending: false })
            .limit(1)

          if (searchError) {
            console.error('Error searching for existing message:', {
              code: searchError.code,
              details: searchError.details,
              message: searchError.message,
              hint: searchError.hint
            })
            toast.error(`Database search error: ${searchError.message}`)
            return
          }

          // Debug log to see what we found
          console.log('Found existing messages:', JSON.stringify(existingMessages, null, 2))

          const metadata = {
            model: 'gpt-4',
            temperature: 0.7,
            tokens_used: message.content.length / 4,
            processing_time: typeof data === 'object' && data !== null && 'startTime' in data 
              ? Date.now() - (data.startTime as number) 
              : 0,
            timestamp: new Date().toISOString()
          }

          if (existingMessages && existingMessages.length > 0) {
            // Found our placeholder message, now update it with the complete AI response
            console.log('Updating existing message:', {
              id: existingMessages[0].id,
              currentContent: existingMessages[0].content,
              newContent: message.content.substring(0, 100) + '...',
              contentLength: message.content.length
            })
            
            const updateData: Partial<ChatMessage> = {
              content: message.content, // Replace empty string with actual AI response
              metadata,
              is_edited: true,
              sequence_number: messages.length,
              role: 'assistant',
              updated_at: new Date().toISOString()
            }

            // Log the exact update operation
            console.log('Update operation:', {
              data: updateData,
              messageId: existingMessages[0].id
            })

            const { data: updatedData, error: updateError } = await supabase
              .from('chat_messages')
              .update(updateData)
              .eq('id', existingMessages[0].id)
              .select()

            if (updateError) {
              console.error('Failed to update assistant message:', {
                code: updateError.code,
                details: updateError.details,
                message: updateError.message,
                hint: updateError.hint,
                messageContent: message.content.substring(0, 100) + '...',
                contentLength: message.content.length
              })
              toast.error(`Failed to update message: ${updateError.message}`)
            } else {
              console.log('Successfully updated message:', {
                updatedData,
                contentPreview: message.content.substring(0, 100) + '...',
                fullContentLength: message.content.length
              })
            }
          } else {
            // Fallback: If we somehow couldn't find our placeholder message
            // create a new message with the complete content
            // This should rarely happen in normal operation
            console.log('No empty message found, creating new one with content length:', message.content.length)
            const messageUuid = uuidv4()
            const newMessage = createChatMessage({
              id: messageUuid,
              user_id: userId,
              research_session_id: researchSessionId,
              content: message.content,
              role: 'assistant',
              metadata
            }, {
              sequence_number: messages.length + 1,
              message_type: 'ai_response'
            })

            const { error: insertError } = await supabase
              .from('chat_messages')
              .insert(newMessage)

            if (insertError) {
              console.error('Failed to save new assistant message:', {
                code: insertError.code,
                details: insertError.details,
                message: insertError.message,
                hint: insertError.hint
              })
              toast.error(`Failed to save message: ${insertError.message}`)
            }
          }
        } catch (err) {
          const error = err as Error
          console.error('Failed to save message to Supabase:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          })
          toast.error('Failed to save message due to an unexpected error')
        }
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

  useEffect(() => {
    if (savedMessages && savedMessages.length > 0) {
      const formattedMessages = savedMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt || new Date()).toISOString()
      }))
      setResearchMessages(formattedMessages)
    }
  }, [savedMessages, setResearchMessages])

  const onQuerySelect = async (query: string) => {
    if (userId && researchSessionId) {
      try {
        console.log('Saving user query')
        const messageUuid = uuidv4()
        const newMessage = createChatMessage({
          id: messageUuid,
          user_id: userId,
          research_session_id: researchSessionId,
          content: query,
          role: 'user',
          metadata: {
            client_timestamp: new Date().toISOString(),
            client_info: {
              platform: navigator.platform,
              userAgent: navigator.userAgent
            }
          }
        }, {
          sequence_number: messages?.length ? messages.length + 1 : 1,
          message_type: 'user_prompt'
          // No parent_message_id needed for user messages
        })
        
        const { error } = await supabase
          .from('chat_messages')
          .insert(newMessage)
        
        if (error) {
          console.error('Failed to save user query:', {
            code: error.code,
            details: error.details,
            message: error.message,
            hint: error.hint
          })
          toast.error(`Failed to save message: ${error.message}`)
        }
      } catch (err) {
        const error = err as Error
        console.error('Failed to save user message:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        toast.error('Failed to save message due to an unexpected error')
      }
    }
    
    append({
      role: 'user',
      content: query
    })
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)
    
    if (userId && researchSessionId && input) {
      try {
        const messageUuid = uuidv4()
        const newMessage = createChatMessage({
          id: messageUuid,
          user_id: userId,
          research_session_id: researchSessionId,
          content: input,
          role: 'user',
          metadata: {
            client_timestamp: new Date().toISOString(),
            client_info: {
              platform: navigator.platform,
              userAgent: navigator.userAgent
            }
          }
        }, {
          sequence_number: messages?.length ? messages.length + 1 : 1,
          message_type: 'user_prompt'
          // No parent_message_id needed for user messages
        })
        
        const { error } = await supabase
          .from('chat_messages')
          .insert(newMessage)
        
        if (error) {
          console.error('Failed to save user input:', {
            code: error.code,
            details: error.details,
            message: error.message,
            hint: error.hint
          })
          toast.error(`Failed to save message: ${error.message}`)
        }
      } catch (err) {
        const error = err as Error
        console.error('Failed to save message:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        toast.error('Failed to save message due to an unexpected error')
      }
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
