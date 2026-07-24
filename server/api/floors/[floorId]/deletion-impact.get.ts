import { getFloorDeletionImpact } from '../../../services/floor.service'
import { defineApiHandler } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const floorId = requireUuidRouteParam(event, 'floorId')
  const impact = await getFloorDeletionImpact(floorId)
  return successResponse(impact)
})
