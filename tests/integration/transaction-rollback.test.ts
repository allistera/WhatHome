import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureMigrated, resetDb } from './helpers/db'

vi.mock('../../server/repositories/floor.repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/repositories/floor.repository')>()
  return {
    ...actual,
    deleteFloorById: vi.fn(async () => {
      throw new Error('Simulated failure during floor deletion')
    })
  }
})

const { createDevice, getDeviceOrThrow } = await import('../../server/services/device.service')
const { createFloor, deleteFloor, getFloorOrThrow } =
  await import('../../server/services/floor.service')
const { createHome } = await import('../../server/services/home.service')
const { createRoom, getRoomOrThrow } = await import('../../server/services/room.service')

beforeAll(async () => {
  await ensureMigrated()
})

beforeEach(async () => {
  await resetDb()
  vi.clearAllMocks()
})

describe('transaction rollback', () => {
  it('leaves rooms and device links unchanged when floor deletion fails mid-transaction', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const room = await createRoom(floor.id, { name: 'Kitchen' })
    const device = await createDevice(home.id, {
      name: 'Fridge Sensor',
      type: 'Sensor',
      protocol: 'Zigbee',
      manufacturer: null,
      model: null,
      serialNumber: null,
      ipAddress: null,
      notes: null,
      purchaseDate: null,
      locationState: 'in_room',
      roomId: room.id
    })

    await expect(deleteFloor(floor.id, floor.version)).rejects.toThrow(
      'Simulated failure during floor deletion'
    )

    const stillThere = await getFloorOrThrow(floor.id)
    expect(stillThere.id).toBe(floor.id)

    const roomAfter = await getRoomOrThrow(room.id)
    expect(roomAfter.id).toBe(room.id)

    const deviceAfter = await getDeviceOrThrow(device.id)
    expect(deviceAfter.roomId).toBe(room.id)
  })
})
