import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

/**
 * Runs once before the e2e suite. Each test creates its own home(s) with
 * unique names and never deletes them, so without a reset here, homes pile
 * up across repeated runs against the same database — including in the
 * sidebar's global home list, which can then collide with loose text
 * assertions in unrelated tests.
 */
export default async function globalSetup() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)
  try {
    await db.execute(sql`TRUNCATE TABLE homes RESTART IDENTITY CASCADE`)
  } catch (error) {
    // Undefined table: migrations for a brand-new database haven't run yet
    // (they run as part of the webServer start command). Nothing to reset.
    if ((error as { code?: string }).code !== '42P01') {
      throw error
    }
  } finally {
    await client.end()
  }
}
