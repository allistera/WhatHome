import { listFloors } from '../../../../services/floor.service'
import { defineApiHandler } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { successResponse } from '../../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const floors = await listFloors(homeId)
  return successResponse(floors)
})
