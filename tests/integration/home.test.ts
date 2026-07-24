import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ensureMigrated, resetDb } from './helpers/db'
import { createDevice } from '../../server/services/device.service'
import { createFloor } from '../../server/services/floor.service'
import {
  createHome,
  deleteHome,
  getHomeDeletionImpact,
  getHomeOrThrow,
  listHomesSummary,
  updateHome
} from '../../server/services/home.service'
import { createRoom } from '../../server/services/room.service'
import { ConflictError, NotFoundError, ValidationError } from '../../server/utils/errors'

beforeAll(async () => {
  await ensureMigrated()
})

beforeEach(async () => {
  await resetDb()
})

describe('home service integration', () => {
  it('creates and retrieves a home', async () => {
    const created = await createHome({ name: 'Beach House' })
    expect(created.name).toBe('Beach House')
    expect(created.version).toBe(1)

    const fetched = await getHomeOrThrow(created.id)
    expect(fetched.id).toBe(created.id)
  })

  it('lists homes with floor, room, and device counts', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    await createRoom(floor.id, { name: 'Kitchen' })
    await createDevice(home.id, {
      name: 'Sensor',
      type: 'Sensor',
      protocol: 'Zigbee',
      manufacturer: null,
      model: null,
      serialNumber: null,
      ipAddress: null,
      notes: null,
      purchaseDate: null,
      locationState: 'unassigned',
      roomId: null
    })

    const summaries = await listHomesSummary()
    const summary = summaries.find((s) => s.id === home.id)
    expect(summary?.floorCount).toBe(1)
    expect(summary?.roomCount).toBe(1)
    expect(summary?.deviceCount).toBe(1)
  })

  it('throws NotFoundError for a missing home', async () => {
    await expect(getHomeOrThrow('11111111-1111-4111-8111-111111111111')).rejects.toBeInstanceOf(
      NotFoundError
    )
  })

  it('updates a home name when the version matches', async () => {
    const home = await createHome({ name: 'Beach House' })
    const updated = await updateHome(home.id, { name: 'Lake House', version: home.version })
    expect(updated.name).toBe('Lake House')
    expect(updated.version).toBe(2)
  })

  it('rejects an update with a stale version', async () => {
    const home = await createHome({ name: 'Beach House' })
    await expect(updateHome(home.id, { name: 'Lake House', version: 999 })).rejects.toBeInstanceOf(
      ConflictError
    )
  })

  it('rejects home deletion when the typed confirmation name does not match', async () => {
    const home = await createHome({ name: 'Beach House' })
    await expect(
      deleteHome(home.id, { name: 'Wrong Name', version: home.version })
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('deletes a home and all descendant floors, rooms, and devices', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const room = await createRoom(floor.id, { name: 'Kitchen' })
    await createDevice(home.id, {
      name: 'Sensor',
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

    const impact = await getHomeDeletionImpact(home.id)
    expect(impact.floors).toBe(1)
    expect(impact.rooms).toBe(1)
    expect(impact.devices).toBe(1)

    await deleteHome(home.id, { name: 'Beach House', version: home.version })

    await expect(getHomeOrThrow(home.id)).rejects.toBeInstanceOf(NotFoundError)
  })
})
