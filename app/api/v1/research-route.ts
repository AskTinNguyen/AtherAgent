import { handleAPIError, NotFoundError, successResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { performResearch } from '@/lib/research'
import type {
  ResearchRequest,
  UpdateResearchStateRequest
} from '@/lib/types/api/requests'
import type {
  ResearchState,
  ResearchStateResponse,
  ResearchSuggestion,
  ResearchSuggestionsResponse
} from '@/lib/types/api/responses'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest
): Promise<ResearchStateResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    
    if (!chatId) {
      throw new Error('Chat ID is required')
    }
    
    const researchState = await prisma.researchState.findUnique({
      where: { chatId }
    })
    
    if (!researchState) {
      throw new NotFoundError('Research state not found')
    }
    
    return successResponse<ResearchState>(researchState)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(
  request: NextRequest
): Promise<ResearchSuggestionsResponse> {
  try {
    const data = await request.json() as ResearchRequest
    const { chatId } = data
    
    // Get or create research state
    let researchState = await prisma.researchState.findUnique({
      where: { chatId }
    })
    
    if (!researchState) {
      researchState = await prisma.researchState.create({
        data: {
          chatId,
          status: 'researching',
          depth: {
            current: 0,
            max: data.depth || 3
          },
          suggestions: []
        }
      })
    }
    
    // Perform research
    const suggestions = await performResearch(data.query, {
      depth: data.depth,
      maxResults: data.maxResults,
      filters: data.filters
    })
    
    // Update research state
    await prisma.researchState.update({
      where: { chatId },
      data: {
        suggestions,
        status: 'complete',
        updatedAt: new Date()
      }
    })
    
    return successResponse<ResearchSuggestion[]>(suggestions)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function PUT(
  request: NextRequest
): Promise<ResearchStateResponse> {
  try {
    const data = await request.json() as UpdateResearchStateRequest & { chatId: string }
    const { chatId, ...updates } = data
    
    const researchState = await prisma.researchState.findUnique({
      where: { chatId }
    })
    
    if (!researchState) {
      throw new NotFoundError('Research state not found')
    }
    
    const updatedState = await prisma.researchState.update({
      where: { chatId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })
    
    return successResponse<ResearchState>(updatedState)
  } catch (error) {
    return handleAPIError(error)
  }
}
