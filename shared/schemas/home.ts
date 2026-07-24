import { z } from 'zod'
import { nameSchema, versionSchema } from './common'

export const createHomeSchema = z.object({
  name: nameSchema
})

export const updateHomeSchema = z.object({
  name: nameSchema,
  version: versionSchema
})

export const deleteHomeSchema = z.object({
  name: nameSchema,
  version: versionSchema
})

export type CreateHomeInput = z.infer<typeof createHomeSchema>
export type UpdateHomeInput = z.infer<typeof updateHomeSchema>
export type DeleteHomeInput = z.infer<typeof deleteHomeSchema>
