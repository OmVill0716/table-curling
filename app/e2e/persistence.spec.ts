import { expect, test } from '@playwright/test'
import { completeGameAtMinimumPower, startGame, throwAtMinimumPower } from './helpers/game'

const HIGH_SCORES_STORAGE_KEY = 'table-curling.high-scores.v1'

test('5投目停止時に記録しResultと再読み込み後のScoreへ表示する', async ({
  page,
}) => {
  test.slow()
  await startGame(page, 'FELT', 'SHORT')
  await completeGameAtMinimumPower(page)

  const stored = await page.evaluate((key) => localStorage.getItem(key), HIGH_SCORES_STORAGE_KEY)
  expect(stored).not.toBeNull()
  const parsed = JSON.parse(stored!) as {
    FELT: { SHORT: Array<{ score: number; achievedAt: string }> }
  }
  expect(parsed.FELT.SHORT).toHaveLength(1)
  expect(parsed.FELT.SHORT[0].score).toBeGreaterThanOrEqual(0)
  expect(Number.isFinite(Date.parse(parsed.FELT.SHORT[0].achievedAt))).toBe(true)

  await page.getByRole('button', { name: '結果を見る' }).click()
  await expect(page.getByText('NEW HIGH SCORE · 1st')).toBeVisible()
  await page.getByRole('button', { name: 'TOPへ' }).click()
  await page.getByRole('button', { name: 'スコア確認' }).click()
  await page.getByRole('tab', { name: 'FELT' }).click()
  await expect(page.getByText(`${parsed.FELT.SHORT[0].score} pt`)).toBeVisible()

  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'テーブルカーリング' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'スコア確認' }).click()
  await page.getByRole('tab', { name: 'FELT' }).click()
  await expect(page.getByText(`${parsed.FELT.SHORT[0].score} pt`)).toBeVisible()
})

test('ゲーム途中は保存せず再読み込みでTOPへ戻る', async ({ page }) => {
  await startGame(page, 'WOOD', 'MEDIUM')
  await throwAtMinimumPower(page)

  expect(
    await page.evaluate((key) => localStorage.getItem(key), HIGH_SCORES_STORAGE_KEY),
  ).toBeNull()

  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'テーブルカーリング' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: /Shot/ })).toHaveCount(0)
})

test('破損した保存値を空記録として扱いゲームを継続する', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{')
  }, HIGH_SCORES_STORAGE_KEY)
  await page.goto('/')

  await page.getByRole('button', { name: 'スコア確認' }).click()
  await expect(page.getByText('まだ記録がありません')).toBeVisible()
  await page.getByRole('button', { name: 'TOPへ' }).click()
  await page.getByRole('button', { name: 'ゲームプレイ' }).click()
  await expect(page.getByRole('heading', { name: 'フィールド選択' })).toBeVisible()
})
