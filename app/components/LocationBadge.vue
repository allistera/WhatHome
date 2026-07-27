<script setup lang="ts">
import Tag from 'primevue/tag'
import type { DeviceLocationState } from '../../shared/schemas/device'

const props = defineProps<{
  state: DeviceLocationState
  roomName?: string | null
}>()

const config: Record<DeviceLocationState, { label: string; icon: string; severity: 'danger' | 'warn' | 'success' }> = {
  unassigned: { label: 'Unassigned', icon: 'pi pi-circle', severity: 'danger' },
  in_storage: { label: 'In storage', icon: 'pi pi-box', severity: 'warn' },
  in_room: { label: 'In room', icon: 'pi pi-map-marker', severity: 'success' }
}

const current = computed(() => config[props.state])
const displayLabel = computed(() => (props.state === 'in_room' && props.roomName ? props.roomName : current.value.label))
</script>

<template>
  <Tag :value="displayLabel" :severity="current.severity" :icon="current.icon" rounded />
</template>
