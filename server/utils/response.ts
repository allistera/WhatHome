import type { ApiListResponse, ApiSuccessResponse } from '../../shared/types/api'

export function successResponse<T>(data: T): ApiSuccessResponse<T> {
  return { data }
}

export function listResponse<T>(
  data: T[],
  page: { number: number; size: number; totalItems: number }
): ApiListResponse<T> {
  return {
    data,
    page: {
      ...page,
      totalPages: page.size > 0 ? Math.ceil(page.totalItems / page.size) : 0
    }
  }
}
