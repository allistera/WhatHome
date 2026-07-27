<script setup lang="ts">
import Button from 'primevue/button'
import { useFloorsApi } from '../composables/useFloorsApi'
import { useHomesApi } from '../composables/useHomesApi'
import { useRoomsApi } from '../composables/useRoomsApi'

const route = useRoute()
const homesApi = useHomesApi()
const floorsApi = useFloorsApi()
const roomsApi = useRoomsApi()

const activeHomeId = computed(() => {
  const id = route.params.homeId
  return typeof id === 'string' ? id : null
})

// Reactive keys matching the home page's useAsyncData keys so the sidebar
// shares the same cached data and updates live when floors/rooms change there.
const { data: activeHome } = await useAsyncData(
  () => `home-${activeHomeId.value}`,
  () => (activeHomeId.value ? homesApi.get(activeHomeId.value) : Promise.resolve(null))
)

const { data: floors } = await useAsyncData(
  () => `floors-${activeHomeId.value}`,
  () => (activeHomeId.value ? floorsApi.list(activeHomeId.value) : Promise.resolve([]))
)

const { data: rooms } = await useAsyncData(
  () => `rooms-${activeHomeId.value}`,
  () => (activeHomeId.value ? roomsApi.listForHome(activeHomeId.value) : Promise.resolve([]))
)

const floorsWithRooms = computed(() => {
  if (!floors.value) return []
  return floors.value.map((floor) => ({
    ...floor,
    rooms: (rooms.value ?? []).filter((room) => room.floorId === floor.id)
  }))
})

const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  }
)

function isActiveHomeOverview() {
  return !!activeHomeId.value && route.path === `/homes/${activeHomeId.value}`
}

function isActiveInventory() {
  return route.path === `/homes/${activeHomeId.value}/devices` && !route.query.roomId
}

function isActiveRoom(roomId: string) {
  return route.path === `/homes/${activeHomeId.value}/devices` && route.query.roomId === roomId
}
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to main content</a>

    <div v-if="sidebarOpen" class="app-sidebar-backdrop" @click="closeSidebar" />

    <aside class="app-sidebar" :class="{ 'is-open': sidebarOpen }" aria-label="Primary">
      <NuxtLink to="/" class="app-sidebar-brand">
        <span class="app-sidebar-brand-mark" aria-hidden="true">W</span>
        WhatHome
      </NuxtLink>

      <nav class="stack" style="gap: var(--space-1)">
        <NuxtLink to="/" class="app-nav-link" :class="{ 'is-active': route.path === '/' }">
          <span aria-hidden="true">🏠</span>
          All homes
        </NuxtLink>
      </nav>

      <div v-if="activeHomeId && activeHome" class="stack" style="gap: var(--space-1)">
        <p class="app-nav-section-label">Current home</p>
        <nav class="stack" style="gap: var(--space-1)">
          <NuxtLink
            :to="`/homes/${activeHomeId}`"
            class="app-nav-link"
            :class="{ 'is-active': isActiveHomeOverview() }"
          >
            <span class="app-home-dot" aria-hidden="true" />
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
              {{ activeHome.name }}
            </span>
          </NuxtLink>

          <NuxtLink
            :to="`/homes/${activeHomeId}/devices`"
            class="app-nav-link"
            :class="{ 'is-active': isActiveInventory() }"
          >
            <span aria-hidden="true">📦</span>
            Inventory
          </NuxtLink>

          <p v-if="floorsWithRooms.length === 0" class="hint" style="padding-inline: var(--space-5)">
            No floors yet.
          </p>

          <div v-for="floor in floorsWithRooms" :key="floor.id" class="stack" style="gap: var(--space-1)">
            <p class="app-nav-section-label" style="padding-left: var(--space-5)">
              {{ floor.name }}
            </p>
            <NuxtLink
              v-for="room in floor.rooms"
              :key="room.id"
              :to="`/homes/${activeHomeId}/devices?roomId=${room.id}`"
              class="app-nav-link"
              style="padding-left: var(--space-6)"
              :class="{ 'is-active': isActiveRoom(room.id) }"
            >
              {{ room.name }}
            </NuxtLink>
            <p v-if="floor.rooms.length === 0" class="hint" style="padding-inline: var(--space-6)">
              No rooms yet.
            </p>
          </div>
        </nav>
      </div>
    </aside>

    <div class="app-content">
      <header class="app-topbar">
        <Button
          icon="pi pi-bars"
          severity="secondary"
          outlined
          aria-label="Open navigation"
          @click="sidebarOpen = true"
        />
        <NuxtLink to="/" style="font-weight: 800">WhatHome</NuxtLink>
      </header>

      <main id="main-content" class="container">
        <slot />
      </main>
    </div>
  </div>
</template>
