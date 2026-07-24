import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ensureMigrated, resetDb } from './helpers/db'
import { listDevices } from '../../server/services/device.service'
import { importDevicesFromCsv } from '../../server/services/device-import.service'
import { createFloor } from '../../server/services/floor.service'
import { createHome } from '../../server/services/home.service'
import { createRoom } from '../../server/services/room.service'
import { BadRequestError, NotFoundError } from '../../server/utils/errors'

beforeAll(async () => {
  await ensureMigrated()
})

beforeEach(async () => {
  await resetDb()
})

function csv(rows: string[][]): string {
  return rows.map((row) => row.join(',')).join('\n')
}

describe('device import integration', () => {
  it('creates devices for valid rows and reports errors for invalid ones', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    await createRoom(floor.id, { name: 'Kitchen' })

    const file = csv([
      ['Name', 'Type', 'Protocol', 'Floor', 'Room', 'In Storage'],
      ['Fridge Sensor', 'Sensor', 'Zigbee', 'Ground Floor', 'Kitchen', ''],
      ['Spare Bulb', 'Light', 'Zigbee', '', '', 'yes'],
      ['Bad Device', 'Sensor', 'WiFi', '', '', '']
    ])

    const summary = await importDevicesFromCsv(home.id, file)

    expect(summary.totalRows).toBe(3)
    expect(summary.created).toBe(3)
    expect(summary.failed).toBe(0)

    const inRoomResult = summary.results.find((r) => r.row === 2)
    expect(inRoomResult?.status).toBe('created')
    expect(inRoomResult?.device?.locationState).toBe('in_room')

    const inStorageResult = summary.results.find((r) => r.row === 3)
    expect(inStorageResult?.device?.locationState).toBe('in_storage')

    const { devices } = await listDevices(home.id, {
      sort: 'name',
      order: 'asc',
      page: 1,
      pageSize: 25
    })
    expect(devices).toHaveLength(3)
  })

  it('rejects an invalid IP address on a single row without affecting others', async () => {
    const home = await createHome({ name: 'Beach House' })

    const file = csv([
      ['Name', 'Type', 'Protocol', 'IP Address'],
      ['Good Device', 'Sensor', 'Zigbee', '192.168.1.5'],
      ['Bad IP Device', 'Sensor', 'Zigbee', 'not-an-ip']
    ])

    const summary = await importDevicesFromCsv(home.id, file)

    expect(summary.created).toBe(1)
    expect(summary.failed).toBe(1)
    const failed = summary.results.find((r) => r.status === 'error')
    expect(failed?.fieldErrors?.ipAddress).toBeDefined()
  })

  it('rejects a row missing the required name field with a friendly message', async () => {
    const home = await createHome({ name: 'Beach House' })
    const file = csv([
      ['Name', 'Type', 'Protocol'],
      ['', 'Sensor', 'Zigbee']
    ])

    const summary = await importDevicesFromCsv(home.id, file)

    expect(summary.failed).toBe(1)
    expect(summary.results[0]?.fieldErrors?.name?.[0]).toMatch(/required/i)
  })

  it('rejects a row that references a room from a floor that does not exist', async () => {
    const home = await createHome({ name: 'Beach House' })
    const file = csv([
      ['Name', 'Type', 'Protocol', 'Floor', 'Room'],
      ['Device', 'Sensor', 'Zigbee', 'Nonexistent Floor', 'Kitchen']
    ])

    const summary = await importDevicesFromCsv(home.id, file)

    expect(summary.failed).toBe(1)
    expect(summary.results[0]?.error).toMatch(/Floor "Nonexistent Floor" was not found/)
  })

  it('rejects a row that references a room not on the given floor', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })

    const file = csv([
      ['Name', 'Type', 'Protocol', 'Floor', 'Room'],
      ['Device', 'Sensor', 'Zigbee', floor.name, 'Nonexistent Room']
    ])

    const summary = await importDevicesFromCsv(home.id, file)

    expect(summary.failed).toBe(1)
    expect(summary.results[0]?.error).toMatch(/Room "Nonexistent Room" was not found/)
  })

  it('rejects a row with only Floor or only Room set', async () => {
    const home = await createHome({ name: 'Beach House' })
    const file = csv([
      ['Name', 'Type', 'Protocol', 'Floor'],
      ['Device', 'Sensor', 'Zigbee', 'Ground Floor']
    ])

    const summary = await importDevicesFromCsv(home.id, file)

    expect(summary.failed).toBe(1)
    expect(summary.results[0]?.error).toMatch(/both Floor and Room/i)
  })

  it('rejects a row with both a room and "in storage" set', async () => {
    const home = await createHome({ name: 'Beach House' })
    const floor = await createFloor(home.id, { name: 'Ground Floor' })
    await createRoom(floor.id, { name: 'Kitchen' })

    const file = csv([
      ['Name', 'Type', 'Protocol', 'Floor', 'Room', 'In Storage'],
      ['Device', 'Sensor', 'Zigbee', 'Ground Floor', 'Kitchen', 'yes']
    ])

    const summary = await importDevicesFromCsv(home.id, file)

    expect(summary.failed).toBe(1)
    expect(summary.results[0]?.error).toMatch(/cannot be both/i)
  })

  it('rejects the whole file when required columns are missing', async () => {
    const home = await createHome({ name: 'Beach House' })
    const file = csv([
      ['Manufacturer', 'Model'],
      ['Acme', 'X100']
    ])

    await expect(importDevicesFromCsv(home.id, file)).rejects.toBeInstanceOf(BadRequestError)
  })

  it('matches header aliases regardless of casing and spacing', async () => {
    const home = await createHome({ name: 'Beach House' })
    const file = csv([
      ['device name', 'DEVICE TYPE', 'protocol', 'brand'],
      ['Aliased Device', 'Sensor', 'Zigbee', 'Acme']
    ])

    const summary = await importDevicesFromCsv(home.id, file)

    expect(summary.created).toBe(1)
    expect(summary.results[0]?.device?.manufacturer).toBe('Acme')
  })

  it('throws NotFoundError for a home that does not exist', async () => {
    const file = csv([
      ['Name', 'Type', 'Protocol'],
      ['Device', 'Sensor', 'Zigbee']
    ])
    await expect(
      importDevicesFromCsv('11111111-1111-4111-8111-111111111111', file)
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
