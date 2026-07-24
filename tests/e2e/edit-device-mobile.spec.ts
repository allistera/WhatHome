import { expect, test } from '@playwright/test'
import { apiCreateDevice, apiCreateHome, baseDevicePayload, uniqueName } from './helpers'

test.use({ viewport: { width: 375, height: 812 } })

test('edits a device from a mobile-sized viewport', async ({ page, request }) => {
  const home = await apiCreateHome(request, uniqueName('Mobile Home'))
  const device = await apiCreateDevice(request, home.id, {
    ...baseDevicePayload,
    name: 'Old Thermostat Name'
  })

  await page.goto(`/homes/${home.id}/devices/${device.id}`)
  await expect(page.getByRole('heading', { name: 'Old Thermostat Name' })).toBeVisible()

  await page.getByRole('button', { name: 'Edit' }).click()
  const nameInput = page.getByLabel('Name')
  await nameInput.fill('New Thermostat Name')
  await page.getByRole('button', { name: 'Save device' }).click()

  await expect(page.getByRole('heading', { name: 'New Thermostat Name' })).toBeVisible()
})
