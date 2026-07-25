<script setup lang="ts">
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
const name = ref(props.home?.name ?? '')
const error = ref('')
const fieldError = ref('')
const saving = ref(false)

const isEdit = computed(() => Boolean(props.home))
const nameInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  nextTick(() => nameInput.value?.focus())
})

async function onSubmit() {
  error.value = ''
  fieldError.value = ''
  saving.value = true
  try {
    const result = props.home
      ? await homesApi.update(props.home.id, { name: name.value, version: props.home.version })
      : await homesApi.create({ name: name.value })
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
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div class="modal stack" role="dialog" aria-modal="true" aria-labelledby="home-form-title">
      <h2 id="home-form-title">{{ isEdit ? 'Rename home' : 'Create home' }}</h2>
      <form class="stack" @submit.prevent="onSubmit">
        <p v-if="error" class="alert" role="alert">{{ error }}</p>
        <FormField id="home-name" label="Home name" required :error="fieldError">
          <template #default="{ describedBy, invalid }">
            <input
              id="home-name"
              ref="nameInput"
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
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
