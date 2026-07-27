import { describe, expect, it } from 'vitest'
import {
  createFloorSchema,
  reorderFloorsSchema,
  updateFloorSchema
} from '../../shared/schemas/floor'
import { createRoomSchema, reorderRoomsSchema, updateRoomSchema } from '../../shared/schemas/room'

const validId = '11111111-1111-4111-8111-111111111111'
const validId2 = '22222222-2222-4222-8222-222222222222'

describe('createFloorSchema', () => {
  it('accepts a valid floor name', () => {
    expect(createFloorSchema.safeParse({ name: 'Ground Floor' }).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(createFloorSchema.safeParse({ name: '' }).success).toBe(false)
  })
})

describe('updateFloorSchema', () => {
  it('requires a version', () => {
    expect(updateFloorSchema.safeParse({ name: 'Ground Floor' }).success).toBe(false)
  })
})

describe('reorderFloorsSchema', () => {
  it('accepts a non-empty list of UUIDs', () => {
    expect(reorderFloorsSchema.safeParse({ floorIds: [validId, validId2] }).success).toBe(true)
  })

  it('rejects an empty list', () => {
    expect(reorderFloorsSchema.safeParse({ floorIds: [] }).success).toBe(false)
  })

  it('rejects a list containing a non-UUID value', () => {
    expect(reorderFloorsSchema.safeParse({ floorIds: [validId, 'nope'] }).success).toBe(false)
  })

  it('rejects duplicate floor IDs', () => {
    expect(reorderFloorsSchema.safeParse({ floorIds: [validId, validId] }).success).toBe(false)
  })
})

describe('createRoomSchema', () => {
  it('accepts a valid room name', () => {
    expect(createRoomSchema.safeParse({ name: 'Kitchen' }).success).toBe(true)
  })

  it('rejects a name over 120 characters', () => {
    expect(createRoomSchema.safeParse({ name: 'a'.repeat(121) }).success).toBe(false)
  })
})

describe('updateRoomSchema', () => {
  it('requires a version', () => {
    expect(updateRoomSchema.safeParse({ name: 'Kitchen' }).success).toBe(false)
  })

  it('accepts a valid name and version', () => {
    expect(updateRoomSchema.safeParse({ name: 'Kitchen', version: 1 }).success).toBe(true)
  })
})

describe('reorderRoomsSchema', () => {
  it('accepts a non-empty list of UUIDs', () => {
    expect(reorderRoomsSchema.safeParse({ roomIds: [validId] }).success).toBe(true)
  })

  it('rejects an empty list', () => {
    expect(reorderRoomsSchema.safeParse({ roomIds: [] }).success).toBe(false)
  })

  it('rejects duplicate room IDs', () => {
    expect(reorderRoomsSchema.safeParse({ roomIds: [validId, validId] }).success).toBe(false)
  })
})
