import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import { type ChatCompletionMessageParam } from 'openai/resources/chat/completions'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Debug environment variables (without exposing sensitive values)
console.log('Environment variables check:', {
  NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
  OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
})

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_KEY is not configured')
}

// Initialize Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface AnalyzeRequest {
  messages: {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }[]
  sessionId: string
  recentSearchQueries?: string[]
}

interface AnalysisResult {
  main_topic: string
  related_topics: string[]
  relevance_score: number
}

// Add this helper function before the POST function
function cleanJsonResponse(content: string): string {
  // Remove markdown code block markers if present
  content = content.replace(/```json\n|\n```/g, '')
  // Remove any other markdown code block markers
  content = content.replace(/```\n|\n```/g, '')
  // Trim whitespace
  return content.trim()
}

export async function POST(req: Request) {
  try {
    const { messages, sessionId, recentSearchQueries = [] } = (await req.json()) as AnalyzeRequest
    
    // Debug logging
    console.log('Received request data:', {
      messageCount: messages?.length,
      hasSessionId: !!sessionId,
      searchQueriesCount: recentSearchQueries?.length
    })
    
    // Input validation
    if (!messages || messages.length === 0) {
      console.log('No messages provided')
      return Response.json({ error: 'No messages provided for analysis' }, { status: 400 })
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured')
      return Response.json({ error: 'OpenAI API key is not configured' }, { status: 500 })
    }

    // Get the last few messages for context
    const recentMessages = messages.slice(-5)
    
    // Debug logging for messages
    console.log('Recent messages:', JSON.stringify(recentMessages, null, 2))
    console.log('Recent searches:', recentSearchQueries)

    // Validate that messages have content
    if (recentMessages.every(m => !m.content?.trim())) {
      console.log('No valid message content found')
      return Response.json({ error: 'No valid message content found for analysis' }, { status: 400 })
    }
    
    // Format messages in a more structured way
    const formattedMessages = recentMessages
      .map(m => `[${m.timestamp}] ${m.role}: ${m.content.trim()}`)
      .join('\n')
    
    // Format search queries with timestamps if available
    const formattedSearches = recentSearchQueries && recentSearchQueries.length > 0
      ? recentSearchQueries.join(', ')
      : 'No recent searches'
    
    const analysisPrompt: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a precise JSON generator that analyzes chat messages to extract key information.
        
        Given the chat messages and search queries, analyze and return ONLY a JSON object with these exact fields:
        {
          "main_topic": "the primary topic being discussed",
          "related_topics": ["array of related subtopics"],
          "relevance_score": 0.0 to 1.0 number
        }
        
        Rules for analysis:
        1. If there are no messages, return the default "unknown" response
        2. For the main_topic, focus on the most recent messages
        3. For related_topics, consider both chat history and search queries
        4. The relevance_score should reflect how focused the discussion is
        
        IMPORTANT: Your response must be valid JSON only. Do not include any explanatory text.`
      },
      {
        role: "user",
        content: `=== Chat History ===\n${formattedMessages}\n\n=== Recent Searches ===\n${formattedSearches}`
      }
    ]

    // Debug log the prompt being sent
    console.log('Sending prompt to OpenAI:', JSON.stringify(analysisPrompt, null, 2))

    try {
      // Debug log the OpenAI request
      console.log('Attempting OpenAI request with API key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing')
      
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: analysisPrompt,
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })

      // Debug log the OpenAI response
      console.log('OpenAI response received:', response.choices[0].message.content)

      if (!response.choices[0].message.content) {
        return Response.json(
          { 
            main_topic: "unknown",
            related_topics: [],
            relevance_score: 0
          }, 
          { status: 200 }
        )
      }

      const cleanedContent = cleanJsonResponse(response.choices[0].message.content)
      const analysis = JSON.parse(cleanedContent) as AnalysisResult

      // Validate the analysis result
      if (!analysis.main_topic || !Array.isArray(analysis.related_topics) || 
          typeof analysis.relevance_score !== 'number' ||
          analysis.relevance_score < 0 || analysis.relevance_score > 1) {
        console.error('Invalid analysis result:', analysis)
        throw new Error('Invalid analysis result structure')
      }

      try {
        // Store the context in Supabase
        const { data: context, error: dbError } = await supabase
          .from('message_contexts')
          .insert({
            session_id: sessionId,
            main_topic: analysis.main_topic,
            related_topics: analysis.related_topics,
            relevance_score: analysis.relevance_score
          })
          .select()
          .single()

        if (dbError) {
          console.error('Supabase error:', dbError)
          throw new Error(`Database error: ${dbError.message}`)
        }

        if (!context) {
          throw new Error('No context returned from database')
        }

        return Response.json(context)
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Return the analysis even if database storage fails
        return Response.json({
          id: sessionId,
          session_id: sessionId,
          main_topic: analysis.main_topic,
          related_topics: analysis.related_topics,
          relevance_score: analysis.relevance_score,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    } catch (openaiError) {
      console.error('OpenAI error:', openaiError)
      throw new Error(
        `OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error'}`
      )
    }
  } catch (error) {
    console.error('Error in analyze route:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze messages' },
      { status: 500 }
    )
  }
} 