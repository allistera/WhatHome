import { useDb } from '../db/client'
import type { CreateHomeInput, DeleteHomeInput, UpdateHomeInput } from '../../shared/schemas/home'
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors'
import {
  countHomeDescendants,
  deleteHomeById,
  findHomeById,
  insertHome,
  listHomeSummaries,
  updateHomeById
} from '../repositories/home.repository'
import { toHomeDto } from './mappers'
import type { HomeSummaryDto } from '../../shared/types/domain'

export async function listHomesSummary(): Promise<HomeSummaryDto[]> {
  const db = useDb()
  const summaries = await listHomeSummaries(db)
  return summaries.map((summary) => ({
    ...toHomeDto(summary),
    floorCount: summary.floorCount,
    roomCount: summary.roomCount,
    deviceCount: summary.deviceCount
  }))
}

export async function getHomeOrThrow(homeId: string) {
  const db = useDb()
  const home = await findHomeById(db, homeId)
  if (!home) {
    throw new NotFoundError('Home')
  }
  return home
}

export async function getHome(homeId: string) {
  const home = await getHomeOrThrow(homeId)
  return toHomeDto(home)
}

export async function createHome(input: CreateHomeInput) {
  const db = useDb()
  const home = await insertHome(db, { name: input.name })
  return toHomeDto(home)
}

export async function updateHome(homeId: string, input: UpdateHomeInput) {
  const db = useDb()
  const existing = await findHomeById(db, homeId)
  if (!existing) {
    throw new NotFoundError('Home')
  }
  if (existing.version !== input.version) {
    throw new ConflictError()
  }

  const updated = await updateHomeById(
    db,
    homeId,
    {
      name: input.name,
      version: existing.version + 1,
      updatedAt: new Date()
    },
    input.version
  )
  if (!updated) {
    throw new ConflictError()
  }
  return toHomeDto(updated)
}

export async function getHomeDeletionImpact(homeId: string) {
  const db = useDb()
  const home = await findHomeById(db, homeId)
  if (!home) {
    throw new NotFoundError('Home')
  }
  const counts = await countHomeDescendants(db, homeId)
  return { home: toHomeDto(home), ...counts }
}

export async function deleteHome(homeId: string, input: DeleteHomeInput) {
  const db = useDb()
  const home = await findHomeById(db, homeId)
  if (!home) {
    throw new NotFoundError('Home')
  }
  if (home.version !== input.version) {
    throw new ConflictError()
  }
  if (home.name.trim().toLowerCase() !== input.name.trim().toLowerCase()) {
    throw new ValidationError({ name: ['Enter the home name exactly to confirm deletion.'] })
  }

  await db.transaction(async (tx) => {
    const deleted = await deleteHomeById(tx, homeId, input.version)
    if (!deleted) {
      throw new ConflictError()
    }
  })
}
