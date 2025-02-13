'use client'

import { CHAT_ID } from '@/lib/constants'
import { ResearchProvider } from '@/lib/contexts/research-context'
import type { ChatResearchState } from '@/lib/types/research'
import { Message, useChat } from 'ai/react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { DeepResearchVisualization } from './deep-research-visualization'

export function Chat({
  id,
  savedMessages = [],
  query
}: {
  id: string
  savedMessages?: Message[]
  query?: string
}) {
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
      id
    },
    onFinish: () => {
      window.history.replaceState({}, '', `/search/${id}`)
    },
    onError: error => {
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
    setMessages(savedMessages)
  }, [id])

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
    <ResearchProvider>
      <div className="flex min-h-screen">
        <DeepResearchVisualization
          location="sidebar"
          chatId={id}
          initialClearedState={researchState?.isCleared}
          onClearStateChange={handleClearResearch}
          onSuggestionSelect={onQuerySelect}
        />
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
    </ResearchProvider>
  )
}
