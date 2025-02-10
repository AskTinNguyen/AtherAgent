'use client'

import { Message, ToolInvocation } from 'ai'
import RetrieveSection from './retrieve-section'
import { SearchSection } from './search-section'
import { VideoSearchSection } from './video-search-section'

interface ToolSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  chatId: string
}

export function ToolSection({ 
  tool, 
  isOpen, 
  onOpenChange,
  messages,
  setMessages,
  chatId
}: ToolSectionProps) {
  switch (tool.toolName) {
    case 'search':
      return (
        <SearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          messages={messages}
          setMessages={setMessages}
          chatId={chatId}
        />
      )
    case 'video_search':
      return (
        <VideoSearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'retrieve':
      return (
        <RetrieveSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    default:
      return null
  }
}
