import { getChat, saveChat } from '@/lib/actions/chat'
import { generateRelatedQuestions } from '@/lib/agents/generate-related-questions'
import { ExtendedCoreMessage } from '@/lib/types'
import { CoreMessage, DataStreamWriter, JSONValue, Message } from 'ai'
import { StreamProtocolManager } from './stream-protocol-manager'

interface HandleStreamFinishParams {
  responseMessages: CoreMessage[]
  originalMessages: Message[]
  model: string
  chatId: string
  dataStream: DataStreamWriter
  skipRelatedQuestions?: boolean
  annotations?: ExtendedCoreMessage[]
  usage?: {
    promptTokens: number
    completionTokens: number
  }
  toolCallId?: string  // Added to track specific tool call
}

const handleError = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  skipRelatedQuestions = false,
  annotations = [],
  usage,
  toolCallId
}: HandleStreamFinishParams) {
  const streamManager = new StreamProtocolManager(dataStream)
  let allAnnotations = [...annotations]

  try {
    // Handle usage tracking
    if (usage) {
      streamManager.updateUsage(usage.promptTokens, usage.completionTokens)
      await trackUsage(model, chatId, usage)
    } else if (!model.includes('gemini')) {
      console.log('No usage data provided for tracking')
    }

    // Process tool-specific response if toolCallId is provided
    if (toolCallId) {
      const toolState = streamManager.getPostToolExecutionState(toolCallId)
      if (toolState && toolState.status === 'processing') {
        const responseId = `response_${toolCallId}`
        streamManager.streamPostToolStart(toolCallId, responseId)
        
        // Process each response message
        for (const message of responseMessages) {
          const content = Array.isArray(message.content) 
            ? message.content.map(part => 
                typeof part === 'string' ? part : JSON.stringify(part)
              ).join('')
            : String(message.content)
          streamManager.streamPostToolContent(toolCallId, content)
        }
        
        streamManager.streamPostToolEnd(toolCallId)
      }
    }

    // Convert messages to extended format
    const extendedCoreMessages = originalMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.toolInvocations && { toolInvocations: msg.toolInvocations })
    })) as ExtendedCoreMessage[]

    // Handle related questions if needed
    if (!skipRelatedQuestions) {
      await processRelatedQuestions(responseMessages, model, streamManager, allAnnotations)
    }

    // Process annotations and prepare messages
    const { chartMessages, otherAnnotations } = processAnnotations(allAnnotations)
    
    // Create final message array with proper ordering
    const generatedMessages = createOrderedMessages(
      extendedCoreMessages,
      responseMessages,
      otherAnnotations,
      chartMessages
    )

    // Save to database with retry mechanism
    await saveToDatabase(chatId, originalMessages, generatedMessages, streamManager)

    // Only send finish if all tool executions are complete
    if (!toolCallId || streamManager.areAllToolExecutionsComplete()) {
      streamManager.streamFinish('stop')
    }
  } catch (error) {
    console.error('Error in handleStreamFinish:', error)
    streamManager.streamError('Error processing stream finish')
  }
}

// Helper function to track usage
async function trackUsage(model: string, chatId: string, usage: { promptTokens: number; completionTokens: number }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        chatId,
        usage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.promptTokens + usage.completionTokens
        }
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Failed to track usage:', {
        status: response.status,
        statusText: response.statusText,
        body: text
      })
    }
  } catch (error) {
    console.error('Failed to track usage:', error)
  }
}

// Helper function to process related questions
async function processRelatedQuestions(
  responseMessages: CoreMessage[],
  model: string,
  streamManager: StreamProtocolManager,
  allAnnotations: ExtendedCoreMessage[]
) {
  try {
    const relatedQuestionsAnnotation: JSONValue = {
      type: 'related-questions',
      data: { items: [] }
    }
    streamManager.streamData([relatedQuestionsAnnotation])

    const relatedQuestions = await generateRelatedQuestions(responseMessages, model)
      .catch(error => {
        console.error('Error generating related questions:', error)
        streamManager.streamError(handleError(error))
        return { object: { items: [] } }
      })

    const updatedRelatedQuestionsAnnotation: ExtendedCoreMessage = {
      role: 'data',
      content: {
        type: 'related-questions',
        data: relatedQuestions.object
      } as JSONValue
    }

    streamManager.streamData([updatedRelatedQuestionsAnnotation.content] as JSONValue)
    allAnnotations.push(updatedRelatedQuestionsAnnotation)
  } catch (error) {
    console.error('Error processing related questions:', error)
    streamManager.streamError(handleError(error))
  }
}

// Helper function to process annotations
function processAnnotations(allAnnotations: ExtendedCoreMessage[]) {
  const chartMessages = allAnnotations.filter(a => 
    'type' in a && a.type === 'chart'
  ) as ExtendedCoreMessage[]
  
  const otherAnnotations = allAnnotations.filter(a => 
    a.role === 'data' && 
    a.content !== null &&
    typeof a.content === 'object' && 
    'type' in a.content && 
    a.content.type !== 'tool_call'
  )

  return { chartMessages, otherAnnotations }
}

// Helper function to create ordered messages
function createOrderedMessages(
  extendedCoreMessages: ExtendedCoreMessage[],
  responseMessages: CoreMessage[],
  otherAnnotations: ExtendedCoreMessage[],
  chartMessages: ExtendedCoreMessage[]
): ExtendedCoreMessage[] {
  return [
    ...extendedCoreMessages,
    ...responseMessages.slice(0, -1),
    ...otherAnnotations,
    ...(chartMessages.length > 0 ? chartMessages : responseMessages.slice(-1))
  ] as ExtendedCoreMessage[]
}

// Helper function to save to database with retry
async function saveToDatabase(
  chatId: string,
  originalMessages: Message[],
  generatedMessages: ExtendedCoreMessage[],
  streamManager: StreamProtocolManager
) {
  try {
    const savedChat = (await getChat(chatId)) ?? {
      messages: [],
      createdAt: new Date(),
      userId: 'anonymous',
      path: `/search/${chatId}`,
      title: originalMessages[0].content,
      id: chatId
    }

    const existingDataMessages = savedChat.messages.filter(msg => 
      msg.role === 'data' && 
      msg.content && 
      typeof msg.content === 'object' &&
      msg.content !== null &&
      'type' in msg.content && 
      typeof msg.content.type === 'string' &&
      ['search_results', 'tool_call'].includes(msg.content.type)
    )

    const mergedMessages = [
      ...existingDataMessages,
      ...generatedMessages
    ]

    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        await saveChat({
          ...savedChat,
          messages: mergedMessages
        })
        break
      } catch (error) {
        retryCount++
        console.error(`Failed to save chat (attempt ${retryCount}/${maxRetries}):`, error)
        
        if (retryCount === maxRetries) {
          streamManager.streamError('Failed to save chat history after multiple attempts')
          throw error
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }
  } catch (error) {
    console.error('Error saving chat:', error)
    streamManager.streamError('Failed to save chat')
    throw error
  }
}
