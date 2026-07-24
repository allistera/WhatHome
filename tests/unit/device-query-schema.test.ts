import { describe, expect, it } from 'vitest'
import { deviceListQuerySchema } from '../../shared/schemas/device'

describe('deviceListQuerySchema', () => {
  it('applies defaults when no parameters are given', () => {
    const result = deviceListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort).toBe('name')
      expect(result.data.order).toBe('asc')
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it('parses string query values for page and pageSize as numbers', () => {
    const result = deviceListQuerySchema.safeParse({ page: '2', pageSize: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(10)
    }
  })

  it('accepts a valid locationState filter', () => {
    expect(deviceListQuerySchema.safeParse({ locationState: 'in_room' }).success).toBe(true)
  })

  it('rejects an invalid locationState filter', () => {
    expect(deviceListQuerySchema.safeParse({ locationState: 'lost' }).success).toBe(false)
  })

  it('rejects an invalid sort field', () => {
    expect(deviceListQuerySchema.safeParse({ sort: 'color' }).success).toBe(false)
  })

  it('rejects an invalid order value', () => {
    expect(deviceListQuerySchema.safeParse({ order: 'sideways' }).success).toBe(false)
  })

  it('accepts a free-text search term', () => {
    const result = deviceListQuerySchema.safeParse({ search: 'fridge' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.search).toBe('fridge')
  })

  it('rejects a floorId that is not a valid UUID', () => {
    expect(deviceListQuerySchema.safeParse({ floorId: 'not-a-uuid' }).success).toBe(false)
  })
})
