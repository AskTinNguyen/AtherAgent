export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          id: string                     // uuid
          content: string | null         // text
          role: MessageRole             // text
          user_id: string               // uuid
          created_at: string            // timestamp
          annotations: Json | null       // jsonb
          message_type: MessageType     // message_t enum
          parent_message_id: string | null // uuid
          thread_id: string | null      // uuid
          metadata: Json                // jsonb with default '{}'
          sequence_number: number | null // int8
          updated_at: string            // timestamp
          search_query: string | null   // text
          search_source: string | null  // text
          tool_name: string | null      // text
          summary_type: string | null   // text
          is_visible: boolean          // bool with default true
          is_edited: boolean           // bool with default false
          research_session_id: string   // uuid
          depth_level: number          // int4 with default 1
        }
        Insert: {
          id?: string                   // uuid with gen_random_uuid() default
          content?: string | null       // text
          role: MessageRole            // text (required)
          user_id: string              // uuid (required)
          created_at?: string          // timestamp with now() default
          annotations?: Json | null     // jsonb
          message_type?: MessageType   // message_t enum
          parent_message_id?: string | null // uuid
          thread_id?: string | null    // uuid
          metadata?: Json              // jsonb with '{}' default
          sequence_number?: number | null // int8
          updated_at?: string          // timestamp with now() default
          search_query?: string | null // text
          search_source?: string | null // text
          tool_name?: string | null    // text
          summary_type?: string | null // text
          is_visible?: boolean        // bool with true default
          is_edited?: boolean         // bool with false default
          research_session_id: string  // uuid (required)
          depth_level?: number        // int4 with 1 default
        }
      }
    }
    Functions: {
      handle_new_chat_message: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'data'
export type MessageType = 
  | 'user_prompt'
  | 'ai_response'
  | 'search_results'
  | 'image_results'
  | 'search_summary'
  | 'chat_title'
  | 'tool_output'

export interface ChatMessage {
  id: string                     // uuid
  content: string | null         // text
  role: MessageRole             // text
  user_id: string               // uuid
  created_at: string            // timestamp
  annotations: Json | null       // jsonb
  message_type: MessageType     // message_t enum
  parent_message_id: string | null // uuid
  thread_id: string | null      // uuid
  metadata: Json                // jsonb with default '{}'
  sequence_number: number | null // int8
  updated_at: string            // timestamp
  search_query: string | null   // text
  search_source: string | null  // text
  tool_name: string | null      // text
  summary_type: string | null   // text
  is_visible: boolean          // bool with default true
  is_edited: boolean           // bool with default false
  research_session_id: string   // uuid
  depth_level: number          // int4 with default 1
}

export interface ChatMessageInsert {
  id?: string                   // uuid with gen_random_uuid() default
  content?: string | null       // text
  role: MessageRole            // text (required)
  user_id: string              // uuid (required)
  created_at?: string          // timestamp with now() default
  annotations?: Json | null     // jsonb
  message_type?: MessageType   // message_t enum
  parent_message_id?: string | null // uuid
  thread_id?: string | null    // uuid
  metadata?: Json              // jsonb with '{}' default
  sequence_number?: number | null // int8
  updated_at?: string          // timestamp with now() default
  search_query?: string | null // text
  search_source?: string | null // text
  tool_name?: string | null    // text
  summary_type?: string | null // text
  is_visible?: boolean        // bool with true default
  is_edited?: boolean         // bool with false default
  research_session_id: string  // uuid (required)
  depth_level?: number        // int4 with 1 default
}

interface BaseMessageProps {
  id: string
  user_id: string              // Required
  research_session_id: string  // Required
  content: string | null
  role: MessageRole           // Required
  thread_id?: string
  metadata?: Json             // Using Json type instead of Record<string, any>
}

interface SearchMessageProps {
  search_query: string
  search_source: string
  tool_name?: string
}

interface AnnotatedMessageProps {
  annotations: Json
  summary_type?: string
}

export function createChatMessage(
  base: BaseMessageProps,
  options?: {
    search?: SearchMessageProps
    annotations?: AnnotatedMessageProps
    parent_message_id?: string
    sequence_number?: number
    is_edited?: boolean
    depth_level?: number
    message_type?: MessageType // Allow explicit message type override
  }
): ChatMessageInsert {
  const message: ChatMessageInsert = {
    ...base,
    // Default message type based on role, but allow override
    message_type: options?.message_type || (base.role === 'user' ? 'user_prompt' : 'ai_response'),
    is_visible: true,
    metadata: base.metadata || {},
    thread_id: base.thread_id || base.id
  }

  if (options?.search) {
    message.search_query = options.search.search_query
    message.search_source = options.search.search_source
    if (options.search.tool_name) {
      message.tool_name = options.search.tool_name
    }
  }

  if (options?.annotations) {
    message.annotations = options.annotations.annotations
    if (options.annotations.summary_type) {
      message.summary_type = options.annotations.summary_type
    }
  }

  if (options?.parent_message_id) {
    message.parent_message_id = options.parent_message_id
  }

  if (options?.sequence_number) {
    message.sequence_number = options.sequence_number
  }

  if (options?.is_edited !== undefined) {
    message.is_edited = options.is_edited
  }

  if (options?.depth_level !== undefined) {
    message.depth_level = options.depth_level
  }

  return message
} 