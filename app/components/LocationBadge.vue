<script setup lang="ts">
import type { DeviceLocationState } from '../../shared/schemas/device'

const props = defineProps<{
  state: DeviceLocationState
  roomName?: string | null
}>()

const config: Record<DeviceLocationState, { label: string; icon: string; className: string }> = {
  unassigned: { label: 'Unassigned', icon: '○', className: 'badge-unassigned' },
  in_storage: { label: 'In storage', icon: '▢', className: 'badge-storage' },
  in_room: { label: 'In room', icon: '●', className: 'badge-room' }
}

const current = computed(() => config[props.state])
</script>

<template>
  <span class="badge" :class="current.className">
    <span aria-hidden="true">{{ current.icon }}</span>
    <span>{{ state === 'in_room' && roomName ? roomName : current.label }}</span>
  </span>
</template>
