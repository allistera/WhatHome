import { listRoomsForHome } from '../../../../services/room.service'
import { defineApiHandler } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { successResponse } from '../../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const rooms = await listRoomsForHome(homeId)
  return successResponse(rooms)
})
