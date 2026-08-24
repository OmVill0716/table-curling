import { expect, test } from '@playwright/test'
import { startGame, throwAtMinimumPower } from './helpers/game'

test('主要操作は44px以上でキーボードフォーカスを表示する', async ({
  page,
}) => {
  await page.goto('/')

  for (const name of ['ゲームプレイ', 'スコア確認', '遊び方']) {
    const button = page.getByRole('button', { name })
    const box = await button.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)
  }

  const gameButton = page.getByRole('button', { name: 'ゲームプレイ' })
  await gameButton.focus()
  await expect(gameButton).toBeFocused()
  const outlineWidth = await gameButton.evaluate(
    (element) => getComputedStyle(element).outlineWidth,
  )
  expect(Number.parseFloat(outlineWidth)).toBeGreaterThan(0)

  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
  expect(viewport).not.toContain('user-scalable=no')
  expect(viewport).not.toContain('maximum-scale=1')
})

test('reduced motionでもPowerとStoneのゲーム進行を維持する', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startGame(page)

  const shotButton = page.getByRole('button', { name: 'ストーンを投射' })
  const box = await shotButton.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  expect(box!.width).toBeGreaterThanOrEqual(44)

  await throwAtMinimumPower(page)
  await expect(page.getByText('ストーン移動中')).toBeVisible()
  await expect(page.getByRole('button', { name: '次の投射へ' })).toBeVisible({
    timeout: 15_000,
  })
})
