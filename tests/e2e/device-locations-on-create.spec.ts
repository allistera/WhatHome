import { expect, test } from '@playwright/test'
import { apiCreateHome, uniqueName } from './helpers'

test('creates a device in storage', async ({ page, request }) => {
  const home = await apiCreateHome(request, uniqueName('Storage Home'))
  const deviceName = 'Backup Router'

  await page.goto(`/homes/${home.id}/devices/new`)
  await page.getByLabel('Name').fill(deviceName)
  await page.getByLabel('Type').fill('Router')
  await page.getByLabel('Protocol').fill('WiFi')
  await page.getByLabel('In storage').check()
  await page.getByRole('button', { name: 'Save device' }).click()

  await expect(page.getByRole('heading', { name: deviceName })).toBeVisible()
  await expect(page.getByText('In storage')).toBeVisible()
})

test('creates an unassigned device', async ({ page, request }) => {
  const home = await apiCreateHome(request, uniqueName('Unassigned Home'))
  const deviceName = 'Spare Bulb'

  await page.goto(`/homes/${home.id}/devices/new`)
  await page.getByLabel('Name').fill(deviceName)
  await page.getByLabel('Type').fill('Light')
  await page.getByLabel('Protocol').fill('Zigbee')
  // "Unassigned" is the default selection; no radio interaction needed.
  await page.getByRole('button', { name: 'Save device' }).click()

  await expect(page.getByRole('heading', { name: deviceName })).toBeVisible()
  await expect(page.getByText('Unassigned', { exact: true })).toBeVisible()
})
