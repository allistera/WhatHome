import { listHomesSummary } from '../../services/home.service'
import { defineApiHandler } from '../../utils/handler'
import { successResponse } from '../../utils/response'

export default defineApiHandler(async () => {
  const homes = await listHomesSummary()
  return successResponse(homes)
})
