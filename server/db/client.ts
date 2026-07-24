import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as dbSchema from './schema'

let queryClient: ReturnType<typeof postgres> | undefined
let db: ReturnType<typeof drizzle<typeof dbSchema>> | undefined

export function useDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    queryClient = postgres(connectionString)
    db = drizzle(queryClient, { schema: dbSchema })
  }
  return db
}

export type Database = ReturnType<typeof useDb>

/**
 * Structural type shared by `Database` and the `tx` object passed into
 * `db.transaction(async (tx) => ...)`. Repository functions accept this so
 * services can pass either a plain db handle or an in-flight transaction.
 */
export type DbClient = PgDatabase<PgQueryResultHKT, typeof dbSchema>

export * as schema from './schema'
