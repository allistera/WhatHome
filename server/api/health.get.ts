import { sql } from 'drizzle-orm'
import { defineEventHandler, setResponseStatus } from 'h3'
import { useDb } from '../db/client'

export default defineEventHandler(async (event) => {
  try {
    await useDb().execute(sql`select 1`)
    return { status: 'ok' }
  } catch (error) {
    console.error('Health check failed:', error)
    setResponseStatus(event, 503)
    return { status: 'error' }
  }
})
