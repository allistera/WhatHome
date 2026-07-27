<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'

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

const canConfirm = computed(() => {
  if (!props.confirmationText) return true
  return typedConfirmation.value.trim() === props.confirmationText
})

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

    <div class="stack">
      <slot />

      <FormField
        v-if="confirmationText"
        id="confirm-typed-text"
        :label="`Type &quot;${confirmationText}&quot; to confirm`"
      >
        <template #default="{ describedBy }">
          <InputText
            id="confirm-typed-text"
            v-model="typedConfirmation"
            autocomplete="off"
            style="width: 100%"
            :aria-describedby="describedBy"
          />
        </template>
      </FormField>
    </div>

    <template #footer>
      <Button label="Cancel" severity="secondary" outlined @click="emit('cancel')" />
      <Button
        :label="busy ? 'Working…' : (confirmLabel ?? 'Confirm')"
        :severity="danger ? 'danger' : 'primary'"
        :disabled="!canConfirm || busy"
        @click="emit('confirm', typedConfirmation)"
      />
    </template>
  </Dialog>
</template>
