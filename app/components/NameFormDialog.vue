<script setup lang="ts">
import { ApiRequestError } from '../composables/useApiClient'

const props = defineProps<{
  title: string
  label?: string
  initialName?: string
  submitLabel?: string
  onSubmit: (name: string) => Promise<void>
}>()

const emit = defineEmits<{
  cancel: []
}>()

const name = ref(props.initialName ?? '')
const error = ref('')
const fieldError = ref('')
const saving = ref(false)

async function handleSubmit() {
  error.value = ''
  fieldError.value = ''
  saving.value = true
  try {
    await props.onSubmit(name.value)
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.code === 'DUPLICATE_NAME') {
        fieldError.value = err.message
      } else if (err.code === 'CONFLICT') {
        error.value = 'This item changed elsewhere. Reload and try again.'
      } else if (err.fieldErrors?.name) {
        fieldError.value = err.fieldErrors.name.join(' ')
      } else {
        error.value = err.message
      }
    } else {
      error.value = 'Something went wrong. Please try again.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div class="modal stack" role="dialog" aria-modal="true" aria-labelledby="name-form-title">
      <h2 id="name-form-title">{{ title }}</h2>
      <form class="stack" @submit.prevent="handleSubmit">
        <p v-if="error" class="alert" role="alert">{{ error }}</p>
        <FormField id="name-form-input" :label="label ?? 'Name'" required :error="fieldError">
          <template #default="{ describedBy, invalid }">
            <input
              id="name-form-input"
              v-model="name"
              type="text"
              required
              maxlength="120"
              :aria-describedby="describedBy"
              :aria-invalid="invalid"
            >
          </template>
        </FormField>
        <div class="row" style="justify-content: flex-end">
          <button type="button" class="btn" @click="emit('cancel')">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving…' : (submitLabel ?? 'Save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
