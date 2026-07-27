import { setHeader } from 'h3'
import { buildDeviceImportTemplateCsv } from '../../../shared/schemas/device-import'
import { defineApiHandler } from '../../utils/handler'

export default defineApiHandler(async (event) => {
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(
    event,
    'Content-Disposition',
    'attachment; filename="whathome-device-import-template.csv"'
  )
  return buildDeviceImportTemplateCsv()
})
