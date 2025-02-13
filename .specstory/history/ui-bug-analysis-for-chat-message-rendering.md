## SpecStory

## UI Bug Analysis for Chat Message Rendering (2/10/2025, 2:50:31 PM)

_**User**_

@handle-stream-finish.ts @chat-messages.tsx @stream-protocol-manager.ts  @BetterVercel_Implementation.md 

Help me review these files, analyze the possible small ui bugs where the chat message is render too quickly, which leads to the AI API streaming outputs which comes AFTER, does not get rendered, unless the User Refresh the browser.

Don't make any code changes, just check.

---

_**Assistant**_

I'll help analyze the potential UI bugs related to message rendering and streaming outputs. Let me break down the components and their interactions:

1. **Message Rendering Flow Analysis**

In `chat-messages.tsx`, I notice a few potential issues:

a) Scroll Behavior:
```typescript
// Current implementation
useEffect(() => {
  scrollToBottom()
}, [])
```
- The scroll only happens on mount, not when new messages arrive
- This could cause streaming content to be "hidden" below the viewport

b) Message State Updates:
```typescript
const showLoading = isLoading && messages[messages.length - 1].role === 'user'
```
- The loading state only shows for user messages
- There's no explicit handling of streaming AI responses in progress

2. **Stream Protocol Analysis**

In `stream-protocol-manager.ts`, the protocol implementation is solid but there are timing considerations:

```typescript
streamText(text: string) {
  this.dataStream.write(`0:${text}\n`)
  this.usageInfo.usage.completionTokens += this.estimateTokens(text)
}
```
- The streaming happens immediately
- But there's no guarantee the UI has processed previous chunks before new ones arrive

3. **Stream Finish Handling**

In `handle-stream-finish.ts`, there are several critical points:

```typescript
try {
  // Update usage if provided
  if (usage) {
    streamManager.updateUsage(usage.promptTokens, usage.completionTokens)
    // ... usage tracking ...
  }

  // Generate related questions
  if (!skipRelatedQuestions) {
    // ... related questions generation ...
  }

  // Save chat with complete response
  await saveChat({
    ...savedChat,
    messages: generatedMessages
  })
```

Potential Race Conditions:
1. The chat might be saved before all streaming content is processed by the UI
2. Related questions generation happens after the main response
3. Usage updates occur asynchronously

4. **Root Causes of UI Issues**

Based on the implementation in `BetterVercel_Implementation.md` and the code, here are the likely causes of messages not appearing without refresh:

1. **Race Conditions**
- The UI might update its state before all stream parts are processed
- The finish message might arrive before all content is rendered
- Related questions and annotations might arrive after the UI thinks the message is complete

2. **State Management Gaps**
- No explicit handling of partial message updates
- Missing synchronization between stream protocol and UI updates
- Incomplete message state tracking during streaming

3. **Timing Issues**
- No guaranteed order of operations between:
  - Stream content arrival
  - Message state updates
  - UI rendering
  - Chat saving
  - Related content generation

5. **Recommendations** (without code changes)

To fix these issues, you would need to:

1. **Message Handling**
- Implement proper message buffering
- Add state tracking for incomplete messages
- Ensure proper ordering of stream processing

2. **UI Updates**
- Add proper stream completion detection
- Implement progressive message rendering
- Add proper scroll handling for new content

3. **State Management**
- Track message completion state
- Handle partial updates properly
- Implement proper stream finish detection

4. **Testing Scenarios**
- Test with slow network conditions
- Test with large streaming responses
- Test with concurrent streaming messages
- Test with related content generation

The core issue appears to be a lack of synchronization between the streaming protocol and UI updates, combined with potential race conditions in state management. The UI might consider a message "complete" before all stream parts have been processed, leading to missing content until refresh.

Would you like me to propose specific solutions for any of these areas?

---

_**User**_

Let's look into this first. . Message Rendering Flow Analysis
In chat-messages.tsx, I notice a few potential issues:
a) Scroll Behavior:
// Current implementation
useEffect(() => {
  scrollToBottom()
}, [])
  scrollToBottom()
- The scroll only happens on mount, not when new messages arrive
This could cause streaming content to be "hidden" below the viewport

---

_**Assistant**_

I'll analyze this scroll behavior issue in more detail by examining the relevant code.

Let me first search for any other scroll-related implementations:

---

_****_

<details>
            <summary>Searched codebase "scrollToBottom scrollIntoView scroll behavior messages" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `components/chat-messages.tsx` | L74-118 |
| `components/chat-messages.tsx` | L233-271 |
| `components/chat-messages.tsx` | L118-188 |
| `chatimplementationreference.md` | L24-97 |
| `components/chat-messages.tsx` | L188-233 |
| `components/render-message.tsx` | L173-186 |
| `components/chat-panel.tsx` | L315-347 |
| `components/chat-panel.tsx` | L347-363 |
| `importedcode-newfeature-deepresearch/REF-deep-research-message.tsx` | L302-353 |
| `components/user-message.tsx` | L6-14 |
| `components/chat-panel.tsx` | L385-430 |
| `importedcode-newfeature-deepresearch/REF-deep-research-multimodal-input.tsx` | L232-288 |
| `components/collapsible-message.tsx` | L20-76 |
| `components/chat-panel.tsx` | L518-556 |
| `importedcode-newfeature-deepresearch/REF-deep-research-message.tsx` | L148-190 |
| `components/render-message.tsx` | L117-173 |
| `lib/utils/context-window.ts` | L22-50 |
| `importedcode-newfeature-deepresearch/REF-deep-research-multimodal-input.tsx` | L321-344 |
| `components/render-message.tsx` | L69-117 |
| `components/chat.tsx` | L1-73 |
| `components/message.tsx` | L44-91 |
| `components/chat-panel.tsx` | L243-273 |
| `components/empty-screen.tsx` | L1-51 |
| `components/render-message.tsx` | L23-34 |
| `components/chat-panel.tsx` | L42-94 |

</details>

---

_****_



Let me check the chat-messages.tsx implementation more closely:

---

_****_

Read file: components/chat-messages.tsx

---

_****_



After analyzing the code, I can confirm there are several issues with the scroll behavior that could lead to missing streamed content:

1. **Limited Scroll Trigger**
```typescript
// Current implementation
useEffect(() => {
  scrollToBottom()
}, []) // Only triggers on mount
```
The main issue is that the scroll behavior only triggers on component mount, but not when:
- New messages are added
- Streaming content arrives
- Tool calls complete
- Related questions are generated

2. **Missing Dependencies in useEffect**
The scroll effect should also trigger when:
```typescript
// Should include these dependencies
useEffect(() => {
  scrollToBottom()
}, [messages, data, isLoading]) // These dependencies are missing
```

3. **Race Condition with Streaming**
```typescript
const showLoading = isLoading && messages[messages.length - 1].role === 'user'
```
The loading state only considers user messages, but doesn't track streaming assistant responses, which can lead to:
- Content arriving after the UI thinks the message is complete
- Missing scroll updates during streaming
- Incomplete message rendering

4. **Async Tool Call Handling**
```typescript
const lastToolData = useMemo(() => {
  if (!data || !Array.isArray(data) || data.length === 0) return null
  // ... tool data processing
}, [data])
```
Tool calls and their results may arrive after the initial message, but there's no scroll behavior to handle this.

5. **Missing Scroll for Dynamic Content**
The `RenderMessage` component can dynamically expand (like tool sections, related questions), but there's no scroll behavior to handle this expansion.

These issues combined can lead to:
1. Missing streamed content below the viewport
2. Incomplete message rendering requiring refresh
3. Tool call results not being visible
4. Related questions being hidden
5. Poor user experience with manual scrolling needed

Would you like me to propose specific solutions for any of these issues?

---

_**User**_

Yes. Let's try solving one by one

---

_**Assistant**_

Let's solve these issues one by one, starting with the most critical one:

1. First, let's fix the **Limited Scroll Trigger** issue. This is the most immediate problem causing content to be hidden.

Let me explain what I'm going to do:
1. Add proper dependencies to the scroll effect
2. Add a debounced scroll to handle rapid updates
3. Ensure scroll happens after content renders

Here's my analysis of the current implementation:

---

_****_

```diff
+ import { useDebounce } from '@/lib/hooks/use-debounce'
  import { JSONValue, Message } from 'ai'
  import { useEffect, useMemo, useRef, useState } from 'react'
    const [openStates, setOpenStates] = useState<Record<string, boolean>>({})
    const manualToolCallId = 'manual-tool-call'
+   const scrollTimeout = useRef<NodeJS.Timeout>()
  
    // Add ref for the messages container
    const messagesEndRef = useRef<HTMLDivElement>(null)
  
-   // Scroll to bottom function
+   // Scroll to bottom function with smooth behavior
    const scrollToBottom = () => {
-     messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
+     if (scrollTimeout.current) {
+       clearTimeout(scrollTimeout.current)
+     }
+ 
+     // Delay scroll to ensure content is rendered
+     scrollTimeout.current = setTimeout(() => {
+       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
+     }, 100)
    }
  
-   // Scroll to bottom on mount and when messages change
+   // Debounced scroll function for rapid updates
+   const debouncedScroll = useDebounce(scrollToBottom, 100)
+ 
+   // Cleanup timeout on unmount
+   useEffect(() => {
+     return () => {
+       if (scrollTimeout.current) {
+         clearTimeout(scrollTimeout.current)
+       }
+     }
+   }, [])
+ 
+   // Scroll on mount
    useEffect(() => {
      scrollToBottom()
    }, [])
+ 
+   // Scroll when messages, data, or loading state changes
+   useEffect(() => {
+     debouncedScroll()
+   }, [messages, data, isLoading, debouncedScroll])
  
    useEffect(() => {
```

---

_****_



I see we need to create the `useDebounce` hook first. Let me create that:

---

_****_

```diff
- 
+ import { useCallback, useEffect, useRef } from 'react'
+ 
+ export function useDebounce<T extends (...args: any[]) => void>(
+   callback: T,
+   delay: number
+ ): T {
+   const timeoutRef = useRef<NodeJS.Timeout>()
+   const callbackRef = useRef(callback)
+ 
+   // Update callback ref when callback changes
+   useEffect(() => {
+     callbackRef.current = callback
+   }, [callback])
+ 
+   // Cleanup on unmount
+   useEffect(() => {
+     return () => {
+       if (timeoutRef.current) {
+         clearTimeout(timeoutRef.current)
+       }
+     }
+   }, [])
+ 
+   return useCallback(
+     ((...args: Parameters<T>) => {
+       if (timeoutRef.current) {
+         clearTimeout(timeoutRef.current)
+       }
+ 
+       timeoutRef.current = setTimeout(() => {
+         callbackRef.current(...args)
+       }, delay)
+     }) as T,
+     [delay]
+   )
+ } 
```

---

_****_



Great! Now that we have the `useDebounce` hook implemented, let's explain what the changes do:

1. **Debounced Scroll Behavior**:
```typescript
const debouncedScroll = useDebounce(scrollToBottom, 100)
```
- This creates a debounced version of scrollToBottom that only fires after 100ms of inactivity
- Prevents multiple scroll attempts during rapid updates
- More efficient than calling scroll on every update

2. **Improved Scroll Timing**:
```typescript
const scrollToBottom = () => {
  if (scrollTimeout.current) {
    clearTimeout(scrollTimeout.current)
  }

  // Delay scroll to ensure content is rendered
  scrollTimeout.current = setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}
```
- Added a small delay to ensure content renders before scrolling
- Cleans up previous scroll attempts
- Uses smooth scrolling for better UX

3. **Proper Dependencies**:
```typescript
useEffect(() => {
  debouncedScroll()
}, [messages, data, isLoading, debouncedScroll])
```
- Now triggers scroll on all relevant state changes
- Handles streaming content updates
- Responds to loading state changes

4. **Cleanup**:
```typescript
useEffect(() => {
  return () => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }
  }
}, [])
```
- Properly cleans up timeouts on unmount
- Prevents memory leaks
- Handles component cleanup

These changes should solve the first issue where streamed content wasn't visible because:
1. Scroll now triggers on all relevant updates
2. Debouncing prevents scroll thrashing during rapid updates
3. Delayed scroll ensures content is rendered first
4. Smooth scrolling provides better user experience

Would you like to test this first change and then move on to solving the next issue?

---

_**User**_

Then let's try to solve

Race Condition with Streaming
const showLoading = isLoading && messages[messages.length - 1].role === 'user'
The loading state only considers user messages, but doesn't track streaming assistant responses, which can lead to:
Content arriving after the UI thinks the message is complete
Missing scroll updates during streaming
Incomplete message rendering

---

_**Assistant**_

Let's analyze and fix the race condition with streaming. The current issue is that we only show loading state for user messages, but don't properly track the assistant's streaming response.

Let me first check the related components to understand the full streaming flow:

---

_****_

<details>
            <summary>Searched codebase "streaming state message handling ai response" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/streaming/types.ts` | L1-8 |
| `lib/streaming/handle-stream-finish.ts` | L1-19 |
| `lib/streaming/create-tool-calling-stream.ts` | L71-110 |
| `lib/streaming/create-manual-tool-stream.ts` | L1-21 |
| `lib/streaming/create-tool-calling-stream.ts` | L1-22 |
| `lib/streaming/create-manual-tool-stream.ts` | L62-101 |
| `lib/ai/research-processor.ts` | L226-259 |
| `lib/streaming/tool-execution.ts` | L69-128 |
| `lib/streaming/handle-stream-finish.ts` | L88-144 |
| `lib/streaming/handle-stream-finish.ts` | L144-198 |
| `lib/streaming/create-tool-calling-stream.ts` | L110-153 |
| `lib/streaming/handle-stream-finish.ts` | L198-202 |
| `lib/streaming/stream-protocol-manager.ts` | L67-73 |
| `lib/streaming/tool-execution.ts` | L1-18 |
| `lib/streaming/create-manual-tool-stream.ts` | L101-144 |
| `app/api/chat/route.ts` | L92-134 |
| `lib/streaming/stream-protocol-manager.ts` | L40-47 |
| `lib/streaming/stream-protocol-manager.ts` | L1-9 |
| `lib/streaming/create-tool-calling-stream.ts` | L27-71 |
| `importedcode-newfeature-deepresearch/REF-deep-research-message.tsx` | L302-353 |
| `lib/streaming/create-manual-tool-stream.ts` | L26-62 |
| `lib/streaming/handle-stream-finish.ts` | L24-88 |
| `lib/streaming/stream-protocol-manager.ts` | L29-35 |
| `app/api/chat/route.ts` | L170-200 |
| `lib/ai/research-processor.ts` | L77-109 |

</details>

---

_****_



Based on the code analysis, I can see that we need to track the streaming state more accurately. Let me propose changes to fix the race condition:

---

_****_

```diff
  import { ToolSection } from './tool-section'
  import { Spinner } from './ui/spinner'
+ 
+ interface StreamState {
+   isStreaming: boolean
+   currentMessageId: string | null
+   streamedContent: string
+ }
  
  interface ChatMessagesProps {
  }: ChatMessagesProps) {
    const [openStates, setOpenStates] = useState<Record<string, boolean>>({})
+   const [streamState, setStreamState] = useState<StreamState>({
+     isStreaming: false,
+     currentMessageId: null,
+     streamedContent: ''
+   })
    const manualToolCallId = 'manual-tool-call'
    const scrollTimeout = useRef<NodeJS.Timeout>()
    // Debounced scroll function for rapid updates
    const debouncedScroll = useDebounce(scrollToBottom, 100)
+ 
+   // Process stream data updates
+   useEffect(() => {
+     if (!data) return
+ 
+     data.forEach(item => {
+       if (typeof item === 'object' && item !== null) {
+         // Handle text streaming
+         if ('type' in item && item.type === 'text' && 'value' in item) {
+           setStreamState(prev => ({
+             ...prev,
+             isStreaming: true,
+             streamedContent: item.value as string
+           }))
+         }
+         
+         // Handle stream completion
+         if ('type' in item && item.type === 'done') {
+           setStreamState(prev => ({
+             ...prev,
+             isStreaming: false,
+             currentMessageId: null,
+             streamedContent: ''
+           }))
+         }
+       }
+     })
+   }, [data])
+ 
+   // Update messages with streamed content
+   useEffect(() => {
+     if (streamState.streamedContent && streamState.isStreaming) {
+       setMessages(prev => {
+         const lastMessage = prev[prev.length - 1]
+         if (lastMessage?.role === 'assistant') {
+           return [
+             ...prev.slice(0, -1),
+             { ...lastMessage, content: streamState.streamedContent }
+           ]
+         }
+         return [
+           ...prev,
+           {
+             id: 'streaming',
+             role: 'assistant',
+             content: streamState.streamedContent
+           }
+         ]
+       })
+     }
+   }, [streamState.streamedContent, streamState.isStreaming, setMessages])
  
    // Cleanup timeout on unmount
      [...messages].reverse().findIndex(msg => msg.role === 'user')
  
-   const showLoading = isLoading && messages[messages.length - 1].role === 'user'
+   // Show loading when:
+   // 1. Initial loading state is true and last message is from user
+   // 2. We're actively streaming content
+   const showLoading = (isLoading && messages[messages.length - 1]?.role === 'user') || 
+                      streamState.isStreaming
  
    const getIsOpen = (id: string) => {
              messages={messages}
              setMessages={setMessages}
+             chatId={chatId ?? 'default'}
            />
          ) : (
+           <div className="flex items-center gap-2">
              <Spinner />
+             {streamState.isStreaming && (
+               <span className="text-sm text-muted-foreground">
+                 Generating response...
+               </span>
+             )}
+           </div>
          ))}
        <div ref={messagesEndRef} /> {/* Add empty div as scroll anchor */}
```

---

_****_



The changes I've made address several key issues:

1. **Proper Stream State Tracking**:
```typescript
interface StreamState {
  isStreaming: boolean
  currentMessageId: string | null
  streamedContent: string
}
```
- Added dedicated state for tracking streaming status
- Tracks current message being streamed
- Stores streamed content separately

2. **Improved Loading State Logic**:
```typescript
const showLoading = (isLoading && messages[messages.length - 1]?.role === 'user') || 
                   streamState.isStreaming
```
- Now shows loading in two cases:
  1. Initial loading when user sends message
  2. During active streaming of assistant response

3. **Stream Content Processing**:
```typescript
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
      // Handle stream completion
      if ('type' in item && item.type === 'done') {
        setStreamState(prev => ({
          ...prev,
          isStreaming: false,
          currentMessageId: null,
          streamedContent: ''
        }))
      }
    }
  })
}, [data])
```
- Properly processes streaming updates
- Handles stream completion
- Updates UI state accordingly

4. **Message Updates During Streaming**:
```typescript
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
```
- Updates messages in real-time during streaming
- Handles both new messages and updates to existing ones
- Maintains message continuity

5. **Better Loading UI**:
```typescript
<div className="flex items-center gap-2">
  <Spinner />
  {streamState.isStreaming && (
    <span className="text-sm text-muted-foreground">
      Generating response...
    </span>
  )}
</div>
```
- Added visual feedback during streaming
- Shows different states for loading vs streaming
- Improves user experience

These changes should fix the race conditions and ensure that:
1. Streaming content is always visible
2. Messages update properly during streaming
3. UI reflects the correct state at all times
4. No content is lost between updates

Would you like me to explain any part in more detail or move on to the next issue?

---

_**User**_

i think your latest changes, there were some change that made the Full message appeared correctly for a brief instant, but then it stopped working, until user Refresh. Look through what you have done in the last step in the @chat-messages.tsx file, then try to replicate it

---

_**Assistant**_

Let me analyze what could be causing this issue. Looking at the changes I made, I think I see the problem:

1. **The Stream State Update**:
```typescript
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
      
      // Handle stream completion
      if ('type' in item && item.type === 'done') {
        setStreamState(prev => ({
          ...prev,
          isStreaming: false,
          currentMessageId: null,
          streamedContent: ''  // <-- This is clearing the content!
        }))
      }
    }
  })
}, [data])
```

The issue is in the stream completion handling. When we receive the 'done' event, we're clearing the `streamedContent`, which is causing the message to disappear. Let me check the data stream format:

---

_****_

<details>
            <summary>Searched codebase "stream data format message-update text type done" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/streaming/stream-protocol-manager.ts` | L67-73 |
| `lib/streaming/stream-protocol-manager.ts` | L35-40 |
| `lib/streaming/stream-protocol-manager.ts` | L40-47 |
| `lib/streaming/stream-protocol-manager.ts` | L29-35 |
| `lib/streaming/stream-protocol-manager.ts` | L57-62 |
| `lib/streaming/stream-protocol-manager.ts` | L47-52 |
| `lib/streaming/types.ts` | L1-8 |
| `lib/streaming/stream-protocol-manager.ts` | L62-67 |
| `app/api/chat/route.ts` | L92-134 |
| `lib/streaming/stream-protocol-manager.ts` | L52-57 |
| `lib/streaming/create-tool-calling-stream.ts` | L71-110 |
| `app/api/chat/route.ts` | L134-170 |
| `lib/streaming/create-manual-tool-stream.ts` | L62-101 |
| `lib/streaming/create-tool-calling-stream.ts` | L27-71 |
| `app/api/chat/route.ts` | L7-16 |
| `lib/streaming/create-manual-tool-stream.ts` | L26-62 |
| `lib/streaming/create-manual-tool-stream.ts` | L1-21 |
| `lib/streaming/tool-execution.ts` | L69-128 |
| `lib/streaming/create-tool-calling-stream.ts` | L1-22 |
| `lib/types/index.ts` | L67-73 |
| `lib/streaming/stream-protocol-manager.ts` | L15-29 |
| `lib/streaming/tool-execution.ts` | L1-18 |
| `lib/streaming/handle-stream-finish.ts` | L1-19 |
| `lib/streaming/stream-protocol-manager.ts` | L1-9 |
| `app/api/chat/route.ts` | L170-200 |

</details>

---

_****_



I see the issue now. Looking at the stream protocol and route handling, I notice that we receive a `message-update` type event at the end of streaming that contains the final message. We need to handle this event type and not clear the content. Let me fix this:

---

_****_

```diff
          }
          
+         // Handle message updates (final message)
+         if ('type' in item && item.type === 'message-update' && 'data' in item) {
+           const messageData = item.data as { messages: Message[] }
+           if (messageData.messages?.length > 0) {
+             const lastMessage = messageData.messages[messageData.messages.length - 1]
+             setStreamState(prev => ({
+               ...prev,
+               isStreaming: false,
+               currentMessageId: lastMessage.id,
+               streamedContent: lastMessage.content
+             }))
+             setMessages(messageData.messages)
+           }
+         }
+ 
          // Handle stream completion
          if ('type' in item && item.type === 'done') {
              isStreaming: false,
              currentMessageId: null,
-             streamedContent: ''
+             // Don't clear streamedContent here
            }))
          }
        }
      })
-   }, [data])
+   }, [data, setMessages])
  
    // Update messages with streamed content
```

---

_****_



Let me fix the type error:

---

_****_

```diff
          
          // Handle message updates (final message)
-         if ('type' in item && item.type === 'message-update' && 'data' in item) {
-           const messageData = item.data as { messages: Message[] }
-           if (messageData.messages?.length > 0) {
+         if ('type' in item && item.type === 'message-update' && 'data' in item && typeof item.data === 'object' && item.data !== null && 'messages' in item.data) {
+           const messageData = item.data as unknown as { messages: Message[] }
+           if (Array.isArray(messageData.messages) && messageData.messages.length > 0) {
              const lastMessage = messageData.messages[messageData.messages.length - 1]
              setStreamState(prev => ({
```

---

_****_



The changes I've made fix two key issues:

1. **Proper Message Update Handling**:
```typescript
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
```
- Now properly handles the final message update
- Updates both stream state and messages
- Maintains the final content instead of clearing it

2. **Stream Completion Without Content Loss**:
```typescript
// Handle stream completion
if ('type' in item && item.type === 'done') {
  setStreamState(prev => ({
    ...prev,
    isStreaming: false,
    currentMessageId: null,
    // Don't clear streamedContent here
  }))
}
```
- No longer clears the content on stream completion
- Maintains the last streamed content
- Only updates streaming state flags

This should fix the issue where:
1. The full message appears correctly
2. Content remains visible after streaming completes
3. No refresh is needed to see the complete message

The key was to:
1. Properly handle the `message-update` event which contains the final message
2. Not clear the content on stream completion
3. Add proper type checking for the message update data

Would you like to test this change to verify it works as expected?

---



---

