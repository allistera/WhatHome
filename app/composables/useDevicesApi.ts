import type { CreateDeviceInput, DeviceListQuery, UpdateDeviceInput } from '../../shared/schemas/device'
import type { DeviceDto } from '../../shared/types/domain'
import { apiDelete, apiGet, apiGetList, apiPatch, apiPost } from './useApiClient'

export function useDevicesApi() {
  return {
    list: (homeId: string, query: Partial<DeviceListQuery>) =>
      apiGetList<DeviceDto>(`/api/homes/${homeId}/devices`, query),
    get: async (deviceId: string) => (await apiGet<DeviceDto>(`/api/devices/${deviceId}`)).data,
    create: async (homeId: string, input: CreateDeviceInput) =>
      (await apiPost<DeviceDto>(`/api/homes/${homeId}/devices`, input)).data,
    update: async (deviceId: string, input: UpdateDeviceInput) =>
      (await apiPatch<DeviceDto>(`/api/devices/${deviceId}`, input)).data,
    remove: async (deviceId: string, version: number) => apiDelete(`/api/devices/${deviceId}`, { version }),
    suggestions: {
      types: async (homeId: string) =>
        (await apiGet<string[]>(`/api/homes/${homeId}/device-suggestions/types`)).data,
      protocols: async (homeId: string) =>
        (await apiGet<string[]>(`/api/homes/${homeId}/device-suggestions/protocols`)).data,
      manufacturers: async (homeId: string) =>
        (await apiGet<string[]>(`/api/homes/${homeId}/device-suggestions/manufacturers`)).data
    }
  }
}
