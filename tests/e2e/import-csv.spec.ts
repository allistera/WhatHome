import { expect, test } from '@playwright/test'
import { apiCreateFloor, apiCreateHome, apiCreateRoom, uniqueName } from './helpers'

test('imports devices from a CSV file, showing required columns and per-row results', async ({
  page,
  request
}) => {
  const home = await apiCreateHome(request, uniqueName('Import Home'))
  const floor = await apiCreateFloor(request, home.id, 'Ground Floor')
  await apiCreateRoom(request, floor.id, 'Kitchen')

  await page.goto(`/homes/${home.id}/devices`)
  await page.getByRole('button', { name: 'Import CSV' }).click()

  await expect(page.getByRole('heading', { name: 'Import devices from CSV' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Name', exact: true })).toBeVisible()
  await expect(page.getByText('Required').first()).toBeVisible()

  const csvContent = [
    'Name,Type,Protocol,Floor,Room',
    'Fridge Sensor,Sensor,Zigbee,Ground Floor,Kitchen',
    'Bad Device,Sensor,Zigbee,Ground Floor,Nonexistent Room'
  ].join('\n')

  await page.getByLabel('CSV file').setInputFiles({
    name: 'devices.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent)
  })

  await page.getByRole('button', { name: 'Import', exact: true }).click()

  await expect(page.getByText('1 of 2 rows imported successfully. 1 row(s) failed.')).toBeVisible()
  await expect(page.getByText('Row 3')).toBeVisible()
  await expect(page.getByText(/Nonexistent Room/)).toBeVisible()

  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('link', { name: 'Fridge Sensor' })).toBeVisible()
})

test('deletes the successfully imported devices after a partial import failure', async ({
  page,
  request
}) => {
  const home = await apiCreateHome(request, uniqueName('Import Undo Home'))
  const floor = await apiCreateFloor(request, home.id, 'Ground Floor')
  await apiCreateRoom(request, floor.id, 'Kitchen')

  await page.goto(`/homes/${home.id}/devices`)
  await page.getByRole('button', { name: 'Import CSV' }).click()

  const csvContent = [
    'Name,Type,Protocol,Floor,Room',
    'Fridge Sensor,Sensor,Zigbee,Ground Floor,Kitchen',
    'Bad Device,Sensor,Zigbee,Ground Floor,Nonexistent Room'
  ].join('\n')

  await page.getByLabel('CSV file').setInputFiles({
    name: 'devices.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent)
  })

  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await expect(page.getByText('1 of 2 rows imported successfully. 1 row(s) failed.')).toBeVisible()

  await page.getByRole('button', { name: 'Delete 1 imported device(s)' }).click()
  await expect(page.getByRole('heading', { name: 'Delete imported devices' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete devices' }).click()

  await expect(page.getByText('The successfully imported devices were deleted.')).toBeVisible()

  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('link', { name: 'Fridge Sensor' })).not.toBeVisible()
})

test('downloading the CSV template gives all the documented columns as headers', async ({
  page,
  request
}) => {
  const home = await apiCreateHome(request, uniqueName('Template Home'))

  await page.goto(`/homes/${home.id}/devices`)
  await page.getByRole('button', { name: 'Import CSV' }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download CSV template' }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('whathome-device-import-template.csv')
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  const content = Buffer.concat(chunks).toString('utf-8')

  expect(content).toContain('Name')
  expect(content).toContain('Type')
  expect(content).toContain('Protocol')
  expect(content.trim().split('\n')).toHaveLength(2)
})
