import { expect, test } from '@playwright/test'
import { uniqueName } from './helpers'

test('deletes a home using the required typed confirmation', async ({ page }) => {
  const homeName = uniqueName('Doomed House')

  await page.goto('/')
  await page.getByRole('button', { name: 'Add home' }).click()
  await page.getByLabel('Home name').fill(homeName)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('link', { name: homeName })).toBeVisible()

  const card = page.locator('li').filter({ hasText: homeName })
  await card.getByRole('button', { name: 'Delete' }).click()

  const confirmButton = page.getByRole('button', { name: 'Delete home' })
  await expect(confirmButton).toBeDisabled()

  await page.getByLabel(`Type "${homeName}" to confirm`).fill('the wrong name')
  await expect(confirmButton).toBeDisabled()

  await page.getByLabel(`Type "${homeName}" to confirm`).fill(homeName)
  await expect(confirmButton).toBeEnabled()
  await confirmButton.click()

  await expect(page.getByRole('link', { name: homeName })).not.toBeVisible()
})
