import { expect, test } from '@playwright/test'
import { uniqueName } from './helpers'

test('creates a home, floor, room, and a room-assigned device', async ({ page }) => {
  const homeName = uniqueName('Beach House')
  const floorName = 'Ground Floor'
  const roomName = 'Kitchen'
  const deviceName = 'Fridge Sensor'

  await page.goto('/')
  await page.getByRole('button', { name: 'Add home' }).click()
  await page.getByLabel('Home name').fill(homeName)
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('link', { name: homeName })).toBeVisible()
  await page.getByRole('link', { name: homeName }).click()

  await expect(page.getByRole('heading', { name: homeName })).toBeVisible()
  await page.getByRole('button', { name: 'Add floor' }).click()
  await page.getByLabel('Floor name').fill(floorName)
  await page.getByRole('button', { name: 'Add floor' }).last().click()

  await expect(page.locator('#main-content').getByText(floorName)).toBeVisible()
  await page.getByRole('button', { name: 'Add room' }).click()
  await page.getByLabel('Room name').fill(roomName)
  await page.getByRole('button', { name: 'Add room' }).last().click()

  await expect(page.locator('#main-content').getByRole('link', { name: roomName })).toBeVisible()

  await page.getByRole('link', { name: 'View inventory' }).click()
  await page.getByRole('link', { name: 'Add device' }).click()

  await page.getByLabel('Name').fill(deviceName)
  await page.getByLabel('Type').fill('Sensor')
  await page.getByLabel('Protocol').fill('Zigbee')
  await page.getByLabel('In room').check()
  await page.locator('#device-room').selectOption({ label: roomName })
  await page.getByRole('button', { name: 'Save device' }).click()

  await expect(page.getByRole('heading', { name: deviceName })).toBeVisible()
  await expect(page.locator('#main-content').getByText(roomName)).toBeVisible()
})
