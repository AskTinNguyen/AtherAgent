# Better Vercel AI SDK Implementation

## Overview
This document outlines the analysis and implementation plan for improving our Vercel AI SDK integration, specifically focusing on streaming, token usage tracking, error handling, and tool call management.

## References
- [Vercel AI SDK Stream Protocol](https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol)
- [Vercel AI SDK streamText Reference](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text)

## Current Implementation Analysis

Our current implementation in `handleStreamFinish.ts` has several gaps when compared to the Vercel AI SDK protocol:

1. **Missing Protocol Features**
   - Incomplete implementation of stream part types
   - Missing token usage information
   - Limited tool call streaming support
   - Basic error handling without protocol alignment

2. **Current Limitations**
   - No proper finish message parts with token usage
   - Lack of step tracking for multi-step processes
   - Incomplete error recovery mechanisms
   - Basic tool call handling without streaming support

## Areas for Improvement

### 1. Stream Protocol Compliance
Required stream part types to implement:
```typescript
// Text parts
0:"example"\n

// Data parts
2:[{"key":"object1"},{"anotherKey":"object2"}]\n

// Error parts
3:"error message"\n

// Finish message parts
d:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":20}}\n

// Tool call parts
9:{"toolCallId":"call-123","toolName":"my-tool","args":{"some":"argument"}}\n

// Tool result parts
a:{"toolCallId":"call-123","result":"tool output"}\n
```

### 2. Token Usage Tracking
Implementation requirements:
```typescript
interface UsageInfo {
  finishReason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'
  usage: {
    promptTokens: number
    completionTokens: number
  }
}
```

### 3. Error Handling Improvements
- Protocol-compliant error streaming
- Structured error annotations
- Stream integrity maintenance
- Error recovery mechanisms

### 4. Tool Call Handling
Protocol implementation requirements:
```typescript
// Tool call start
b:{"toolCallId":"call-456","toolName":"streaming-tool"}\n

// Tool call delta
c:{"toolCallId":"call-456","argsTextDelta":"partial arg"}\n

// Tool call completion
9:{"toolCallId":"call-123","toolName":"my-tool","args":{"some":"argument"}}\n

// Tool result
a:{"toolCallId":"call-123","result":"tool output"}\n
```

## Implementation Plan

### Phase 1: Stream Protocol Alignment
1. **Stream Writer Enhancement**
   - ✅ Implemented `StreamProtocolManager` with all protocol message types
   - ✅ Added proper message formatting for all stream types
   - ✅ Added support for multi-part messages
   - ✅ Implemented proper error handling and propagation

2. **Stream Protocol Types**
   - ✅ Text parts (type 0)
   - ✅ Data parts (type 2)
   - ✅ Error parts (type 3)
   - ✅ Tool call parts (type 9)
   - ✅ Tool result parts (type a)
   - ✅ Tool call start (type b)
   - ✅ Tool call delta (type c)
   - ✅ Finish message parts (type d)

3. **Stream Implementations**
   - ✅ Updated `handleStreamFinish.ts` with new protocol
   - ✅ Updated `create-tool-calling-stream.ts` with new protocol
   - ✅ Updated `create-manual-tool-stream.ts` with new protocol
   - ✅ Standardized error handling across all stream types
   - ✅ Implemented proper event type handling

### Phase 1.5: Authentication and Session Management ✅
1. **Session Provider Implementation**
   - ✅ Created client-side `SessionProvider` wrapper component
   - ✅ Fixed React Context availability in Server Components
   - ✅ Implemented proper Next.js 13+ App Router integration
   - ✅ Added NextAuth.js configuration with GitHub provider

2. **Component Structure**
   - ✅ Separated client and server components
   - ✅ Created dedicated providers directory
   - ✅ Implemented proper component hierarchy
   - ✅ Added type safety for session management

### Phase 2: Token Usage Implementation (BLOCKED)
1. **Token Counting**
   - ✅ Basic token counting implementation
   - ✅ Per-message token tracking
   - ⚠️ BLOCKED: Model-specific token counting
     - Issue: Different models return usage data in different formats
     - Current workaround: Added support for both OpenAI-style (`prompt_tokens`) and Vercel AI SDK style (`promptTokens`)
     - Need to implement proper model-specific token counting strategies
   - [ ] Add token counting validation

2. **Usage Tracking**
   - ✅ Implemented Redis-based usage storage
   - ✅ Added per-user usage tracking
   - ✅ Integrated with authentication system
   - ✅ Added basic usage analytics UI
   - ✅ Added usage statistics dialog in header
   - ✅ Protected usage routes with authentication
   - ⚠️ BLOCKED: Accurate usage tracking
     - Issue: Some models don't return usage data
     - Current state: Added extensive logging to debug missing usage data
     - Need to implement fallback token counting for models that don't provide usage
   - [ ] Implement rate limiting
   - [ ] Add usage quotas

3. **Usage Reporting**
   - ✅ Basic usage statistics display
   - ✅ Model-specific usage breakdown
   - ✅ Real-time usage updates
   - ✅ Token usage visualization
   - ⚠️ BLOCKED: Accurate usage summary
     - Issue: Usage data may be incomplete or missing
     - Current state: UI shows available data but may not reflect actual usage
   - [ ] Add usage summary generation
   - [ ] Implement detailed analytics
   - [ ] Add usage monitoring

### Current Implementation Details

1. **Stream Protocol Implementation**
   - ✅ Added proper finish message format with usage:
     ```
     d:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":20}}\n
     ```
   - ✅ Implemented usage extraction from different response formats
   - ⚠️ BLOCKED: Consistent usage data across models
     - Some models return `prompt_tokens`/`completion_tokens`
     - Others use `promptTokens`/`completionTokens`
     - Some nest usage under `response.usage`
     - Some don't return usage at all

2. **Usage Data Extraction**
   - ✅ Support for OpenAI format
   - ✅ Support for Vercel AI SDK format
   - ✅ Support for nested usage data
   - ✅ Added detailed logging for debugging
   - ⚠️ BLOCKED: Need to implement:
     - Model-specific token counting fallbacks
     - Validation of reported usage data
     - Handling of missing usage data

3. **Next Steps for Usage Implementation**
   - Implement model-specific token counting strategies
   - Add validation for token counts
   - Create fallback mechanisms for missing usage data
   - Improve usage tracking accuracy
   - Add rate limiting based on token usage
   - Implement usage quotas and alerts

### Recent Updates

1. **Header Integration**
   - Added usage statistics button in header
   - Integrated with authentication state
   - Added icon-based trigger button
   - Implemented accessibility features

2. **Usage Dialog**
   - Implemented responsive dialog design
   - Added loading states
   - Added error handling
   - Implemented real-time updates

3. **Data Flow**
   - Protected API routes with session checks
   - Implemented user-specific data fetching
   - Added error boundaries
   - Optimized data loading

### Next Steps

1. **Token Usage Enhancement**
   - Implement model-specific token counting
   - Add usage validation and limits
   - Implement rate limiting
   - Add cost estimation

2. **Analytics Improvement**
   - Add detailed usage reports
   - Implement usage trends
   - Add cost estimation
   - Add usage forecasting

3. **User Management**
   - Add proper user authentication
   - Implement usage quotas
   - Add usage alerts
   - Add team usage tracking

### Phase 3: Error Handling Enhancement
1. **Error Protocol**
   - [ ] Add structured error annotations
   - [ ] Support error categorization
   - [ ] Implement error recovery strategies

2. **Error Recovery**
   - [ ] Add stream recovery mechanisms
   - [ ] Implement graceful degradation
   - [ ] Support partial completions

3. **Error Reporting**
   - [ ] Add error metrics collection
   - [ ] Implement error analytics
   - [ ] Support error debugging

### Phase 4: Tool Call Streaming
1. **Protocol Implementation**
   - [ ] Add streaming tool call support
   - [ ] Implement tool call state management
   - [ ] Support streaming results

2. **Tool State Management**
   - [ ] Add tool call tracking
   - [ ] Implement tool result handling
   - [ ] Support concurrent tool calls

3. **Tool Analytics**
   - [ ] Add tool usage tracking
   - [ ] Implement tool performance metrics
   - [ ] Support tool debugging

## Implementation Strategy

### New Components
1. **StreamManager Class**
```typescript
class StreamManager {
  // Protocol handling
  // Token counting
  // Error management
  // Tool call handling
}
```

2. **Usage Tracker**
```typescript
class UsageTracker {
  // Token counting
  // Usage metrics
  // Analytics
}
```

3. **Error Handler**
```typescript
class ErrorHandler {
  // Error streaming
  // Recovery mechanisms
  // Error reporting
}
```

4. **Tool Manager**
```typescript
class ToolManager {
  // Tool call streaming
  // State management
  // Result handling
}
```

## Key Considerations

### 1. Compatibility
- Maintain backward compatibility
- Support gradual migration
- Provide fallback mechanisms

### 2. Performance
- Optimize token counting
- Minimize memory usage
- Support streaming efficiency

### 3. Reliability
- Ensure error recovery
- Maintain data integrity
- Support partial completions

### 4. Scalability
- Support high concurrency
- Enable distributed processing
- Handle large message volumes

### 5. Monitoring
- Add performance metrics
- Support debugging
- Enable analytics

## Next Steps
1. Review and prioritize implementation phases
2. Create detailed technical specifications
3. Implement proof of concept
4. Conduct performance testing
5. Plan gradual rollout

## Success Metrics
1. Improved stream reliability
2. Accurate token usage tracking
3. Better error recovery
4. Enhanced tool call performance
5. Reduced system resources usage

## Implementation Progress

### Phase 1: Stream Protocol Alignment ✅
1. **Stream Writer Enhancement**
   - ✅ Implemented `StreamProtocolManager` with all protocol message types
   - ✅ Added proper message formatting for all stream types
   - ✅ Added support for multi-part messages
   - ✅ Implemented proper error handling and propagation

2. **Stream Protocol Types**
   - ✅ Text parts (type 0)
   - ✅ Data parts (type 2)
   - ✅ Error parts (type 3)
   - ✅ Tool call parts (type 9)
   - ✅ Tool result parts (type a)
   - ✅ Tool call start (type b)
   - ✅ Tool call delta (type c)
   - ✅ Finish message parts (type d)

3. **Stream Implementations**
   - ✅ Updated `handleStreamFinish.ts` with new protocol
   - ✅ Updated `create-tool-calling-stream.ts` with new protocol
   - ✅ Updated `create-manual-tool-stream.ts` with new protocol
   - ✅ Standardized error handling across all stream types
   - ✅ Implemented proper event type handling

### Phase 1.5: Authentication and Session Management ✅
1. **Session Provider Implementation**
   - ✅ Created client-side `SessionProvider` wrapper component
   - ✅ Fixed React Context availability in Server Components
   - ✅ Implemented proper Next.js 13+ App Router integration
   - ✅ Added NextAuth.js configuration with GitHub provider

2. **Component Structure**
   - ✅ Separated client and server components
   - ✅ Created dedicated providers directory
   - ✅ Implemented proper component hierarchy
   - ✅ Added type safety for session management

### Next Steps

#### Phase 2: Token Usage Implementation (BLOCKED)
1. **Token Counting**
   - ✅ Basic token counting implementation
   - ✅ Per-message token tracking
   - ⚠️ BLOCKED: Model-specific token counting
     - Issue: Different models return usage data in different formats
     - Current workaround: Added support for both OpenAI-style (`prompt_tokens`) and Vercel AI SDK style (`promptTokens`)
     - Need to implement proper model-specific token counting strategies
   - [ ] Add token counting validation

2. **Usage Tracking**
   - ✅ Implemented Redis-based usage storage
   - ✅ Added per-user usage tracking
   - ✅ Integrated with authentication system
   - ✅ Added basic usage analytics UI
   - ✅ Added usage statistics dialog in header
   - ✅ Protected usage routes with authentication
   - ⚠️ BLOCKED: Accurate usage tracking
     - Issue: Some models don't return usage data
     - Current state: Added extensive logging to debug missing usage data
     - Need to implement fallback token counting for models that don't provide usage
   - [ ] Implement rate limiting
   - [ ] Add usage quotas

3. **Usage Reporting**
   - ✅ Basic usage statistics display
   - ✅ Model-specific usage breakdown
   - ✅ Real-time usage updates
   - ✅ Token usage visualization
   - ⚠️ BLOCKED: Accurate usage summary
     - Issue: Usage data may be incomplete or missing
     - Current state: UI shows available data but may not reflect actual usage
   - [ ] Add usage summary generation
   - [ ] Implement detailed analytics
   - [ ] Add usage monitoring

#### Phase 3: Error Handling Enhancement (Next)
1. **Error Protocol**
   - [ ] Add structured error annotations
   - [ ] Support error categorization
   - [ ] Implement error recovery strategies

2. **Error Recovery**
   - [ ] Add stream recovery mechanisms
   - [ ] Implement graceful degradation
   - [ ] Support partial completions

3. **Error Reporting**
   - [ ] Add error metrics collection
   - [ ] Implement error analytics
   - [ ] Support error debugging

#### Phase 4: Tool Call Streaming (Upcoming)
1. **Protocol Implementation**
   - [ ] Add streaming tool call support
   - [ ] Implement tool call state management
   - [ ] Support streaming results

2. **Tool State Management**
   - [ ] Add tool call tracking
   - [ ] Implement tool result handling
   - [ ] Support concurrent tool calls

3. **Tool Analytics**
   - [ ] Add tool usage tracking
   - [ ] Implement tool performance metrics
   - [ ] Support tool debugging

## Current Focus Areas
1. **Token Usage Accuracy**
   - Implement accurate token counting for different models
   - Add validation for token counts
   - Support model-specific token counting strategies

2. **Usage Analytics**
   - Design usage tracking system
   - Implement usage monitoring
   - Add usage reporting endpoints

3. **Error Recovery**
   - Design error recovery strategies
   - Implement graceful degradation
   - Add error monitoring

## Technical Debt
1. **Token Counting**
   - Current token estimation is basic (4 chars/token)
   - Need model-specific token counting
   - Need validation for token counts

2. **Error Handling**
   - Basic error propagation implemented
   - Need more structured error types
   - Need better error recovery

3. **Tool Call Management**
   - Basic tool call support
   - Need streaming tool calls
   - Need concurrent tool call support 