## Chart Implementation Progress

### Our Modern Implementation Approach

Our current implementation takes a sophisticated approach using Next.js, React, and TypeScript. Here's an overview of our successful implementation:

#### Previous Failed Attempts and Lessons Learned

1. **Annotation-Only Approach (Failed)**
   - Initially tried to rely solely on message annotations for chart data
   - Failed because the AI's response format includes chart data as XML-like tags in the content
   - Annotations were never populated because we weren't processing the XML structure

2. **Direct Chart.js Integration (Failed)**
   - Attempted to directly integrate Chart.js without proper message processing
   - Charts wouldn't render because we were missing the connection between AI output and chart data
   - The XML tags in the content were being displayed as raw text

3. **Children Prop Approach (Failed)**
   ```typescript
   <ChatMessages>
     {(message) => (
       <ChartMessage message={chartMessage} />
     )}
   </ChatMessages>
   ```
   - Tried to use a render prop pattern with ChatMessages
   - Failed because ChatMessages wasn't designed to accept children
   - Led to type errors and runtime issues

4. **Why Our Current Solution Works**
   - Processes chart data at the message rendering level in `RenderMessage`
   - Handles both annotation-based and XML-based chart data
   - Properly cleans up the message content after extracting chart data
   - Uses proper TypeScript types and validation
   - Maintains separation of concerns between data extraction and rendering

5. **Message Duplication Issues (Fixed)**
   - Initially had issues with chart data being duplicated in messages
   - Two main duplication sources identified:
     1. Chart data appearing in both message content and annotations
     2. Same text description appearing in both chart message and regular message

   **Solution Implementation:**
   ```typescript
   // In handleStreamFinish.ts
   const chartMessages = allAnnotations.filter(a => 
     'type' in a && a.type === 'chart'
   )
   const otherAnnotations = allAnnotations.filter(a => 
     a.role === 'data' && 
     a.content !== null &&
     typeof a.content === 'object' && 
     'type' in a.content && 
     a.content.type !== 'tool_call'
   )

   // Create the message to save with proper ordering
   const generatedMessages = [
     ...extendedCoreMessages,
     ...responseMessages.slice(0, -1),
     ...otherAnnotations,
     // For the last message, if we have a chart, use it instead of the text message
     ...(chartMessages.length > 0 ? chartMessages : responseMessages.slice(-1))
   ]
   ```

   **Key Improvements:**
   1. Separated chart messages from other annotations
   2. Implemented mutually exclusive message handling:
      - If a chart message exists, use it instead of the text message
      - If no chart message exists, use the original text message
   3. Proper ordering ensures consistent message flow
   4. Chart data is preserved while eliminating duplicate text

   **Loading and Parsing:**
   ```typescript
   // In getChat.ts and getChats.ts
   if (msg.type === 'chart' && msg.data) {
     return {
       ...msg,
       data: typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data
     }
   }
   ```
   - Special handling for chart message types during loading
   - Ensures chart data structure is preserved
   - Properly parses nested JSON structures
   - Maintains type safety throughout the process

The key insight was that we needed to:
1. Extract chart data from the message content using regex
2. Convert the extracted data into a proper ChatChartMessage format
3. Clean up the displayed message by removing the XML tags
4. Handle both annotation and XML-based chart data sources
5. Process everything at the message rendering level rather than the chat level
6. Ensure mutually exclusive message handling to prevent duplication

#### Current Architecture

*   **Technology Stack:**
    *   Next.js with TypeScript
    *   React-based components
    *   Dynamic imports for better performance
    *   Integration with chat/streaming system
    *   `react-chartjs-2` as Chart.js React wrapper

*   **Key Components:**
    *   Base Chart Component (`components/ui/chart.tsx`)
    *   Chart Message Component (`components/chart-message.tsx`)
    *   Chart Types and Interfaces (`lib/types/chart.ts`)
    *   API Route with Stream Processing (`app/api/chat/route.ts`)

#### Successfully Implemented Features

1. **XML-like Chart Data Processing**
   ```typescript
   // Function to extract and parse chart data from message content
   function extractChartData(content: string): ChatChartMessage | null {
     try {
       const chartMatch = content.match(/<chart_data>([\s\S]*?)<\/chart_data>/)
       if (!chartMatch) return null

       const chartJson = JSON.parse(chartMatch[1].trim())
       return createChartMessage(chartJson)
     } catch (error) {
       console.error('Error extracting chart data:', error)
       return null
     }
   }
   ```

2. **Dual Chart Data Sources**
   - Support for both annotation-based charts and inline XML-like chart data
   - Seamless fallback between the two sources
   ```typescript
   const chartMessage = useMemo(() => {
     // First check annotations
     const chartAnnotation = message.annotations?.find(
       annotation => (annotation as any)?.type === 'chart'
     ) as ChatChartMessage | undefined

     if (chartAnnotation) return chartAnnotation

     // If no annotation, try to extract from content
     if (typeof message.content === 'string') {
       return extractChartData(message.content)
     }

     return undefined
   }, [message.annotations, message.content])
   ```

3. **Clean Content Display**
   - Automatic removal of chart XML data from displayed message
   - Preserves readability while maintaining chart functionality
   ```typescript
   const cleanContent = typeof message.content === 'string' 
     ? message.content.replace(/<chart_data>[\s\S]*?<\/chart_data>/g, '').trim()
     : message.content
   ```

4. **Type-Safe Chart Data Handling**
   ```typescript
   export interface ChatChartData {
     type: ChartType
     title?: string
     labels: string[]
     datasets: Array<{
       label: string
       data: number[]
       borderColor?: string
       backgroundColor?: string
       borderWidth?: number
     }>
   }

   export interface ChatChartMessage {
     type: 'chart'
     role: 'assistant'
     content: string
     data: ChatChartData
   }
   ```

5. **Robust Data Validation**
   ```typescript
   export function validateChatChartData(data: any): data is ChatChartData {
     if (!data || 
         !data.type ||
         !Array.isArray(data.labels) || 
         !Array.isArray(data.datasets)) return false

     return data.datasets.every((dataset: DatasetToValidate) => 
       typeof dataset.label === 'string' &&
       Array.isArray(dataset.data) &&
       dataset.data.every((value: unknown) => typeof value === 'number')
     )
   }
   ```

4. **Message Content Double Rendering (Fixed)**
   - Initially had overlapping render paths for messages with tool calls
   - Content would render once through tool data and once through content section
   - Fixed by properly handling message storage and loading:
   ```typescript
   // When saving messages
   const extendedCoreMessages = originalMessages.map(msg => ({
     role: msg.role,
     content: msg.content,
     ...(msg.toolInvocations && { toolInvocations: msg.toolInvocations })
   }))

   // Filter out redundant tool-call annotations
   const generatedMessages = [
     ...extendedCoreMessages,
     ...responseMessages.slice(0, -1),
     ...allAnnotations.filter(a => 
       a.role === 'data' && 
       a.content !== null &&
       typeof a.content === 'object' && 
       'type' in a.content && 
       a.content.type !== 'tool_call'
     ),
     ...responseMessages.slice(-1)
   ]
   ```

   ```typescript
   // When loading messages
   chat.messages = parsedMessages.map((msg: any) => ({
     ...msg,
     ...(msg.toolInvocations && {
       toolInvocations: msg.toolInvocations.map((tool: any) => ({
         ...tool,
         args: typeof tool.args === 'string' ? JSON.parse(tool.args) : tool.args,
         result: tool.result && typeof tool.result === 'string' ? 
           JSON.parse(tool.result) : tool.result
       }))
     })
   }))
   ```
   - Now ensures message content is rendered exactly once
   - Properly preserves tool invocations in chat history
   - Prevents duplication by removing redundant tool-call annotations
   - Handles both live and history messages consistently

#### Usage Example

To render a chart in the chat dialogue, include chart data in the following format:

```typescript
<chart_data>
{
  "type": "line",
  "title": "Sample Chart",
  "labels": ["Label1", "Label2", "Label3"],
  "datasets": [{
    "label": "Dataset Name",
    "data": [10, 20, 30],
    "borderColor": "#4CAF50",
    "backgroundColor": "rgba(76, 175, 80, 0.1)"
  }]
}
</chart_data>
```

The system will:
1. Extract the chart data from the message
2. Validate the data structure
3. Create a properly typed chart message
4. Render the chart while cleaning the message content
5. Display both the chart and the cleaned message text

#### Key Implementation Benefits

1. **Flexibility**: Supports both annotation-based and inline chart data
2. **Type Safety**: Full TypeScript support with runtime validation
3. **Clean Display**: Automatic removal of chart markup from message content
4. **Error Handling**: Graceful fallbacks and error states
5. **Performance**: Efficient memo-ization of chart processing
6. **Maintainability**: Clear separation of concerns and modular design

This implementation successfully enables dynamic chart rendering in the chat dialogue, with proper type safety, error handling, and a clean user experience.