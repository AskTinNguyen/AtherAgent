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

export class StreamProtocolManager {
  private dataStream: DataStreamWriter
  private usageInfo: UsageInfo = {
    finishReason: 'unknown',
    usage: {
      promptTokens: 0,
      completionTokens: 0
    }
  }

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
  }

  // Tool result streaming (type a)
  streamToolResult(toolCallId: string, result: JSONValue) {
    this.dataStream.write(`a:${JSON.stringify({ toolCallId, result })}\n`)
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
    this.usageInfo.finishReason = finishReason
    this.dataStream.write(`d:${JSON.stringify(this.usageInfo)}\n`)
  }

  // Update token usage
  updateUsage(promptTokens: number, completionTokens: number) {
    this.usageInfo.usage.promptTokens += promptTokens
    this.usageInfo.usage.completionTokens += completionTokens
  }

  private estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
} 