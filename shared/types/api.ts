export interface ApiSuccessResponse<T> {
  data: T
}

export interface ApiListResponse<T> {
  data: T[]
  page: {
    number: number
    size: number
    totalItems: number
    totalPages: number
  }
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'DUPLICATE_NAME'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR'

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    fieldErrors?: Record<string, string[]>
    requestId: string
  }
}
