import type { DeviceLocationState } from '../schemas/device'

export interface HomeDto {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface HomeSummaryDto extends HomeDto {
  floorCount: number
  roomCount: number
  deviceCount: number
}

export interface FloorDto {
  id: string
  homeId: string
  name: string
  position: number
  createdAt: string
  updatedAt: string
  version: number
}

export interface RoomDto {
  id: string
  floorId: string
  homeId: string
  name: string
  position: number
  createdAt: string
  updatedAt: string
  version: number
}

export interface DeviceDto {
  id: string
  homeId: string
  roomId: string | null
  inStorage: boolean
  locationState: DeviceLocationState
  name: string
  type: string
  protocol: string
  manufacturer: string | null
  model: string | null
  serialNumber: string | null
  ipAddress: string | null
  notes: string | null
  purchaseDate: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export interface HomeOverviewDto {
  home: HomeDto
  deviceCounts: {
    total: number
    inRoom: number
    inStorage: number
    unassigned: number
  }
  recentChanges: DeviceDto[]
}

export interface FloorWithRooms extends FloorDto {
  rooms: RoomDto[]
}

export interface DeviceImportRowResult {
  row: number
  status: 'created' | 'error'
  device?: DeviceDto
  error?: string
  fieldErrors?: Record<string, string[]>
}

export interface DeviceImportSummary {
  totalRows: number
  created: number
  failed: number
  results: DeviceImportRowResult[]
}

export type { DeviceLocationState }
