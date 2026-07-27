<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import type { FloorDto, HomeDto, RoomDto } from '../../../../shared/types/domain'
import { ApiRequestError } from '../../../composables/useApiClient'
import { useFloorsApi } from '../../../composables/useFloorsApi'
import { useHomesApi } from '../../../composables/useHomesApi'
import { useRoomsApi } from '../../../composables/useRoomsApi'

const route = useRoute()
const router = useRouter()
const homeId = route.params.homeId as string

const homesApi = useHomesApi()
const floorsApi = useFloorsApi()
const roomsApi = useRoomsApi()
const toast = useToast()

const { data: home, error: homeError } = await useAsyncData(`home-${homeId}`, () =>
  homesApi.get(homeId)
)
const { data: overview, refresh: refreshOverview } = await useAsyncData(
  `home-overview-${homeId}`,
  () => homesApi.overview(homeId)
)
const { data: floors, refresh: refreshFloors } = await useAsyncData(`floors-${homeId}`, () =>
  floorsApi.list(homeId)
)
const { data: rooms, refresh: refreshRooms } = await useAsyncData(`rooms-${homeId}`, () =>
  roomsApi.listForHome(homeId)
)

const notFound = computed(
  () => homeError.value instanceof ApiRequestError && homeError.value.status === 404
)

const floorsWithRooms = computed(() => {
  if (!floors.value) return []
  return floors.value.map((floor) => ({
    ...floor,
    rooms: (rooms.value ?? []).filter((room) => room.floorId === floor.id)
  }))
})

async function refreshAll() {
  await Promise.all([refreshOverview(), refreshFloors(), refreshRooms()])
}

// --- Home actions ---
const editingHome = ref(false)
const deletingHome = ref(false)
const homeDeletionImpact = ref<{ floors: number; rooms: number; devices: number } | null>(null)
const homeDeleteError = ref('')
const homeDeleteBusy = ref(false)

async function openDeleteHome() {
  if (!home.value) return
  deletingHome.value = true
  homeDeleteError.value = ''
  const impact = await homesApi.deletionImpact(home.value.id)
  homeDeletionImpact.value = { floors: impact.floors, rooms: impact.rooms, devices: impact.devices }
}

async function confirmDeleteHome(typedName: string) {
  if (!home.value) return
  homeDeleteBusy.value = true
  homeDeleteError.value = ''
  try {
    await homesApi.remove(home.value.id, { name: typedName, version: home.value.version })
    toast.add({ severity: 'success', summary: 'Home deleted', life: 3000 })
    router.push('/')
  } catch (err) {
    homeDeleteError.value = err instanceof ApiRequestError ? err.message : 'Failed to delete home.'
  } finally {
    homeDeleteBusy.value = false
  }
}

// --- Floor actions ---
const addingFloor = ref(false)
const editingFloor = ref<FloorDto | null>(null)
const deletingFloor = ref<FloorDto | null>(null)
const floorDeletionImpact = ref<{ roomCount: number; deviceCount: number } | null>(null)
const floorDeleteError = ref('')
const floorDeleteBusy = ref(false)

async function openDeleteFloor(floor: FloorDto) {
  deletingFloor.value = floor
  floorDeleteError.value = ''
  floorDeletionImpact.value = await floorsApi.deletionImpact(floor.id)
}

async function confirmDeleteFloor() {
  if (!deletingFloor.value) return
  floorDeleteBusy.value = true
  floorDeleteError.value = ''
  try {
    await floorsApi.remove(deletingFloor.value.id, deletingFloor.value.version)
    deletingFloor.value = null
    toast.add({ severity: 'success', summary: 'Floor deleted', life: 3000 })
    await refreshAll()
  } catch (err) {
    floorDeleteError.value =
      err instanceof ApiRequestError ? err.message : 'Failed to delete floor.'
  } finally {
    floorDeleteBusy.value = false
  }
}

async function moveFloor(index: number, direction: -1 | 1) {
  const list = floors.value
  if (!list) return
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= list.length) return
  const reordered = [...list]
  const [moved] = reordered.splice(index, 1)
  reordered.splice(targetIndex, 0, moved!)
  await floorsApi.reorder(homeId, { floorIds: reordered.map((f) => f.id) })
  toast.add({ severity: 'success', summary: 'Floor order updated', life: 2000 })
  await refreshFloors()
}

// --- Room actions ---
const addingRoomForFloor = ref<FloorDto | null>(null)
const editingRoom = ref<RoomDto | null>(null)
const deletingRoom = ref<RoomDto | null>(null)
const roomDeletionImpact = ref<{ deviceCount: number } | null>(null)
const roomDeleteError = ref('')
const roomDeleteBusy = ref(false)

async function openDeleteRoom(room: RoomDto) {
  deletingRoom.value = room
  roomDeleteError.value = ''
  roomDeletionImpact.value = await roomsApi.deletionImpact(room.id)
}

async function confirmDeleteRoom() {
  if (!deletingRoom.value) return
  roomDeleteBusy.value = true
  roomDeleteError.value = ''
  try {
    await roomsApi.remove(deletingRoom.value.id, deletingRoom.value.version)
    deletingRoom.value = null
    toast.add({ severity: 'success', summary: 'Room deleted', life: 3000 })
    await refreshAll()
  } catch (err) {
    roomDeleteError.value = err instanceof ApiRequestError ? err.message : 'Failed to delete room.'
  } finally {
    roomDeleteBusy.value = false
  }
}

async function moveRoom(floor: FloorDto & { rooms: RoomDto[] }, index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= floor.rooms.length) return
  const reordered = [...floor.rooms]
  const [moved] = reordered.splice(index, 1)
  reordered.splice(targetIndex, 0, moved!)
  await roomsApi.reorder(floor.id, { roomIds: reordered.map((r) => r.id) })
  toast.add({ severity: 'success', summary: 'Room order updated', life: 2000 })
  await refreshRooms()
}

function onHomeSaved(updated: HomeDto) {
  editingHome.value = false
  home.value = updated
}
</script>

<template>
  <div v-if="notFound" class="empty-state">
    <p>This home could not be found.</p>
    <NuxtLink to="/" class="btn btn-primary">Back to homes</NuxtLink>
  </div>

  <div v-else-if="home" class="stack">
    <div class="row-between">
      <div>
        <NuxtLink to="/">← All homes</NuxtLink>
        <h1>{{ home.name }}</h1>
      </div>
      <div class="row">
        <Button label="Rename" severity="secondary" outlined @click="editingHome = true" />
        <Button label="Delete home" severity="danger" outlined @click="openDeleteHome" />
      </div>
    </div>

    <section class="card stack" aria-labelledby="overview-heading">
      <h2 id="overview-heading">Overview</h2>
      <div class="row" style="gap: var(--space-5)">
        <p>
          <strong>{{ overview?.deviceCounts.total ?? 0 }}</strong> total devices
        </p>
        <p>
          <strong>{{ overview?.deviceCounts.inRoom ?? 0 }}</strong> in rooms
        </p>
        <p>
          <strong>{{ overview?.deviceCounts.inStorage ?? 0 }}</strong> in storage
        </p>
        <p>
          <strong>{{ overview?.deviceCounts.unassigned ?? 0 }}</strong> unassigned
        </p>
      </div>
      <div class="row">
        <NuxtLink :to="`/homes/${homeId}/devices`" class="btn btn-primary">View inventory</NuxtLink>
        <NuxtLink :to="`/homes/${homeId}/devices/new`" class="btn">Add device</NuxtLink>
      </div>
    </section>

    <section class="card stack" aria-labelledby="floors-heading">
      <div class="row-between">
        <h2 id="floors-heading">Floors &amp; rooms</h2>
        <Button label="Add floor" size="small" @click="addingFloor = true" />
      </div>

      <p v-if="floorsWithRooms.length === 0" class="hint">
        No floors yet. Add a floor before you can create rooms.
      </p>

      <ol v-else class="stack" style="list-style: none; padding: 0">
        <li v-for="(floor, floorIndex) in floorsWithRooms" :key="floor.id" class="card">
          <div class="row-between">
            <h3 style="margin: 0">{{ floor.name }}</h3>
            <div class="row">
              <Button
                icon="pi pi-arrow-up"
                size="small"
                severity="secondary"
                outlined
                :disabled="floorIndex === 0"
                aria-label="Move floor up"
                @click="moveFloor(floorIndex, -1)"
              />
              <Button
                icon="pi pi-arrow-down"
                size="small"
                severity="secondary"
                outlined
                :disabled="floorIndex === floorsWithRooms.length - 1"
                aria-label="Move floor down"
                @click="moveFloor(floorIndex, 1)"
              />
              <Button
                label="Rename"
                size="small"
                severity="secondary"
                outlined
                @click="editingFloor = floor"
              />
              <Button
                label="Add room"
                size="small"
                severity="secondary"
                outlined
                @click="addingRoomForFloor = floor"
              />
              <Button
                label="Delete"
                size="small"
                severity="danger"
                outlined
                @click="openDeleteFloor(floor)"
              />
            </div>
          </div>

          <p v-if="floor.rooms.length === 0" class="hint" style="margin-top: var(--space-5)">
            No rooms on this floor yet.
          </p>
          <ul
            v-else
            class="stack"
            style="
              list-style: none;
              padding-left: var(--space-4);
              margin: var(--space-5) 0 0;
              gap: var(--space-6);
            "
          >
            <li v-for="(room, roomIndex) in floor.rooms" :key="room.id" class="row-between">
              <NuxtLink :to="`/homes/${homeId}/devices?roomId=${room.id}`">{{
                room.name
              }}</NuxtLink>
              <div class="row">
                <Button
                  icon="pi pi-arrow-up"
                  size="small"
                  severity="secondary"
                  outlined
                  :disabled="roomIndex === 0"
                  aria-label="Move room up"
                  @click="moveRoom(floor, roomIndex, -1)"
                />
                <Button
                  icon="pi pi-arrow-down"
                  size="small"
                  severity="secondary"
                  outlined
                  :disabled="roomIndex === floor.rooms.length - 1"
                  aria-label="Move room down"
                  @click="moveRoom(floor, roomIndex, 1)"
                />
                <Button
                  label="Rename"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="editingRoom = room"
                />
                <Button
                  label="Delete"
                  size="small"
                  severity="danger"
                  outlined
                  @click="openDeleteRoom(room)"
                />
              </div>
            </li>
          </ul>
        </li>
      </ol>
    </section>

    <section class="card stack" aria-labelledby="recent-heading">
      <h2 id="recent-heading">Recent inventory changes</h2>
      <p v-if="!overview || overview.recentChanges.length === 0" class="hint">No recent changes.</p>
      <ul v-else class="stack" style="list-style: none; padding: 0">
        <li v-for="device in overview.recentChanges" :key="device.id">
          <NuxtLink :to="`/homes/${homeId}/devices/${device.id}`">{{ device.name }}</NuxtLink>
          <span class="hint"> · updated {{ new Date(device.updatedAt).toLocaleString() }}</span>
        </li>
      </ul>
    </section>

    <!-- Home dialogs -->
    <HomeFormDialog
      v-if="editingHome"
      :home="home"
      @saved="onHomeSaved"
      @cancel="editingHome = false"
    />
    <ConfirmDialog
      v-if="deletingHome"
      title="Delete home"
      danger
      confirm-label="Delete home"
      :confirmation-text="home.name"
      :busy="homeDeleteBusy"
      @cancel="deletingHome = false"
      @confirm="confirmDeleteHome"
    >
      <p>
        This will permanently delete <strong>{{ home.name }}</strong> and everything in it.
      </p>
      <p v-if="homeDeletionImpact">
        This includes {{ homeDeletionImpact.floors }} floors, {{ homeDeletionImpact.rooms }} rooms,
        and {{ homeDeletionImpact.devices }} devices. This action cannot be undone.
      </p>
      <Message v-if="homeDeleteError" severity="error">{{ homeDeleteError }}</Message>
    </ConfirmDialog>

    <!-- Floor dialogs -->
    <NameFormDialog
      v-if="addingFloor"
      title="Add floor"
      label="Floor name"
      submit-label="Add floor"
      :on-submit="
        async (name) => {
          await floorsApi.create(homeId, { name })
          addingFloor = false
          await refreshAll()
        }
      "
      @cancel="addingFloor = false"
    />
    <NameFormDialog
      v-if="editingFloor"
      title="Rename floor"
      label="Floor name"
      :initial-name="editingFloor.name"
      :on-submit="
        async (name) => {
          await floorsApi.update(editingFloor!.id, { name, version: editingFloor!.version })
          editingFloor = null
          await refreshAll()
        }
      "
      @cancel="editingFloor = null"
    />
    <ConfirmDialog
      v-if="deletingFloor"
      title="Delete floor"
      danger
      confirm-label="Delete floor"
      :busy="floorDeleteBusy"
      @cancel="deletingFloor = null"
      @confirm="confirmDeleteFloor"
    >
      <p>
        Delete <strong>{{ deletingFloor.name }}</strong
        >?
      </p>
      <p v-if="floorDeletionImpact">
        This will delete {{ floorDeletionImpact.roomCount }} rooms.
        {{ floorDeletionImpact.deviceCount }}
        devices will become unassigned.
      </p>
      <Message v-if="floorDeleteError" severity="error">{{ floorDeleteError }}</Message>
    </ConfirmDialog>

    <!-- Room dialogs -->
    <NameFormDialog
      v-if="addingRoomForFloor"
      title="Add room"
      label="Room name"
      submit-label="Add room"
      :on-submit="
        async (name) => {
          await roomsApi.create(addingRoomForFloor!.id, { name })
          addingRoomForFloor = null
          await refreshAll()
        }
      "
      @cancel="addingRoomForFloor = null"
    />
    <NameFormDialog
      v-if="editingRoom"
      title="Rename room"
      label="Room name"
      :initial-name="editingRoom.name"
      :on-submit="
        async (name) => {
          await roomsApi.update(editingRoom!.id, { name, version: editingRoom!.version })
          editingRoom = null
          await refreshAll()
        }
      "
      @cancel="editingRoom = null"
    />
    <ConfirmDialog
      v-if="deletingRoom"
      title="Delete room"
      danger
      confirm-label="Delete room"
      :busy="roomDeleteBusy"
      @cancel="deletingRoom = null"
      @confirm="confirmDeleteRoom"
    >
      <p>
        Delete <strong>{{ deletingRoom.name }}</strong
        >?
      </p>
      <p v-if="roomDeletionImpact">
        {{ roomDeletionImpact.deviceCount }} devices will become unassigned.
      </p>
      <Message v-if="roomDeleteError" severity="error">{{ roomDeleteError }}</Message>
    </ConfirmDialog>
  </div>
</template>
