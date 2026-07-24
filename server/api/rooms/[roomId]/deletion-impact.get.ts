import { getRoomDeletionImpact } from '../../../services/room.service'
import { defineApiHandler } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const roomId = requireUuidRouteParam(event, 'roomId')
  const impact = await getRoomDeletionImpact(roomId)
  return successResponse(impact)
})
