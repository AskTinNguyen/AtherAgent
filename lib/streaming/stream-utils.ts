import { ChartDataResult, ExtractedUsage, StreamFinishEvent } from '@/lib/types/types.streaming'
import { ChatChartMessage } from '@/lib/types/types.visualization'
import { AssistantContent, ToolContent } from 'ai'

/**
 * Extracts usage data from a stream finish event
 */
export function extractUsageData(event: StreamFinishEvent, model: string): ExtractedUsage {
  const lastStep = event.steps[event.steps.length - 1]
  const usage = lastStep?.response?.usage || {}

  return {
    promptTokens: usage.prompt_tokens || usage.promptTokens || 0,
    completionTokens: usage.completion_tokens || usage.completionTokens || 0
  }
}

/**
 * Processes chart data from message content
 */
export function processChartData(content: AssistantContent | ToolContent): ChartDataResult {
  if (typeof content !== 'string') {
    return { content }
  }

  // Extract chart XML if present
  const chartMatch = content.match(/<chart>([\s\S]*?)<\/chart>/)
  if (!chartMatch) {
    return { content }
  }

  const chartXml = chartMatch[1]
  const cleanContent = content.replace(/<chart>[\s\S]*?<\/chart>/, '').trim()

  // Parse chart data from XML
  const chartData: ChatChartMessage = {
    type: 'chart',
    role: 'assistant',
    content: chartXml,
    data: {
      type: 'line', // Default to line chart
      labels: [],
      datasets: []
    }
  }

  return {
    content: cleanContent,
    chartData
  }
}

/**
 * Handles stream errors
 */
export function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
} 