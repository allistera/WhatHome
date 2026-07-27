import { and, asc, count, desc, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { devices, rooms } from '../db/schema'
import type { Device, NewDevice } from '../db/schema'
import type { DeviceListQuery } from '../../shared/schemas/device'

export async function findDeviceById(db: DbClient, deviceId: string): Promise<Device | undefined> {
  const [device] = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1)
  return device
}

export async function insertDevice(db: DbClient, input: NewDevice): Promise<Device> {
  const [device] = await db.insert(devices).values(input).returning()
  return device!
}

export async function updateDeviceById(
  db: DbClient,
  deviceId: string,
  values: Partial<NewDevice>,
  expectedVersion: number
): Promise<Device | undefined> {
  const [device] = await db
    .update(devices)
    .set(values)
    .where(and(eq(devices.id, deviceId), eq(devices.version, expectedVersion)))
    .returning()
  return device
}

export async function deleteDeviceById(
  db: DbClient,
  deviceId: string,
  expectedVersion: number
): Promise<boolean> {
  const deleted = await db
    .delete(devices)
    .where(and(eq(devices.id, deviceId), eq(devices.version, expectedVersion)))
    .returning({ id: devices.id })
  return deleted.length === 1
}

export async function unlinkDevicesByRoomIds(db: DbClient, roomIds: string[]): Promise<void> {
  if (roomIds.length === 0) return
  await db
    .update(devices)
    .set({ roomId: null, updatedAt: new Date() })
    .where(inArray(devices.roomId, roomIds))
}

export async function countDevicesByRoomIds(db: DbClient, roomIds: string[]): Promise<number> {
  if (roomIds.length === 0) return 0
  const [row] = await db.select({ total: count() }).from(devices).where(inArray(devices.roomId, roomIds))
  return row?.total ?? 0
}

export async function countDeviceLocationBreakdown(db: DbClient, homeId: string) {
  const rows = await db
    .select({
      inRoom: sql<number>`count(*) filter (where ${devices.roomId} is not null)`,
      inStorage: sql<number>`count(*) filter (where ${devices.roomId} is null and ${devices.inStorage} = true)`,
      unassigned: sql<number>`count(*) filter (where ${devices.roomId} is null and ${devices.inStorage} = false)`,
      total: count()
    })
    .from(devices)
    .where(eq(devices.homeId, homeId))
  return (
    rows[0] ?? {
      inRoom: 0,
      inStorage: 0,
      unassigned: 0,
      total: 0
    }
  )
}

export async function listRecentDeviceChanges(db: DbClient, homeId: string, limit: number): Promise<Device[]> {
  return db
    .select()
    .from(devices)
    .where(eq(devices.homeId, homeId))
    .orderBy(desc(devices.updatedAt))
    .limit(limit)
}

export async function listDistinctDeviceValues(
  db: DbClient,
  homeId: string,
  column: 'type' | 'protocol' | 'manufacturer'
): Promise<string[]> {
  const columnRef = devices[column]
  const rows = await db
    .selectDistinct({ value: columnRef })
    .from(devices)
    .where(and(eq(devices.homeId, homeId), sql`${columnRef} is not null and ${columnRef} != ''`))
    .orderBy(asc(columnRef))
  return rows.map((row) => row.value as string).filter((value): value is string => Boolean(value))
}

const sortColumnMap = {
  name: devices.name,
  purchaseDate: devices.purchaseDate,
  manufacturer: devices.manufacturer,
  type: devices.type,
  updatedAt: devices.updatedAt
} as const

export async function listDevices(db: DbClient, homeId: string, query: DeviceListQuery) {
  const conditions: SQL[] = [eq(devices.homeId, homeId)]

  if (query.roomId) {
    conditions.push(eq(devices.roomId, query.roomId))
  }

  if (query.floorId) {
    conditions.push(
      sql`${devices.roomId} in (select ${rooms.id} from ${rooms} where ${rooms.floorId} = ${query.floorId})`
    )
  }

  if (query.locationState === 'unassigned') {
    conditions.push(and(isNull(devices.roomId), eq(devices.inStorage, false))!)
  } else if (query.locationState === 'in_storage') {
    conditions.push(and(isNull(devices.roomId), eq(devices.inStorage, true))!)
  } else if (query.locationState === 'in_room') {
    conditions.push(sql`${devices.roomId} is not null`)
  }

  if (query.type) {
    conditions.push(sql`lower(${devices.type}) = lower(${query.type})`)
  }

  if (query.protocol) {
    conditions.push(sql`lower(${devices.protocol}) = lower(${query.protocol})`)
  }

  if (query.manufacturer) {
    conditions.push(sql`lower(${devices.manufacturer}) = lower(${query.manufacturer})`)
  }

  if (query.search) {
    const pattern = `%${query.search.toLowerCase()}%`
    conditions.push(sql`(
      lower(${devices.name}) like ${pattern} or
      lower(coalesce(${devices.manufacturer}, '')) like ${pattern} or
      lower(coalesce(${devices.model}, '')) like ${pattern} or
      lower(coalesce(${devices.serialNumber}, '')) like ${pattern} or
      lower(coalesce(host(${devices.ipAddress}), '')) like ${pattern} or
      lower(${devices.type}) like ${pattern} or
      lower(${devices.protocol}) like ${pattern}
    )`)
  }

  const whereClause = and(...conditions)
  const sortColumn = sortColumnMap[query.sort]
  const orderFn = query.order === 'desc' ? desc : asc

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(devices)
      .where(whereClause)
      .orderBy(orderFn(sortColumn), asc(devices.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(devices).where(whereClause)
  ])

  return { rows, total: totalRows[0]?.total ?? 0 }
}
