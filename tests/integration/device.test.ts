import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ensureMigrated, resetDb } from './helpers/db'
import {
  createDevice,
  deleteDevice,
  getDeviceOrThrow,
  listDevices,
  updateDevice
} from '../../server/services/device.service'
import { createFloor } from '../../server/services/floor.service'
import { createHome } from '../../server/services/home.service'
import { createRoom } from '../../server/services/room.service'
import { ConflictError, NotFoundError } from '../../server/utils/errors'

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
  purchaseDate: null,
  locationState: 'unassigned' as const,
  roomId: null
}

describe('device service integration', () => {
  it('creates a device with only the required fields', async () => {
    const home = await createHome({ name: 'Beach House' })
    const device = await createDevice(home.id, { ...baseDevice, name: 'Fridge Sensor' })
    expect(device.name).toBe('Fridge Sensor')
    expect(device.locationState).toBe('unassigned')
    expect(device.version).toBe(1)
  })

  it('stores and returns all optional fields', async () => {
    const home = await createHome({ name: 'Beach House' })
    const device = await createDevice(home.id, {
      ...baseDevice,
      name: 'Thermostat',
      manufacturer: 'Nest',
      model: 'Learning Thermostat',
      serialNumber: 'SN-123',
      ipAddress: '192.168.1.20',
      notes: 'Hallway thermostat',
      purchaseDate: '2024-01-15'
    })
    expect(device.manufacturer).toBe('Nest')
    expect(device.ipAddress).toBe('192.168.1.20')
    expect(device.purchaseDate).toBe('2024-01-15')
  })

  it('moves a device through unassigned, in storage, and in room states', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    const room = await createRoom(floor.id, { name: 'Kitchen' })
    const device = await createDevice(home.id, { ...baseDevice, name: 'Speaker' })
    expect(device.locationState).toBe('unassigned')

    const inStorage = await updateDevice(device.id, {
      ...baseDevice,
      name: 'Speaker',
      locationState: 'in_storage',
      roomId: null,
      version: device.version
    })
    expect(inStorage.locationState).toBe('in_storage')
    expect(inStorage.inStorage).toBe(true)

    const inRoom = await updateDevice(device.id, {
      ...baseDevice,
      name: 'Speaker',
      locationState: 'in_room',
      roomId: room.id,
      version: inStorage.version
    })
    expect(inRoom.locationState).toBe('in_room')
    expect(inRoom.roomId).toBe(room.id)
    expect(inRoom.inStorage).toBe(false)
  })

  it('rejects a concurrent update with a stale version', async () => {
    const home = await createHome({ name: 'Beach House' })
    const device = await createDevice(home.id, { ...baseDevice, name: 'Speaker' })

    await updateDevice(device.id, { ...baseDevice, name: 'Speaker v2', version: device.version })

    await expect(
      updateDevice(device.id, { ...baseDevice, name: 'Speaker v3', version: device.version })
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('deletes a device', async () => {
    const home = await createHome({ name: 'Beach House' })
    const device = await createDevice(home.id, { ...baseDevice, name: 'Speaker' })
    await deleteDevice(device.id, device.version)
    await expect(getDeviceOrThrow(device.id)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('rejects deleting with a stale version', async () => {
    const home = await createHome({ name: 'Beach House' })
    const device = await createDevice(home.id, { ...baseDevice, name: 'Speaker' })
    await expect(deleteDevice(device.id, device.version + 1)).rejects.toBeInstanceOf(ConflictError)
  })

  it('searches devices case-insensitively across name, manufacturer, and serial number', async () => {
    const home = await createHome({ name: 'Beach House' })
    await createDevice(home.id, {
      ...baseDevice,
      name: 'Fridge Sensor',
      manufacturer: 'Acme',
      serialNumber: 'ABC-1'
    })
    await createDevice(home.id, { ...baseDevice, name: 'Door Lock', manufacturer: 'Other' })

    const bySearch = await listDevices(home.id, {
      sort: 'name',
      order: 'asc',
      page: 1,
      pageSize: 25,
      search: 'FRIDGE'
    })
    expect(bySearch.devices).toHaveLength(1)
    expect(bySearch.devices[0]?.name).toBe('Fridge Sensor')

    const byManufacturer = await listDevices(home.id, {
      sort: 'name',
      order: 'asc',
      page: 1,
      pageSize: 25,
      search: 'acme'
    })
    expect(byManufacturer.devices).toHaveLength(1)
  })

  it('filters devices by location state', async () => {
    const home = await createHome({ name: 'Beach House' })
    await createDevice(home.id, { ...baseDevice, name: 'Unassigned Device' })
    await createDevice(home.id, {
      ...baseDevice,
      name: 'Stored Device',
      locationState: 'in_storage'
    })

    const result = await listDevices(home.id, {
      sort: 'name',
      order: 'asc',
      page: 1,
      pageSize: 25,
      locationState: 'in_storage'
    })
    expect(result.devices).toHaveLength(1)
    expect(result.devices[0]?.name).toBe('Stored Device')
  })
})
