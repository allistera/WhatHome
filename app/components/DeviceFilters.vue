<script setup lang="ts">
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

const roomsForFilter = computed(() => {
  if (!props.modelValue.floorId) return props.rooms
  return props.rooms.filter((room) => room.floorId === props.modelValue.floorId)
})

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
      <input
        id="device-search"
        :value="modelValue.search"
        type="search"
        placeholder="Search name, manufacturer, model, serial, IP…"
        @input="update('search', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <div class="row">
      <div class="field">
        <label for="filter-floor">Floor</label>
        <select
          id="filter-floor"
          :value="modelValue.floorId"
          @change="update('floorId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All floors</option>
          <option v-for="floor in floors" :key="floor.id" :value="floor.id">{{ floor.name }}</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-room">Room</label>
        <select
          id="filter-room"
          :value="modelValue.roomId"
          @change="update('roomId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All rooms</option>
          <option v-for="room in roomsForFilter" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-location">Location</label>
        <select
          id="filter-location"
          :value="modelValue.locationState"
          @change="update('locationState', ($event.target as HTMLSelectElement).value as DeviceLocationState | '')"
        >
          <option value="">All locations</option>
          <option value="unassigned">Unassigned</option>
          <option value="in_storage">In storage</option>
          <option value="in_room">In room</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label for="filter-type">Type</label>
        <select
          id="filter-type"
          :value="modelValue.type"
          @change="update('type', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All types</option>
          <option v-for="option in typeOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-protocol">Protocol</label>
        <select
          id="filter-protocol"
          :value="modelValue.protocol"
          @change="update('protocol', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All protocols</option>
          <option v-for="option in protocolOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-manufacturer">Manufacturer</label>
        <select
          id="filter-manufacturer"
          :value="modelValue.manufacturer"
          @change="update('manufacturer', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All manufacturers</option>
          <option v-for="option in manufacturerOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>

    <div>
      <button type="button" class="btn btn-small" :disabled="!hasActiveFilters" @click="emit('clear')">
        Clear all filters
      </button>
    </div>
  </div>
</template>
