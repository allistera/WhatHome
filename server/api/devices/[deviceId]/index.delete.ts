import { readBody, setResponseStatus } from 'h3'
import { deleteWithVersionSchema } from '../../../../shared/schemas/common'
import { deleteDevice } from '../../../services/device.service'
import { defineApiHandler, parseWithSchema } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'

export default defineApiHandler(async (event) => {
  const deviceId = requireUuidRouteParam(event, 'deviceId')
  const body = parseWithSchema(deleteWithVersionSchema, await readBody(event))
  await deleteDevice(deviceId, body.version)
  setResponseStatus(event, 204)
  return null
})
