import { type MessageContext } from '@/lib/types/research-enhanced'
import { OpenAI } from 'openai'
import { type ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface GeneratedSuggestion {
  type: 'depth' | 'cross_reference' | 'refinement' | 'path'
  content: string
  confidence: number
  related_topics: string[]
}

function cleanJsonResponse(content: string): string {
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  return content.trim()
}

export async function generateAISuggestions(
  context: MessageContext,
  currentDepth: number,
  maxDepth: number
): Promise<GeneratedSuggestion[]> {
  const suggestionPrompt: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a JSON-only response generator. Do not use markdown formatting or code blocks.
        Generate research suggestions based on the following context:
        Main Topic: ${context.main_topic}
        Related Topics: ${context.related_topics.join(', ')}
        Current Depth: ${currentDepth}
        Max Depth: ${maxDepth}
        
        Return a JSON object with a 'suggestions' array, where each suggestion has these exact fields:
        {
          "suggestions": [
            {
              "type": string (one of: "depth", "cross_reference", "refinement", "path"),
              "content": string,
              "confidence": number between 0 and 1,
              "related_topics": array of strings
            }
          ]
        }
        
        IMPORTANT: Your response must be valid JSON only. Do not include any explanatory text, markdown formatting, or code blocks.`
    }
  ]

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: suggestionPrompt,
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" }
  })

  if (!response.choices[0].message.content) {
    throw new Error('No content in OpenAI response')
  }

  const cleanContent = cleanJsonResponse(response.choices[0].message.content)
  const parsedResponse = JSON.parse(cleanContent)
  
  if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
    throw new Error('Invalid response format - missing suggestions array')
  }
  
  const suggestions = parsedResponse.suggestions as GeneratedSuggestion[]
  
  if (suggestions.length === 0) {
    throw new Error('Empty suggestions array')
  }

  // Validate each suggestion
  for (const suggestion of suggestions) {
    if (!suggestion.type || !suggestion.content || typeof suggestion.confidence !== 'number') {
      throw new Error('Invalid suggestion format')
    }
  }

  return suggestions
} 