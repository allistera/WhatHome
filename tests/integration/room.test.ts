import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ensureMigrated, resetDb } from './helpers/db'
import { createDevice, getDeviceOrThrow } from '../../server/services/device.service'
import { createFloor } from '../../server/services/floor.service'
import { createHome } from '../../server/services/home.service'
import {
  createRoom,
  deleteRoom,
  getRoomDeletionImpact,
  reorderRooms,
  updateRoom
} from '../../server/services/room.service'
import { ConflictError, DuplicateNameError, ValidationError } from '../../server/utils/errors'

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

describe('room service integration', () => {
  it('creates rooms with increasing positions on a floor', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const first = await createRoom(floor.id, { name: 'Kitchen' })
    const second = await createRoom(floor.id, { name: 'Living Room' })
    expect(first.position).toBe(0)
    expect(second.position).toBe(1)
  })

  it('rejects a duplicate room name on the same floor, case-insensitively', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    await createRoom(floor.id, { name: 'Kitchen' })
    await expect(createRoom(floor.id, { name: 'kitchen' })).rejects.toBeInstanceOf(DuplicateNameError)
  })

  it('allows the same room name across different floors', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floorA = await createFloor(home.id, { name: 'Ground Floor' })
    const floorB = await createFloor(home.id, { name: 'First Floor' })
    await createRoom(floorA.id, { name: 'Bathroom' })
    await expect(createRoom(floorB.id, { name: 'Bathroom' })).resolves.toBeDefined()
  })

  it('rejects an update with a stale version', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const room = await createRoom(floor.id, { name: 'Kitchen' })
    await expect(
      updateRoom(room.id, { name: 'Pantry', version: room.version + 1 })
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('reorders rooms within a floor', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const first = await createRoom(floor.id, { name: 'Kitchen' })
    const second = await createRoom(floor.id, { name: 'Living Room' })

    const reordered = await reorderRooms(floor.id, { roomIds: [second.id, first.id] })
    expect(reordered.find((r) => r.id === second.id)?.position).toBe(0)
    expect(reordered.find((r) => r.id === first.id)?.position).toBe(1)
  })

  it('reports the device count before deletion', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const room = await createRoom(floor.id, { name: 'Kitchen' })
    await createDevice(home.id, {
      ...baseDevice,
      name: 'Fridge Sensor',
      locationState: 'in_room',
      roomId: room.id
    })

    const impact = await getRoomDeletionImpact(room.id)
    expect(impact.deviceCount).toBe(1)
  })

  it('deleting a room unassigns its devices', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const room = await createRoom(floor.id, { name: 'Kitchen' })
    const device = await createDevice(home.id, {
      ...baseDevice,
      name: 'Fridge Sensor',
      locationState: 'in_room',
      roomId: room.id
    })

    await deleteRoom(room.id, room.version)

    const updated = await getDeviceOrThrow(device.id)
    expect(updated.roomId).toBeNull()
    expect(updated.inStorage).toBe(false)
  })

  it('rejects assigning a device to a room from a different home', async () => {
    const homeA = await createHome({ name: 'Beach House' })
    const homeB = await createHome({ name: 'Lake House' })
    const floorB = await createFloor(homeB.id, { name: 'Ground Floor' })
    const roomB = await createRoom(floorB.id, { name: 'Kitchen' })

    await expect(
      createDevice(homeA.id, {
        ...baseDevice,
        name: 'Fridge Sensor',
        locationState: 'in_room',
        roomId: roomB.id
      })
    ).rejects.toBeInstanceOf(ValidationError)
  })
})
