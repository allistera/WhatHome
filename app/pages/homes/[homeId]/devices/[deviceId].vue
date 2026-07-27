<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { ApiRequestError } from '../../../../composables/useApiClient'
import { useDevicesApi } from '../../../../composables/useDevicesApi'
import { useRoomsApi } from '../../../../composables/useRoomsApi'

const route = useRoute()
const router = useRouter()
const homeId = route.params.homeId as string
const deviceId = route.params.deviceId as string

const devicesApi = useDevicesApi()
const roomsApi = useRoomsApi()
const toast = useToast()

const { data: device, refresh, error: loadError } = await useAsyncData(`device-${deviceId}`, () =>
  devicesApi.get(deviceId)
)
const { data: rooms } = await useAsyncData(`device-detail-rooms-${homeId}`, () => roomsApi.listForHome(homeId))

const notFound = computed(
  () =>
    (loadError.value instanceof ApiRequestError && loadError.value.status === 404) ||
    (device.value !== undefined && device.value !== null && device.value.homeId !== homeId)
)
const roomName = computed(() => {
  if (!device.value?.roomId) return null
  return rooms.value?.find((room) => room.id === device.value!.roomId)?.name ?? null
})

const editing = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const deleteBusy = ref(false)

function onSaved() {
  editing.value = false
  refresh()
}

async function confirmDelete() {
  if (!device.value) return
  deleteBusy.value = true
  deleteError.value = ''
  try {
    await devicesApi.remove(device.value.id, device.value.version)
    toast.add({ severity: 'success', summary: 'Device deleted', life: 3000 })
    router.push(`/homes/${homeId}/devices`)
  } catch (err) {
    deleteError.value = err instanceof ApiRequestError ? err.message : 'Failed to delete device.'
  } finally {
    deleteBusy.value = false
  }
}

function fmtDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div v-if="notFound" class="empty-state">
    <p>This device could not be found.</p>
    <NuxtLink :to="`/homes/${homeId}/devices`" class="btn btn-primary">Back to inventory</NuxtLink>
  </div>

  <div v-else-if="device" class="stack">
    <NuxtLink :to="`/homes/${homeId}/devices`">← Back to inventory</NuxtLink>

    <div v-if="!editing" class="stack">
      <div class="row-between">
        <h1>{{ device.name }}</h1>
        <div class="row">
          <Button label="Edit" severity="secondary" outlined @click="editing = true" />
          <Button label="Delete" severity="danger" outlined @click="deleting = true" />
        </div>
      </div>

      <div class="card stack">
        <LocationBadge :state="device.locationState" :room-name="roomName" />

        <dl class="stack" style="display: grid; grid-template-columns: auto 1fr; gap: var(--space-2) var(--space-4)">
          <dt>Type</dt><dd>{{ device.type }}</dd>
          <dt>Protocol</dt><dd>{{ device.protocol }}</dd>
          <dt>Manufacturer</dt><dd>{{ device.manufacturer ?? '—' }}</dd>
          <dt>Model</dt><dd>{{ device.model ?? '—' }}</dd>
          <dt>Serial number</dt><dd>{{ device.serialNumber ?? '—' }}</dd>
          <dt>IP address</dt><dd>{{ device.ipAddress ?? '—' }}</dd>
          <dt>Purchase date</dt><dd>{{ device.purchaseDate ?? '—' }}</dd>
          <dt>Notes</dt><dd style="white-space: pre-wrap">{{ device.notes ?? '—' }}</dd>
          <dt>Created</dt><dd>{{ fmtDate(device.createdAt) }}</dd>
          <dt>Updated</dt><dd>{{ fmtDate(device.updatedAt) }}</dd>
        </dl>
      </div>
    </div>

    <div v-else class="stack">
      <h1>Edit {{ device.name }}</h1>
      <DeviceForm :home-id="homeId" :device="device" @saved="onSaved" @cancel="editing = false" />
    </div>

    <ConfirmDialog
      v-if="deleting"
      title="Delete device"
      danger
      confirm-label="Delete device"
      :busy="deleteBusy"
      @cancel="deleting = false"
      @confirm="confirmDelete"
    >
      <p>Delete <strong>{{ device.name }}</strong>? This action cannot be undone.</p>
      <Message v-if="deleteError" severity="error">{{ deleteError }}</Message>
    </ConfirmDialog>
  </div>
</template>
