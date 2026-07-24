<script setup lang="ts">
import type { DeviceLocationState } from '../../shared/schemas/device'
import type { DeviceDto } from '../../shared/types/domain'
import { ApiRequestError } from '../composables/useApiClient'
import { useDevicesApi } from '../composables/useDevicesApi'
import { useFloorsApi } from '../composables/useFloorsApi'
import { useRoomsApi } from '../composables/useRoomsApi'

const props = defineProps<{
  homeId: string
  device?: DeviceDto | null
}>()

const emit = defineEmits<{
  saved: [DeviceDto]
  cancel: []
}>()

const devicesApi = useDevicesApi()
const floorsApi = useFloorsApi()
const roomsApi = useRoomsApi()

const { data: floors } = await useAsyncData(`device-form-floors-${props.homeId}`, () =>
  floorsApi.list(props.homeId)
)
const { data: rooms } = await useAsyncData(`device-form-rooms-${props.homeId}`, () =>
  roomsApi.listForHome(props.homeId)
)
const { data: typeOptions } = await useAsyncData(`device-form-types-${props.homeId}`, () =>
  devicesApi.suggestions.types(props.homeId)
)
const { data: protocolOptions } = await useAsyncData(`device-form-protocols-${props.homeId}`, () =>
  devicesApi.suggestions.protocols(props.homeId)
)

const floorsWithRooms = computed(() => {
  if (!floors.value) return []
  return floors.value.map((floor) => ({
    ...floor,
    rooms: (rooms.value ?? []).filter((room) => room.floorId === floor.id)
  }))
})

const form = reactive({
  name: props.device?.name ?? '',
  type: props.device?.type ?? '',
  protocol: props.device?.protocol ?? '',
  manufacturer: props.device?.manufacturer ?? '',
  model: props.device?.model ?? '',
  serialNumber: props.device?.serialNumber ?? '',
  ipAddress: props.device?.ipAddress ?? '',
  purchaseDate: props.device?.purchaseDate ?? '',
  locationState: (props.device?.locationState ?? 'unassigned') as DeviceLocationState,
  roomId: props.device?.roomId ?? '',
  notes: props.device?.notes ?? ''
})

const fieldErrors = ref<Record<string, string[]>>({})
const formError = ref('')
const saving = ref(false)

function errorFor(field: string): string | undefined {
  return fieldErrors.value[field]?.join(' ')
}

async function onSubmit() {
  formError.value = ''
  fieldErrors.value = {}
  saving.value = true

  const payload = {
    name: form.name,
    type: form.type,
    protocol: form.protocol,
    manufacturer: form.manufacturer || null,
    model: form.model || null,
    serialNumber: form.serialNumber || null,
    ipAddress: form.ipAddress || null,
    purchaseDate: form.purchaseDate || null,
    notes: form.notes || null,
    locationState: form.locationState,
    roomId: form.locationState === 'in_room' ? form.roomId || null : null
  }

  try {
    const result = props.device
      ? await devicesApi.update(props.device.id, { ...payload, version: props.device.version })
      : await devicesApi.create(props.homeId, payload)
    emit('saved', result)
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.code === 'CONFLICT') {
        formError.value = 'This device changed elsewhere. Reload the page and try again.'
      } else if (err.fieldErrors) {
        fieldErrors.value = err.fieldErrors
      } else {
        formError.value = err.message
      }
    } else {
      formError.value = 'Something went wrong. Please try again.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="stack" novalidate @submit.prevent="onSubmit">
    <p v-if="formError" class="alert" role="alert">{{ formError }}</p>

    <FormField id="device-name" label="Name" required :error="errorFor('name')">
      <template #default="{ describedBy, invalid }">
        <input
          id="device-name"
          v-model="form.name"
          type="text"
          required
          maxlength="160"
          :aria-describedby="describedBy"
          :aria-invalid="invalid"
        >
      </template>
    </FormField>

    <div class="row" style="align-items: flex-start">
      <FormField id="device-type" label="Type" required :error="errorFor('type')" style="flex: 1">
        <template #default="{ describedBy, invalid }">
          <input
            id="device-type"
            v-model="form.type"
            type="text"
            required
            maxlength="80"
            list="type-suggestions"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
          >
          <datalist id="type-suggestions">
            <option v-for="option in typeOptions" :key="option" :value="option" />
          </datalist>
        </template>
      </FormField>

      <FormField id="device-protocol" label="Protocol" required :error="errorFor('protocol')" style="flex: 1">
        <template #default="{ describedBy, invalid }">
          <input
            id="device-protocol"
            v-model="form.protocol"
            type="text"
            required
            maxlength="80"
            list="protocol-suggestions"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
          >
          <datalist id="protocol-suggestions">
            <option v-for="option in protocolOptions" :key="option" :value="option" />
          </datalist>
        </template>
      </FormField>
    </div>

    <div class="row" style="align-items: flex-start">
      <FormField id="device-manufacturer" label="Manufacturer" :error="errorFor('manufacturer')" style="flex: 1">
        <template #default="{ describedBy, invalid }">
          <input
            id="device-manufacturer"
            v-model="form.manufacturer"
            type="text"
            maxlength="120"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
          >
        </template>
      </FormField>

      <FormField id="device-model" label="Model" :error="errorFor('model')" style="flex: 1">
        <template #default="{ describedBy, invalid }">
          <input
            id="device-model"
            v-model="form.model"
            type="text"
            maxlength="120"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
          >
        </template>
      </FormField>
    </div>

    <div class="row" style="align-items: flex-start">
      <FormField
        id="device-serial-number"
        label="Serial number"
        :error="errorFor('serialNumber')"
        style="flex: 1"
      >
        <template #default="{ describedBy, invalid }">
          <input
            id="device-serial-number"
            v-model="form.serialNumber"
            type="text"
            maxlength="160"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
          >
        </template>
      </FormField>

      <FormField id="device-ip-address" label="IP address" :error="errorFor('ipAddress')" style="flex: 1">
        <template #default="{ describedBy, invalid }">
          <input
            id="device-ip-address"
            v-model="form.ipAddress"
            type="text"
            placeholder="192.168.1.10"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
          >
        </template>
      </FormField>
    </div>

    <FormField id="device-purchase-date" label="Purchase date" :error="errorFor('purchaseDate')">
      <template #default="{ describedBy, invalid }">
        <input
          id="device-purchase-date"
          v-model="form.purchaseDate"
          type="date"
          :aria-describedby="describedBy"
          :aria-invalid="invalid"
        >
      </template>
    </FormField>

    <fieldset>
      <legend>Location</legend>
      <div class="radio-group" role="radiogroup" aria-required="true">
        <div class="radio-option">
          <input id="location-unassigned" v-model="form.locationState" type="radio" value="unassigned">
          <label for="location-unassigned">Unassigned</label>
        </div>
        <div class="radio-option">
          <input id="location-storage" v-model="form.locationState" type="radio" value="in_storage">
          <label for="location-storage">In storage</label>
        </div>
        <div class="radio-option">
          <input id="location-room" v-model="form.locationState" type="radio" value="in_room">
          <label for="location-room">In room</label>
        </div>
      </div>

      <FormField
        v-if="form.locationState === 'in_room'"
        id="device-room"
        label="Room"
        required
        :error="errorFor('roomId')"
      >
        <template #default="{ describedBy, invalid }">
          <select
            id="device-room"
            v-model="form.roomId"
            required
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
          >
            <option value="" disabled>Select a room</option>
            <optgroup v-for="floor in floorsWithRooms" :key="floor.id" :label="floor.name">
              <option v-for="room in floor.rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
            </optgroup>
          </select>
        </template>
      </FormField>
    </fieldset>

    <FormField id="device-notes" label="Notes" :error="errorFor('notes')">
      <template #default="{ describedBy, invalid }">
        <textarea
          id="device-notes"
          v-model="form.notes"
          maxlength="5000"
          :aria-describedby="describedBy"
          :aria-invalid="invalid"
        />
      </template>
    </FormField>

    <div class="row" style="justify-content: flex-end">
      <button type="button" class="btn" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Saving…' : 'Save device' }}
      </button>
    </div>
  </form>
</template>
