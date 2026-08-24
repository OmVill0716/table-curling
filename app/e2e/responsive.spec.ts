import { expect, test } from '@playwright/test'

async function openGame(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'ゲームプレイ' }).click()
  await page.getByRole('button', { name: 'WOODを選択' }).click()
  await page.getByRole('button', { name: 'MEDIUMを選択' }).click()
  await page.getByRole('button', { name: 'ゲーム開始' }).click()
}

test('viewportに応じてGame外枠を縦横へ切り替える', async ({
  page,
}, testInfo) => {
  await openGame(page)

  const layout = page.getByTestId('game-layout')
  const initialAreas = await layout.evaluate(
    (element) => getComputedStyle(element).gridTemplateAreas,
  )

  if (testInfo.project.name.startsWith('mobile-')) {
    expect(initialAreas).toBe('"info" "board" "controls"')
  } else {
    expect(initialAreas).toBe('"board info" "board controls"')
  }

  await page.setViewportSize({ width: 844, height: 390 })
  await expect
    .poll(() =>
      layout.evaluate((element) => getComputedStyle(element).gridTemplateAreas),
    )
    .toBe('"board info" "board controls"')
})

test('GameのCanvasは3対5を維持しページスクロールを発生させない', async ({
  page,
}) => {
  await openGame(page)

  const board = page.getByLabel('カーリング盤面')
  const box = await board.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width / box!.height).toBeCloseTo(3 / 5, 1)

  const dimensions = await page.evaluate(() => ({
    clientHeight: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }))
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight + 1)
})

test('Game以外の長い画面は縦スクロールできる', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')
  await page.getByRole('button', { name: '遊び方' }).click()

  const dimensions = await page.evaluate(() => ({
    clientHeight: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }))
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight)

  await page.getByRole('heading', { name: '効果音設定' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('heading', { name: '効果音設定' })).toBeVisible()
})
