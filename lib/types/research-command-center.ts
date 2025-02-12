import { type ExtendedMessage } from './messages'

export interface ResearchCommandCenterProps {
  className?: string
}

export type ViewType = 'grid' | 'ranked' | 'images' | 'diff'

export interface TimelinePoint {
  id: number
  timestamp: number
  type: string
  message: string
  depth: number
  snapshot: string
  significance: number
}

export interface VisualizationMetrics {
  depthProgress: number
  qualityImprovement: number
  sourceReliability: number
}

export interface SearchProps {
  tool: {
    id: string
    name: string
    description: string
    state: 'idle' | 'loading' | 'error' | 'success'
  }
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  messages: ExtendedMessage[]
  setMessages: (messages: ExtendedMessage[]) => void
  chatId: string
  onSubmit: () => Promise<void>
  onClear: () => void
}

export interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  score: number
  content: string
}

export interface ImageResult {
  id: string
  url: string
  title: string
  description: string
}

export interface SearchResults {
  results: SearchResult[]
}

export interface ImageResults {
  images: ImageResult[]
} 