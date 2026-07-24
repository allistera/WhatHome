import type { ApiErrorBody, ApiErrorCode, ApiListResponse, ApiSuccessResponse } from '../../shared/types/api'

export class ApiRequestError extends Error {
  code: ApiErrorCode
  status: number
  fieldErrors?: Record<string, string[]>
  requestId?: string

  constructor(body: ApiErrorBody['error'], status: number) {
    super(body.message)
    this.code = body.code
    this.status = status
    this.fieldErrors = body.fieldErrors
    this.requestId = body.requestId
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'error' in value
}

function rethrowAsApiError(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    isApiErrorBody((error as { data: unknown }).data)
  ) {
    const status = 'statusCode' in error ? Number((error as { statusCode: unknown }).statusCode) : 500
    throw new ApiRequestError((error as { data: ApiErrorBody }).data.error, status)
  }
  throw error
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Record<string, unknown>
  body?: unknown
}

async function request<T>(url: string, options: RequestOptions): Promise<T> {
  try {
    const response = await $fetch(url, {
      method: options.method,
      query: options.query,
      body: options.body as Record<string, unknown> | undefined,
      headers: { 'Content-Type': 'application/json' }
    })
    return response as T
  } catch (error) {
    rethrowAsApiError(error)
  }
}

export function apiGet<T>(url: string, query?: Record<string, unknown>): Promise<ApiSuccessResponse<T>> {
  return request<ApiSuccessResponse<T>>(url, { method: 'GET', query })
}

export function apiGetList<T>(url: string, query?: Record<string, unknown>): Promise<ApiListResponse<T>> {
  return request<ApiListResponse<T>>(url, { method: 'GET', query })
}

export function apiPost<T>(url: string, body?: unknown): Promise<ApiSuccessResponse<T>> {
  return request<ApiSuccessResponse<T>>(url, { method: 'POST', body })
}

export function apiPatch<T>(url: string, body?: unknown): Promise<ApiSuccessResponse<T>> {
  return request<ApiSuccessResponse<T>>(url, { method: 'PATCH', body })
}

export async function apiDelete(url: string, body?: unknown): Promise<void> {
  await request<unknown>(url, { method: 'DELETE', body })
}

/**
 * Uploads a FormData payload (e.g. a file). Deliberately does not set a
 * Content-Type header — the browser must set its own multipart boundary.
 */
export async function apiUpload<T>(url: string, formData: FormData): Promise<ApiSuccessResponse<T>> {
  try {
    const response = await $fetch(url, { method: 'POST', body: formData })
    return response as ApiSuccessResponse<T>
  } catch (error) {
    rethrowAsApiError(error)
  }
}
