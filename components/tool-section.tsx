'use client'

import { ResearchActivityProvider } from '@/lib/contexts/research-activity-context'
import { DepthProvider } from '@/lib/contexts/research-depth-context'
import { SourcesProvider } from '@/lib/contexts/research-sources-context'
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
        <ResearchActivityProvider>
          <SourcesProvider>
            <DepthProvider>
              <SearchSection
                tool={tool}
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                messages={messages}
                setMessages={setMessages}
                chatId={chatId}
              />
            </DepthProvider>
          </SourcesProvider>
        </ResearchActivityProvider>
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
