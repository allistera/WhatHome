import { readBody, setResponseStatus } from 'h3'
import { deleteWithVersionSchema } from '../../../../shared/schemas/common'
import { deleteFloor } from '../../../services/floor.service'
import { defineApiHandler, parseWithSchema } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'

export default defineApiHandler(async (event) => {
  const floorId = requireUuidRouteParam(event, 'floorId')
  const body = parseWithSchema(deleteWithVersionSchema, await readBody(event))
  await deleteFloor(floorId, body.version)
  setResponseStatus(event, 204)
  return null
})
