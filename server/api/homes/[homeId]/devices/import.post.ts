import { readMultipartFormData } from 'h3'
import { importDevicesFromCsv } from '../../../../services/device-import.service'
import { BadRequestError } from '../../../../utils/errors'
import { defineApiHandler } from '../../../../utils/handler'
import { requireUuidRouteParam } from '../../../../utils/params'
import { successResponse } from '../../../../utils/response'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export default defineApiHandler(async (event) => {
  const homeId = requireUuidRouteParam(event, 'homeId')

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(
    (part) => part.name === 'file' && part.data && part.data.byteLength > 0
  )

  if (!filePart) {
    throw new BadRequestError('No CSV file was uploaded. Attach it under the "file" field.')
  }
  if (filePart.data.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new BadRequestError('The CSV file is too large (maximum 5 MB).')
  }

  const csvText = filePart.data.toString('utf-8')
  const summary = await importDevicesFromCsv(homeId, csvText)
  return successResponse(summary)
})
