import { readBody, setResponseStatus } from 'h3'
import { createFloorSchema } from '../../../../../shared/schemas/floor'
import { createFloor } from '../../../../services/floor.service'
import { defineApiHandler, parseWithSchema } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { successResponse } from '../../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const body = parseWithSchema(createFloorSchema, await readBody(event))
  const floor = await createFloor(homeId, body)
  setResponseStatus(event, 201)
  return successResponse(floor)
})
