import {
  CoreMessage,
  DataStreamWriter,
  generateId,
  generateText,
  JSONValue
} from 'ai'
import { searchSchema } from '../schema/search'
import { search } from '../tools/search'
import { ExtendedCoreMessage } from '../types/index'
import { getToolCallModel } from '../utils/registry'
import { parseToolCallXml } from './parse-tool-call'

interface ToolExecutionResult {
  toolCallDataAnnotation: ExtendedCoreMessage | null
  toolCallMessages: CoreMessage[]
}

export async function executeToolCall(
  coreMessages: CoreMessage[],
  dataStream: DataStreamWriter,
  model: string,
  searchMode: boolean
): Promise<ToolExecutionResult> {
  // If search mode is disabled, return empty tool call
  if (!searchMode) {
    return { toolCallDataAnnotation: null, toolCallMessages: [] }
  }

  const toolCallModel = getToolCallModel(model)
  const defaultMaxResults = model?.includes('ollama') ? 5 : 20

  // Generate tool selection using XML format
  const toolSelectionResponse = await generateText({
    model: toolCallModel,
    system: `You are an intelligent assistant that analyzes conversations to select the most appropriate tools and their parameters.
            You excel at understanding context to determine when and how to use available tools, including crafting effective search queries.
            Current date: ${new Date().toISOString().split('T')[0]}

            Do not include any other text in your response.
            Respond in XML format with the following structure:
            <tool_call>
              <tool>tool_name</tool>
              <parameters>
                <query>search query text</query>
                <max_results>number - ${defaultMaxResults} by default</max_results>
                <search_depth>basic or advanced</search_depth>
                <include_domains>[]</include_domains>
                <exclude_domains>[]</exclude_domains>
                <topic>news or general</topic>
                <time_range>day, week, month, year</time_range>
                <include_answer>basic, advanced</include_answer>
                <include_raw_content>boolean</include_raw_content>
                <include_images>boolean</include_images>
                <include_image_descriptions>boolean</include_image_descriptions>
              </parameters>
            </tool_call>

            Available tools: search

            Search parameters:
            - query: The search query text
            - max_results: Number of results (1-20)
            - search_depth: basic or advanced
            - include_domains: List of domains to include
            - exclude_domains: List of domains to exclude
            - topic: news or general
            - time_range: Time range for results
            - include_answer: Whether to include AI-generated answer
            - include_raw_content: Whether to include raw content
            - include_images: Whether to include images

            If you don't need a tool, respond with <tool_call><tool></tool></tool_call>`,
    messages: coreMessages
  })

  // Parse the tool selection XML using the search schema
  const toolCall = parseToolCallXml(toolSelectionResponse.text, searchSchema)

  if (!toolCall || toolCall.tool === '') {
    return { toolCallDataAnnotation: null, toolCallMessages: [] }
  }

  const toolCallAnnotation = {
    type: 'tool_call',
    data: {
      state: 'call',
      toolCallId: `call_${generateId()}`,
      toolName: toolCall.tool,
      args: JSON.stringify(toolCall.parameters)
    }
  }
  dataStream.writeData(toolCallAnnotation)

  // Support for search tool only for now
  const searchResults = await search(
    toolCall.parameters?.query ?? '', 
    {
      max_results: toolCall.parameters?.max_results,
      search_depth: toolCall.parameters?.search_depth as 'basic' | 'advanced',
      include_domains: toolCall.parameters?.include_domains ?? [],
      exclude_domains: toolCall.parameters?.exclude_domains ?? [],
      topic: toolCall.parameters?.topic ?? 'general',
      time_range: toolCall.parameters?.time_range ?? 'w',
      include_answer: (toolCall.parameters?.include_answer === true ? 'basic' : 
                      toolCall.parameters?.include_answer === false ? 'none' : 
                      toolCall.parameters?.include_answer) ?? 'basic',
      include_raw_content: toolCall.parameters?.include_raw_content ?? false,
      include_images: toolCall.parameters?.include_images ?? true
    }
  )

  const updatedToolCallAnnotation = {
    ...toolCallAnnotation,
    data: {
      ...toolCallAnnotation.data,
      result: JSON.stringify(searchResults),
      state: 'result'
    }
  }
  dataStream.writeMessageAnnotation(updatedToolCallAnnotation)

  const toolCallDataAnnotation: ExtendedCoreMessage = {
    role: 'data',
    content: {
      type: 'tool_call',
      data: updatedToolCallAnnotation.data
    } as JSONValue
  }

  const toolCallMessages: CoreMessage[] = [
    {
      role: 'assistant',
      content: `Tool call result: ${JSON.stringify(searchResults)}`
    },
    {
      role: 'user',
      content: 'Now answer the user question.'
    }
  ]

  return { toolCallDataAnnotation, toolCallMessages }
}
