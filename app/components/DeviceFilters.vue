<script setup lang="ts">
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import type { DeviceLocationState } from '../../shared/schemas/device'
import type { FloorDto, RoomDto } from '../../shared/types/domain'

export interface DeviceFilterState {
  search: string
  floorId: string
  roomId: string
  locationState: DeviceLocationState | ''
  type: string
  protocol: string
  manufacturer: string
}

const props = defineProps<{
  modelValue: DeviceFilterState
  floors: FloorDto[]
  rooms: RoomDto[]
  typeOptions: string[]
  protocolOptions: string[]
  manufacturerOptions: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [DeviceFilterState]
  clear: []
}>()

const locationOptions = [
  { label: 'All locations', value: '' },
  { label: 'Unassigned', value: 'unassigned' },
  { label: 'In storage', value: 'in_storage' },
  { label: 'In room', value: 'in_room' }
]

const floorOptions = computed(() => [
  { label: 'All floors', value: '' },
  ...props.floors.map((floor) => ({ label: floor.name, value: floor.id }))
])

const roomsForFilter = computed(() => {
  if (!props.modelValue.floorId) return props.rooms
  return props.rooms.filter((room) => room.floorId === props.modelValue.floorId)
})

const roomOptions = computed(() => [
  { label: 'All rooms', value: '' },
  ...roomsForFilter.value.map((room) => ({ label: room.name, value: room.id }))
])

const typeSelectOptions = computed(() => [
  { label: 'All types', value: '' },
  ...props.typeOptions.map((option) => ({ label: option, value: option }))
])

const protocolSelectOptions = computed(() => [
  { label: 'All protocols', value: '' },
  ...props.protocolOptions.map((option) => ({ label: option, value: option }))
])

const manufacturerSelectOptions = computed(() => [
  { label: 'All manufacturers', value: '' },
  ...props.manufacturerOptions.map((option) => ({ label: option, value: option }))
])

function update<K extends keyof DeviceFilterState>(key: K, value: DeviceFilterState[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const hasActiveFilters = computed(() =>
  Object.values(props.modelValue).some((value) => value !== '')
)
</script>

<template>
  <div class="card stack" role="search">
    <div class="field">
      <label for="device-search">Search</label>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          id="device-search"
          :model-value="modelValue.search"
          placeholder="Search name, manufacturer, model, serial, IP…"
          style="width: 100%"
          @update:model-value="update('search', $event ?? '')"
        />
      </IconField>
    </div>

    <div class="row">
      <div class="field">
        <label for="filter-floor">Floor</label>
        <Select
          input-id="filter-floor"
          :model-value="modelValue.floorId"
          :options="floorOptions"
          option-label="label"
          option-value="value"
          @update:model-value="update('floorId', $event)"
        />
      </div>

      <div class="field">
        <label for="filter-room">Room</label>
        <Select
          input-id="filter-room"
          :model-value="modelValue.roomId"
          :options="roomOptions"
          option-label="label"
          option-value="value"
          @update:model-value="update('roomId', $event)"
        />
      </div>

      <div class="field">
        <label for="filter-location">Location</label>
        <Select
          input-id="filter-location"
          :model-value="modelValue.locationState"
          :options="locationOptions"
          option-label="label"
          option-value="value"
          @update:model-value="update('locationState', $event as DeviceLocationState | '')"
        />
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label for="filter-type">Type</label>
        <Select
          input-id="filter-type"
          :model-value="modelValue.type"
          :options="typeSelectOptions"
          option-label="label"
          option-value="value"
          @update:model-value="update('type', $event)"
        />
      </div>

      <div class="field">
        <label for="filter-protocol">Protocol</label>
        <Select
          input-id="filter-protocol"
          :model-value="modelValue.protocol"
          :options="protocolSelectOptions"
          option-label="label"
          option-value="value"
          @update:model-value="update('protocol', $event)"
        />
      </div>

      <div class="field">
        <label for="filter-manufacturer">Manufacturer</label>
        <Select
          input-id="filter-manufacturer"
          :model-value="modelValue.manufacturer"
          :options="manufacturerSelectOptions"
          option-label="label"
          option-value="value"
          @update:model-value="update('manufacturer', $event)"
        />
      </div>
    </div>

    <div>
      <Button label="Clear all filters" size="small" severity="secondary" outlined :disabled="!hasActiveFilters" @click="emit('clear')" />
    </div>
  </div>
</template>
