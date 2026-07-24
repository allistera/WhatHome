import { readBody, setResponseStatus } from 'h3'
import { createDeviceSchema } from '../../../../../shared/schemas/device'
import { createDevice } from '../../../../services/device.service'
import { defineApiHandler, parseWithSchema } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { successResponse } from '../../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const body = parseWithSchema(createDeviceSchema, await readBody(event))
  const device = await createDevice(homeId, body)
  setResponseStatus(event, 201)
  return successResponse(device)
})
