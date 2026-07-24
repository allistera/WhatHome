import type { H3Event } from 'h3'
import { getRouterParam } from 'h3'
import { uuidSchema } from '../../shared/schemas/common'
import { BadRequestError } from './errors'

export function requireRouteParam(event: H3Event, name: string): string {
  const value = getRouterParam(event, name)
  if (!value) {
    throw new BadRequestError(`Missing required route parameter: ${name}`)
  }
  return value
}

export function requireUuidRouteParam(event: H3Event, name: string): string {
  const value = requireRouteParam(event, name)
  const result = uuidSchema.safeParse(value)
  if (!result.success) {
    throw new BadRequestError(`Invalid ${name}: must be a valid UUID.`)
  }
  return result.data
}
