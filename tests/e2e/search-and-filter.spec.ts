import { expect, test } from '@playwright/test'
import { apiCreateDevice, apiCreateHome, baseDevicePayload, uniqueName } from './helpers'

test('searches and filters the device inventory', async ({ page, request }) => {
  const home = await apiCreateHome(request, uniqueName('Inventory Home'))

  await apiCreateDevice(request, home.id, {
    ...baseDevicePayload,
    name: 'Fridge Sensor',
    type: 'Sensor',
    manufacturer: 'Acme'
  })
  await apiCreateDevice(request, home.id, {
    ...baseDevicePayload,
    name: 'Front Door Lock',
    type: 'Lock',
    manufacturer: 'Other Co'
  })

  await page.goto(`/homes/${home.id}/devices`)
  await expect(page.getByRole('link', { name: 'Fridge Sensor' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Front Door Lock' })).toBeVisible()

  await page.getByLabel('Search').fill('fridge')
  await page.waitForTimeout(400)
  await expect(page.getByRole('link', { name: 'Fridge Sensor' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Front Door Lock' })).not.toBeVisible()

  await page.getByRole('button', { name: 'Clear all filters' }).click()
  await expect(page.getByRole('link', { name: 'Front Door Lock' })).toBeVisible()

  await page.getByLabel('Type').selectOption({ label: 'Lock' })
  await page.waitForTimeout(400)
  await expect(page.getByRole('link', { name: 'Front Door Lock' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Fridge Sensor' })).not.toBeVisible()

  await page.getByRole('button', { name: 'Clear all filters' }).click()
  await expect(page.getByRole('link', { name: 'Fridge Sensor' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Front Door Lock' })).toBeVisible()
})
