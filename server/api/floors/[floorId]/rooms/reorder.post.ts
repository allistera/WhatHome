import { readBody } from 'h3'
import { reorderRoomsSchema } from '../../../../../shared/schemas/room'
import { reorderRooms } from '../../../../services/room.service'
import { defineApiHandler, parseWithSchema } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { successResponse } from '../../../../utils/response'

export default defineApiHandler(async (event) => {
  const floorId = requireUuidRouteParam(event, 'floorId')
  const body = parseWithSchema(reorderRoomsSchema, await readBody(event))
  const rooms = await reorderRooms(floorId, body)
  return successResponse(rooms)
})
