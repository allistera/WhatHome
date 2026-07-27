import { and, eq, inArray, sql } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { rooms } from '../db/schema'
import type { NewRoom, Room } from '../db/schema'

export async function listRoomsByFloor(db: DbClient, floorId: string): Promise<Room[]> {
  return db.select().from(rooms).where(eq(rooms.floorId, floorId)).orderBy(rooms.position)
}

export async function listRoomsByHome(db: DbClient, homeId: string): Promise<Room[]> {
  return db.select().from(rooms).where(eq(rooms.homeId, homeId)).orderBy(rooms.position)
}

export async function listRoomsByFloorIds(db: DbClient, floorIds: string[]): Promise<Room[]> {
  if (floorIds.length === 0) return []
  return db.select().from(rooms).where(inArray(rooms.floorId, floorIds)).orderBy(rooms.position)
}

export async function findRoomById(db: DbClient, roomId: string): Promise<Room | undefined> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1)
  return room
}

export async function findRoomByNameOnFloor(
  db: DbClient,
  floorId: string,
  name: string,
  excludeRoomId?: string
): Promise<Room | undefined> {
  const conditions = [eq(rooms.floorId, floorId), sql`lower(${rooms.name}) = lower(${name})`]
  if (excludeRoomId) {
    conditions.push(sql`${rooms.id} != ${excludeRoomId}`)
  }
  const [room] = await db
    .select()
    .from(rooms)
    .where(and(...conditions))
    .limit(1)
  return room
}

export async function nextRoomPosition(db: DbClient, floorId: string): Promise<number> {
  const [row] = await db
    .select({ maxPosition: sql<number | null>`max(${rooms.position})` })
    .from(rooms)
    .where(eq(rooms.floorId, floorId))
  return (row?.maxPosition ?? -1) + 1
}

export async function insertRoom(db: DbClient, input: NewRoom): Promise<Room> {
  const [room] = await db.insert(rooms).values(input).returning()
  return room!
}

export async function updateRoomById(
  db: DbClient,
  roomId: string,
  values: Partial<NewRoom>,
  expectedVersion: number
): Promise<Room | undefined> {
  const [room] = await db
    .update(rooms)
    .set(values)
    .where(and(eq(rooms.id, roomId), eq(rooms.version, expectedVersion)))
    .returning()
  return room
}

export async function deleteRoomById(
  db: DbClient,
  roomId: string,
  expectedVersion: number
): Promise<boolean> {
  const deleted = await db
    .delete(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.version, expectedVersion)))
    .returning({ id: rooms.id })
  return deleted.length === 1
}

export async function setRoomPosition(db: DbClient, roomId: string, position: number): Promise<void> {
  await db.update(rooms).set({ position }).where(eq(rooms.id, roomId))
}
