import { z } from 'zod'

export const uuidSchema = z.uuid()

export const versionSchema = z.coerce.number().int().min(1)

export const positionSchema = z.coerce.number().int().min(0)

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required.')
  .max(120, 'Name must be 120 characters or fewer.')

export const deleteWithVersionSchema = z.object({
  version: versionSchema
})

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
