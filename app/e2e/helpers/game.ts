import { expect, type Page } from '@playwright/test'

export async function startGame(
  page: Page,
  surface: 'ICE' | 'WOOD' | 'FELT' = 'FELT',
  distance: 'SHORT' | 'MEDIUM' | 'LONG' = 'SHORT',
) {
  await page.goto('/')
  await page.getByRole('button', { name: 'ゲームプレイ' }).click()
  await page.getByRole('button', { name: `${surface}を選択` }).click()
  await page.getByRole('button', { name: `${distance}を選択` }).click()
  await page.getByRole('button', { name: 'ゲーム開始' }).click()
  await expect(page.getByRole('button', { name: 'ストーンを投射' })).toBeEnabled()
}

export async function throwAtMinimumPower(page: Page) {
  const button = page.getByRole('button', { name: 'ストーンを投射' })
  const box = await button.boundingBox()
  expect(box).not.toBeNull()

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await expect(page.getByText('Power調整中')).toBeVisible()
  await page.mouse.up()
  await expect(page.getByText('ストーン移動中')).toBeVisible()
}

export async function completeGameAtMinimumPower(page: Page) {
  for (let shot = 1; shot <= 5; shot += 1) {
    await throwAtMinimumPower(page)

    if (shot < 5) {
      const nextButton = page.getByRole('button', { name: '次の投射へ' })
      await expect(nextButton).toBeVisible({ timeout: 15_000 })
      await nextButton.click()
    } else {
      await expect(
        page.getByRole('button', { name: '結果を見る' }),
      ).toBeVisible({ timeout: 15_000 })
    }
  }
}
