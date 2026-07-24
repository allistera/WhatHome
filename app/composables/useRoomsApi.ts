import type { CreateRoomInput, ReorderRoomsInput, UpdateRoomInput } from '../../shared/schemas/room'
import type { RoomDto } from '../../shared/types/domain'
import { apiDelete, apiGet, apiPatch, apiPost } from './useApiClient'

interface RoomDeletionImpact {
  room: RoomDto
  deviceCount: number
}

export function useRoomsApi() {
  return {
    listForHome: async (homeId: string) => (await apiGet<RoomDto[]>(`/api/homes/${homeId}/rooms`)).data,
    create: async (floorId: string, input: CreateRoomInput) =>
      (await apiPost<RoomDto>(`/api/floors/${floorId}/rooms`, input)).data,
    update: async (roomId: string, input: UpdateRoomInput) =>
      (await apiPatch<RoomDto>(`/api/rooms/${roomId}`, input)).data,
    deletionImpact: async (roomId: string) =>
      (await apiGet<RoomDeletionImpact>(`/api/rooms/${roomId}/deletion-impact`)).data,
    remove: async (roomId: string, version: number) => apiDelete(`/api/rooms/${roomId}`, { version }),
    reorder: async (floorId: string, input: ReorderRoomsInput) =>
      (await apiPost<RoomDto[]>(`/api/floors/${floorId}/rooms/reorder`, input)).data
  }
}
