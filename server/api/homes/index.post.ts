import { readBody, setResponseStatus } from 'h3'
import { createHomeSchema } from '../../../shared/schemas/home'
import { createHome } from '../../services/home.service'
import { defineApiHandler, parseWithSchema } from '../../utils/handler'
import { successResponse } from '../../utils/response'

export default defineApiHandler(async (event) => {
  const body = parseWithSchema(createHomeSchema, await readBody(event))
  const home = await createHome(body)
  setResponseStatus(event, 201)
  return successResponse(home)
})
