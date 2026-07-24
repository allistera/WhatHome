import { z } from 'zod'
import { uuidSchema, versionSchema } from './common'

export const deviceLocationStates = ['unassigned', 'in_storage', 'in_room'] as const
export type DeviceLocationState = (typeof deviceLocationStates)[number]

function normalizeNullable<T>(value: T | null | undefined): T | null {
  return value ?? null
}

function optionalTrimmedString(max: number, message: string) {
  return z
    .string()
    .nullish()
    .transform((value) => {
      if (value === null || value === undefined) return null
      const trimmed = value.trim()
      return trimmed === '' ? null : trimmed
    })
    .refine((value) => value === null || value.length <= max, { message })
    .optional()
}

const ipAddressSchema = z
  .string()
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined) return null
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  })
  .refine(
    (value) =>
      value === null ||
      z.ipv4().safeParse(value).success ||
      z.ipv6().safeParse(value).success,
    { message: 'Enter a valid IPv4 or IPv6 address.' }
  )
  .optional()

const purchaseDateSchema = z
  .string()
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined) return null
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  })
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Enter a valid date in YYYY-MM-DD format.'
  })
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
    message: 'Enter a valid date.'
  })
  .optional()

const optionalRoomIdSchema = uuidSchema.nullish()

const deviceBaseShape = {
  name: z.string().trim().min(1, 'Name is required.').max(160, 'Name must be 160 characters or fewer.'),
  type: z.string().trim().min(1, 'Type is required.').max(80, 'Type must be 80 characters or fewer.'),
  protocol: z
    .string()
    .trim()
    .min(1, 'Protocol is required.')
    .max(80, 'Protocol must be 80 characters or fewer.'),
  manufacturer: optionalTrimmedString(120, 'Manufacturer must be 120 characters or fewer.'),
  model: optionalTrimmedString(120, 'Model must be 120 characters or fewer.'),
  serialNumber: optionalTrimmedString(160, 'Serial number must be 160 characters or fewer.'),
  ipAddress: ipAddressSchema,
  notes: optionalTrimmedString(5000, 'Notes must be 5,000 characters or fewer.'),
  purchaseDate: purchaseDateSchema,
  locationState: z.enum(deviceLocationStates),
  roomId: optionalRoomIdSchema
}

function withLocationRefinement<Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) {
  return schema
    .transform((data) => ({
      ...data,
      manufacturer: normalizeNullable((data as { manufacturer?: string | null }).manufacturer),
      model: normalizeNullable((data as { model?: string | null }).model),
      serialNumber: normalizeNullable((data as { serialNumber?: string | null }).serialNumber),
      ipAddress: normalizeNullable((data as { ipAddress?: string | null }).ipAddress),
      notes: normalizeNullable((data as { notes?: string | null }).notes),
      purchaseDate: normalizeNullable((data as { purchaseDate?: string | null }).purchaseDate),
      roomId: normalizeNullable((data as { roomId?: string | null }).roomId)
    }))
    .superRefine((data, ctx) => {
      const typed = data as unknown as { locationState: DeviceLocationState; roomId: string | null }
      const locationState = typed.locationState
      const roomId = typed.roomId
      if (locationState === 'in_room' && !roomId) {
        ctx.addIssue({ code: 'custom', message: 'Select a room.', path: ['roomId'] })
      }
      if (locationState !== 'in_room' && roomId) {
        ctx.addIssue({
          code: 'custom',
          message: 'Room must be empty unless location is In Room.',
          path: ['roomId']
        })
      }
    })
}

export const createDeviceSchema = withLocationRefinement(z.object(deviceBaseShape))

export const updateDeviceSchema = withLocationRefinement(
  z.object({ ...deviceBaseShape, version: versionSchema })
)

export const deviceSortFields = ['name', 'purchaseDate', 'manufacturer', 'type', 'updatedAt'] as const
export type DeviceSortField = (typeof deviceSortFields)[number]

export const deviceListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  floorId: uuidSchema.optional(),
  roomId: uuidSchema.optional(),
  locationState: z.enum(deviceLocationStates).optional(),
  type: z.string().trim().max(80).optional(),
  protocol: z.string().trim().max(80).optional(),
  manufacturer: z.string().trim().max(120).optional(),
  sort: z.enum(deviceSortFields).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
})

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>
export type DeviceListQuery = z.infer<typeof deviceListQuerySchema>
