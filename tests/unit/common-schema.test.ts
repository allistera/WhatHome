import { describe, expect, it } from 'vitest'
import {
  deleteWithVersionSchema,
  nameSchema,
  paginationQuerySchema,
  uuidSchema,
  versionSchema
} from '../../shared/schemas/common'

describe('nameSchema', () => {
  it('trims surrounding whitespace', () => {
    const result = nameSchema.safeParse('  Living Room  ')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('Living Room')
  })

  it('rejects an empty string', () => {
    expect(nameSchema.safeParse('').success).toBe(false)
  })

  it('rejects a string over 120 characters', () => {
    expect(nameSchema.safeParse('a'.repeat(121)).success).toBe(false)
  })

  it('accepts a string at exactly 120 characters', () => {
    expect(nameSchema.safeParse('a'.repeat(120)).success).toBe(true)
  })
})

describe('versionSchema', () => {
  it('accepts a positive integer', () => {
    expect(versionSchema.safeParse(3).success).toBe(true)
  })

  it('coerces a numeric string', () => {
    const result = versionSchema.safeParse('4')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe(4)
  })

  it('rejects zero', () => {
    expect(versionSchema.safeParse(0).success).toBe(false)
  })

  it('rejects a non-numeric value', () => {
    expect(versionSchema.safeParse('not-a-number').success).toBe(false)
  })
})

describe('uuidSchema', () => {
  it('accepts a well-formed v4 UUID', () => {
    expect(uuidSchema.safeParse('11111111-1111-4111-8111-111111111111').success).toBe(true)
  })

  it('rejects a malformed UUID', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
  })
})

describe('deleteWithVersionSchema', () => {
  it('requires a version', () => {
    expect(deleteWithVersionSchema.safeParse({}).success).toBe(false)
  })

  it('accepts a valid version', () => {
    expect(deleteWithVersionSchema.safeParse({ version: 1 }).success).toBe(true)
  })
})

describe('paginationQuerySchema', () => {
  it('defaults page to 1 and pageSize to 25', () => {
    const result = paginationQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it('rejects a pageSize over 100', () => {
    expect(paginationQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false)
  })
})
