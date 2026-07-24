import { getDeviceOrThrow } from '../../../services/device.service'
import { toDeviceDto } from '../../../services/mappers'
import { defineApiHandler } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const deviceId = requireUuidRouteParam(event, 'deviceId')
  const device = await getDeviceOrThrow(deviceId)
  return successResponse(toDeviceDto(device))
})
