<script setup lang="ts">
import type { AutoCompleteCompleteEvent } from 'primevue/autocomplete'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
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
const toast = useToast()

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

const roomGroups = computed(() => {
  if (!floors.value) return []
  return floors.value.map((floor) => ({
    label: floor.name,
    items: (rooms.value ?? [])
      .filter((room) => room.floorId === floor.id)
      .map((room) => ({
        label: room.name,
        value: room.id
      }))
  }))
})

const locationOptions = [
  { label: 'Unassigned', value: 'unassigned' },
  { label: 'In storage', value: 'in_storage' },
  { label: 'In room', value: 'in_room' }
]

const filteredTypeOptions = ref<string[]>([])
function onTypeComplete(event: AutoCompleteCompleteEvent) {
  const query = event.query.toLowerCase()
  filteredTypeOptions.value = (typeOptions.value ?? []).filter((option) =>
    option.toLowerCase().includes(query)
  )
}

const filteredProtocolOptions = ref<string[]>([])
function onProtocolComplete(event: AutoCompleteCompleteEvent) {
  const query = event.query.toLowerCase()
  filteredProtocolOptions.value = (protocolOptions.value ?? []).filter((option) =>
    option.toLowerCase().includes(query)
  )
}

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
    toast.add({
      severity: 'success',
      summary: props.device ? 'Device updated' : 'Device created',
      life: 3000
    })
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
    <Message v-if="formError" severity="error">{{ formError }}</Message>

    <FormField id="device-name" label="Name" required :error="errorFor('name')">
      <template #default="{ describedBy, invalid }">
        <InputText
          id="device-name"
          v-model="form.name"
          required
          maxlength="160"
          style="width: 100%"
          :aria-describedby="describedBy"
          :invalid="invalid"
        />
      </template>
    </FormField>

    <div class="row" style="align-items: flex-start">
      <FormField id="device-type" label="Type" required :error="errorFor('type')" style="flex: 1">
        <template #default="{ describedBy, invalid }">
          <AutoComplete
            v-model="form.type"
            input-id="device-type"
            dropdown
            complete-on-focus
            :suggestions="filteredTypeOptions"
            style="width: 100%"
            :input-style="{ width: '100%' }"
            :aria-describedby="describedBy"
            :invalid="invalid"
            @complete="onTypeComplete"
          />
        </template>
      </FormField>

      <FormField
        id="device-protocol"
        label="Protocol"
        required
        :error="errorFor('protocol')"
        style="flex: 1"
      >
        <template #default="{ describedBy, invalid }">
          <AutoComplete
            v-model="form.protocol"
            input-id="device-protocol"
            dropdown
            complete-on-focus
            :suggestions="filteredProtocolOptions"
            style="width: 100%"
            :input-style="{ width: '100%' }"
            :aria-describedby="describedBy"
            :invalid="invalid"
            @complete="onProtocolComplete"
          />
        </template>
      </FormField>
    </div>

    <div class="row" style="align-items: flex-start">
      <FormField
        id="device-manufacturer"
        label="Manufacturer"
        :error="errorFor('manufacturer')"
        style="flex: 1"
      >
        <template #default="{ describedBy, invalid }">
          <InputText
            id="device-manufacturer"
            v-model="form.manufacturer"
            maxlength="120"
            style="width: 100%"
            :aria-describedby="describedBy"
            :invalid="invalid"
          />
        </template>
      </FormField>

      <FormField id="device-model" label="Model" :error="errorFor('model')" style="flex: 1">
        <template #default="{ describedBy, invalid }">
          <InputText
            id="device-model"
            v-model="form.model"
            maxlength="120"
            style="width: 100%"
            :aria-describedby="describedBy"
            :invalid="invalid"
          />
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
          <InputText
            id="device-serial-number"
            v-model="form.serialNumber"
            maxlength="160"
            style="width: 100%"
            :aria-describedby="describedBy"
            :invalid="invalid"
          />
        </template>
      </FormField>

      <FormField
        id="device-ip-address"
        label="IP address"
        :error="errorFor('ipAddress')"
        style="flex: 1"
      >
        <template #default="{ describedBy, invalid }">
          <InputText
            id="device-ip-address"
            v-model="form.ipAddress"
            placeholder="192.168.1.10"
            style="width: 100%"
            :aria-describedby="describedBy"
            :invalid="invalid"
          />
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
        />
      </template>
    </FormField>

    <fieldset>
      <legend>Location</legend>
      <SelectButton
        v-model="form.locationState"
        :options="locationOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Location"
      />

      <FormField
        v-if="form.locationState === 'in_room'"
        id="device-room"
        label="Room"
        required
        :error="errorFor('roomId')"
        style="margin-top: var(--space-4)"
      >
        <template #default="{ describedBy, invalid }">
          <Select
            v-model="form.roomId"
            input-id="device-room"
            :options="roomGroups"
            option-group-label="label"
            option-group-children="items"
            option-label="label"
            option-value="value"
            placeholder="Select a room"
            style="width: 100%"
            :aria-describedby="describedBy"
            :invalid="invalid"
          />
        </template>
      </FormField>
    </fieldset>

    <FormField id="device-notes" label="Notes" :error="errorFor('notes')">
      <template #default="{ describedBy, invalid }">
        <Textarea
          id="device-notes"
          v-model="form.notes"
          maxlength="5000"
          rows="4"
          style="width: 100%"
          :aria-describedby="describedBy"
          :invalid="invalid"
        />
      </template>
    </FormField>

    <div class="row" style="justify-content: flex-end">
      <Button type="button" label="Cancel" severity="secondary" outlined @click="emit('cancel')" />
      <Button type="submit" :label="saving ? 'Saving…' : 'Save device'" :disabled="saving" />
    </div>
  </form>
</template>
