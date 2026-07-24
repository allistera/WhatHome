import { readBody, setResponseStatus } from 'h3'
import { createRoomSchema } from '../../../../../shared/schemas/room'
import { createRoom } from '../../../../services/room.service'
import { defineApiHandler, parseWithSchema } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { successResponse } from '../../../../utils/response'

export default defineApiHandler(async (event) => {
  const floorId = requireUuidRouteParam(event, 'floorId')
  const body = parseWithSchema(createRoomSchema, await readBody(event))
  const room = await createRoom(floorId, body)
  setResponseStatus(event, 201)
  return successResponse(room)
})
