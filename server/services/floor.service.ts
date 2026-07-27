import { useDb } from '../db/client'
import type { CreateFloorInput, ReorderFloorsInput, UpdateFloorInput } from '../../shared/schemas/floor'
import { ConflictError, DuplicateNameError, NotFoundError, ValidationError } from '../utils/errors'
import {
  deleteFloorById,
  findFloorByNameInHome,
  findFloorById,
  insertFloor,
  listFloorsByHome,
  nextFloorPosition,
  setFloorPosition,
  updateFloorById
} from '../repositories/floor.repository'
import {
  countDevicesByRoomIds,
  unlinkDevicesByRoomIds
} from '../repositories/device.repository'
import { listRoomsByFloor } from '../repositories/room.repository'
import { getHomeOrThrow } from './home.service'
import { toFloorDto } from './mappers'

export async function listFloors(homeId: string) {
  const db = useDb()
  await getHomeOrThrow(homeId)
  const floors = await listFloorsByHome(db, homeId)
  return floors.map(toFloorDto)
}

export async function getFloorOrThrow(floorId: string) {
  const db = useDb()
  const floor = await findFloorById(db, floorId)
  if (!floor) {
    throw new NotFoundError('Floor')
  }
  return floor
}

export async function createFloor(homeId: string, input: CreateFloorInput) {
  const db = useDb()
  await getHomeOrThrow(homeId)

  const duplicate = await findFloorByNameInHome(db, homeId, input.name)
  if (duplicate) {
    throw new DuplicateNameError('A floor with this name already exists in this home.')
  }

  const position = await nextFloorPosition(db, homeId)
  const floor = await insertFloor(db, { homeId, name: input.name, position })
  return toFloorDto(floor)
}

export async function updateFloor(floorId: string, input: UpdateFloorInput) {
  const db = useDb()
  const existing = await getFloorOrThrow(floorId)

  if (existing.version !== input.version) {
    throw new ConflictError()
  }

  const duplicate = await findFloorByNameInHome(db, existing.homeId, input.name, floorId)
  if (duplicate) {
    throw new DuplicateNameError('A floor with this name already exists in this home.')
  }

  const updated = await updateFloorById(db, floorId, {
    name: input.name,
    version: existing.version + 1,
    updatedAt: new Date()
  }, input.version)
  if (!updated) {
    throw new ConflictError()
  }
  return toFloorDto(updated)
}

export async function getFloorDeletionImpact(floorId: string) {
  const db = useDb()
  const floor = await getFloorOrThrow(floorId)
  const rooms = await listRoomsByFloor(db, floorId)
  const roomIds = rooms.map((room) => room.id)
  const deviceCount = await countDevicesByRoomIds(db, roomIds)
  return { floor: toFloorDto(floor), roomCount: rooms.length, deviceCount }
}

export async function deleteFloor(floorId: string, version: number) {
  const db = useDb()
  const floor = await getFloorOrThrow(floorId)
  if (floor.version !== version) {
    throw new ConflictError()
  }

  await db.transaction(async (tx) => {
    const roomsOnFloor = await listRoomsByFloor(tx, floorId)
    const roomIds = roomsOnFloor.map((room) => room.id)
    await unlinkDevicesByRoomIds(tx, roomIds)
    const deleted = await deleteFloorById(tx, floorId, version)
    if (!deleted) {
      throw new ConflictError()
    }
  })
}

export async function reorderFloors(homeId: string, input: ReorderFloorsInput) {
  const db = useDb()
  await getHomeOrThrow(homeId)

  const existingFloors = await listFloorsByHome(db, homeId)
  const existingIds = new Set(existingFloors.map((floor) => floor.id))

  if (
    input.floorIds.length !== existingFloors.length ||
    new Set(input.floorIds).size !== input.floorIds.length ||
    !input.floorIds.every((id) => existingIds.has(id))
  ) {
    throw new ValidationError({ floorIds: ['The floor list must include every floor in this home exactly once.'] })
  }

  await db.transaction(async (tx) => {
    await Promise.all(input.floorIds.map((floorId, index) => setFloorPosition(tx, floorId, index)))
  })

  const updated = await listFloorsByHome(db, homeId)
  return updated.map(toFloorDto)
}
