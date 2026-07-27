import { expect, test } from '@playwright/test'
import { apiCreateDevice, apiCreateHome, baseDevicePayload, uniqueName } from './helpers'

test('does not render a device under a different home', async ({ page, request }) => {
  const firstHome = await apiCreateHome(request, uniqueName('First Home'))
  const secondHome = await apiCreateHome(request, uniqueName('Second Home'))
  const device = await apiCreateDevice(request, secondHome.id, {
    ...baseDevicePayload,
    name: uniqueName('Private Device')
  })

  await page.goto(`/homes/${firstHome.id}/devices/${device.id}`)

  await expect(page.getByText('This device could not be found.')).toBeVisible()
  await expect(page.getByRole('heading', { name: device.name })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible()
})
