'use client'

import { ChatMessages } from '@/components/chat-messages'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { cn } from '@/lib/utils'
import { Message } from 'ai'
import { useChat } from 'ai/react'
import { nanoid } from 'nanoid'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { RequireAuth } from './auth/require-auth'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const { user } = useSupabase()
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-chat-preview-token',
    null
  )

  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      initialMessages,
      id,
      body: {
        id,
        previewToken
      }
    })

  const handleSubmitMessage = (message: string) => {
    if (!message.trim()) return
    append({
      id: nanoid(),
      content: message,
      role: 'user'
    })
    setInput('')
  }

  useEffect(() => {
    if (!user && !previewToken) {
      toast.message('Sign in to save your chat history')
    }
  }, [user, previewToken])

  return (
    <RequireAuth>
      <div className={cn('flex flex-col h-full', className)}>
        {messages.length ? (
          <>
            <ChatMessages 
              messages={messages} 
              isLoading={isLoading}
              onQuerySelect={(query: string) => setInput(query)}
              chatId={id}
              data={[]}
              setMessages={(msgs) => {
                if (typeof msgs === 'function') {
                  const newMsgs = msgs(messages)
                  append(newMsgs[newMsgs.length - 1])
                } else {
                  append(msgs[msgs.length - 1])
                }
              }}
            />
          </>
        ) : (
          <EmptyScreen submitMessage={handleSubmitMessage} />
        )}
        <ChatPanel
          input={input}
          handleInputChange={(e) => setInput(e.target.value)}
          handleSubmit={(e) => {
            e?.preventDefault()
            handleSubmitMessage(input)
          }}
          isLoading={isLoading}
          messages={messages}
          setMessages={(msgs) => {
            if (typeof msgs === 'function') {
              const newMsgs = msgs(messages)
              append(newMsgs[newMsgs.length - 1])
            } else {
              append(msgs[msgs.length - 1])
            }
          }}
          stop={stop}
          append={append}
          chatId={id || ''}
        />
      </div>
    </RequireAuth>
  )
}
