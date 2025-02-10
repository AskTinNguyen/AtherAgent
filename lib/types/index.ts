import { CoreMessage, JSONValue, Message } from 'ai'

export interface SearchResults {
  results: SearchResultItem[]
  images?: SearchResultImage[]
  directUrls?: string[]
  number_of_results?: number
}

// If enabled the include_images_description is true, the images will be an array of { url: string, description: string }
// Otherwise, the images will be an array of strings
export type SearchResultImage = {
  url: string
  title?: string
  thumbnail?: string
}

export type ExaSearchResults = {
  results: ExaSearchResultItem[]
}

export type SerperSearchResults = {
  searchParameters: {
    q: string
    type: string
    engine: string
  }
  videos: SerperSearchResultItem[]
}

export type SearchResultItem = {
  url: string
  title: string
  snippet?: string
  content?: string
}

export type ExaSearchResultItem = {
  score: number
  title: string
  id: string
  url: string
  publishedDate: Date
  author: string
}

export type SerperSearchResultItem = {
  title: string
  link: string
  snippet: string
  imageUrl: string
  duration: string
  source: string
  channel: string
  date: string
  position: number
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: ExtendedCoreMessage[] // Note: Changed from AIMessage to ExtendedCoreMessage
  sharePath?: string
}

// ExtendedCoreMessage for saveing annotations
export type ExtendedCoreMessage = Omit<CoreMessage, 'role' | 'content'> & {
  role: CoreMessage['role'] | 'data'
  content: CoreMessage['content'] | JSONValue
}

export type AIMessage = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
  type?:
    | 'answer'
    | 'related'
    | 'skip'
    | 'inquiry'
    | 'input'
    | 'input_related'
    | 'tool'
    | 'followup'
    | 'end'
}

export interface SearXNGResult {
  title: string
  url: string
  content: string
  img_src?: string
  publishedDate?: string
  score?: number
}

export interface SearXNGResponse {
  query: string
  number_of_results: number
  results: SearXNGResult[]
}

export type SearXNGImageResult = string

export type SearXNGSearchResults = {
  images: SearXNGImageResult[]
  results: SearchResultItem[]
  number_of_results?: number
  query: string
}

export interface AttachmentFile {
  id: string
  file: File
  type: 'image' | 'document' | 'other'
  previewUrl?: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  progress?: number
  error?: string
}

export interface ResearchSource {
  id: string
  url: string
  title?: string
  relevance?: number
  snippet?: string
}

export interface MultimodalMessage extends Message {
  attachments?: AttachmentFile[]
  sources?: ResearchSource[]
}

export interface AutocompleteSuggestion {
  id: string
  text: string
  confidence: number
  source?: ResearchSource
}

export interface SearchSource {
  url: string
  title?: string
  snippet?: string
  timestamp: number
  messageId: string
  searchQuery?: string
}

export interface ExtendedMessage extends Message {
  searchSources?: SearchSource[]
}
