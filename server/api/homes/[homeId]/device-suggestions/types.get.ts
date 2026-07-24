import { getDeviceSuggestions } from '../../../../services/device.service'
import { defineApiHandler } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { successResponse } from '../../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const suggestions = await getDeviceSuggestions(homeId, 'type')
  return successResponse(suggestions)
})
