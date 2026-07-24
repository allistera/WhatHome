import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import { defineEventHandler, setResponseStatus } from 'h3'
import type { ZodType } from 'zod'
import type { ApiErrorBody } from '../../shared/types/api'
import { AppError, ValidationError } from './errors'

export function defineApiHandler<T>(handler: (event: H3Event) => Promise<T>) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error) {
      return handleApiError(event, error)
    }
  })
}

export function handleApiError(event: H3Event, error: unknown): ApiErrorBody {
  const requestId = randomUUID()

  if (error instanceof AppError) {
    setResponseStatus(event, error.statusCode)
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        requestId
      }
    }
  }

  console.error(`[${requestId}] Unhandled server error:`, error)
  setResponseStatus(event, 500)
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      requestId
    }
  }
}

export function parseWithSchema<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : '_'
      fieldErrors[path] = [...(fieldErrors[path] ?? []), issue.message]
    }
    throw new ValidationError(fieldErrors)
  }
  return result.data
}
