<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import type { HomeDto } from '../../shared/types/domain'
import { ApiRequestError } from '../composables/useApiClient'
import { useHomesApi } from '../composables/useHomesApi'

const props = defineProps<{
  home?: HomeDto | null
}>()

const emit = defineEmits<{
  saved: [HomeDto]
  cancel: []
}>()

const homesApi = useHomesApi()
const toast = useToast()
const name = ref(props.home?.name ?? '')
const error = ref('')
const fieldError = ref('')
const saving = ref(false)

const isEdit = computed(() => Boolean(props.home))

async function onSubmit() {
  error.value = ''
  fieldError.value = ''
  saving.value = true
  try {
    const result = props.home
      ? await homesApi.update(props.home.id, { name: name.value, version: props.home.version })
      : await homesApi.create({ name: name.value })
    toast.add({
      severity: 'success',
      summary: props.home ? 'Home renamed' : 'Home created',
      life: 3000
    })
    emit('saved', result)
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.code === 'CONFLICT') {
        error.value = 'This home changed elsewhere. Reload and try again.'
      } else {
        fieldError.value = err.fieldErrors?.name?.join(' ') ?? err.message
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
      <h2 :id="headerId" :class="headerClass">{{ isEdit ? 'Rename home' : 'Create home' }}</h2>
    </template>

    <form id="home-form" class="stack" @submit.prevent="onSubmit">
      <Message v-if="error" severity="error">{{ error }}</Message>
      <FormField id="home-name" label="Home name" required :error="fieldError">
        <template #default="{ describedBy, invalid }">
          <InputText
            id="home-name"
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
        form="home-form"
        :label="saving ? 'Saving…' : 'Save'"
        :disabled="saving"
      />
    </template>
  </Dialog>
</template>
