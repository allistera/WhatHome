import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const migrationClient = postgres(connectionString, { max: 1 })
  const db = drizzle(migrationClient)

  console.log('Applying database migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Database migrations applied successfully.')

  await migrationClient.end()
}

runMigrations().catch((error) => {
  console.error('Failed to apply database migrations:')
  console.error(error)
  process.exit(1)
})
