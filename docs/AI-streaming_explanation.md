AI STREAMING CHAT BEST PRACTICES 

**I. Chat Messages Component (chat-messages.tsx)**

*   Handles real-time message rendering and streaming state.
*   Uses a `StreamState` interface to track:
    *   `isStreaming: boolean`
    *   `currentMessageId: string | null`
    *   `streamedContent: string`
*   Processes stream data through the `useEffect` hook that watches data array.
*   Updates messages based on stream content.

**II. Stream Protocol Manager (stream-protocol-manager.ts)**

*   Manages different types of stream messages using type prefixes:
    *   `0`: for text streaming
    *   `2`: for data streaming
    *   `9`: for tool calls
    *   `d`: for finish messages
*   Handles token usage tracking.

**III. Handle Stream Finish (handle-stream-finish.ts)**

*   Manages the completion of streaming.
*   Handles saving chat history.
*   Processes related questions generation.
*   Updates usage statistics.

**IV. Tool Call Streaming Issue Analysis**

*Problem:* AI stream messages after tool calls are not rendered until user refreshes the page.

**Root Causes:**
1. Incorrect stream state management during tool call lifecycle
2. Premature stream completion after tool calls
3. Missing state transitions between tool completion and subsequent content
4. Lack of proper message continuity handling

**Current Flow:**
1. Tool call starts (`type: 'tool_call'`) → sets `isStreaming` true
2. Tool executes and returns result (`type: 'tool_result'`) → no state update
3. AI continues with analysis (`type: 'text'`) → might not be processed due to incorrect state

**Solution Components:**

1. *Enhanced Stream State:*
```typescript
interface StreamState {
  isStreaming: boolean
  currentMessageId: string | null
  streamedContent: string
  toolCallStatus: 'none' | 'executing' | 'completed'  // New state tracker
}
```

2. *Improved Stream Processing:*
```typescript
// Handle tool calls
if ('type' in item && item.type === 'tool_call') {
  setStreamState(prev => ({
    ...prev,
    isStreaming: true,
    toolCallStatus: 'executing'
  }))
}

// Handle tool results
if ('type' in item && item.type === 'tool_result') {
  setStreamState(prev => ({
    ...prev,
    toolCallStatus: 'completed',
    isStreaming: true  // Keep streaming for subsequent content
  }))
}

// Handle text streaming (including post-tool content)
if ('type' in item && item.type === 'text') {
  setStreamState(prev => ({
    ...prev,
    isStreaming: true,
    streamedContent: item.value as string,
    toolCallStatus: prev.toolCallStatus === 'completed' ? 'none' : prev.toolCallStatus
  }))
}
```

3. *Message Continuity Handler:*
```typescript
useEffect(() => {
  if (streamState.toolCallStatus === 'completed' && streamState.streamedContent) {
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1]
      if (lastMessage?.role === 'assistant') {
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            content: streamState.streamedContent
          }
        ]
      }
      return prev
    })
  }
}, [streamState.toolCallStatus, streamState.streamedContent])
```

**Key Improvements:**
1. Proper state tracking through entire tool call lifecycle
2. Maintained streaming state during tool call completion
3. Smooth transition from tool results to subsequent content
4. Continuous message updates during and after tool calls

**Implementation Benefits:**
- Eliminates need for page refresh
- Maintains message continuity
- Proper handling of multi-step tool calls
- Better user experience with real-time updates

How to Fix AI Streaming Issues:

I'll help you update the chat-messages.tsx with the simplified streaming approach. Here's what we need to modify:
First, let's update the StreamState interface to be simpler:

interface StreamState {
  isStreaming: boolean
  currentMessageId: string | null
  streamedContent: string
}

Then, let's modify the main streaming effect:

// In chat-messages.tsx
useEffect(() => {
  let mounted = true

  const processStreamData = async () => {
    if (!data) return

    for (const item of data) {
      if (!mounted) break

      if (typeof item === 'object' && item !== null) {
        // Handle text streaming
        if ('type' in item && item.type === 'text' && 'value' in item) {
          setStreamState(prev => ({
            ...prev,
            isStreaming: true,
            streamedContent: item.value as string
          }))
        }
        
        // Always process message updates
        if ('type' in item && item.type === 'message-update' && 'data' in item && typeof item.data === 'object' && item.data !== null && 'messages' in item.data) {
          const messageData = item.data as { messages: Message[] }
          if (Array.isArray(messageData.messages)) {
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
          setStreamState(prev => ({
            ...prev,
            isStreaming: false,
            currentMessageId: null,
            // Keep the streamedContent for final message check
          }))
        }
      }
    }
  }

  processStreamData()

  return () => {
    mounted = false
  }
}, [data, setMessages])

Add a final message check effect:

const ensureFinalMessage = useCallback(() => {
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === 'assistant' && streamState.streamedContent) {
    setMessages(prev => [
      ...prev.slice(0, -1),
      {
        ...lastMessage,
        content: streamState.streamedContent
      }
    ])
  }
}, [messages, streamState.streamedContent])

// Call this when streaming ends
useEffect(() => {
  if (!streamState.isStreaming && streamState.streamedContent) {
    ensureFinalMessage()
  }
}, [streamState.isStreaming, ensureFinalMessage])

Update the chat reset logic:

// Reset state when chatId changes
useEffect(() => {
  setOpenStates({})
  setStreamState({
    isStreaming: false,
    currentMessageId: null,
    streamedContent: ''
  })
  setMessages([]) // Clear messages when chatId changes
}, [chatId, setMessages])

Simplify the loading state:

// Show loading when:
// 1. Initial loading state is true and last message is from user
// 2. We're actively streaming content
const showLoading = (isLoading && messages[messages.length - 1]?.role === 'user') || 
                   streamState.isStreaming

Update the tool call handling:

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

  return {
    state: 'call' as const,
    toolCallId: lastItem.data.toolCallId,
    toolName: lastItem.data.toolName,
    args: lastItem.data.args ? JSON.parse(lastItem.data.args) : undefined
  }
}, [data])

// Show tool section when appropriate
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

This simplified approach:
Properly handles stream cleanup with mounted flag
Always processes message updates
Ensures final message completeness
Maintains proper loading states
Handles tool calls without complex state tracking
Uses React's built-in cleanup mechanisms