Here's the organized data:

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

**IV. Based on your description of the issue, here's what I think might be happening:** (This section begins an analysis of the issue and therefore does not fall under the description of components and their functions)
