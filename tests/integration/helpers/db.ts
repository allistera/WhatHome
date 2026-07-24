import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../../../server/db/schema'

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/whathome_test'

process.env.DATABASE_URL = TEST_DATABASE_URL

let client: ReturnType<typeof postgres> | undefined
let db: ReturnType<typeof drizzle<typeof schema>> | undefined
let migrated = false

export function getTestDb() {
  if (!db) {
    client = postgres(TEST_DATABASE_URL, { max: 5 })
    db = drizzle(client, { schema })
  }
  return db
}

export async function ensureMigrated() {
  if (migrated) return
  const migrationClient = postgres(TEST_DATABASE_URL, { max: 1 })
  await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' })
  await migrationClient.end()
  migrated = true
}

export async function resetDb() {
  const database = getTestDb()
  await database.execute(sql`TRUNCATE TABLE homes RESTART IDENTITY CASCADE`)
}
