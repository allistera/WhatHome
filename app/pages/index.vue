<script setup lang="ts">
import type { HomeSummaryDto } from '../../shared/types/domain'
import { ApiRequestError } from '../composables/useApiClient'
import { useHomesApi } from '../composables/useHomesApi'

const homesApi = useHomesApi()

const { data: homes, refresh, pending, error: loadError } = await useAsyncData('homes', () => homesApi.list())

const showCreateDialog = ref(false)
const editingHome = ref<HomeSummaryDto | null>(null)
const deletingHome = ref<HomeSummaryDto | null>(null)
const deletionImpact = ref<{ floors: number; rooms: number; devices: number } | null>(null)
const deleteError = ref('')
const deleteBusy = ref(false)

async function openDeleteDialog(home: HomeSummaryDto) {
  deletingHome.value = home
  deleteError.value = ''
  deletionImpact.value = null
  const impact = await homesApi.deletionImpact(home.id)
  deletionImpact.value = { floors: impact.floors, rooms: impact.rooms, devices: impact.devices }
}

function closeDeleteDialog() {
  deletingHome.value = null
  deletionImpact.value = null
}

async function confirmDelete(typedName: string) {
  if (!deletingHome.value) return
  deleteBusy.value = true
  deleteError.value = ''
  try {
    await homesApi.remove(deletingHome.value.id, {
      name: typedName,
      version: deletingHome.value.version
    })
    closeDeleteDialog()
    await refresh()
  } catch (err) {
    deleteError.value = err instanceof ApiRequestError ? err.message : 'Failed to delete home.'
  } finally {
    deleteBusy.value = false
  }
}

function onSaved() {
  showCreateDialog.value = false
  editingHome.value = null
  refresh()
}
</script>

<template>
  <div class="stack">
    <div class="row-between">
      <h1>Homes</h1>
      <button type="button" class="btn btn-primary" @click="showCreateDialog = true">Add home</button>
    </div>

    <p v-if="pending">Loading homes…</p>
    <p v-else-if="loadError" class="alert" role="alert">Failed to load homes.</p>

    <div v-else-if="homes && homes.length === 0" class="empty-state">
      <p>You haven't added any homes yet.</p>
      <button type="button" class="btn btn-primary" @click="showCreateDialog = true">
        Create your first home
      </button>
    </div>

    <ul v-else class="stack" style="list-style: none; padding: 0">
      <li v-for="home in homes" :key="home.id" class="card">
        <div class="row-between">
          <div>
            <NuxtLink :to="`/homes/${home.id}`" style="font-size: 1.125rem; font-weight: 700">
              {{ home.name }}
            </NuxtLink>
            <p class="hint">
              {{ home.floorCount }} {{ home.floorCount === 1 ? 'floor' : 'floors' }} ·
              {{ home.roomCount }} {{ home.roomCount === 1 ? 'room' : 'rooms' }} ·
              {{ home.deviceCount }} {{ home.deviceCount === 1 ? 'device' : 'devices' }}
            </p>
          </div>
          <div class="row">
            <NuxtLink :to="`/homes/${home.id}`" class="btn btn-small">Open</NuxtLink>
            <button type="button" class="btn btn-small" @click="editingHome = home">Rename</button>
            <button type="button" class="btn btn-small btn-danger" @click="openDeleteDialog(home)">
              Delete
            </button>
          </div>
        </div>
      </li>
    </ul>

    <HomeFormDialog v-if="showCreateDialog" @saved="onSaved" @cancel="showCreateDialog = false" />
    <HomeFormDialog
      v-if="editingHome"
      :home="editingHome"
      @saved="onSaved"
      @cancel="editingHome = null"
    />

    <ConfirmDialog
      v-if="deletingHome"
      title="Delete home"
      danger
      confirm-label="Delete home"
      :confirmation-text="deletingHome.name"
      :busy="deleteBusy"
      @cancel="closeDeleteDialog"
      @confirm="confirmDelete"
    >
      <p>
        This will permanently delete <strong>{{ deletingHome.name }}</strong> and everything in it.
      </p>
      <p v-if="deletionImpact">
        This includes {{ deletionImpact.floors }} floors, {{ deletionImpact.rooms }} rooms, and
        {{ deletionImpact.devices }} devices. This action cannot be undone.
      </p>
      <p v-if="deleteError" class="alert" role="alert">{{ deleteError }}</p>
    </ConfirmDialog>
  </div>
</template>
