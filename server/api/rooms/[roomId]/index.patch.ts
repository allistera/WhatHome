import { readBody } from 'h3'
import { updateRoomSchema } from '../../../../shared/schemas/room'
import { updateRoom } from '../../../services/room.service'
import { defineApiHandler, parseWithSchema } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const roomId = requireUuidRouteParam(event, 'roomId')
  const body = parseWithSchema(updateRoomSchema, await readBody(event))
  const room = await updateRoom(roomId, body)
  return successResponse(room)
})
