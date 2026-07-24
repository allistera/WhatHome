import { getHome } from '../../../services/home.service'
import { getHomeOverview } from '../../../services/device.service'
import { defineApiHandler } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const [home, overview] = await Promise.all([getHome(homeId), getHomeOverview(homeId)])
  return successResponse({ home, ...overview })
})
