import { readBody } from 'h3'
import { updateFloorSchema } from '../../../../shared/schemas/floor'
import { updateFloor } from '../../../services/floor.service'
import { defineApiHandler, parseWithSchema } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const floorId = requireUuidRouteParam(event, 'floorId')
  const body = parseWithSchema(updateFloorSchema, await readBody(event))
  const floor = await updateFloor(floorId, body)
  return successResponse(floor)
})
