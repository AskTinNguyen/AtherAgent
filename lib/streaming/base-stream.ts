import {
  BaseStreamConfig,
  MessageProcessorResult,
  StreamEventHandler,
  StreamFinishEvent,
  StreamState
} from '@/lib/types/types.streaming'
import { ChatChartMessage } from '@/lib/types/types.visualization'
import {
  convertToCoreMessages,
  CoreMessage,
  createDataStreamResponse,
  DataStreamWriter,
  Message,
  streamText
} from 'ai'
import { getMaxAllowedTokens, truncateMessages } from '../utils/context-window'
import { handleStreamFinish } from './handle-stream-finish'
import { StreamProtocolManager } from './stream-protocol-manager'
import { extractUsageData, handleError, processChartData } from './stream-utils'

/**
 * Configuration for creating a stream response
 */
export interface StreamResponseConfig extends BaseStreamConfig {
  /**
   * Whether to skip generating related questions
   * @default false
   */
  skipRelatedQuestions?: boolean

  /**
   * Custom message processor function
   * @param messages - The messages to process
   * @returns Processed messages and any additional configuration
   */
  messageProcessor: (messages: Message[]) => Promise<MessageProcessorResult>

  /**
   * Optional event handler for stream events
   */
  eventHandler?: StreamEventHandler
}

/**
 * Creates a base stream response with common functionality for both manual and tool-calling streams
 * 
 * @param config - Stream configuration including message processor
 * @returns A data stream response
 */
export function createBaseStreamResponse(config: StreamResponseConfig) {
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { 
        messages, 
        model, 
        chatId, 
        skipRelatedQuestions = false, 
        messageProcessor,
        eventHandler 
      } = config

      const streamManager = new StreamProtocolManager(dataStream, eventHandler)

      try {
        // Convert and truncate messages
        const coreMessages = convertToCoreMessages(messages)
        const truncatedMessages = truncateMessages(
          coreMessages,
          getMaxAllowedTokens(model)
        )

        // Convert messages to format expected by processor
        const processedMessages = truncatedMessages.map(msg => ({
          ...msg,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })) as Message[]

        // Process messages using the provided processor
        const processedConfig = await messageProcessor(processedMessages)
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during message processing'
            streamManager.streamError({
              code: 'MESSAGE_PROCESSOR_ERROR',
              message: errorMessage,
              details: error
            })
            throw error
          })

        // Validate processed messages
        if (!Array.isArray(processedConfig?.messages)) {
          throw new Error('Invalid message processor result: messages must be an array')
        }

        // Create the stream
        const result = streamText({
          ...processedConfig,
          messages: processedConfig.messages.map(msg => {
            const { id, ...rest } = msg
            // Validate message role
            const role = rest.role === 'data' ? 'system' : rest.role
            if (!['system', 'user', 'assistant'].includes(role)) {
              throw new Error(`Invalid message role: ${role}`)
            }
            return { ...rest, role } as CoreMessage
          }) as CoreMessage[],
          onFinish: async (event: StreamFinishEvent) => {
            try {
              const lastStep = event.steps[event.steps.length - 1]
              if (!lastStep?.response?.messages?.length) {
                streamManager.streamError({
                  code: 'EMPTY_RESPONSE',
                  message: 'No messages in response'
                })
                return
              }

              const message = lastStep.response.messages[0]
              if (!message) {
                throw new Error('No message found in response')
              }

              // Validate and process message content
              let messageContent: string
              if (typeof message.content === 'string') {
                messageContent = message.content
              } else if (message.content && typeof message.content === 'object') {
                messageContent = JSON.stringify(message.content)
              } else {
                throw new Error('Invalid message content type')
              }

              // Process chart data in the complete response
              const { content, chartData } = processChartData(messageContent)
              
              // Update the message content without the chart XML
              lastStep.response.messages[0].content = content

              // Create annotations array with chart data if present
              const annotations: ChatChartMessage[] = chartData ? [chartData] : []

              // Extract usage data
              const usage = extractUsageData(event, model)

              // Handle stream finish with usage data
              try {
                await handleStreamFinish({
                  responseMessages: lastStep.response.messages,
                  originalMessages: messages,
                  model,
                  chatId,
                  dataStream,
                  skipRelatedQuestions,
                  annotations,
                  usage
                })
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error in handleStreamFinish'
                console.error('Error in handleStreamFinish:', error)
                streamManager.streamError({
                  code: 'STREAM_FINISH_ERROR',
                  message: errorMessage,
                  details: error
                })
                throw error // Re-throw to ensure proper error propagation
              }
            } catch (error) {
              console.error('Error in onFinish:', error)
              streamManager.streamError({
                code: 'ON_FINISH_ERROR',
                message: 'Error in onFinish handler',
                details: error
              })
            } finally {
              if (streamManager.getState() !== StreamState.ERROR) {
                streamManager.streamFinish('stop')
              }
            }
          }
        } as any) // Type assertion needed due to AI SDK type mismatch

        result.mergeIntoDataStream(dataStream)
      } catch (error) {
        console.error('Stream execution error:', error)
        streamManager.streamError({
          code: 'STREAM_EXECUTION_ERROR',
          message: 'Error executing stream',
          details: error
        })
      }
    },
    onError: error => {
      console.error('Stream error:', error)
      return handleError(error)
    }
  })
} 