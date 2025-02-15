import { APIError, APIResponse } from '@/lib/api/response'
import type {
  UpdateChatRequest
} from '@/lib/types/api/requests'
import type {
  ChatListResponse,
  ChatResponse
} from '@/lib/types/api/responses'
import { PrismaClient } from '@prisma/client'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { Configuration, OpenAIApi } from 'openai-edge'

import { env } from '@/env.mjs'
import { redis } from '@/lib/redis'
import { nanoid } from '@/lib/utils'

const prisma = new PrismaClient()

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

class UnauthorizedError extends APIError {
  constructor(message: string) {
    super(message, 401)
  }
}

class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, 404)
  }
}

function successResponse<T>(data: T): APIResponse<T> {
  return {
    success: true,
    data
  }
}

function handleAPIError(error: unknown): APIResponse<null> {
  if (error instanceof APIError) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode
    }
  }
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500
    }
  }
  return {
    success: false,
    error: 'Internal server error',
    statusCode: 500
  }
}

export async function GET(): Promise<NextResponse<ChatListResponse>> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      throw new UnauthorizedError('Authentication required')
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        messages: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(successResponse(chats))
  } catch (error) {
    return NextResponse.json(handleAPIError(error))
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { messages, id } = json
    
    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages are required and must be an array', { status: 400 })
    }

    const chatId = id || nanoid()
    
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      stream: true
    })

    const stream = OpenAIStream(response)
    
    // Store chat in Redis
    try {
      await redis.hset(`chat:${chatId}`, {
        id: chatId,
        createdAt: Date.now(),
        messages: JSON.stringify(messages)
      })
    } catch (error) {
      console.error('Failed to store chat in Redis:', error)
      // Continue with the response even if Redis storage fails
    }

    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse<ChatResponse>> {
  try {
    const session = await getServerSession()
    const { id, ...updates } = await request.json() as UpdateChatRequest & { id: string }
    
    const chat = await prisma.chat.findUnique({
      where: { id }
    })
    
    if (!chat) {
      throw new NotFoundError('Chat not found')
    }

    // Only allow updates to public chats or if user owns the chat
    if (!chat.metadata?.isPublic && (!session?.user?.id || chat.userId !== session.user.id)) {
      throw new UnauthorizedError('Not authorized to update this chat')
    }
    
    const updatedChat = await prisma.chat.update({
      where: { id },
      data: {
        ...updates,
        messages: updates.messages ? {
          deleteMany: {},
          create: updates.messages
        } : undefined,
        metadata: updates.metadata ? {
          ...chat.metadata,
          ...updates.metadata
        } : undefined
      },
      include: {
        messages: true
      }
    })

    return NextResponse.json(successResponse(updatedChat))
  } catch (error) {
    return NextResponse.json(handleAPIError(error))
  }
}
