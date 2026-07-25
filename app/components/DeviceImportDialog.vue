<script setup lang="ts">
import type { DeviceImportColumn } from '../../shared/schemas/device-import'
import type { DeviceImportSummary } from '../../shared/types/domain'
import { apiGet, ApiRequestError } from '../composables/useApiClient'
import { useDevicesApi } from '../composables/useDevicesApi'

const props = defineProps<{
  homeId: string
}>()

const emit = defineEmits<{
  imported: []
  cancel: []
}>()

const devicesApi = useDevicesApi()

const { data: columns } = await useAsyncData(
  'device-import-columns',
  async () => (await apiGet<DeviceImportColumn[]>('/api/device-import/columns')).data
)

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const importing = ref(false)
const formError = ref('')
const summary = ref<DeviceImportSummary | null>(null)

onMounted(() => {
  nextTick(() => fileInput.value?.focus())
})

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  selectedFile.value = file
  summary.value = null
  formError.value = ''
}

async function onImport() {
  if (!selectedFile.value) return
  importing.value = true
  formError.value = ''
  summary.value = null
  try {
    summary.value = await devicesApi.importCsv(props.homeId, selectedFile.value)
    if (summary.value.created > 0) {
      emit('imported')
    }
  } catch (err) {
    formError.value = err instanceof ApiRequestError ? err.message : 'Failed to import the CSV file.'
  } finally {
    importing.value = false
  }
}

function reset() {
  selectedFile.value = null
  summary.value = null
  formError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div class="modal stack" role="dialog" aria-modal="true" aria-labelledby="import-dialog-title" style="max-width: 40rem">
      <h2 id="import-dialog-title">Import devices from CSV</h2>

      <div class="stack">
        <p class="hint">
          The first row must be a header row. Column names are matched flexibly (case and spacing don't
          matter), and extra columns are ignored.
        </p>

        <div class="table-scroll">
          <table>
            <caption class="visually-hidden">CSV columns</caption>
            <thead>
              <tr>
                <th scope="col">Column</th>
                <th scope="col">Required</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="column in columns ?? []" :key="column.key">
                <td style="font-weight: 600">{{ column.label }}</td>
                <td>
                  <span v-if="column.required" class="badge badge-unassigned">Required</span>
                  <span v-else class="hint">Optional</span>
                </td>
                <td class="hint">{{ column.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <a class="btn btn-small" href="/api/device-import/template" download="whathome-device-import-template.csv">
            Download CSV template
          </a>
        </div>
      </div>

      <div v-if="!summary" class="stack">
        <p v-if="formError" class="alert" role="alert">{{ formError }}</p>

        <div class="field">
          <label for="import-file">CSV file</label>
          <input
            id="import-file"
            ref="fileInput"
            type="file"
            accept=".csv,text/csv"
            @change="onFileChange"
          >
        </div>

        <div class="row" style="justify-content: flex-end">
          <button type="button" class="btn" @click="emit('cancel')">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!selectedFile || importing"
            @click="onImport"
          >
            {{ importing ? 'Importing…' : 'Import' }}
          </button>
        </div>
      </div>

      <div v-else class="stack">
        <p>
          <strong>{{ summary.created }}</strong> of {{ summary.totalRows }} rows imported successfully.
          <span v-if="summary.failed > 0">{{ summary.failed }} row(s) failed.</span>
        </p>

        <ul v-if="summary.failed > 0" class="stack" style="list-style: none; padding: 0; max-height: 16rem; overflow-y: auto">
          <li v-for="result in summary.results.filter((r) => r.status === 'error')" :key="result.row" class="card">
            <p style="font-weight: 600">Row {{ result.row }}</p>
            <p class="field-error">{{ result.error }}</p>
            <ul v-if="result.fieldErrors">
              <li v-for="(messages, field) in result.fieldErrors" :key="field" class="hint">
                {{ field }}: {{ messages.join(' ') }}
              </li>
            </ul>
          </li>
        </ul>

        <div class="row" style="justify-content: flex-end">
          <button v-if="summary.failed > 0" type="button" class="btn" @click="reset">
            Import another file
          </button>
          <button type="button" class="btn btn-primary" @click="emit('cancel')">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>
