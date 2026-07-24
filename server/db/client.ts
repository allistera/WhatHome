import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { Pool as NeonPool } from '@neondatabase/serverless'
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless'
import { drizzle as postgresJsDrizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as dbSchema from './schema'

/**
 * Structural type shared across driver implementations and the `tx` object
 * passed into `db.transaction(async (tx) => ...)`. Repository functions
 * accept this so services work the same way regardless of which concrete
 * driver `useDb()` picked.
 */
export type DbClient = PgDatabase<PgQueryResultHKT, typeof dbSchema>

let db: DbClient | undefined

function isNeonConnectionString(url: string): boolean {
  return url.includes('neon.tech')
}

/**
 * Self-hosted deployments (Docker Compose) connect to a long-lived Postgres
 * instance over a plain TCP connection via `postgres-js`. Deployments on
 * Vercel with a Neon database instead go over Neon's WebSocket driver,
 * which is safe to open per-invocation in a serverless environment and
 * still supports real interactive transactions (unlike Neon's HTTP driver).
 * The driver is chosen automatically from the shape of `DATABASE_URL`, so
 * no separate configuration is needed for either target.
 */
export function useDb(): DbClient {
  if (!db) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    db = isNeonConnectionString(connectionString)
      ? neonDrizzle(new NeonPool({ connectionString }), { schema: dbSchema })
      : postgresJsDrizzle(postgres(connectionString), { schema: dbSchema })
  }
  return db
}

export * as schema from './schema'
