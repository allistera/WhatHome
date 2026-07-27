import { describe, expect, it } from 'vitest'
import { createDeviceSchema } from '../../shared/schemas/device'

const base = {
  name: 'Living Room Sensor',
  type: 'Sensor',
  protocol: 'Zigbee',
  manufacturer: null,
  model: null,
  serialNumber: null,
  ipAddress: null,
  notes: null,
  purchaseDate: null
}

describe('createDeviceSchema', () => {
  it('accepts a minimal unassigned device', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      locationState: 'unassigned',
      roomId: null
    })
    expect(result.success).toBe(true)
  })

  it('rejects in_room without a roomId', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      locationState: 'in_room',
      roomId: null
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'roomId')).toBe(true)
    }
  })

  it('rejects a roomId when in storage', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      locationState: 'in_storage',
      roomId: '11111111-1111-4111-8111-111111111111'
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid roomId when in_room', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      locationState: 'in_room',
      roomId: '11111111-1111-4111-8111-111111111111'
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid IPv4 address', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      ipAddress: '192.168.1.10',
      locationState: 'unassigned',
      roomId: null
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid IPv6 address', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      ipAddress: '2001:db8::1',
      locationState: 'unassigned',
      roomId: null
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid IP address', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      ipAddress: 'not-an-ip',
      locationState: 'unassigned',
      roomId: null
    })
    expect(result.success).toBe(false)
  })

  it('treats blank optional strings as null', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      manufacturer: '   ',
      locationState: 'unassigned',
      roomId: null
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.manufacturer).toBeNull()
    }
  })

  it('rejects a name that is empty after trimming', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      name: '   ',
      locationState: 'unassigned',
      roomId: null
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid purchase date format', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      purchaseDate: '07/24/2026',
      locationState: 'unassigned',
      roomId: null
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid purchase date', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      purchaseDate: '2026-07-24',
      locationState: 'unassigned',
      roomId: null
    })
    expect(result.success).toBe(true)
  })

  it('rejects a purchase date that does not exist', () => {
    const result = createDeviceSchema.safeParse({
      ...base,
      purchaseDate: '2026-02-30',
      locationState: 'unassigned',
      roomId: null
    })
    expect(result.success).toBe(false)
  })

  it('validates leap days using the calendar year', () => {
    const commonYear = createDeviceSchema.safeParse({
      ...base,
      purchaseDate: '2026-02-29',
      locationState: 'unassigned',
      roomId: null
    })
    const leapYear = createDeviceSchema.safeParse({
      ...base,
      purchaseDate: '2024-02-29',
      locationState: 'unassigned',
      roomId: null
    })

    expect(commonYear.success).toBe(false)
    expect(leapYear.success).toBe(true)
  })
})
