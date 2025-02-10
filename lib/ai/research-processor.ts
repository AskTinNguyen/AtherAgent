import { OpenAI } from 'openai'
import { type ChatCompletion, type ChatCompletionChunk } from 'openai/resources/chat/completions'
import { type Stream } from 'openai/streaming'
import { z } from 'zod'

// Validation schemas
const topicAnalysisSchema = z.object({
  mainTopics: z.array(z.string()),
  subtopics: z.array(z.string()),
  relevance: z.number().min(0).max(1),
  complexity: z.number().min(0).max(1),
  suggestedQueries: z.array(z.string())
})

const relationshipAnalysisSchema = z.object({
  commonThemes: z.array(z.string()),
  connections: z.array(z.object({
    topic1: z.string(),
    topic2: z.string(),
    relationship: z.string(),
    strength: z.number().min(0).max(1)
  })),
  suggestedExplorations: z.array(z.string())
})

const suggestionSchema = z.object({
  content: z.string(),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  nextSteps: z.array(z.string()),
  relatedTopics: z.array(z.string())
})

// Types
export type TopicAnalysis = z.infer<typeof topicAnalysisSchema>
export type RelationshipAnalysis = z.infer<typeof relationshipAnalysisSchema>
export type AISuggestion = z.infer<typeof suggestionSchema>

export interface ResearchContext {
  currentQuery: string
  previousQueries: string[]
  currentDepth: number
  maxDepth: number
  recentFindings: string[]
}

export interface ResearchProcessorOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export class ResearchAIProcessor {
  private static instance: ResearchAIProcessor
  private openai: OpenAI
  private defaultOptions: Required<ResearchProcessorOptions> = {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000
  }

  private constructor(options?: ResearchProcessorOptions) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options
    }
  }

  public static getInstance(options?: ResearchProcessorOptions): ResearchAIProcessor {
    if (!ResearchAIProcessor.instance) {
      ResearchAIProcessor.instance = new ResearchAIProcessor(options)
    }
    return ResearchAIProcessor.instance
  }

  private async createCompletion(
    prompt: string,
    systemPrompt: string,
    options: {
      responseFormat?: { type: 'json_object' }
      stream?: boolean
      temperature?: number
      maxTokens?: number
    } = {}
  ): Promise<ChatCompletion | Stream<ChatCompletionChunk>> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.defaultOptions.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature ?? this.defaultOptions.temperature,
        max_tokens: options.maxTokens ?? this.defaultOptions.maxTokens,
        response_format: options.responseFormat,
        stream: options.stream
      })
      return response
    } catch (error) {
      console.error('Error in createCompletion:', error)
      throw error
    }
  }

  async analyzeTopic(topic: string): Promise<TopicAnalysis> {
    try {
      const prompt = `Analyze the following research topic and provide structured insights:
Topic: ${topic}

Provide analysis in the following JSON format:
{
  "mainTopics": ["list of main topics"],
  "subtopics": ["list of relevant subtopics"],
  "relevance": 0.0-1.0,
  "complexity": 0.0-1.0,
  "suggestedQueries": ["list of suggested research queries"]
}`

      const response = await this.createCompletion(
        prompt,
        'You are a research analysis assistant. Provide detailed topic analysis in the requested JSON format.',
        { responseFormat: { type: 'json_object' } }
      ) as ChatCompletion

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return topicAnalysisSchema.parse(result)
    } catch (error) {
      console.error('Error analyzing topic:', error)
      // Return a safe fallback
      return {
        mainTopics: [topic],
        subtopics: [],
        relevance: 0.5,
        complexity: 0.5,
        suggestedQueries: []
      }
    }
  }

  async analyzeRelationships(topics: string[]): Promise<RelationshipAnalysis> {
    try {
      const prompt = `Analyze the relationships between the following topics:
Topics: ${topics.join(', ')}

Provide analysis in the following JSON format:
{
  "commonThemes": ["list of common themes"],
  "connections": [
    {
      "topic1": "first topic",
      "topic2": "second topic",
      "relationship": "description of relationship",
      "strength": 0.0-1.0
    }
  ],
  "suggestedExplorations": ["list of suggested areas to explore"]
}`

      const response = await this.createCompletion(
        prompt,
        'You are a research analysis assistant. Analyze relationships between topics and provide insights in the requested JSON format.',
        { responseFormat: { type: 'json_object' } }
      ) as ChatCompletion

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return relationshipAnalysisSchema.parse(result)
    } catch (error) {
      console.error('Error analyzing relationships:', error)
      // Return a safe fallback
      return {
        commonThemes: [],
        connections: topics.slice(0, 2).map((topic, i) => ({
          topic1: topic,
          topic2: topics[i + 1] || topics[0],
          relationship: 'related topics',
          strength: 0.5
        })),
        suggestedExplorations: topics
      }
    }
  }

  async generateSuggestion(context: ResearchContext): Promise<AISuggestion> {
    try {
      const prompt = `Generate a research suggestion based on the following context:
Current Query: ${context.currentQuery}
Previous Queries: ${context.previousQueries.join(', ')}
Current Depth: ${context.currentDepth}
Max Depth: ${context.maxDepth}
Recent Findings: ${context.recentFindings.join(', ')}

Provide suggestion in the following JSON format:
{
  "content": "suggestion text",
  "rationale": "explanation of why this suggestion is relevant",
  "confidence": 0.0-1.0,
  "nextSteps": ["list of specific next steps"],
  "relatedTopics": ["list of related topics to explore"]
}`

      const response = await this.createCompletion(
        prompt,
        'You are a research assistant. Generate relevant and insightful research suggestions based on the provided context.',
        { responseFormat: { type: 'json_object' } }
      ) as ChatCompletion

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return suggestionSchema.parse(result)
    } catch (error) {
      console.error('Error generating suggestion:', error)
      // Return a safe fallback
      return {
        content: `Continue exploring ${context.currentQuery}`,
        rationale: 'Based on your current research path',
        confidence: 0.5,
        nextSteps: ['Review current findings', 'Look for related topics'],
        relatedTopics: context.recentFindings
      }
    }
  }

  async generateStreamingSuggestion(context: ResearchContext): Promise<ReadableStream> {
    try {
      const prompt = `Generate a research suggestion based on the following context:
Current Query: ${context.currentQuery}
Previous Queries: ${context.previousQueries.join(', ')}
Current Depth: ${context.currentDepth}
Max Depth: ${context.maxDepth}
Recent Findings: ${context.recentFindings.join(', ')}`

      const response = await this.createCompletion(
        prompt,
        'You are a research assistant. Generate relevant and insightful research suggestions based on the provided context.',
        { stream: true }
      ) as Stream<ChatCompletionChunk>

      // Convert the OpenAI stream to a ReadableStream
      return new ReadableStream({
        async start(controller) {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              controller.enqueue(new TextEncoder().encode(content))
            }
          }
          controller.close()
        }
      })
    } catch (error) {
      console.error('Error in streaming suggestion:', error)
      throw error
    }
  }
} 