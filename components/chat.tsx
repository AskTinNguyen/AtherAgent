'use client'

import type { ChatResearchState } from '@/lib/types/research'
import { Message, useChat } from 'ai/react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
// import { DeepResearchVisualization } from './deep-research-visualization'
// import { ResearchInitializer } from './research-initializer'

export function Chat({
  id,
  savedMessages = [],
  query
}: {
  id: string
  savedMessages?: Message[]
  query?: string
}) {
  console.log('[DEBUG] Chat component mounting:', { id, hasMessages: savedMessages.length > 0 })

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
    id,
    body: {
      id,
      initialQuery: query
    },
    onFinish: async () => {
      console.log('[DEBUG] Chat finished, updating URL:', { id })
      try {
        await fetch(`/api/chat/${id}/validate`, { method: 'POST' })
        window.history.replaceState({}, '', `/chat/${id}`)
      } catch (error) {
        console.error('[DEBUG] Error validating chat:', error)
        toast.error('Error creating chat session')
      }
    },
    onError: error => {
      console.error('[DEBUG] Chat error:', error)
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: true
  })

  const { data: researchState, mutate: mutateResearch } = useSWR<ChatResearchState>(
    `/api/chats/${id}/research`,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch research state')
      return res.json()
    }
  )

  useEffect(() => {
    const initializeChat = async () => {
      console.log('[DEBUG] Initializing chat:', { id, messagesCount: messages.length })
      try {
        if (savedMessages.length === 0) {
          await fetch(`/api/chat/${id}/init`, { method: 'POST' })
        }
        setMessages(savedMessages)
      } catch (error) {
        console.error('[DEBUG] Error initializing chat:', error)
        toast.error('Error initializing chat session')
      }
    }

    initializeChat()
  }, [id, savedMessages])

  // Handle command bar events
  useEffect(() => {
    const handleClearChat = () => {
      setMessages([])
      setData(undefined)
    }

    const handleExportChat = () => {
      const chatData = {
        id,
        messages,
        research: researchState
      }
      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-${id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    const handleToggleChatMode = () => {
      // Toggle between different chat modes if implemented
      toast.info('Chat mode toggled')
    }

    // Listen for command bar events
    document.addEventListener('clear-chat', handleClearChat)
    document.addEventListener('export-chat', handleExportChat)
    document.addEventListener('toggle-chat-mode', handleToggleChatMode)

    return () => {
      document.removeEventListener('clear-chat', handleClearChat)
      document.removeEventListener('export-chat', handleExportChat)
      document.removeEventListener('toggle-chat-mode', handleToggleChatMode)
    }
  }, [id, messages, researchState, setData, setMessages])

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)
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

  const handleDepthChange = async (chatId: string, currentDepth: number, maxDepth: number) => {
    try {
      await fetch(`/api/chats/${chatId}/research/depth`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentDepth, maxDepth })
      })
      await mutateResearch()
    } catch (error) {
      console.error('Failed to update research depth:', error)
    }
  }

  return (
    <div className="flex min-h-screen">
      {messages.length > 0 && (
        <>
          {/* <ResearchInitializer />
          <DeepResearchVisualization
            location="sidebar"
            chatId={id}
            initialClearedState={researchState?.isCleared}
            onClearStateChange={handleClearResearch}
            onSuggestionSelect={onQuerySelect}
          /> */}
        </>
      )}
      <div className="flex-1 flex justify-center transition-all duration-300">
        <div className="relative w-full max-w-3xl">
          <div className="pt-14 pb-32">
            <ChatMessages
              messages={messages}
              data={data}
              onQuerySelect={onQuerySelect}
              isLoading={isLoading}
              chatId={id}
              setMessages={setMessages}
            />
          </div>
          <div className="fixed bottom-0 left-0 right-0 lg:left-[400px] bg-gradient-to-t from-background to-background/0 pt-6">
            <div className="mx-auto w-full max-w-3xl">
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
      </div>
    </div>
  )
}
