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
  toolCallStatus: 'none' | 'executing' | 'completed'
  postToolResponses: Map<string, {
    responseId: string
    content: string
    status: 'started' | 'streaming' | 'completed'
  }>
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
    streamedContent: '',
    toolCallStatus: 'none',
    postToolResponses: new Map()
  })
  const manualToolCallId = 'manual-tool-call'
  const scrollTimeout = useRef<NodeJS.Timeout>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Reset state when chatId changes
  useEffect(() => {
    setOpenStates({})
    setStreamState({
      isStreaming: false,
      currentMessageId: null,
      streamedContent: '',
      toolCallStatus: 'none',
      postToolResponses: new Map()
    })
    setMessages([])
  }, [chatId, setMessages])

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
    let mounted = true

    const processStreamData = async () => {
      if (!data) return

      for (const item of data) {
        if (!mounted) break

        if (typeof item === 'object' && item !== null) {
          // Handle tool calls
          if ('type' in item && item.type === 'tool_call') {
            console.debug('🛠️ Tool Call Started:', { item })
            if (mounted) {
              setStreamState(prev => ({
                ...prev,
                isStreaming: true,
                toolCallStatus: 'executing'
              }))
            }
          }

          // Handle tool results
          if ('type' in item && item.type === 'tool_result') {
            console.debug('✅ Tool Call Completed:', { item })
            if (mounted) {
              setStreamState(prev => ({
                ...prev,
                toolCallStatus: 'completed',
                isStreaming: true  // Keep streaming for subsequent content
              }))
            }
          }

          // Handle post-tool execution start (type e)
          if ('type' in item && item.type === 'post_tool_start') {
            const { toolCallId, responseId } = item.data as { toolCallId: string; responseId: string }
            console.debug('📝 Post-Tool Response Started:', { toolCallId, responseId })
            if (mounted) {
              setStreamState(prev => {
                const newPostToolResponses = new Map(prev.postToolResponses)
                newPostToolResponses.set(toolCallId, {
                  responseId,
                  content: '',
                  status: 'started'
                })
                return {
                  ...prev,
                  postToolResponses: newPostToolResponses
                }
              })
            }
          }

          // Handle post-tool execution content (type f)
          if ('type' in item && item.type === 'post_tool_content') {
            const { toolCallId, content } = item.data as { toolCallId: string; content: string }
            console.debug('📝 Post-Tool Content Received:', { toolCallId, contentPreview: content.slice(0, 50) })
            if (mounted) {
              setStreamState(prev => {
                const newPostToolResponses = new Map(prev.postToolResponses)
                const currentResponse = newPostToolResponses.get(toolCallId)
                if (currentResponse) {
                  newPostToolResponses.set(toolCallId, {
                    ...currentResponse,
                    content: currentResponse.content + content,
                    status: 'streaming'
                  })
                }
                return {
                  ...prev,
                  postToolResponses: newPostToolResponses
                }
              })
            }
          }

          // Handle post-tool execution end (type g)
          if ('type' in item && item.type === 'post_tool_end') {
            const { toolCallId } = item.data as { toolCallId: string }
            console.debug('📝 Post-Tool Response Completed:', { toolCallId })
            if (mounted) {
              setStreamState(prev => {
                const newPostToolResponses = new Map(prev.postToolResponses)
                const currentResponse = newPostToolResponses.get(toolCallId)
                if (currentResponse) {
                  newPostToolResponses.set(toolCallId, {
                    ...currentResponse,
                    status: 'completed'
                  })
                }
                return {
                  ...prev,
                  postToolResponses: newPostToolResponses
                }
              })
            }
          }

          // Handle text streaming
          if ('type' in item && item.type === 'text' && 'value' in item) {
            console.debug('📝 Text Streaming:', { 
              content: (item.value as string).slice(0, 50) + '...',
              toolCallStatus: streamState.toolCallStatus 
            })
            if (mounted) {
              setStreamState(prev => ({
                ...prev,
                isStreaming: true,
                streamedContent: item.value as string,
                toolCallStatus: prev.toolCallStatus === 'completed' ? 'none' : prev.toolCallStatus
              }))
            }
          }

          // Handle message updates
          if ('type' in item && item.type === 'message-update' && 'data' in item) {
            console.debug('📨 Message Update:', { item })
            const messageData = item.data as unknown as { messages: Message[] }
            if (Array.isArray(messageData.messages) && mounted) {
              const lastMessage = messageData.messages[messageData.messages.length - 1]
              setStreamState(prev => ({
                ...prev,
                currentMessageId: lastMessage.id,
                streamedContent: lastMessage.content
              }))
              setMessages(messageData.messages)
            }
          }

          // Handle stream completion
          if ('type' in item && item.type === 'done') {
            console.debug('🏁 Stream Completed')
            if (mounted) {
              setStreamState(prev => ({
                ...prev,
                isStreaming: false,
                currentMessageId: null,
                toolCallStatus: 'none'
              }))
            }
          }
        }
      }
    }

    processStreamData()

    return () => {
      mounted = false
    }
  }, [data, setMessages])

  // Update messages with streamed content
  useEffect(() => {
    if (streamState.streamedContent && (streamState.isStreaming || streamState.toolCallStatus === 'completed')) {
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
  }, [streamState.streamedContent, streamState.isStreaming, streamState.toolCallStatus, setMessages])

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
    <div className="relative mx-auto px-4 w-full bg-transparent">
      {messages.map(message => (
        <div key={message.id} className="mb-4 flex flex-col gap-4 bg-transparent">
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
          <div className="flex items-center gap-2 bg-transparent">
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
