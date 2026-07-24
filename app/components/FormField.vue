<script setup lang="ts">
const props = defineProps<{
  id: string
  label: string
  error?: string | string[]
  hint?: string
  required?: boolean
}>()

const errorId = computed(() => `${props.id}-error`)
const hintId = computed(() => `${props.id}-hint`)

const errorMessage = computed(() => {
  if (!props.error) return ''
  return Array.isArray(props.error) ? props.error.join(' ') : props.error
})

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(hintId.value)
  if (errorMessage.value) ids.push(errorId.value)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}<span v-if="required" aria-hidden="true"> *</span></label>
    <slot :described-by="describedBy" :invalid="Boolean(errorMessage)" />
    <p v-if="hint" :id="hintId" class="hint">{{ hint }}</p>
    <p v-if="errorMessage" :id="errorId" class="field-error" role="alert">{{ errorMessage }}</p>
  </div>
</template>
