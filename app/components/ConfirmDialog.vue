<script setup lang="ts">
const props = defineProps<{
  title: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  /** When set, the user must type this exact text to enable the confirm button. */
  confirmationText?: string
}>()

const emit = defineEmits<{
  confirm: [typedConfirmation: string]
  cancel: []
}>()

const typedConfirmation = ref('')
const dialogRef = ref<HTMLElement | null>(null)

const canConfirm = computed(() => {
  if (!props.confirmationText) return true
  return typedConfirmation.value.trim() === props.confirmationText
})

onMounted(() => {
  dialogRef.value?.focus()
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('cancel')
  }
}
</script>

<template>
  <div class="modal-backdrop" @keydown="onKeydown" @click.self="emit('cancel')">
    <div ref="dialogRef" class="modal stack" role="alertdialog" aria-modal="true" :aria-labelledby="'confirm-title'" tabindex="-1">
      <h2 id="confirm-title">{{ title }}</h2>
      <div class="stack">
        <slot />
      </div>
      <FormField
        v-if="confirmationText"
        id="confirm-typed-text"
        :label="`Type &quot;${confirmationText}&quot; to confirm`"
      >
        <template #default="{ describedBy }">
          <input
            id="confirm-typed-text"
            v-model="typedConfirmation"
            type="text"
            :aria-describedby="describedBy"
            autocomplete="off"
          >
        </template>
      </FormField>
      <div class="row" style="justify-content: flex-end">
        <button type="button" class="btn" @click="emit('cancel')">Cancel</button>
        <button
          type="button"
          class="btn"
          :class="danger ? 'btn-danger' : 'btn-primary'"
          :disabled="!canConfirm || busy"
          @click="emit('confirm', typedConfirmation)"
        >
          {{ busy ? 'Working…' : (confirmLabel ?? 'Confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>
