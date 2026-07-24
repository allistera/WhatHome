import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ensureMigrated, resetDb } from './helpers/db'
import { getDeviceOrThrow, createDevice } from '../../server/services/device.service'
import {
  createFloor,
  deleteFloor,
  getFloorDeletionImpact,
  reorderFloors,
  updateFloor
} from '../../server/services/floor.service'
import { createHome } from '../../server/services/home.service'
import { createRoom } from '../../server/services/room.service'
import { ConflictError, DuplicateNameError } from '../../server/utils/errors'

beforeAll(async () => {
  await ensureMigrated()
})

beforeEach(async () => {
  await resetDb()
})

const baseDevice = {
  type: 'Sensor',
  protocol: 'Zigbee',
  manufacturer: null,
  model: null,
  serialNumber: null,
  ipAddress: null,
  notes: null,
  purchaseDate: null
} as const

describe('floor service integration', () => {
  it('creates floors with increasing positions', async () => {
    const home = await createHome({ name: 'Beach House' })
    const first = await createFloor(home.id, { name: 'Ground Floor' })
    const second = await createFloor(home.id, { name: 'First Floor' })
    expect(first.position).toBe(0)
    expect(second.position).toBe(1)
  })

  it('rejects a duplicate floor name within the same home, case-insensitively', async () => {
    const home = await createHome({ name: 'Beach House' })
    await createFloor(home.id, { name: 'Ground Floor' })
    await expect(createFloor(home.id, { name: 'ground floor' })).rejects.toBeInstanceOf(
      DuplicateNameError
    )
  })

  it('allows the same floor name across different homes', async () => {
    const homeA = await createHome({ name: 'Beach House' })
    const homeB = await createHome({ name: 'Lake House' })
    await createFloor(homeA.id, { name: 'Ground Floor' })
    await expect(createFloor(homeB.id, { name: 'Ground Floor' })).resolves.toBeDefined()
  })

  it('rejects an update with a stale version', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    await expect(
      updateFloor(floor.id, { name: 'Upstairs', version: floor.version + 1 })
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('reorders floors within a home', async () => {
    const home = await createHome({ name: 'Beach House' })
    const first = await createFloor(home.id, { name: 'Ground Floor' })
    const second = await createFloor(home.id, { name: 'First Floor' })

    const reordered = await reorderFloors(home.id, { floorIds: [second.id, first.id] })
    expect(reordered.find((f) => f.id === second.id)?.position).toBe(0)
    expect(reordered.find((f) => f.id === first.id)?.position).toBe(1)
  })

  it('reports rooms and device counts before deletion', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const room = await createRoom(floor.id, { name: 'Kitchen' })
    await createDevice(home.id, {
      ...baseDevice,
      name: 'Fridge Sensor',
      locationState: 'in_room',
      roomId: room.id
    })

    const impact = await getFloorDeletionImpact(floor.id)
    expect(impact.roomCount).toBe(1)
    expect(impact.deviceCount).toBe(1)
  })

  it('deleting a floor deletes its rooms and unassigns their devices', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const room = await createRoom(floor.id, { name: 'Kitchen' })
    const device = await createDevice(home.id, {
      ...baseDevice,
      name: 'Fridge Sensor',
      locationState: 'in_room',
      roomId: room.id
    })

    await deleteFloor(floor.id, floor.version)

    const updatedDevice = await getDeviceOrThrow(device.id)
    expect(updatedDevice.roomId).toBeNull()
    expect(updatedDevice.inStorage).toBe(false)
  })
})
