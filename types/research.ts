export interface ResearchSource {
  id: string
  chatId: string
  url: string
  title: string
  description: string
  relevance: number
  type: 'webpage' | 'image' | 'video' | 'document'
  status: 'pending' | 'processing' | 'completed' | 'error'
  createdAt: string
}

export interface ResearchLoopOptions {
  timeRange?: string
  searchDepth?: number
  maxResults?: number
  filters?: {
    type?: ResearchSource['type'][]
    minRelevance?: number
  }
} 