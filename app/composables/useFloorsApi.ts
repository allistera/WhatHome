import type { CreateFloorInput, ReorderFloorsInput, UpdateFloorInput } from '../../shared/schemas/floor'
import type { FloorDto } from '../../shared/types/domain'
import { apiDelete, apiGet, apiPatch, apiPost } from './useApiClient'

interface FloorDeletionImpact {
  floor: FloorDto
  roomCount: number
  deviceCount: number
}

export function useFloorsApi() {
  return {
    list: async (homeId: string) => (await apiGet<FloorDto[]>(`/api/homes/${homeId}/floors`)).data,
    create: async (homeId: string, input: CreateFloorInput) =>
      (await apiPost<FloorDto>(`/api/homes/${homeId}/floors`, input)).data,
    update: async (floorId: string, input: UpdateFloorInput) =>
      (await apiPatch<FloorDto>(`/api/floors/${floorId}`, input)).data,
    deletionImpact: async (floorId: string) =>
      (await apiGet<FloorDeletionImpact>(`/api/floors/${floorId}/deletion-impact`)).data,
    remove: async (floorId: string, version: number) => apiDelete(`/api/floors/${floorId}`, { version }),
    reorder: async (homeId: string, input: ReorderFloorsInput) =>
      (await apiPost<FloorDto[]>(`/api/homes/${homeId}/floors/reorder`, input)).data
  }
}
