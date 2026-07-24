import { describe, expect, it } from 'vitest'
import { createHomeSchema, deleteHomeSchema, updateHomeSchema } from '../../shared/schemas/home'

describe('createHomeSchema', () => {
  it('accepts a valid name', () => {
    expect(createHomeSchema.safeParse({ name: 'Beach House' }).success).toBe(true)
  })

  it('rejects a missing name', () => {
    expect(createHomeSchema.safeParse({}).success).toBe(false)
  })

  it('rejects a whitespace-only name', () => {
    expect(createHomeSchema.safeParse({ name: '   ' }).success).toBe(false)
  })
})

describe('updateHomeSchema', () => {
  it('requires a version alongside the name', () => {
    expect(updateHomeSchema.safeParse({ name: 'Beach House' }).success).toBe(false)
  })

  it('accepts a valid name and version', () => {
    expect(updateHomeSchema.safeParse({ name: 'Beach House', version: 2 }).success).toBe(true)
  })
})

describe('deleteHomeSchema', () => {
  it('requires the typed confirmation name and version', () => {
    const result = deleteHomeSchema.safeParse({ name: 'Beach House', version: 1 })
    expect(result.success).toBe(true)
  })

  it('rejects a missing version', () => {
    expect(deleteHomeSchema.safeParse({ name: 'Beach House' }).success).toBe(false)
  })
})
