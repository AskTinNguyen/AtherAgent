import { BaseStreamConfig, MessageProcessorResult } from '@/lib/types/types.streaming'
import { manualResearcher } from '../agents/manual-researcher'
import { createBaseStreamResponse } from './base-stream'

/**
 * Creates a stream response for manual tool interactions.
 * Use this stream when you need direct tool usage without the complexity
 * of the full research system. This is ideal for:
 * - Simple tool executions
 * - Direct user commands
 * - Testing and debugging
 * 
 * @param config - Base stream configuration
 * @returns A data stream response
 */
export function createManualToolStreamResponse(config: BaseStreamConfig) {
  return createBaseStreamResponse({
    ...config,
    skipRelatedQuestions: true,
    messageProcessor: async (messages): Promise<MessageProcessorResult> => {
      const result = await manualResearcher({
        messages,
        model: config.model,
        searchMode: config.searchMode
      })

      return {
        ...result,
        messages: messages // Preserve original message format
      }
    }
  })
}
