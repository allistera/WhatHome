import type { CreateHomeInput, DeleteHomeInput, UpdateHomeInput } from '../../shared/schemas/home'
import type { HomeDto, HomeOverviewDto, HomeSummaryDto } from '../../shared/types/domain'
import { apiDelete, apiGet, apiPatch, apiPost } from './useApiClient'

interface HomeDeletionImpact {
  home: HomeDto
  floors: number
  rooms: number
  devices: number
}

export function useHomesApi() {
  return {
    list: async () => (await apiGet<HomeSummaryDto[]>('/api/homes')).data,
    get: async (homeId: string) => (await apiGet<HomeDto>(`/api/homes/${homeId}`)).data,
    overview: async (homeId: string) =>
      (await apiGet<HomeOverviewDto>(`/api/homes/${homeId}/overview`)).data,
    create: async (input: CreateHomeInput) => (await apiPost<HomeDto>('/api/homes', input)).data,
    update: async (homeId: string, input: UpdateHomeInput) =>
      (await apiPatch<HomeDto>(`/api/homes/${homeId}`, input)).data,
    deletionImpact: async (homeId: string) =>
      (await apiGet<HomeDeletionImpact>(`/api/homes/${homeId}/deletion-impact`)).data,
    remove: async (homeId: string, input: DeleteHomeInput) =>
      apiDelete(`/api/homes/${homeId}`, input)
  }
}
