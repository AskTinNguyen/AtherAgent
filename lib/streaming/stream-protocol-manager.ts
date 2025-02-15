import {
    RetryConfig,
    StreamError,
    StreamEventHandler,
    StreamMessageType,
    StreamState,
    ToolCallInfo,
    ToolCallResult,
    UsageInfo
} from '@/lib/types/types.streaming'
import { DataStreamWriter, JSONValue } from 'ai'

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffFactor: 2,
  initialDelay: 1000,
}

export class StreamProtocolManager {
  private dataStream: DataStreamWriter
  private state: StreamState = StreamState.IDLE
  private activeToolCalls: Map<string, ToolCallInfo> = new Map()
  private errors: StreamError[] = []
  private eventHandler?: StreamEventHandler
  private usageInfo: UsageInfo = {
    finishReason: 'unknown',
    usage: {
      promptTokens: 0,
      completionTokens: 0
    }
  }

  constructor(
    dataStream: DataStreamWriter,
    eventHandler?: StreamEventHandler
  ) {
    this.dataStream = dataStream
    this.eventHandler = eventHandler
  }

  // State Management
  private setState(newState: StreamState): void {
    this.state = newState
    this.streamData({ type: 'state_change', state: newState })
    this.eventHandler?.onStateChange?.(newState)
  }

  // Error Handling
  private normalizeError(error: StreamError | string | Error): StreamError {
    if (typeof error === 'string') {
      return {
        code: 'STREAM_ERROR',
        message: error
      }
    }
    if (error instanceof Error) {
      return {
        code: 'STREAM_ERROR',
        message: error.message,
        details: error.stack
      }
    }
    return error
  }

  // Retry Logic
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error
    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        if (attempt < config.maxRetries - 1) {
          await this.delay(config.initialDelay * Math.pow(config.backoffFactor, attempt))
        }
      }
    }
    throw lastError!
  }

  // Stream Operations
  async streamText(text: string): Promise<void> {
    this.setState(StreamState.STREAMING)
    await this.withRetry(async () => {
      this.dataStream.write(`${StreamMessageType.TEXT}:${text}\n`)
      this.usageInfo.usage.completionTokens += this.estimateTokens(text)
    })
  }

  async streamData(data: JSONValue): Promise<void> {
    await this.withRetry(async () => {
      this.dataStream.write(`${StreamMessageType.DATA}:${JSON.stringify(data)}\n`)
    })
  }

  async streamError(error: StreamError | string | Error): Promise<void> {
    const structuredError = this.normalizeError(error)
    this.errors.push(structuredError)
    this.setState(StreamState.ERROR)
    await this.withRetry(async () => {
      this.dataStream.write(`${StreamMessageType.ERROR}:${JSON.stringify(structuredError)}\n`)
    })
    this.eventHandler?.onError?.(structuredError)
  }

  async streamToolCall(toolCall: ToolCallInfo): Promise<void> {
    this.activeToolCalls.set(toolCall.toolCallId, toolCall)
    this.setState(StreamState.TOOL_CALLING)
    await this.withRetry(async () => {
      this.dataStream.write(`${StreamMessageType.TOOL_CALL}:${JSON.stringify(toolCall)}\n`)
    })
    this.eventHandler?.onToolCall?.(toolCall)
  }

  async streamToolResult(toolCallId: string, result: unknown): Promise<void> {
    const toolCallResult: ToolCallResult = { toolCallId, result }
    await this.withRetry(async () => {
      this.dataStream.write(`${StreamMessageType.TOOL_RESULT}:${JSON.stringify(toolCallResult)}\n`)
    })
    this.eventHandler?.onToolResult?.(toolCallResult)
    this.activeToolCalls.delete(toolCallId)
  }

  async streamToolCallStart(toolCallId: string, toolName: string): Promise<void> {
    await this.withRetry(async () => {
      this.dataStream.write(`${StreamMessageType.TOOL_CALL_START}:${JSON.stringify({ toolCallId, toolName })}\n`)
    })
  }

  async streamToolCallDelta(toolCallId: string, argsTextDelta: string): Promise<void> {
    await this.withRetry(async () => {
      this.dataStream.write(`${StreamMessageType.TOOL_CALL_DELTA}:${JSON.stringify({ toolCallId, argsTextDelta })}\n`)
    })
  }

  async streamFinish(finishReason: UsageInfo['finishReason'] = 'stop'): Promise<void> {
    this.usageInfo.finishReason = finishReason
    await this.withRetry(async () => {
      this.dataStream.write(`${StreamMessageType.FINISH}:${JSON.stringify(this.usageInfo)}\n`)
    })
    this.eventHandler?.onFinish?.(this.usageInfo)
    this.cleanup()
  }

  // Usage Management
  updateUsage(promptTokens: number, completionTokens: number): void {
    this.usageInfo.usage.promptTokens += promptTokens
    this.usageInfo.usage.completionTokens += completionTokens
  }

  // Cleanup
  cleanup(): void {
    this.activeToolCalls.clear()
    this.errors = []
    this.setState(StreamState.FINISHED)
  }

  // Utility Methods
  getState(): StreamState {
    return this.state
  }

  getErrors(): StreamError[] {
    return [...this.errors]
  }

  getActiveToolCalls(): ToolCallInfo[] {
    return Array.from(this.activeToolCalls.values())
  }

  private estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
} 