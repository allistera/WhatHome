<script setup lang="ts">
import { FilterMatchMode } from '@primevue/core/api'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import type { DeviceLocationState, DeviceSortField } from '../../../../../shared/schemas/device'
import type { DeviceDto } from '../../../../../shared/types/domain'
import { ApiRequestError } from '../../../../composables/useApiClient'
import { useDevicesApi } from '../../../../composables/useDevicesApi'
import { useFloorsApi } from '../../../../composables/useFloorsApi'
import { useRoomsApi } from '../../../../composables/useRoomsApi'

const route = useRoute()
const router = useRouter()
const homeId = route.params.homeId as string

const devicesApi = useDevicesApi()
const floorsApi = useFloorsApi()
const roomsApi = useRoomsApi()

const { data: floors } = await useAsyncData(`inv-floors-${homeId}`, () => floorsApi.list(homeId))
const { data: rooms } = await useAsyncData(`inv-rooms-${homeId}`, () =>
  roomsApi.listForHome(homeId)
)
const { data: typeOptions } = await useAsyncData(`inv-types-${homeId}`, () =>
  devicesApi.suggestions.types(homeId)
)
const { data: protocolOptions } = await useAsyncData(`inv-protocols-${homeId}`, () =>
  devicesApi.suggestions.protocols(homeId)
)
const { data: manufacturerOptions } = await useAsyncData(`inv-manufacturers-${homeId}`, () =>
  devicesApi.suggestions.manufacturers(homeId)
)

const roomNameById = computed(() => {
  const map = new Map<string, string>()
  for (const room of rooms.value ?? []) map.set(room.id, room.name)
  return map
})

const locationStateOptions = [
  { label: 'Unassigned', value: 'unassigned' },
  { label: 'In storage', value: 'in_storage' },
  { label: 'In room', value: 'in_room' }
]

const floorOptions = computed(() =>
  (floors.value ?? []).map((floor) => ({ label: floor.name, value: floor.id }))
)

const roomsForFilter = computed(() => {
  if (!filters.value.floorId.value) return rooms.value ?? []
  return (rooms.value ?? []).filter((room) => room.floorId === filters.value.floorId.value)
})

const roomOptions = computed(() =>
  roomsForFilter.value.map((room) => ({ label: room.name, value: room.id }))
)

function queryParam(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

interface DeviceFilterEntry {
  value: string | null
  matchMode: string
}

interface DeviceFiltersModel {
  global: DeviceFilterEntry
  type: DeviceFilterEntry
  protocol: DeviceFilterEntry
  manufacturer: DeviceFilterEntry
  locationState: DeviceFilterEntry
  floorId: DeviceFilterEntry
  roomId: DeviceFilterEntry
}

const filters = ref<DeviceFiltersModel>({
  global: { value: queryParam('search') || null, matchMode: FilterMatchMode.CONTAINS },
  type: { value: queryParam('type') || null, matchMode: FilterMatchMode.EQUALS },
  protocol: { value: queryParam('protocol') || null, matchMode: FilterMatchMode.EQUALS },
  manufacturer: { value: queryParam('manufacturer') || null, matchMode: FilterMatchMode.EQUALS },
  locationState: { value: queryParam('locationState') || null, matchMode: FilterMatchMode.EQUALS },
  floorId: { value: queryParam('floorId') || null, matchMode: FilterMatchMode.EQUALS },
  roomId: { value: queryParam('roomId') || null, matchMode: FilterMatchMode.EQUALS }
})

const sort = ref<DeviceSortField>((queryParam('sort') as DeviceSortField) || 'name')
const order = ref<'asc' | 'desc'>((queryParam('order') as 'asc' | 'desc') || 'asc')
const page = ref(Number(queryParam('page')) || 1)

let applyingRouteQuery = false
let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => route.query,
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    applyingRouteQuery = true

    filters.value.global.value = queryParam('search') || null
    filters.value.type.value = queryParam('type') || null
    filters.value.protocol.value = queryParam('protocol') || null
    filters.value.manufacturer.value = queryParam('manufacturer') || null
    filters.value.locationState.value = queryParam('locationState') || null
    filters.value.floorId.value = queryParam('floorId') || null
    filters.value.roomId.value = queryParam('roomId') || null
    sort.value = (queryParam('sort') as DeviceSortField) || 'name'
    order.value = (queryParam('order') as 'asc' | 'desc') || 'asc'
    page.value = Number(queryParam('page')) || 1

    nextTick(() => {
      applyingRouteQuery = false
    })
  }
)

function syncQuery() {
  const query: Record<string, string> = {}
  if (filters.value.global.value) query.search = filters.value.global.value
  if (filters.value.floorId.value) query.floorId = filters.value.floorId.value
  if (filters.value.roomId.value) query.roomId = filters.value.roomId.value
  if (filters.value.locationState.value) query.locationState = filters.value.locationState.value
  if (filters.value.type.value) query.type = filters.value.type.value
  if (filters.value.protocol.value) query.protocol = filters.value.protocol.value
  if (filters.value.manufacturer.value) query.manufacturer = filters.value.manufacturer.value
  if (sort.value !== 'name') query.sort = sort.value
  if (order.value !== 'asc') query.order = order.value
  if (page.value !== 1) query.page = String(page.value)
  router.replace({ query })
}

function scheduleSync() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(syncQuery, 300)
}

watch(
  filters,
  () => {
    if (applyingRouteQuery) return
    page.value = 1
    scheduleSync()
  },
  { deep: true }
)

const hasActiveFilters = computed(() => Object.values(filters.value).some((entry) => entry.value))

function clearFilters() {
  for (const entry of Object.values(filters.value)) entry.value = null
  page.value = 1
  if (debounceTimer) clearTimeout(debounceTimer)
  syncQuery()
}

function onSort(event: DataTableSortEvent) {
  const field = event.sortField as DeviceSortField | undefined
  if (!field) return
  sort.value = field
  order.value = event.sortOrder === -1 ? 'desc' : 'asc'
  page.value = 1
  syncQuery()
}

function goToPage(next: number) {
  page.value = next
  syncQuery()
}

function onPage(event: DataTablePageEvent) {
  goToPage(event.page + 1)
}

const queryKey = computed(() =>
  JSON.stringify({
    global: filters.value.global.value,
    type: filters.value.type.value,
    protocol: filters.value.protocol.value,
    manufacturer: filters.value.manufacturer.value,
    locationState: filters.value.locationState.value,
    floorId: filters.value.floorId.value,
    roomId: filters.value.roomId.value,
    sort: sort.value,
    order: order.value,
    page: page.value
  })
)

const {
  data: result,
  pending,
  refresh: refreshDevices
} = await useAsyncData(
  `inv-devices-${homeId}`,
  () =>
    devicesApi.list(homeId, {
      search: filters.value.global.value || undefined,
      floorId: filters.value.floorId.value || undefined,
      roomId: filters.value.roomId.value || undefined,
      locationState: (filters.value.locationState.value || undefined) as
        DeviceLocationState | undefined,
      type: filters.value.type.value || undefined,
      protocol: filters.value.protocol.value || undefined,
      manufacturer: filters.value.manufacturer.value || undefined,
      sort: sort.value,
      order: order.value,
      page: page.value,
      pageSize: 25
    }),
  { watch: [queryKey] }
)

const showImportDialog = ref(false)

function onImported() {
  refreshDevices()
}

const toast = useToast()
const updatingPackaged = ref<Set<string>>(new Set())

async function togglePackaged(device: DeviceDto, packaged: boolean) {
  updatingPackaged.value.add(device.id)
  try {
    await devicesApi.update(device.id, {
      name: device.name,
      type: device.type,
      protocol: device.protocol,
      manufacturer: device.manufacturer,
      model: device.model,
      serialNumber: device.serialNumber,
      ipAddress: device.ipAddress,
      purchaseDate: device.purchaseDate,
      notes: device.notes,
      locationState: packaged ? 'in_storage' : 'unassigned',
      roomId: null,
      version: device.version
    })
    toast.add({
      severity: 'success',
      summary: packaged ? 'Marked as packaged' : 'Marked as unpackaged',
      life: 2000
    })
    await refreshDevices()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: err instanceof ApiRequestError ? err.message : 'Failed to update device',
      life: 4000
    })
  } finally {
    updatingPackaged.value.delete(device.id)
  }
}
</script>

<template>
  <div class="stack">
    <div class="row-between">
      <div>
        <NuxtLink :to="`/homes/${homeId}`">← Back to home</NuxtLink>
        <h1>Device inventory</h1>
      </div>
      <div class="row">
        <Button label="Import CSV" severity="secondary" outlined @click="showImportDialog = true" />
        <NuxtLink :to="`/homes/${homeId}/devices/new`" class="btn btn-primary">Add device</NuxtLink>
      </div>
    </div>

    <div class="table-scroll device-table-wrap">
      <DataTable
        v-model:filters="filters"
        :value="result?.data ?? []"
        data-key="id"
        lazy
        :loading="pending"
        paginator
        filter-display="row"
        :rows="result?.page.size ?? 25"
        :total-records="result?.page.totalItems ?? 0"
        :first="((result?.page.number ?? 1) - 1) * (result?.page.size ?? 25)"
        :sort-field="sort"
        :sort-order="order === 'asc' ? 1 : -1"
        :global-filter-fields="[
          'name',
          'manufacturer',
          'model',
          'serialNumber',
          'ipAddress',
          'type',
          'protocol'
        ]"
        @page="onPage"
        @sort="onSort"
      >
        <template #header>
          <div class="row-between">
            <div class="field" style="margin: 0">
              <label for="device-search" class="visually-hidden">Search</label>
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText
                  id="device-search"
                  v-model="filters.global.value"
                  placeholder="Search name, manufacturer, model, serial, IP…"
                  style="width: 20rem; max-width: 100%"
                />
              </IconField>
            </div>
            <Button
              label="Clear all filters"
              size="small"
              severity="secondary"
              outlined
              :disabled="!hasActiveFilters"
              @click="clearFilters"
            />
          </div>
        </template>

        <template #empty>
          <div class="empty-state">
            <p>No devices match your search and filters.</p>
            <Button
              label="Clear all filters"
              size="small"
              :disabled="!hasActiveFilters"
              @click="clearFilters"
            />
          </div>
        </template>

        <Column field="name" header="Name" sortable>
          <template #body="{ data }">
            <NuxtLink :to="`/homes/${homeId}/devices/${data.id}`">{{ data.name }}</NuxtLink>
          </template>
        </Column>

        <Column field="type" header="Type" sortable :show-filter-menu="false">
          <template #filter="{ filterModel, filterCallback }">
            <Select
              v-model="filterModel.value"
              input-id="filter-type"
              :options="typeOptions ?? []"
              placeholder="Any type"
              size="small"
              show-clear
              @change="filterCallback()"
            />
          </template>
        </Column>

        <Column header="Protocol" filter-field="protocol" :show-filter-menu="false">
          <template #body="{ data }">{{ data.protocol }}</template>
          <template #filter="{ filterModel, filterCallback }">
            <Select
              v-model="filterModel.value"
              input-id="filter-protocol"
              :options="protocolOptions ?? []"
              placeholder="Any protocol"
              size="small"
              show-clear
              @change="filterCallback()"
            />
          </template>
        </Column>

        <Column
          header="Manufacturer / model"
          sortable
          field="manufacturer"
          :show-filter-menu="false"
        >
          <template #body="{ data }">
            {{ [data.manufacturer, data.model].filter(Boolean).join(' / ') || '—' }}
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Select
              v-model="filterModel.value"
              input-id="filter-manufacturer"
              :options="manufacturerOptions ?? []"
              placeholder="Any manufacturer"
              size="small"
              show-clear
              @change="filterCallback()"
            />
          </template>
        </Column>

        <Column header="Location" filter-field="locationState" :show-filter-menu="false">
          <template #body="{ data }">
            <LocationBadge
              :state="data.locationState"
              :room-name="data.roomId ? roomNameById.get(data.roomId) : null"
            />
          </template>
          <template #filter>
            <div class="stack" style="gap: var(--space-1)">
              <Select
                v-model="filters.floorId.value"
                input-id="filter-floor"
                :options="floorOptions"
                option-label="label"
                option-value="value"
                placeholder="Any floor"
                size="small"
                show-clear
              />
              <Select
                v-model="filters.roomId.value"
                input-id="filter-room"
                :options="roomOptions"
                option-label="label"
                option-value="value"
                placeholder="Any room"
                size="small"
                show-clear
              />
              <Select
                v-model="filters.locationState.value"
                input-id="filter-location"
                :options="locationStateOptions"
                option-label="label"
                option-value="value"
                placeholder="Any location"
                size="small"
                show-clear
              />
            </div>
          </template>
        </Column>

        <Column header="Packaged" style="width: 6rem">
          <template #body="{ data }">
            <Checkbox
              :model-value="data.locationState === 'in_storage'"
              binary
              :disabled="updatingPackaged.has(data.id)"
              :aria-label="`Mark ${data.name} as packaged`"
              @update:model-value="(checked) => togglePackaged(data, checked as boolean)"
            />
          </template>
        </Column>

        <Column field="ipAddress" header="IP address">
          <template #body="{ data }">{{ data.ipAddress ?? '—' }}</template>
        </Column>

        <Column field="purchaseDate" header="Purchase date" sortable>
          <template #body="{ data }">{{ data.purchaseDate ?? '—' }}</template>
        </Column>
      </DataTable>
    </div>

    <div class="device-cards-wrap">
      <p v-if="pending">Loading devices…</p>
      <p v-else-if="!result || result.data.length === 0" class="empty-state">
        No devices match your search and filters.
        <Button
          label="Clear all filters"
          size="small"
          severity="secondary"
          outlined
          @click="clearFilters"
        />
      </p>
      <template v-else>
        <ul class="device-cards" style="list-style: none; padding: 0">
          <li v-for="device in result.data" :key="device.id" class="card stack">
            <div class="row-between">
              <NuxtLink :to="`/homes/${homeId}/devices/${device.id}`" style="font-weight: 700">
                {{ device.name }}
              </NuxtLink>
              <LocationBadge
                :state="device.locationState"
                :room-name="device.roomId ? roomNameById.get(device.roomId) : null"
              />
            </div>
            <p class="hint">{{ device.type }} · {{ device.protocol }}</p>
            <p v-if="device.manufacturer || device.model" class="hint">
              {{ [device.manufacturer, device.model].filter(Boolean).join(' / ') }}
            </p>
            <p v-if="device.ipAddress" class="hint">IP: {{ device.ipAddress }}</p>
            <p v-if="device.purchaseDate" class="hint">Purchased: {{ device.purchaseDate }}</p>
            <label class="row" style="align-items: center; gap: var(--space-2)">
              <Checkbox
                :model-value="device.locationState === 'in_storage'"
                binary
                :disabled="updatingPackaged.has(device.id)"
                @update:model-value="(checked) => togglePackaged(device, checked as boolean)"
              />
              Packaged
            </label>
          </li>
        </ul>

        <nav class="pagination" aria-label="Pagination">
          <Button
            label="Previous"
            size="small"
            severity="secondary"
            outlined
            :disabled="result.page.number <= 1"
            @click="goToPage(result.page.number - 1)"
          />
          <span>Page {{ result.page.number }} of {{ Math.max(result.page.totalPages, 1) }}</span>
          <Button
            label="Next"
            size="small"
            severity="secondary"
            outlined
            :disabled="result.page.number >= result.page.totalPages"
            @click="goToPage(result.page.number + 1)"
          />
        </nav>
      </template>
    </div>

    <DeviceImportDialog
      v-if="showImportDialog"
      :home-id="homeId"
      @imported="onImported"
      @cancel="showImportDialog = false"
    />
  </div>
</template>
