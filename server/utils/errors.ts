import type { ApiErrorCode } from '../../shared/types/api'

export class AppError extends Error {
  code: ApiErrorCode
  statusCode: number
  fieldErrors?: Record<string, string[]>

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.fieldErrors = fieldErrors
  }
}

export class ValidationError extends AppError {
  constructor(fieldErrors: Record<string, string[]>) {
    super('VALIDATION_ERROR', 'The submitted data is invalid.', 422, fieldErrors)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'The request could not be understood.') {
    super('BAD_REQUEST', message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} was not found.`, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'The record changed elsewhere. Reload and try again.') {
    super('CONFLICT', message, 409)
  }
}

export class DuplicateNameError extends AppError {
  constructor(message: string) {
    super('DUPLICATE_NAME', message, 409)
  }
}
