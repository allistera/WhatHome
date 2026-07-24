<script setup lang="ts">
import { useHomesApi } from '../composables/useHomesApi'

const route = useRoute()
const homesApi = useHomesApi()

const { data: homes } = await useAsyncData('sidebar-homes', () => homesApi.list())

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

function isActiveHome(homeId: string) {
  return route.path.startsWith(`/homes/${homeId}`)
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

      <div class="stack" style="gap: var(--space-1)">
        <p class="app-nav-section-label">Homes</p>
        <nav class="stack" style="gap: var(--space-1)">
          <NuxtLink
            v-for="home in homes"
            :key="home.id"
            :to="`/homes/${home.id}`"
            class="app-nav-link"
            :class="{ 'is-active': isActiveHome(home.id) }"
          >
            <span class="app-home-dot" aria-hidden="true" />
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
              {{ home.name }}
            </span>
          </NuxtLink>
          <p v-if="homes && homes.length === 0" class="hint" style="padding-inline: var(--space-3)">
            No homes yet.
          </p>
        </nav>
      </div>
    </aside>

    <div class="app-content">
      <header class="app-topbar">
        <button
          type="button"
          class="app-menu-button"
          aria-label="Open navigation"
          @click="sidebarOpen = true"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <NuxtLink to="/" style="font-weight: 800">WhatHome</NuxtLink>
      </header>

      <main id="main-content" class="container">
        <slot />
      </main>
    </div>
  </div>
</template>
