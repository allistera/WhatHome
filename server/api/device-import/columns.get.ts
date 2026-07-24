import { deviceImportColumns } from '../../../shared/schemas/device-import'
import { defineApiHandler } from '../../utils/handler'
import { successResponse } from '../../utils/response'

export default defineApiHandler(async () => {
  return successResponse(deviceImportColumns)
})
