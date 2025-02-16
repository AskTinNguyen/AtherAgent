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
          id: string
          chat_id: string
          content: string
          role: 'user' | 'assistant' | 'system' | 'data'
          annotations: Json | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          chat_id: string
          content: string
          role: 'user' | 'assistant' | 'system' | 'data'
          annotations?: Json | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          chat_id?: string
          content?: string
          role?: 'user' | 'assistant' | 'system' | 'data'
          annotations?: Json | null
          created_at?: string
          user_id?: string
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