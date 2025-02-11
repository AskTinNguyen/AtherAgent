export interface ExtendedMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface MessageThread {
  messages: ExtendedMessage[]
  status: 'idle' | 'loading' | 'error' | 'complete'
  error?: string
} 