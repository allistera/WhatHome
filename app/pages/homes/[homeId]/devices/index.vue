<script setup lang="ts">
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import type { DeviceLocationState, DeviceSortField } from '../../../../../shared/schemas/device'
import type { DeviceFilterState } from '../../../../components/DeviceFilters.vue'
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
const { data: rooms } = await useAsyncData(`inv-rooms-${homeId}`, () => roomsApi.listForHome(homeId))
const { data: typeOptions } = await useAsyncData(`inv-types-${homeId}`, () => devicesApi.suggestions.types(homeId))
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

function queryParam(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

const filters = reactive<DeviceFilterState>({
  search: queryParam('search'),
  floorId: queryParam('floorId'),
  roomId: queryParam('roomId'),
  locationState: queryParam('locationState') as DeviceFilterState['locationState'],
  type: queryParam('type'),
  protocol: queryParam('protocol'),
  manufacturer: queryParam('manufacturer')
})

const sort = ref<DeviceSortField>((queryParam('sort') as DeviceSortField) || 'name')
const order = ref<'asc' | 'desc'>((queryParam('order') as 'asc' | 'desc') || 'asc')
const page = ref(Number(queryParam('page')) || 1)

function syncQuery() {
  const query: Record<string, string> = {}
  if (filters.search) query.search = filters.search
  if (filters.floorId) query.floorId = filters.floorId
  if (filters.roomId) query.roomId = filters.roomId
  if (filters.locationState) query.locationState = filters.locationState
  if (filters.type) query.type = filters.type
  if (filters.protocol) query.protocol = filters.protocol
  if (filters.manufacturer) query.manufacturer = filters.manufacturer
  if (sort.value !== 'name') query.sort = sort.value
  if (order.value !== 'asc') query.order = order.value
  if (page.value !== 1) query.page = String(page.value)
  router.replace({ query })
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined
function scheduleSync() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(syncQuery, 300)
}

function onFiltersUpdate(next: DeviceFilterState) {
  Object.assign(filters, next)
  page.value = 1
  scheduleSync()
}

function clearFilters() {
  Object.assign(filters, {
    search: '',
    floorId: '',
    roomId: '',
    locationState: '',
    type: '',
    protocol: '',
    manufacturer: ''
  })
  page.value = 1
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

function onPage(event: DataTablePageEvent) {
  page.value = event.page + 1
  syncQuery()
}

const queryKey = computed(() =>
  JSON.stringify({ ...filters, sort: sort.value, order: order.value, page: page.value })
)

const { data: result, pending, refresh: refreshDevices } = await useAsyncData(
  `inv-devices-${homeId}`,
  () =>
    devicesApi.list(homeId, {
      search: filters.search || undefined,
      floorId: filters.floorId || undefined,
      roomId: filters.roomId || undefined,
      locationState: (filters.locationState || undefined) as DeviceLocationState | undefined,
      type: filters.type || undefined,
      protocol: filters.protocol || undefined,
      manufacturer: filters.manufacturer || undefined,
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

</script>

<template>
  <div class="stack">
    <div class="row-between">
      <div>
        <NuxtLink :to="`/homes/${homeId}`">← Back to home</NuxtLink>
        <h1>Device inventory</h1>
      </div>
      <div class="row">
        <button type="button" class="btn" @click="showImportDialog = true">Import CSV</button>
        <NuxtLink :to="`/homes/${homeId}/devices/new`" class="btn btn-primary">Add device</NuxtLink>
      </div>
    </div>

    <DeviceFilters
      :model-value="filters"
      :floors="floors ?? []"
      :rooms="rooms ?? []"
      :type-options="typeOptions ?? []"
      :protocol-options="protocolOptions ?? []"
      :manufacturer-options="manufacturerOptions ?? []"
      @update:model-value="onFiltersUpdate"
      @clear="clearFilters"
    />

    <p v-if="pending">Loading devices…</p>

    <div v-else-if="!result || result.data.length === 0" class="empty-state">
      <p>No devices match your search and filters.</p>
      <button type="button" class="btn" @click="clearFilters">Clear all filters</button>
    </div>

    <template v-else>
      <div class="table-scroll device-table-wrap">
        <DataTable
          :value="result.data"
          data-key="id"
          lazy
          paginator
          :rows="result.page.size"
          :total-records="result.page.totalItems"
          :first="(result.page.number - 1) * result.page.size"
          :sort-field="sort"
          :sort-order="order === 'asc' ? 1 : -1"
          @page="onPage"
          @sort="onSort"
        >
          <template #paginatorstart>
            Page {{ result.page.number }} of {{ Math.max(result.page.totalPages, 1) }}
          </template>
          <Column field="name" header="Name" sortable>
            <template #body="{ data }">
              <NuxtLink :to="`/homes/${homeId}/devices/${data.id}`">{{ data.name }}</NuxtLink>
            </template>
          </Column>
          <Column field="type" header="Type" sortable />
          <Column field="protocol" header="Protocol" />
          <Column field="manufacturer" header="Manufacturer / model" sortable>
            <template #body="{ data }">
              {{ [data.manufacturer, data.model].filter(Boolean).join(' / ') || '—' }}
            </template>
          </Column>
          <Column header="Location">
            <template #body="{ data }">
              <LocationBadge
                :state="data.locationState"
                :room-name="data.roomId ? roomNameById.get(data.roomId) : null"
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
        </li>
      </ul>
    </template>

    <DeviceImportDialog
      v-if="showImportDialog"
      :home-id="homeId"
      @imported="onImported"
      @cancel="showImportDialog = false"
    />
  </div>
</template>
