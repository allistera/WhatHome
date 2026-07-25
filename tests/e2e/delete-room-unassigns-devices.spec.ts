import { expect, test } from '@playwright/test'
import { apiCreateDevice, apiCreateFloor, apiCreateHome, apiCreateRoom, baseDevicePayload, uniqueName } from './helpers'

test('deleting a room unassigns its devices', async ({ page, request }) => {
  const home = await apiCreateHome(request, uniqueName('Delete Room Home'))
  const floor = await apiCreateFloor(request, home.id, 'Ground Floor')
  const room = await apiCreateRoom(request, floor.id, 'Kitchen')
  const device = await apiCreateDevice(request, home.id, {
    ...baseDevicePayload,
    name: 'Fridge Sensor',
    locationState: 'in_room',
    roomId: room.id
  })

  await page.goto(`/homes/${home.id}`)
  await expect(page.locator('#main-content').getByText('Kitchen', { exact: true })).toBeVisible()

  page.on('dialog', (dialog) => dialog.dismiss())
  await page
    .locator('li.row-between')
    .filter({ hasText: 'Kitchen' })
    .getByRole('button', { name: 'Delete' })
    .click()

  await expect(page.getByRole('heading', { name: 'Delete room', exact: true })).toBeVisible()
  await expect(page.getByText('1 devices will become unassigned')).toBeVisible()
  await page.getByRole('button', { name: 'Delete room' }).click()

  await expect(page.getByRole('heading', { name: 'Delete room', exact: true })).not.toBeVisible()
  await expect(page.getByRole('link', { name: 'Kitchen' })).not.toBeVisible()

  await page.goto(`/homes/${home.id}/devices/${device.id}`)
  await expect(page.getByText('Unassigned', { exact: true })).toBeVisible()
})
