import { NextRequest } from 'next/server'
import { searchSchema, validateRequest } from '@/lib/api/validation'
import { successResponse, handleAPIError } from '@/lib/api/response'
import type { SearchResponse, SearchResult } from '@/lib/types/api/responses'
import type { SearchRequest } from '@/lib/types/api/requests'
import { performSearch } from '@/lib/search'

export async function POST(
  request: NextRequest
): Promise<SearchResponse> {
  try {
    const data = await validateRequest<SearchRequest>(request, searchSchema)
    
    const results = await performSearch(data.query, {
      filters: data.filters,
      pagination: data.pagination,
      options: data.options
    })

    return successResponse<SearchResult[]>(results.items, {
      metadata: {
        totalResults: results.total,
        searchTime: results.searchTime,
        nextCursor: results.nextCursor
      }
    })
  } catch (error) {
    return handleAPIError(error)
  }
}
