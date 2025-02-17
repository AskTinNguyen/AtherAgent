import { Json } from './database'

export interface SearchMetadata {
  source_type: 'web' | 'academic' | 'image'
  last_updated: string
  language: string
  word_count?: number
  domain_authority?: number
  citations?: number
  keywords: string[]
  fetch_metadata: {
    status_code: number
    content_type: string
    encoding: string
  }
  authors?: Array<{
    name: string
    affiliation?: string
  }>
  publication_date?: string
  journal?: string
  doi?: string
  citation_count?: number
  impact_factor?: number
}

export interface ImageMetadata extends Omit<SearchMetadata, 'source_type'> {
  source_type: 'image'
}

export interface DatabaseSource {
  id?: string                    
  session_id: string            
  message_id?: string           
  url: string                   
  title: string                 
  content: string | null        
  relevance: number            
  metadata: SearchMetadata      
  created_at?: string          
  updated_at?: string          
  is_processed: boolean        
  search_query?: string        
  search_source?: string       
  depth_level: number         
}

export interface BaseSearchResult {
  url: string                   
  title: string                
  description: string | null    
  relevance: number            
  type: 'webpage' | 'image' | 'video' | 'document'
  metadata: SearchMetadata      
  search_query?: string        
  search_source?: string       
  depth_level: number         
}

export interface SearchImage extends Omit<BaseSearchResult, 'type' | 'metadata'> {
  type: 'image'
  thumbnailUrl: string
  metadata: ImageMetadata
}

export interface SearchOptions {
  query: string                
  max_results?: number
  search_depth?: 'basic' | 'advanced'
  include_domains?: string[]
  exclude_domains?: string[]
  time_range?: string
  topic?: 'news' | 'general' | 'research' | 'code'
  include_answer?: 'basic' | 'advanced' | 'none'
  include_images?: boolean
  include_raw_content?: boolean
  session_id?: string         
  message_id?: string        
  depth_level?: number       
}

export interface SearchResults {
  results: BaseSearchResult[]
  total: number
  images?: SearchImage[]
  metadata?: Json            
} 