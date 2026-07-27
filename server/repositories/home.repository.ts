import { and, count, eq } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { devices, floors, homes, rooms } from '../db/schema'
import type { Home, NewHome } from '../db/schema'

export async function listHomes(db: DbClient): Promise<Home[]> {
  return db.select().from(homes).orderBy(homes.name)
}

export async function listHomeSummaries(db: DbClient) {
  const homeRows = await listHomes(db)

  const [floorCounts, roomCounts, deviceCounts] = await Promise.all([
    db.select({ homeId: floors.homeId, total: count() }).from(floors).groupBy(floors.homeId),
    db.select({ homeId: rooms.homeId, total: count() }).from(rooms).groupBy(rooms.homeId),
    db.select({ homeId: devices.homeId, total: count() }).from(devices).groupBy(devices.homeId)
  ])

  const floorMap = new Map(floorCounts.map((row) => [row.homeId, row.total]))
  const roomMap = new Map(roomCounts.map((row) => [row.homeId, row.total]))
  const deviceMap = new Map(deviceCounts.map((row) => [row.homeId, row.total]))

  return homeRows.map((home) => ({
    ...home,
    floorCount: floorMap.get(home.id) ?? 0,
    roomCount: roomMap.get(home.id) ?? 0,
    deviceCount: deviceMap.get(home.id) ?? 0
  }))
}

export async function findHomeById(db: DbClient, homeId: string): Promise<Home | undefined> {
  const [home] = await db.select().from(homes).where(eq(homes.id, homeId)).limit(1)
  return home
}

export async function insertHome(db: DbClient, input: NewHome): Promise<Home> {
  const [home] = await db.insert(homes).values(input).returning()
  return home!
}

export async function updateHomeById(
  db: DbClient,
  homeId: string,
  values: Partial<NewHome>,
  expectedVersion: number
): Promise<Home | undefined> {
  const [home] = await db
    .update(homes)
    .set(values)
    .where(and(eq(homes.id, homeId), eq(homes.version, expectedVersion)))
    .returning()
  return home
}

export async function deleteHomeById(
  db: DbClient,
  homeId: string,
  expectedVersion: number
): Promise<boolean> {
  const deleted = await db
    .delete(homes)
    .where(and(eq(homes.id, homeId), eq(homes.version, expectedVersion)))
    .returning({ id: homes.id })
  return deleted.length === 1
}

export async function countHomeDescendants(db: DbClient, homeId: string) {
  const [[floorRow], [roomRow], [deviceRow]] = await Promise.all([
    db.select({ total: count() }).from(floors).where(eq(floors.homeId, homeId)),
    db.select({ total: count() }).from(rooms).where(eq(rooms.homeId, homeId)),
    db.select({ total: count() }).from(devices).where(eq(devices.homeId, homeId))
  ])
  return {
    floors: floorRow?.total ?? 0,
    rooms: roomRow?.total ?? 0,
    devices: deviceRow?.total ?? 0
  }
}
