import { expect, test } from '@playwright/test'
import {
  apiCreateDevice,
  apiCreateFloor,
  apiCreateHome,
  apiCreateRoom,
  baseDevicePayload,
  uniqueName
} from './helpers'

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

  await page.locator('#filter-type').click()
  await page.getByRole('option', { name: 'Lock' }).click()
  await page.waitForTimeout(400)
  await expect(page.getByRole('link', { name: 'Front Door Lock' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Fridge Sensor' })).not.toBeVisible()

  await page.getByRole('button', { name: 'Clear all filters' }).click()
  await expect(page.getByRole('link', { name: 'Fridge Sensor' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Front Door Lock' })).toBeVisible()
})

test('filters the device inventory when a room is selected in the sidebar', async ({
  page,
  request
}) => {
  const home = await apiCreateHome(request, uniqueName('Room Navigation Home'))
  const floor = await apiCreateFloor(request, home.id, uniqueName('Ground Floor'))
  const kitchen = await apiCreateRoom(request, floor.id, uniqueName('Kitchen'))
  const lounge = await apiCreateRoom(request, floor.id, uniqueName('Lounge'))

  await apiCreateDevice(request, home.id, {
    ...baseDevicePayload,
    name: 'Kitchen Sensor',
    locationState: 'in_room',
    roomId: kitchen.id
  })
  await apiCreateDevice(request, home.id, {
    ...baseDevicePayload,
    name: 'Lounge Sensor',
    locationState: 'in_room',
    roomId: lounge.id
  })

  await page.goto(`/homes/${home.id}/devices`)
  await expect(page.getByRole('link', { name: 'Kitchen Sensor' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Lounge Sensor' })).toBeVisible()

  await page.getByRole('link', { name: kitchen.name, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/homes/${home.id}/devices\\?roomId=${kitchen.id}$`))
  await expect(page.getByRole('link', { name: 'Kitchen Sensor' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Lounge Sensor' })).not.toBeVisible()

  await page.getByRole('link', { name: lounge.name, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/homes/${home.id}/devices\\?roomId=${lounge.id}$`))
  await expect(page.getByRole('link', { name: 'Lounge Sensor' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Kitchen Sensor' })).not.toBeVisible()
})
