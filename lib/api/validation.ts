import { z } from 'zod'
import { NextRequest } from 'next/server'
import { ValidationError } from './response'
import type {
  CreateChatRequest,
  CreateFolderRequest,
  UpdateFolderRequest,
  CreateBookmarkRequest,
  SearchRequest,
  TrackUsageRequest
} from '@/lib/types/api/requests'

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.Schema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors.map(e => e.message).join(', '))
    }
    throw error
  }
}

// Chat validation schemas
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1)
})

export const createChatSchema: z.Schema<CreateChatRequest> = z.object({
  messages: z.array(chatMessageSchema),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// Folder validation schemas
export const createFolderSchema: z.Schema<CreateFolderRequest> = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const updateFolderSchema: z.Schema<UpdateFolderRequest> = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// Bookmark validation schemas
export const createBookmarkSchema: z.Schema<CreateBookmarkRequest> = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  snippet: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

// Search validation schemas
export const searchSchema: z.Schema<SearchRequest> = z.object({
  query: z.string().min(1),
  filters: z.object({
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    sources: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    type: z.enum(['web', 'news', 'academic']).optional()
  }).optional(),
  pagination: z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).optional()
  }).optional(),
  options: z.record(z.any()).optional()
})

// Usage validation schemas
export const trackUsageSchema: z.Schema<TrackUsageRequest> = z.object({
  model: z.string(),
  tokens: z.number().min(0),
  chatId: z.string().optional(),
  metadata: z.object({
    requestType: z.string().optional(),
    features: z.array(z.string()).optional()
  }).optional()
})
