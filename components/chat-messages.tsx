import { useDebounce } from '@/lib/hooks/use-debounce'
import { JSONValue, Message } from 'ai'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RenderMessage } from './render-message'
import { ToolSection } from './tool-section'
import { Spinner } from './ui/spinner'

interface StreamState {
  isStreaming: boolean
  currentMessageId: string | null
  streamedContent: string
}

interface ChatMessagesProps {
  messages: Message[]
  data: JSONValue[] | undefined
  onQuerySelect: (query: string) => void
  isLoading: boolean
  chatId?: string
  setMessages: (messages: Message[] | ((messages: Message[]) => Message[])) => void
}

export function ChatMessages({
  messages,
  data,
  onQuerySelect,
  isLoading,
  chatId,
  setMessages
}: ChatMessagesProps) {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})
  const [streamState, setStreamState] = useState<StreamState>({
    isStreaming: false,
    currentMessageId: null,
    streamedContent: ''
  })
  const manualToolCallId = 'manual-tool-call'
  const scrollTimeout = useRef<NodeJS.Timeout>()

  // Add ref for the messages container
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom function with smooth behavior
  const scrollToBottom = () => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }

    // Delay scroll to ensure content is rendered
    scrollTimeout.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Debounced scroll function for rapid updates
  const debouncedScroll = useDebounce(scrollToBottom, 100)

  // Process stream data updates
  useEffect(() => {
    if (!data) return

    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        // Handle text streaming
        if ('type' in item && item.type === 'text' && 'value' in item) {
          setStreamState(prev => ({
            ...prev,
            isStreaming: true,
            streamedContent: item.value as string
          }))
        }
        
        // Handle message updates (final message)
        if ('type' in item && item.type === 'message-update' && 'data' in item && typeof item.data === 'object' && item.data !== null && 'messages' in item.data) {
          const messageData = item.data as unknown as { messages: Message[] }
          if (Array.isArray(messageData.messages) && messageData.messages.length > 0) {
            const lastMessage = messageData.messages[messageData.messages.length - 1]
            setStreamState(prev => ({
              ...prev,
              isStreaming: false,
              currentMessageId: lastMessage.id,
              streamedContent: lastMessage.content
            }))
            setMessages(messageData.messages)
          }
        }

        // Handle stream completion
        if ('type' in item && item.type === 'done') {
          setStreamState(prev => ({
            ...prev,
            isStreaming: false,
            currentMessageId: null,
            // Don't clear streamedContent here
          }))
        }
      }
    })
  }, [data, setMessages])

  // Update messages with streamed content
  useEffect(() => {
    if (streamState.streamedContent && streamState.isStreaming) {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: streamState.streamedContent }
          ]
        }
        return [
          ...prev,
          {
            id: 'streaming',
            role: 'assistant',
            content: streamState.streamedContent
          }
        ]
      })
    }
  }, [streamState.streamedContent, streamState.isStreaming, setMessages])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  // Scroll on mount
  useEffect(() => {
    scrollToBottom()
  }, [])

  // Scroll when messages, data, or loading state changes
  useEffect(() => {
    debouncedScroll()
  }, [messages, data, isLoading, debouncedScroll])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user') {
      setOpenStates({ [manualToolCallId]: true })
    }
  }, [messages])

  // get last tool data for manual tool call
  const lastToolData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null

    const lastItem = data[data.length - 1] as {
      type: 'tool_call'
      data: {
        toolCallId: string
        state: 'call' | 'result'
        toolName: string
        args: string
      }
    }

    if (lastItem.type !== 'tool_call') return null

    const toolData = lastItem.data
    return {
      state: 'call' as const,
      toolCallId: toolData.toolCallId,
      toolName: toolData.toolName,
      args: toolData.args ? JSON.parse(toolData.args) : undefined
    }
  }, [data])

  if (!messages.length) return null

  const lastUserIndex =
    messages.length -
    1 -
    [...messages].reverse().findIndex(msg => msg.role === 'user')

  // Show loading when:
  // 1. Initial loading state is true and last message is from user
  // 2. We're actively streaming content
  const showLoading = (isLoading && messages[messages.length - 1]?.role === 'user') || 
                     streamState.isStreaming

  const getIsOpen = (id: string) => {
    const baseId = id.endsWith('-related') ? id.slice(0, -8) : id
    const index = messages.findIndex(msg => msg.id === baseId)
    return openStates[id] ?? index >= lastUserIndex
  }

  const handleOpenChange = (id: string, open: boolean) => {
    setOpenStates(prev => ({
      ...prev,
      [id]: open
    }))
  }

  return (
    <div className="relative mx-auto px-4 w-full">
      {messages.map(message => (
        <div key={message.id} className="mb-4 flex flex-col gap-4">
          <RenderMessage
            message={message}
            messageId={message.id}
            getIsOpen={getIsOpen}
            onOpenChange={handleOpenChange}
            onQuerySelect={onQuerySelect}
            chatId={chatId}
            messages={messages}
            setMessages={setMessages}
          />
        </div>
      ))}
      {showLoading &&
        (lastToolData ? (
          <ToolSection
            key={manualToolCallId}
            tool={lastToolData}
            isOpen={getIsOpen(manualToolCallId)}
            onOpenChange={open => handleOpenChange(manualToolCallId, open)}
            messages={messages}
            setMessages={setMessages}
            chatId={chatId ?? 'default'}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Spinner />
            {streamState.isStreaming && (
              <span className="text-sm text-muted-foreground">
                Generating response...
              </span>
            )}
          </div>
        ))}
      <div ref={messagesEndRef} /> {/* Add empty div as scroll anchor */}
    </div>
  )
}
