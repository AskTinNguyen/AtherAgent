export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      research_sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
      }
      search_results: {
        Row: {
          id: string
          session_id: string
          query: string
          results: Json
          created_at: string
          depth_level: number
        }
        Insert: {
          id?: string
          session_id: string
          query: string
          results: Json
          created_at?: string
          depth_level?: number
        }
        Update: {
          id?: string
          session_id?: string
          query?: string
          results?: Json
          created_at?: string
          depth_level?: number
        }
      }
      research_states: {
        Row: {
          id: string
          session_id: string
          previous_results: Json | null
          visualization_data: Json | null
          metrics: Json
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          previous_results?: Json | null
          visualization_data?: Json | null
          metrics: Json
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          previous_results?: Json | null
          visualization_data?: Json | null
          metrics?: Json
          updated_at?: string
        }
      }
      sources: {
        Row: {
          id: string
          session_id: string
          url: string
          title: string | null
          content: string | null
          relevance: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          url: string
          title?: string | null
          content?: string | null
          relevance?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          url?: string
          title?: string | null
          content?: string | null
          relevance?: number
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 