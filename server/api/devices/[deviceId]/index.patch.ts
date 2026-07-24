import { readBody } from 'h3'
import { updateDeviceSchema } from '../../../../shared/schemas/device'
import { updateDevice } from '../../../services/device.service'
import { defineApiHandler, parseWithSchema } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'
import { successResponse } from '../../../utils/response'

export default defineApiHandler(async (event) => {
  const deviceId = requireUuidRouteParam(event, 'deviceId')
  const body = parseWithSchema(updateDeviceSchema, await readBody(event))
  const device = await updateDevice(deviceId, body)
  return successResponse(device)
})
