import { useDb } from '../db/client'
import type { CreateRoomInput, ReorderRoomsInput, UpdateRoomInput } from '../../shared/schemas/room'
import { ConflictError, DuplicateNameError, NotFoundError, ValidationError } from '../utils/errors'
import {
  deleteRoomById,
  findRoomByNameOnFloor,
  findRoomById,
  insertRoom,
  listRoomsByFloor,
  listRoomsByHome,
  nextRoomPosition,
  setRoomPosition,
  updateRoomById
} from '../repositories/room.repository'
import { countDevicesByRoomIds, unlinkDevicesByRoomIds } from '../repositories/device.repository'
import { getFloorOrThrow } from './floor.service'
import { getHomeOrThrow } from './home.service'
import { toRoomDto } from './mappers'

export async function listRoomsForHome(homeId: string) {
  const db = useDb()
  await getHomeOrThrow(homeId)
  const rooms = await listRoomsByHome(db, homeId)
  return rooms.map(toRoomDto)
}

export async function listRoomsForFloor(floorId: string) {
  const db = useDb()
  await getFloorOrThrow(floorId)
  const rooms = await listRoomsByFloor(db, floorId)
  return rooms.map(toRoomDto)
}

export async function getRoomOrThrow(roomId: string) {
  const db = useDb()
  const room = await findRoomById(db, roomId)
  if (!room) {
    throw new NotFoundError('Room')
  }
  return room
}

export async function createRoom(floorId: string, input: CreateRoomInput) {
  const db = useDb()
  const floor = await getFloorOrThrow(floorId)

  const duplicate = await findRoomByNameOnFloor(db, floorId, input.name)
  if (duplicate) {
    throw new DuplicateNameError('A room with this name already exists on this floor.')
  }

  const position = await nextRoomPosition(db, floorId)
  const room = await insertRoom(db, {
    floorId,
    homeId: floor.homeId,
    name: input.name,
    position
  })
  return toRoomDto(room)
}

export async function updateRoom(roomId: string, input: UpdateRoomInput) {
  const db = useDb()
  const existing = await getRoomOrThrow(roomId)

  if (existing.version !== input.version) {
    throw new ConflictError()
  }

  const duplicate = await findRoomByNameOnFloor(db, existing.floorId, input.name, roomId)
  if (duplicate) {
    throw new DuplicateNameError('A room with this name already exists on this floor.')
  }

  const updated = await updateRoomById(db, roomId, {
    name: input.name,
    version: existing.version + 1,
    updatedAt: new Date()
  })
  if (!updated) {
    throw new NotFoundError('Room')
  }
  return toRoomDto(updated)
}

export async function getRoomDeletionImpact(roomId: string) {
  const db = useDb()
  const room = await getRoomOrThrow(roomId)
  const deviceCount = await countDevicesByRoomIds(db, [roomId])
  return { room: toRoomDto(room), deviceCount }
}

export async function deleteRoom(roomId: string, version: number) {
  const db = useDb()
  const room = await getRoomOrThrow(roomId)
  if (room.version !== version) {
    throw new ConflictError()
  }

  await db.transaction(async (tx) => {
    await unlinkDevicesByRoomIds(tx, [roomId])
    await deleteRoomById(tx, roomId)
  })
}

export async function reorderRooms(floorId: string, input: ReorderRoomsInput) {
  const db = useDb()
  await getFloorOrThrow(floorId)

  const existingRooms = await listRoomsByFloor(db, floorId)
  const existingIds = new Set(existingRooms.map((room) => room.id))

  if (
    input.roomIds.length !== existingRooms.length ||
    !input.roomIds.every((id) => existingIds.has(id))
  ) {
    throw new ValidationError({ roomIds: ['The room list must include every room on this floor exactly once.'] })
  }

  await db.transaction(async (tx) => {
    await Promise.all(input.roomIds.map((roomId, index) => setRoomPosition(tx, roomId, index)))
  })

  const updated = await listRoomsByFloor(db, floorId)
  return updated.map(toRoomDto)
}
