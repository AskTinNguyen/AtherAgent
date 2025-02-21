import { DataStreamWriter, JSONValue } from 'ai'

export interface UsageInfo {
  finishReason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

export interface ToolCallInfo {
  toolCallId: string
  toolName: string
  args?: Record<string, unknown>
}

export interface PostToolExecutionState {
  toolCallId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  responseId?: string
  startTime: number
  lastUpdateTime: number
}

const TOOL_EXECUTION_TIMEOUT = 30000 // 30 seconds
const MAX_STORED_STATES = 100 // Maximum number of stored states

export class StreamProtocolManager {
  private dataStream: DataStreamWriter
  private usageInfo: UsageInfo = {
    finishReason: 'unknown',
    usage: {
      promptTokens: 0,
      completionTokens: 0
    }
  }
  private postToolExecutionStates: Map<string, PostToolExecutionState> = new Map()
  private timeoutHandles: Map<string, NodeJS.Timeout> = new Map()

  constructor(dataStream: DataStreamWriter) {
    this.dataStream = dataStream
  }

  // Text streaming (type 0)
  streamText(text: string) {
    this.dataStream.write(`0:${text}\n`)
    this.usageInfo.usage.completionTokens += this.estimateTokens(text)
  }

  // Data streaming (type 2)
  streamData(data: JSONValue) {
    this.dataStream.write(`2:${JSON.stringify(data)}\n`)
  }

  // Error streaming (type 3)
  streamError(error: string | Error) {
    const errorMessage = error instanceof Error ? error.message : error
    this.dataStream.write(`3:${JSON.stringify(errorMessage)}\n`)
    this.usageInfo.finishReason = 'error'
  }

  // Tool call streaming (type 9)
  streamToolCall(toolCall: ToolCallInfo) {
    this.dataStream.write(`9:${JSON.stringify(toolCall)}\n`)
    
    // Initialize post-tool execution state
    const now = Date.now()
    this.postToolExecutionStates.set(toolCall.toolCallId, {
      toolCallId: toolCall.toolCallId,
      status: 'pending',
      startTime: now,
      lastUpdateTime: now
    })

    // Set timeout for tool execution
    this.setToolTimeout(toolCall.toolCallId)

    // Cleanup old states if needed
    this.cleanupOldStates()
  }

  // Tool result streaming (type a)
  streamToolResult(toolCallId: string, result: JSONValue) {
    this.dataStream.write(`a:${JSON.stringify({ toolCallId, result })}\n`)
    
    // Update state to processing
    const state = this.postToolExecutionStates.get(toolCallId)
    if (state) {
      state.status = 'processing'
      state.lastUpdateTime = Date.now()
      this.postToolExecutionStates.set(toolCallId, state)
      
      // Reset timeout
      this.resetToolTimeout(toolCallId)
    }
  }

  // Post-tool execution response start (type e)
  streamPostToolStart(toolCallId: string, responseId: string) {
    this.dataStream.write(`e:${JSON.stringify({ toolCallId, responseId })}\n`)
    const state = this.postToolExecutionStates.get(toolCallId)
    if (state) {
      state.responseId = responseId
      state.lastUpdateTime = Date.now()
      this.postToolExecutionStates.set(toolCallId, state)
      
      // Reset timeout
      this.resetToolTimeout(toolCallId)
    }
  }

  // Post-tool execution response content (type f)
  streamPostToolContent(toolCallId: string, content: string) {
    this.dataStream.write(`f:${JSON.stringify({ toolCallId, content })}\n`)
    
    // Update last activity time
    const state = this.postToolExecutionStates.get(toolCallId)
    if (state) {
      state.lastUpdateTime = Date.now()
      this.postToolExecutionStates.set(toolCallId, state)
      
      // Reset timeout
      this.resetToolTimeout(toolCallId)
    }
  }

  // Post-tool execution response end (type g)
  streamPostToolEnd(toolCallId: string) {
    this.dataStream.write(`g:${JSON.stringify({ toolCallId })}\n`)
    const state = this.postToolExecutionStates.get(toolCallId)
    if (state) {
      state.status = 'completed'
      state.lastUpdateTime = Date.now()
      this.postToolExecutionStates.set(toolCallId, state)
      
      // Clear timeout as execution is complete
      this.clearToolTimeout(toolCallId)
    }
  }

  // Tool call start (type b)
  streamToolCallStart(toolCallId: string, toolName: string) {
    this.dataStream.write(`b:${JSON.stringify({ toolCallId, toolName })}\n`)
  }

  // Tool call delta (type c)
  streamToolCallDelta(toolCallId: string, argsTextDelta: string) {
    this.dataStream.write(`c:${JSON.stringify({ toolCallId, argsTextDelta })}\n`)
  }

  // Finish message (type d)
  streamFinish(finishReason: UsageInfo['finishReason'] = 'stop') {
    // Validate all tool executions are completed
    const incompleteCalls = Array.from(this.postToolExecutionStates.values())
      .filter(state => state.status !== 'completed' && state.status !== 'error')
    
    if (incompleteCalls.length > 0) {
      console.warn('Some tool calls did not complete:', incompleteCalls)
      finishReason = 'tool-calls'
      
      // Mark incomplete calls as error
      for (const call of incompleteCalls) {
        this.handleToolTimeout(call.toolCallId)
      }
    }

    this.usageInfo.finishReason = finishReason
    this.dataStream.write(`d:${JSON.stringify(this.usageInfo)}\n`)
    
    // Cleanup all timeouts
    this.clearAllTimeouts()
  }

  // Get post-tool execution state
  getPostToolExecutionState(toolCallId: string): PostToolExecutionState | undefined {
    return this.postToolExecutionStates.get(toolCallId)
  }

  // Check if all tool executions are complete
  areAllToolExecutionsComplete(): boolean {
    return Array.from(this.postToolExecutionStates.values())
      .every(state => state.status === 'completed' || state.status === 'error')
  }

  // Update token usage
  updateUsage(promptTokens: number, completionTokens: number) {
    this.usageInfo.usage.promptTokens += promptTokens
    this.usageInfo.usage.completionTokens += completionTokens
  }

  // Cleanup when stream manager is disposed
  dispose() {
    this.clearAllTimeouts()
    this.postToolExecutionStates.clear()
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  private setToolTimeout(toolCallId: string) {
    const timeoutHandle = setTimeout(() => {
      this.handleToolTimeout(toolCallId)
    }, TOOL_EXECUTION_TIMEOUT)
    
    this.timeoutHandles.set(toolCallId, timeoutHandle)
  }

  private resetToolTimeout(toolCallId: string) {
    this.clearToolTimeout(toolCallId)
    this.setToolTimeout(toolCallId)
  }

  private clearToolTimeout(toolCallId: string) {
    const handle = this.timeoutHandles.get(toolCallId)
    if (handle) {
      clearTimeout(handle)
      this.timeoutHandles.delete(toolCallId)
    }
  }

  private clearAllTimeouts() {
    for (const [toolCallId] of this.timeoutHandles) {
      this.clearToolTimeout(toolCallId)
    }
  }

  private handleToolTimeout(toolCallId: string) {
    const state = this.postToolExecutionStates.get(toolCallId)
    if (state && state.status !== 'completed') {
      state.status = 'error'
      this.postToolExecutionStates.set(toolCallId, state)
      this.streamError(`Tool execution timeout for ${toolCallId}`)
    }
  }

  private cleanupOldStates() {
    if (this.postToolExecutionStates.size > MAX_STORED_STATES) {
      // Sort states by last update time and remove oldest
      const states = Array.from(this.postToolExecutionStates.entries())
        .sort(([, a], [, b]) => a.lastUpdateTime - b.lastUpdateTime)
      
      const toRemove = states.slice(0, states.length - MAX_STORED_STATES)
      for (const [toolCallId] of toRemove) {
        this.postToolExecutionStates.delete(toolCallId)
        this.clearToolTimeout(toolCallId)
      }
    }
  }
} 