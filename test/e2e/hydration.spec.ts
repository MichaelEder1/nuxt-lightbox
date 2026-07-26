import { test, expect } from '@playwright/test'

test('loads without hydration mismatch warnings and opens/closes the lightbox', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().toLowerCase().includes('hydration')) {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
  expect(consoleErrors).toEqual([])

  await page.getByRole('button', { name: 'Open configured gallery' }).click()
  await expect(page.locator('.nuxt-lightbox')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.locator('.nuxt-lightbox')).not.toBeVisible()

  expect(consoleErrors).toEqual([])
})

test('navigating between pages while the lightbox is open auto-closes it', async ({ page }) => {
  // The lightbox is an accessible modal overlay whose backdrop intentionally
  // intercepts pointer events, so a background link cannot be clicked while
  // it is open. Route navigation while the modal is up realistically happens
  // via browser history (back/forward), so we drive it through that instead.
  await page.goto('/other')
  await page.goto('/')
  await page.getByRole('button', { name: 'Open configured gallery' }).click()
  await expect(page.locator('.nuxt-lightbox')).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/other$/)
  await expect(page.locator('.nuxt-lightbox')).not.toBeVisible()
})
