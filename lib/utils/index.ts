import { type Model } from '@/lib/types/models'
import {
    convertToCoreMessages,
    CoreMessage,
    CoreToolMessage,
    generateId,
    JSONValue,
    Message,
    ToolInvocation
} from 'ai'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ExtendedCoreMessage } from '../types'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Takes an array of AIMessage and modifies each message where the role is 'tool'.
 * Changes the role to 'assistant' and converts the content to a JSON string.
 * Returns the modified messages as an array of CoreMessage.
 *
 * @param aiMessages - Array of AIMessage
 * @returns modifiedMessages - Array of modified messages
 */
export function transformToolMessages(messages: CoreMessage[]): CoreMessage[] {
  return messages.map(message =>
    message.role === 'tool'
      ? {
          ...message,
          role: 'assistant',
          content: JSON.stringify(message.content),
          type: 'tool'
        }
      : message
  ) as CoreMessage[]
}

/**
 * Sanitizes a URL by replacing spaces with '%20'
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/\s+/g, '%20')
}

export function createModelId(model: Model): string {
  return `${model.providerId}:${model.id}`
}

export function getDefaultModelId(models: Model[]): string {
  if (!models.length) {
    throw new Error('No models available')
  }
  return createModelId(models[0])
}

function addToolMessageToChat({
  toolMessage,
  messages
}: {
  toolMessage: CoreToolMessage
  messages: Array<Message>
}): Array<Message> {
  return messages.map(message => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map(toolInvocation => {
          const toolResult = toolMessage.content.find(
            tool => tool.toolCallId === toolInvocation.toolCallId
          )

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result
            }
          }

          return toolInvocation
        })
      }
    }

    return message
  })
}

export function convertToUIMessages(
  messages: Array<ExtendedCoreMessage>
): Array<Message> {
  let pendingAnnotations: JSONValue[] = []
  let pendingReasoning: string | undefined
  let pendingToolInvocations: Array<ToolInvocation> = []

  return messages.reduce((chatMessages: Array<Message>, message) => {
    // Handle tool messages
    if (message.role === 'tool') {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages
      })
    }

    // Store data message content for next assistant message
    if (message.role === 'data') {
      if (
        message.content !== null &&
        message.content !== undefined &&
        typeof message.content !== 'string' &&
        typeof message.content !== 'number' &&
        typeof message.content !== 'boolean'
      ) {
        const content = message.content as JSONValue
        if (
          content &&
          typeof content === 'object' &&
          'type' in content &&
          'data' in content
        ) {
          if (content.type === 'reasoning') {
            pendingReasoning = content.data as string
          } else if (content.type === 'tool_call') {
            // Convert tool call annotations to tool invocations
            const toolData = content.data as any
            if (toolData && typeof toolData === 'object') {
              pendingToolInvocations.push({
                state: toolData.state || 'call',
                toolCallId: toolData.toolCallId,
                toolName: toolData.toolName,
                args: toolData.args,
                result: toolData.result
              })
            }
          } else {
            // Keep all other annotations including charts
            pendingAnnotations.push(content)
          }
        }
      }
      return chatMessages
    }

    let textContent = ''
    let toolInvocations: Array<ToolInvocation> = [...pendingToolInvocations]
    let messageAnnotations: JSONValue[] = [...pendingAnnotations]

    // Handle message content
    if (message.content) {
      if (typeof message.content === 'string') {
        textContent = message.content
        // Extract chart data from content if present
        const chartMatch = textContent.match(/<chart_data>([\s\S]*?)<\/chart_data>/)
        if (chartMatch) {
          try {
            const chartData = JSON.parse(chartMatch[1].trim())
            messageAnnotations.push({
              type: 'chart',
              data: chartData
            })
            // Clean the content
            textContent = textContent.replace(/<chart_data>[\s\S]*?<\/chart_data>/g, '').trim()
          } catch (error) {
            console.error('Error parsing chart data:', error)
          }
        }
      } else if (Array.isArray(message.content)) {
        for (const content of message.content) {
          if (content && typeof content === 'object' && 'type' in content) {
            if (content.type === 'text' && 'text' in content) {
              textContent += content.text
            } else if (
              content.type === 'tool-call' &&
              'toolCallId' in content &&
              'toolName' in content &&
              'args' in content
            ) {
              const existingTool = toolInvocations.find(
                t => t.toolCallId === content.toolCallId
              )
              if (!existingTool) {
                toolInvocations.push({
                  state: 'call',
                  toolCallId: content.toolCallId,
                  toolName: content.toolName,
                  args: content.args
                } as ToolInvocation)
              }
            }
          }
        }
      }
    }

    // Create new message
    const newMessage: Message = {
      id: generateId(),
      role: message.role,
      content: textContent,
      toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
      // Add annotations and reasoning if this is an assistant message
      ...(message.role === 'assistant' && {
        ...(messageAnnotations.length > 0 && {
          annotations: messageAnnotations.filter(a => 
            a !== null &&
            typeof a === 'object' && 
            'type' in a && 
            (a.type === 'chart' || a.type !== 'tool_call') // Keep charts and non-tool annotations
          )
        }),
        ...(pendingReasoning && { reasoning: pendingReasoning })
      })
    }

    chatMessages.push(newMessage)

    // Clear pending data after adding them
    if (message.role === 'assistant') {
      pendingAnnotations = []
      pendingReasoning = undefined
      pendingToolInvocations = []
    }

    return chatMessages
  }, [])
}

export function convertToExtendedCoreMessages(
  messages: Message[]
): ExtendedCoreMessage[] {
  const result: ExtendedCoreMessage[] = []

  for (const message of messages) {
    // Convert annotations to data messages
    if (message.annotations && message.annotations.length > 0) {
      message.annotations.forEach(annotation => {
        result.push({
          role: 'data',
          content: annotation
        })
      })
    }

    // Convert reasoning to data message
    if (message.reasoning) {
      result.push({
        role: 'data',
        content: {
          type: 'reasoning',
          data: message.reasoning
        } as JSONValue
      })
    }

    // Convert current message
    const converted = convertToCoreMessages([message])
    result.push(...converted)
  }

  return result
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

/**
 * Validates and normalizes a date value for chat storage
 * Returns a valid ISO string date that is not in the future
 */
export function normalizeDate(date: Date | string | number | null | undefined): string {
  if (!date) {
    return new Date().toISOString();
  }

  try {
    const parsedDate = new Date(date);
    
    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      return new Date().toISOString();
    }

    // If date is in the future, return current date
    if (parsedDate > new Date()) {
      return new Date().toISOString();
    }

    return parsedDate.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}
