import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ensureMigrated, resetDb, TEST_DATABASE_URL } from './helpers/db'
import * as schema from '../../server/db/schema'
import { createHome } from '../../server/services/home.service'

beforeAll(async () => {
  await ensureMigrated()
})

beforeEach(async () => {
  await resetDb()
})

describe('data persistence across a simulated application restart', () => {
  it('is readable from a brand new database connection after the original connection closes', async () => {
    const home = await createHome({ name: 'Beach House' })

    // Simulate the application process restarting: open a fresh connection
    // pool independent of the one the service layer used to write the data.
    const freshClient = postgres(TEST_DATABASE_URL, { max: 1 })
    const freshDb = drizzle(freshClient, { schema })

    try {
      const [row] = await freshDb.select().from(schema.homes).where(eq(schema.homes.id, home.id)).limit(1)
      expect(row).toBeDefined()
      expect(row?.name).toBe('Beach House')
    } finally {
      await freshClient.end()
    }
  })
})
