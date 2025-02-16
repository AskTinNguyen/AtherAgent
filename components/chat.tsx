'use client'

import { CHAT_ID } from '@/lib/constants'
import { ResearchProvider, useResearch } from '@/lib/contexts/research-context'
import type { ChatResearchState } from '@/lib/types/research'
import { Message, useChat } from 'ai/react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { DeepResearchVisualization } from './deep-research-visualization'
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
    onFinish: () => {
      window.history.replaceState({}, '', `/search/${id}`)
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

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined) // reset data to clear tool call
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
