import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  inet,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'

export const homes = pgTable('homes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1)
})

export const floors = pgTable(
  'floors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    homeId: uuid('home_id')
      .notNull()
      .references(() => homes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    version: integer('version').notNull().default(1)
  },
  (table) => [
    uniqueIndex('floors_home_id_name_lower_idx').on(table.homeId, sql`lower(${table.name})`),
    index('floors_home_id_idx').on(table.homeId)
  ]
)

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    floorId: uuid('floor_id')
      .notNull()
      .references(() => floors.id, { onDelete: 'cascade' }),
    homeId: uuid('home_id')
      .notNull()
      .references(() => homes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    version: integer('version').notNull().default(1)
  },
  (table) => [
    uniqueIndex('rooms_floor_id_name_lower_idx').on(table.floorId, sql`lower(${table.name})`),
    index('rooms_floor_id_idx').on(table.floorId),
    index('rooms_home_id_idx').on(table.homeId)
  ]
)

export const devices = pgTable(
  'devices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    homeId: uuid('home_id')
      .notNull()
      .references(() => homes.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    inStorage: boolean('in_storage').notNull().default(false),
    name: text('name').notNull(),
    type: text('type').notNull(),
    protocol: text('protocol').notNull(),
    manufacturer: text('manufacturer'),
    model: text('model'),
    serialNumber: text('serial_number'),
    ipAddress: inet('ip_address'),
    notes: text('notes'),
    purchaseDate: date('purchase_date', { mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    version: integer('version').notNull().default(1)
  },
  (table) => [
    index('devices_home_id_idx').on(table.homeId),
    index('devices_room_id_idx').on(table.roomId),
    check(
      'devices_location_state_check',
      sql`NOT (${table.roomId} IS NOT NULL AND ${table.inStorage} = true)`
    )
  ]
)

export type Home = typeof homes.$inferSelect
export type NewHome = typeof homes.$inferInsert
export type Floor = typeof floors.$inferSelect
export type NewFloor = typeof floors.$inferInsert
export type Room = typeof rooms.$inferSelect
export type NewRoom = typeof rooms.$inferInsert
export type Device = typeof devices.$inferSelect
export type NewDevice = typeof devices.$inferInsert
