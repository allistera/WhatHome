import { expect, test } from '@playwright/test'
import { apiCreateDevice, apiCreateFloor, apiCreateHome, apiCreateRoom, baseDevicePayload, uniqueName } from './helpers'

test('moves a device between all three location states', async ({ page, request }) => {
  const home = await apiCreateHome(request, uniqueName('Transitions Home'))
  const floor = await apiCreateFloor(request, home.id, 'Ground Floor')
  await apiCreateRoom(request, floor.id, 'Kitchen')
  const device = await apiCreateDevice(request, home.id, {
    ...baseDevicePayload,
    name: 'Multi-state Sensor'
  })

  await page.goto(`/homes/${home.id}/devices/${device.id}`)
  await expect(page.getByText('Unassigned', { exact: true })).toBeVisible()

  // Unassigned -> In storage
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('In storage').check()
  await page.getByRole('button', { name: 'Save device' }).click()
  await expect(page.getByText('In storage')).toBeVisible()

  // In storage -> In room
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('In room').check()
  await page.locator('#device-room').selectOption({ label: 'Kitchen' })
  await page.getByRole('button', { name: 'Save device' }).click()
  await expect(page.getByText('Kitchen')).toBeVisible()

  // In room -> Unassigned
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Unassigned').check()
  await page.getByRole('button', { name: 'Save device' }).click()
  await expect(page.getByText('Unassigned', { exact: true })).toBeVisible()
})
