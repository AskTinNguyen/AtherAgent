'use client'

import type { ChatChartMessage } from '@/lib/types/chart'
import { createChartMessage } from '@/lib/types/chart'
import { JSONValue, Message, ToolInvocation } from 'ai'
import { useMemo } from 'react'
import { AnswerSection } from './answer-section'
import ChartMessage from './chart-message'
import { ReasoningAnswerSection } from './reasoning-answer-section'
import RelatedQuestions from './related-questions'
import { ToolSection } from './tool-section'

// Function to extract and parse chart data from message content
function extractChartData(content: string): ChatChartMessage | null {
  try {
    const chartMatch = content.match(/<chart_data>([\s\S]*?)<\/chart_data>/)
    if (!chartMatch) return null

    const chartJson = JSON.parse(chartMatch[1].trim())
    return createChartMessage(chartJson)
  } catch (error) {
    console.error('Error extracting chart data:', error)
    return null
  }
}

interface RenderMessageProps {
  message: Message
  messageId: string
  getIsOpen: (id: string) => boolean
  onOpenChange: (id: string, open: boolean) => void
  onQuerySelect: (query: string) => void
  chatId?: string
  messages: Message[]
  setMessages: (messages: Message[]) => void
}

export function RenderMessage({
  message,
  messageId,
  getIsOpen,
  onOpenChange,
  onQuerySelect,
  chatId,
  messages,
  setMessages
}: RenderMessageProps) {
  const relatedQuestions = useMemo(
    () =>
      message.annotations?.filter(
        annotation => (annotation as any)?.type === 'related-questions'
      ),
    [message.annotations]
  )

  // Process both annotation-based and content-based chart data
  const chartMessage = useMemo(() => {
    // First check annotations
    const chartAnnotation = message.annotations?.find(
      annotation => (annotation as any)?.type === 'chart'
    ) as ChatChartMessage | undefined

    if (chartAnnotation) return chartAnnotation

    // If no annotation, try to extract from content
    if (typeof message.content === 'string') {
      return extractChartData(message.content)
    }

    return undefined
  }, [message.annotations, message.content])

  // render for manual tool call
  const toolData = useMemo(() => {
    const toolAnnotations =
      (message.annotations?.filter(
        annotation =>
          (annotation as unknown as { type: string }).type === 'tool_call'
      ) as unknown as Array<{
        data: {
          args: string
          toolCallId: string
          toolName: string
          result?: string
          state: 'call' | 'result'
        }
      }>) || []

    // Group by toolCallId and prioritize 'result' state
    const toolDataMap = toolAnnotations.reduce((acc, annotation) => {
      const existing = acc.get(annotation.data.toolCallId)
      if (!existing || annotation.data.state === 'result') {
        acc.set(annotation.data.toolCallId, {
          ...annotation.data,
          args: annotation.data.args ? JSON.parse(annotation.data.args) : {},
          result:
            annotation.data.result && annotation.data.result !== 'undefined'
              ? JSON.parse(annotation.data.result)
              : undefined
        } as ToolInvocation)
      }
      return acc
    }, new Map<string, ToolInvocation>())

    return Array.from(toolDataMap.values())
  }, [message.annotations])

  if (message.role === 'user') {
    return (
      <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
        {message.content}
      </div>
    )
  }

  // Clean the content by removing the chart data XML if present
  const cleanContent = typeof message.content === 'string' 
    ? message.content.replace(/<chart_data>[\s\S]*?<\/chart_data>/g, '').trim()
    : message.content

  return (
    <>
      {(message.toolInvocations && message.toolInvocations.length > 0) ? (
        // If there are tool invocations, only render those
        message.toolInvocations.map(tool => (
          <ToolSection
            key={tool.toolCallId}
            tool={tool}
            isOpen={getIsOpen(messageId)}
            onOpenChange={open => onOpenChange(messageId, open)}
            messages={messages}
            setMessages={setMessages}
            chatId={chatId ?? 'default'}
          />
        ))
      ) : (
        // Otherwise render manual tool data and content
        <>
          {toolData.map(tool => (
            <ToolSection
              key={tool.toolCallId}
              tool={tool}
              isOpen={getIsOpen(tool.toolCallId)}
              onOpenChange={open => onOpenChange(tool.toolCallId, open)}
              messages={messages}
              setMessages={setMessages}
              chatId={chatId ?? 'default'}
            />
          ))}
          {message.reasoning ? (
            <ReasoningAnswerSection
              content={{
                reasoning: message.reasoning,
                answer: cleanContent
              }}
              isOpen={getIsOpen(messageId)}
              onOpenChange={open => onOpenChange(messageId, open)}
              chatId={chatId}
            />
          ) : (
            <AnswerSection
              content={cleanContent}
              isOpen={getIsOpen(messageId)}
              onOpenChange={open => onOpenChange(messageId, open)}
              chatId={chatId}
            />
          )}
        </>
      )}
      {/* Render chart after the content */}
      {chartMessage && (
        <div className="mt-4">
          <ChartMessage message={chartMessage} />
        </div>
      )}
      {!message.toolInvocations &&
        relatedQuestions &&
        relatedQuestions.length > 0 && (
          <RelatedQuestions
            annotations={relatedQuestions as JSONValue[]}
            onQuerySelect={onQuerySelect}
            isOpen={getIsOpen(`${messageId}-related`)}
            onOpenChange={open => onOpenChange(`${messageId}-related`, open)}
          />
        )}
    </>
  )
}
