<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const homeId = route.params.homeId as string

function onSaved(device: { id: string }) {
  router.push(`/homes/${homeId}/devices/${device.id}`)
}

function onCancel() {
  router.push(`/homes/${homeId}/devices`)
}
</script>

<template>
  <div class="stack">
    <NuxtLink :to="`/homes/${homeId}/devices`">← Back to inventory</NuxtLink>
    <h1>Add device</h1>
    <DeviceForm :home-id="homeId" @saved="onSaved" @cancel="onCancel" />
  </div>
</template>
