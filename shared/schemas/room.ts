import { z } from 'zod'
import { nameSchema, uuidSchema, versionSchema } from './common'

export const createRoomSchema = z.object({
  name: nameSchema
})

export const updateRoomSchema = z.object({
  name: nameSchema,
  version: versionSchema
})

export const reorderRoomsSchema = z.object({
  roomIds: z.array(uuidSchema).min(1)
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>
export type ReorderRoomsInput = z.infer<typeof reorderRoomsSchema>
