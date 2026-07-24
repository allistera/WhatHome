import { getHomeDeletionImpact } from '../../../services/home.service'
import { defineApiHandler } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const impact = await getHomeDeletionImpact(homeId)
  return successResponse(impact)
})
