import { getHome } from '../../../services/home.service'
import { defineApiHandler } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const home = await getHome(homeId)
  return successResponse(home)
})
