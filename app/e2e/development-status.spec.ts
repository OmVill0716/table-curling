import { expect, test } from '@playwright/test'

test('開発環境の初期画面を表示できる', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Table Curling')
  await expect(
    page.getByRole('heading', { name: 'Table Curling' }),
  ).toBeVisible()
  await expect(
    page.getByText('Phase 1: Development environment ready'),
  ).toBeVisible()
})
