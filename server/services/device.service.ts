import { useDb } from '../db/client'
import type {
  CreateDeviceInput,
  DeviceListQuery,
  UpdateDeviceInput
} from '../../shared/schemas/device'
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors'
import {
  countDeviceLocationBreakdown,
  deleteDeviceById,
  findDeviceById,
  insertDevice,
  listDevices as listDevicesFromDb,
  listDistinctDeviceValues,
  listRecentDeviceChanges,
  updateDeviceById
} from '../repositories/device.repository'
import { findRoomById } from '../repositories/room.repository'
import { getHomeOrThrow } from './home.service'
import { toDeviceDto } from './mappers'

async function assertRoomBelongsToHome(homeId: string, roomId: string) {
  const db = useDb()
  const room = await findRoomById(db, roomId)
  if (!room || room.homeId !== homeId) {
    throw new ValidationError({ roomId: ['Select a room that belongs to this home.'] })
  }
}

function toColumns(input: CreateDeviceInput | UpdateDeviceInput) {
  return {
    name: input.name,
    type: input.type,
    protocol: input.protocol,
    manufacturer: input.manufacturer,
    model: input.model,
    serialNumber: input.serialNumber,
    ipAddress: input.ipAddress,
    notes: input.notes,
    purchaseDate: input.purchaseDate,
    roomId: input.locationState === 'in_room' ? input.roomId : null,
    inStorage: input.locationState === 'in_storage'
  }
}

export async function listDevices(homeId: string, query: DeviceListQuery) {
  await getHomeOrThrow(homeId)
  const db = useDb()
  const { rows, total } = await listDevicesFromDb(db, homeId, query)
  return {
    devices: rows.map(toDeviceDto),
    page: { number: query.page, size: query.pageSize, totalItems: total }
  }
}

export async function getDeviceOrThrow(deviceId: string) {
  const db = useDb()
  const device = await findDeviceById(db, deviceId)
  if (!device) {
    throw new NotFoundError('Device')
  }
  return device
}

export async function createDevice(homeId: string, input: CreateDeviceInput) {
  await getHomeOrThrow(homeId)

  if (input.locationState === 'in_room' && input.roomId) {
    await assertRoomBelongsToHome(homeId, input.roomId)
  }

  const db = useDb()
  const device = await insertDevice(db, { homeId, ...toColumns(input) })
  return toDeviceDto(device)
}

export async function updateDevice(deviceId: string, input: UpdateDeviceInput) {
  const existing = await getDeviceOrThrow(deviceId)

  if (existing.version !== input.version) {
    throw new ConflictError()
  }

  if (input.locationState === 'in_room' && input.roomId) {
    await assertRoomBelongsToHome(existing.homeId, input.roomId)
  }

  const db = useDb()
  const updated = await updateDeviceById(
    db,
    deviceId,
    {
      ...toColumns(input),
      version: existing.version + 1,
      updatedAt: new Date()
    },
    input.version
  )
  if (!updated) {
    throw new ConflictError()
  }
  return toDeviceDto(updated)
}

export async function deleteDevice(deviceId: string, version: number) {
  const existing = await getDeviceOrThrow(deviceId)
  if (existing.version !== version) {
    throw new ConflictError()
  }
  const db = useDb()
  const deleted = await deleteDeviceById(db, deviceId, version)
  if (!deleted) {
    throw new ConflictError()
  }
}

export async function getHomeOverview(homeId: string) {
  await getHomeOrThrow(homeId)
  const db = useDb()
  const [breakdown, recent] = await Promise.all([
    countDeviceLocationBreakdown(db, homeId),
    listRecentDeviceChanges(db, homeId, 10)
  ])
  return {
    deviceCounts: {
      total: Number(breakdown.total),
      inRoom: Number(breakdown.inRoom),
      inStorage: Number(breakdown.inStorage),
      unassigned: Number(breakdown.unassigned)
    },
    recentChanges: recent.map(toDeviceDto)
  }
}

export async function getDeviceSuggestions(
  homeId: string,
  field: 'type' | 'protocol' | 'manufacturer'
) {
  await getHomeOrThrow(homeId)
  const db = useDb()
  return listDistinctDeviceValues(db, homeId, field)
}
