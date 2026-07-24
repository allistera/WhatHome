import { readBody } from 'h3'
import { reorderFloorsSchema } from '../../../../../shared/schemas/floor'
import { reorderFloors } from '../../../../services/floor.service'
import { defineApiHandler, parseWithSchema } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { successResponse } from '../../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const body = parseWithSchema(reorderFloorsSchema, await readBody(event))
  const floors = await reorderFloors(homeId, body)
  return successResponse(floors)
})
