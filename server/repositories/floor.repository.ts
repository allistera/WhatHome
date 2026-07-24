import { and, count, eq, sql } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { floors, rooms } from '../db/schema'
import type { Floor, NewFloor } from '../db/schema'

export async function listFloorsByHome(db: DbClient, homeId: string): Promise<Floor[]> {
  return db.select().from(floors).where(eq(floors.homeId, homeId)).orderBy(floors.position)
}

export async function findFloorById(db: DbClient, floorId: string): Promise<Floor | undefined> {
  const [floor] = await db.select().from(floors).where(eq(floors.id, floorId)).limit(1)
  return floor
}

export async function findFloorByNameInHome(
  db: DbClient,
  homeId: string,
  name: string,
  excludeFloorId?: string
): Promise<Floor | undefined> {
  const conditions = [eq(floors.homeId, homeId), sql`lower(${floors.name}) = lower(${name})`]
  if (excludeFloorId) {
    conditions.push(sql`${floors.id} != ${excludeFloorId}`)
  }
  const [floor] = await db
    .select()
    .from(floors)
    .where(and(...conditions))
    .limit(1)
  return floor
}

export async function nextFloorPosition(db: DbClient, homeId: string): Promise<number> {
  const [row] = await db
    .select({ maxPosition: sql<number | null>`max(${floors.position})` })
    .from(floors)
    .where(eq(floors.homeId, homeId))
  return (row?.maxPosition ?? -1) + 1
}

export async function insertFloor(db: DbClient, input: NewFloor): Promise<Floor> {
  const [floor] = await db.insert(floors).values(input).returning()
  return floor!
}

export async function updateFloorById(
  db: DbClient,
  floorId: string,
  values: Partial<NewFloor>
): Promise<Floor | undefined> {
  const [floor] = await db.update(floors).set(values).where(eq(floors.id, floorId)).returning()
  return floor
}

export async function deleteFloorById(db: DbClient, floorId: string): Promise<void> {
  await db.delete(floors).where(eq(floors.id, floorId))
}

export async function countRoomsOnFloor(db: DbClient, floorId: string): Promise<number> {
  const [row] = await db.select({ total: count() }).from(rooms).where(eq(rooms.floorId, floorId))
  return row?.total ?? 0
}

export async function setFloorPosition(
  db: DbClient,
  floorId: string,
  position: number
): Promise<void> {
  await db.update(floors).set({ position }).where(eq(floors.id, floorId))
}
