import type { APIRequestContext } from '@playwright/test'

export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

interface HomeRecord {
  id: string
  name: string
  version: number
}

interface FloorRecord {
  id: string
  name: string
  version: number
}

interface RoomRecord {
  id: string
  name: string
  version: number
}

interface DeviceRecord {
  id: string
  name: string
  version: number
  locationState: string
  roomId: string | null
}

export async function apiCreateHome(request: APIRequestContext, name: string): Promise<HomeRecord> {
  const res = await request.post('/api/homes', { data: { name } })
  const body = await res.json()
  return body.data
}

export async function apiCreateFloor(
  request: APIRequestContext,
  homeId: string,
  name: string
): Promise<FloorRecord> {
  const res = await request.post(`/api/homes/${homeId}/floors`, { data: { name } })
  const body = await res.json()
  return body.data
}

export async function apiCreateRoom(
  request: APIRequestContext,
  floorId: string,
  name: string
): Promise<RoomRecord> {
  const res = await request.post(`/api/floors/${floorId}/rooms`, { data: { name } })
  const body = await res.json()
  return body.data
}

export async function apiCreateDevice(
  request: APIRequestContext,
  homeId: string,
  payload: Record<string, unknown>
): Promise<DeviceRecord> {
  const res = await request.post(`/api/homes/${homeId}/devices`, { data: payload })
  const body = await res.json()
  return body.data
}

export const baseDevicePayload = {
  type: 'Sensor',
  protocol: 'Zigbee',
  manufacturer: null,
  model: null,
  serialNumber: null,
  ipAddress: null,
  notes: null,
  purchaseDate: null,
  locationState: 'unassigned',
  roomId: null
}
