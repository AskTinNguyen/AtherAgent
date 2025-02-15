import { Message } from '@/lib/types/chat'
import { z } from 'zod'
import { Chat, ChatError, ChatErrorType, ChatQueryOptions, CreateChatOptions, UpdateChatOptions } from '../types'
import {
    ValidationError,
    ValidationErrorCode,
    ValidationOptions,
    ValidationResult,
    chatQuerySchema,
    chatSchema,
    createChatSchema,
    messageSchema,
    updateChatSchema
} from '../types/validation'

/**
 * Validate data against a schema
 */
export function validateData<T>(
  data: unknown,
  schema: z.ZodSchema,
  options: ValidationOptions = {}
): ValidationResult<T> {
  try {
    const result = schema.parse(data)
    return {
      success: true,
      data: result as T
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        type: ChatErrorType.VALIDATION_ERROR,
        field: err.path.join('.'),
        message: options.messages?.[err.code] || err.message,
        code: mapZodErrorCode(err.code)
      }))

      if (options.throwOnError) {
        throw new ChatError(
          ChatErrorType.VALIDATION_ERROR,
          'Validation failed',
          errors
        )
      }

      return {
        success: false,
        errors
      }
    }

    throw error
  }
}

/**
 * Map Zod error codes to our validation error codes
 */
function mapZodErrorCode(zodCode: string): ValidationErrorCode {
  const codeMap: Record<string, ValidationErrorCode> = {
    invalid_type: ValidationErrorCode.INVALID_TYPE,
    too_small: ValidationErrorCode.TOO_SHORT,
    too_big: ValidationErrorCode.TOO_LONG,
    invalid_string: ValidationErrorCode.INVALID_FORMAT,
    custom: ValidationErrorCode.INVALID_FORMAT
  }

  return codeMap[zodCode] || ValidationErrorCode.INVALID_FORMAT
}

/**
 * Validate chat data
 */
export function validateChat(data: unknown): ValidationResult<Chat> {
  return validateData(data, chatSchema)
}

/**
 * Validate chat creation data
 */
export function validateCreateChat(data: unknown): ValidationResult<CreateChatOptions> {
  return validateData(data, createChatSchema)
}

/**
 * Validate chat update data
 */
export function validateUpdateChat(data: unknown): ValidationResult<UpdateChatOptions> {
  return validateData(data, updateChatSchema)
}

/**
 * Validate chat query options
 */
export function validateChatQuery(data: unknown): ValidationResult<ChatQueryOptions> {
  return validateData(data, chatQuerySchema)
}

/**
 * Validate message data
 */
export function validateMessage(data: unknown): ValidationResult<Message> {
  return validateData(data, messageSchema)
}

/**
 * Apply additional validation rules
 */
export function applyValidationRules(
  data: unknown,
  rules: Record<string, (value: any) => boolean>
): ValidationResult<unknown> {
  const errors: ValidationError[] = []

  for (const [field, rule] of Object.entries(rules)) {
    try {
      if (!rule((data as any)[field])) {
        errors.push({
          type: ChatErrorType.VALIDATION_ERROR,
          field,
          message: `Invalid value for field ${field}`,
          code: ValidationErrorCode.INVALID_FORMAT
        })
      }
    } catch (error) {
      errors.push({
        type: ChatErrorType.VALIDATION_ERROR,
        field,
        message: error instanceof Error ? error.message : 'Validation failed',
        code: ValidationErrorCode.INVALID_FORMAT
      })
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors
    }
  }

  return {
    success: true,
    data
  }
} 