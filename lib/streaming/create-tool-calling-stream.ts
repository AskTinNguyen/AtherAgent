import { researcher } from '@/lib/agents/researcher'
import { BaseStreamConfig, MessageProcessorResult } from '@/lib/types/types.streaming'
import { isReasoningModel } from '../utils/registry'
import { createBaseStreamResponse } from './base-stream'

/**
 * Creates a stream response for AI-driven research and tool calling.
 * Use this stream when you need the full research system capabilities, including:
 * - Deep research with multiple iterations
 * - AI-driven tool selection
 * - Complex reasoning chains
 * - Related question generation (for non-reasoning models)
 * 
 * @param config - Base stream configuration
 * @returns A data stream response
 */
export function createToolCallingStreamResponse(config: BaseStreamConfig) {
  return createBaseStreamResponse({
    ...config,
    skipRelatedQuestions: isReasoningModel(config.model),
    messageProcessor: async (messages): Promise<MessageProcessorResult> => {
      const result = await researcher({
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
