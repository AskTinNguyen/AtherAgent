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
  usage
}: HandleStreamFinishParams) {
  const streamManager = new StreamProtocolManager(dataStream)
  let allAnnotations = [...annotations]

  try {
    // Update usage if provided
    if (usage) {
      streamManager.updateUsage(usage.promptTokens, usage.completionTokens)
      
      // Track usage in our system
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        console.log('Tracking usage:', {
          model,
          chatId,
          usage: {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.promptTokens + usage.completionTokens
          }
        })
        
        const response = await fetch(`${baseUrl}/api/usage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
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
        // Don't throw, just log the error and continue
      }
    } else if (!model.includes('gemini')) {
      // Only log missing usage for non-Gemini models
      console.log('No usage data provided for tracking')
    }

    // Don't convert messages that are already in the correct format
    const extendedCoreMessages = originalMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.toolInvocations && { toolInvocations: msg.toolInvocations })
    })) as ExtendedCoreMessage[]

    if (!skipRelatedQuestions) {
      try {
        // Notify related questions loading
        const relatedQuestionsAnnotation: JSONValue = {
          type: 'related-questions',
          data: { items: [] }
        }
        streamManager.streamData(relatedQuestionsAnnotation)

        // Generate related questions
        const relatedQuestions = await generateRelatedQuestions(
          responseMessages,
          model
        ).catch(error => {
          console.error('Error generating related questions:', error)
          streamManager.streamError(handleError(error))
          return { object: { items: [] } }
        })

        // Create and add related questions annotation
        const updatedRelatedQuestionsAnnotation: ExtendedCoreMessage = {
          role: 'data',
          content: {
            type: 'related-questions',
            data: relatedQuestions.object
          } as JSONValue
        }

        streamManager.streamData(updatedRelatedQuestionsAnnotation.content as JSONValue)
        allAnnotations.push(updatedRelatedQuestionsAnnotation)
      } catch (error) {
        console.error('Error processing related questions:', error)
        streamManager.streamError(handleError(error))
        // Don't throw, just continue without related questions
      }
    }

    // Separate chart messages from other annotations
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

    // Create the message to save
    const generatedMessages = [
      ...extendedCoreMessages,
      ...responseMessages.slice(0, -1),
      ...otherAnnotations,
      // For the last message, if we have a chart, use it instead of the text message
      ...(chartMessages.length > 0 ? chartMessages : responseMessages.slice(-1))
    ] as ExtendedCoreMessage[]

    try {
      // Get the chat from the database if it exists, otherwise create a new one
      const savedChat = (await getChat(chatId)) ?? {
        messages: [],
        createdAt: new Date(),
        userId: 'anonymous',
        path: `/search/${chatId}`,
        title: originalMessages[0].content,
        id: chatId
      }

      // Save chat with complete response and related questions
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await saveChat({
            ...savedChat,
            messages: generatedMessages
          });
          break; // If successful, break out of retry loop
        } catch (error) {
          retryCount++;
          console.error(`Failed to save chat (attempt ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount === maxRetries) {
            streamManager.streamError('Failed to save chat history after multiple attempts');
            throw error; // Re-throw after max retries
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    } catch (error) {
      console.error('Error saving chat:', error);
      streamManager.streamError('Failed to save chat');
      throw error; // Re-throw to trigger error handling in the parent
    }

    // Send finish message with usage information
    streamManager.streamFinish('stop')
  } catch (error) {
    console.error('Error in handleStreamFinish:', error)
    streamManager.streamError('Error processing stream finish')
  }
}
