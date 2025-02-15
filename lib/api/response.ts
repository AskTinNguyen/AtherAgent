import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types/api/responses'

export class APIError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export function successResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data
  })
}

export function errorResponse(error: Error | APIError): NextResponse<ApiResponse<null>> {
  const statusCode = error instanceof APIError ? error.statusCode : 500
  const errorCode = error.name || 'UnknownError'
  
  return NextResponse.json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message: error.message
    }
  }, { status: statusCode })
}

export async function handleAPIError(error: unknown): Promise<NextResponse<ApiResponse<null>>> {
  console.error('API Error:', error)
  
  if (error instanceof APIError) {
    return errorResponse(error)
  }
  
  if (error instanceof Error) {
    return errorResponse(new APIError(error.message))
  }
  
  return errorResponse(new APIError('An unexpected error occurred'))
}
