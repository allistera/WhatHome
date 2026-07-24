import { readBody, setResponseStatus } from 'h3'
import { deleteHomeSchema } from '../../../../shared/schemas/home'
import { deleteHome } from '../../../services/home.service'
import { defineApiHandler, parseWithSchema } from '../../../utils/handler'
import { requireUuidRouteParam } from '../../../utils/params'

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')
  const body = parseWithSchema(deleteHomeSchema, await readBody(event))
  await deleteHome(homeId, body)
  setResponseStatus(event, 204)
  return null
})
