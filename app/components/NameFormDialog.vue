<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
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
const toast = useToast()

async function handleSubmit() {
  error.value = ''
  fieldError.value = ''
  saving.value = true
  try {
    await props.onSubmit(name.value)
    toast.add({ severity: 'success', summary: props.title, life: 3000 })
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

function onVisibleChange(visible: boolean) {
  if (!visible) emit('cancel')
}
</script>

<template>
  <Dialog
    :visible="true"
    modal
    dismissable-mask
    :style="{ width: '28rem' }"
    @update:visible="onVisibleChange"
  >
    <template #header="{ class: headerClass, headerId }">
      <h2 :id="headerId" :class="headerClass">{{ title }}</h2>
    </template>

    <form id="name-form" class="stack" @submit.prevent="handleSubmit">
      <Message v-if="error" severity="error">{{ error }}</Message>
      <FormField id="name-form-input" :label="label ?? 'Name'" required :error="fieldError">
        <template #default="{ describedBy, invalid }">
          <InputText
            id="name-form-input"
            v-model="name"
            autofocus
            required
            maxlength="120"
            style="width: 100%"
            :aria-describedby="describedBy"
            :invalid="invalid"
          />
        </template>
      </FormField>
    </form>

    <template #footer>
      <Button label="Cancel" severity="secondary" outlined @click="emit('cancel')" />
      <Button
        type="submit"
        form="name-form"
        :label="saving ? 'Saving…' : (submitLabel ?? 'Save')"
        :disabled="saving"
      />
    </template>
  </Dialog>
</template>
