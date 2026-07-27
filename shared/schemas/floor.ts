import { z } from 'zod'
import { nameSchema, uuidSchema, versionSchema } from './common'

export const createFloorSchema = z.object({
  name: nameSchema
})

export const updateFloorSchema = z.object({
  name: nameSchema,
  version: versionSchema
})

export const reorderFloorsSchema = z.object({
  floorIds: z
    .array(uuidSchema)
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Each floor must appear exactly once.'
    })
})

export type CreateFloorInput = z.infer<typeof createFloorSchema>
export type UpdateFloorInput = z.infer<typeof updateFloorSchema>
export type ReorderFloorsInput = z.infer<typeof reorderFloorsSchema>
