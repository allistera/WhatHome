import { readBody, setResponseStatus } from 'h3'
import { deleteWithVersionSchema } from '../../../../shared/schemas/common'
import { deleteRoom } from '../../../services/room.service'
import { defineApiHandler, parseWithSchema } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'

export default defineApiHandler(async (event) => {
  const roomId = requireUuidRouteParam(event, 'roomId')
  const body = parseWithSchema(deleteWithVersionSchema, await readBody(event))
  await deleteRoom(roomId, body.version)
  setResponseStatus(event, 204)
  return null
})
