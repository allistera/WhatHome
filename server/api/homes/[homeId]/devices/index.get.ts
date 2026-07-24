import { getQuery } from 'h3'
import { deviceListQuerySchema } from '../../../../../shared/schemas/device'
import { listDevices } from '../../../../services/device.service'
import { defineApiHandler, parseWithSchema } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { listResponse } from '../../../../utils/response'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const query = parseWithSchema(deviceListQuerySchema, getQuery(event))
  const result = await listDevices(homeId, query)
  return listResponse(result.devices, result.page)
})
