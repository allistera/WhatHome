import { readBody } from 'h3'
import { updateHomeSchema } from '../../../../shared/schemas/home'
import { updateHome } from '../../../services/home.service'
import { defineApiHandler, parseWithSchema } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const body = parseWithSchema(updateHomeSchema, await readBody(event))
  const home = await updateHome(homeId, body)
  return successResponse(home)
})
