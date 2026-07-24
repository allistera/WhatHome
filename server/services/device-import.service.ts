import Papa from 'papaparse'
import { createDeviceSchema } from '../../shared/schemas/device'
import {
  isTruthyImportFlag,
  matchDeviceImportColumn,
  type DeviceImportColumnKey,
  type RawDeviceImportRow
} from '../../shared/schemas/device-import'
import type { DeviceImportRowResult, DeviceImportSummary } from '../../shared/types/domain'
import { useDb } from '../db/client'
import { findFloorByNameInHome } from '../repositories/floor.repository'
import { findRoomByNameOnFloor } from '../repositories/room.repository'
import { BadRequestError } from '../utils/errors'
import { createDevice } from './device.service'
import { getHomeOrThrow } from './home.service'

const MAX_IMPORT_ROWS = 1000
const REQUIRED_COLUMN_KEYS: DeviceImportColumnKey[] = ['name', 'type', 'protocol']

class RowValidationError extends Error {}

async function resolveRoomId(homeId: string, floorName?: string, roomName?: string, inStorage?: boolean) {
  if (!floorName && !roomName) {
    return null
  }
  if (!floorName || !roomName) {
    throw new RowValidationError(
      'Provide both Floor and Room to place the device in a room, or leave both blank.'
    )
  }
  if (inStorage) {
    throw new RowValidationError(
      'A device cannot be both in a room and in storage. Leave "In Storage" blank when Floor and Room are set.'
    )
  }

  const db = useDb()
  const floor = await findFloorByNameInHome(db, homeId, floorName)
  if (!floor) {
    throw new RowValidationError(`Floor "${floorName}" was not found in this home.`)
  }
  const room = await findRoomByNameOnFloor(db, floor.id, roomName)
  if (!room) {
    throw new RowValidationError(`Room "${roomName}" was not found on floor "${floorName}".`)
  }
  return room.id
}

function extractRow(rawRecord: Record<string, string>, headerMap: Map<string, DeviceImportColumnKey>) {
  const row: RawDeviceImportRow = {}
  for (const [field, value] of Object.entries(rawRecord)) {
    const key = headerMap.get(field)
    if (key && typeof value === 'string' && value.trim() !== '') {
      row[key] = value.trim()
    }
  }
  return row
}

export async function importDevicesFromCsv(homeId: string, csvText: string): Promise<DeviceImportSummary> {
  await getHomeOrThrow(homeId)

  const parsed = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true
  })

  const fields = parsed.meta.fields ?? []
  if (fields.length === 0) {
    throw new BadRequestError('The CSV file could not be read, or has no header row.')
  }

  const headerMap = new Map<string, DeviceImportColumnKey>()
  for (const field of fields) {
    const matched = matchDeviceImportColumn(field)
    if (matched) headerMap.set(field, matched)
  }

  const foundKeys = new Set(headerMap.values())
  const missingRequired = REQUIRED_COLUMN_KEYS.filter((key) => !foundKeys.has(key))
  if (missingRequired.length > 0) {
    throw new BadRequestError(
      `The CSV file is missing required column(s): ${missingRequired.join(', ')}. Download the template for the exact column names.`
    )
  }

  if (parsed.data.length === 0) {
    throw new BadRequestError('The CSV file has no data rows.')
  }
  if (parsed.data.length > MAX_IMPORT_ROWS) {
    throw new BadRequestError(`The CSV file has too many rows (maximum ${MAX_IMPORT_ROWS}).`)
  }

  const results: DeviceImportRowResult[] = []

  for (const [index, rawRecord] of parsed.data.entries()) {
    const rowNumber = index + 2 // account for the header row
    const row = extractRow(rawRecord, headerMap)

    try {
      const inStorage = isTruthyImportFlag(row.inStorage)
      const roomId = await resolveRoomId(homeId, row.floor, row.room, inStorage)
      const locationState = roomId ? 'in_room' : inStorage ? 'in_storage' : 'unassigned'

      const candidate = createDeviceSchema.safeParse({
        name: row.name ?? '',
        type: row.type ?? '',
        protocol: row.protocol ?? '',
        manufacturer: row.manufacturer ?? null,
        model: row.model ?? null,
        serialNumber: row.serialNumber ?? null,
        ipAddress: row.ipAddress ?? null,
        notes: row.notes ?? null,
        purchaseDate: row.purchaseDate ?? null,
        locationState,
        roomId
      })

      if (!candidate.success) {
        const fieldErrors: Record<string, string[]> = {}
        for (const issue of candidate.error.issues) {
          const key = issue.path.length > 0 ? issue.path.join('.') : '_'
          fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message]
        }
        results.push({
          row: rowNumber,
          status: 'error',
          error: 'The submitted data is invalid.',
          fieldErrors
        })
        continue
      }

      const device = await createDevice(homeId, candidate.data)
      results.push({ row: rowNumber, status: 'created', device })
    } catch (error) {
      if (error instanceof RowValidationError) {
        results.push({ row: rowNumber, status: 'error', error: error.message })
      } else {
        console.error(`Unexpected error importing CSV row ${rowNumber}:`, error)
        results.push({ row: rowNumber, status: 'error', error: 'Unexpected error while importing this row.' })
      }
    }
  }

  return {
    totalRows: results.length,
    created: results.filter((result) => result.status === 'created').length,
    failed: results.filter((result) => result.status === 'error').length,
    results
  }
}
