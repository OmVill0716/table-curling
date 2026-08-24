import { expect, test } from '@playwright/test'

test('TOPから設定内容を維持してGame外枠へ進める', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Table Curling')
  await expect(
    page.getByRole('heading', { name: 'テーブルカーリング' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'ゲームプレイ' }).click()
  await page.getByRole('button', { name: 'ICEを選択' }).click()
  await page.getByRole('button', { name: 'LONGを選択' }).click()

  await expect(
    page.getByRole('heading', { name: '選択内容確認' }),
  ).toBeVisible()
  await expect(page.getByText('ICE')).toBeVisible()
  await expect(page.getByText('LONG')).toBeVisible()

  await page.getByRole('button', { name: '戻る' }).click()
  await expect(page.getByRole('button', { name: 'LONGを選択' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: '戻る' }).click()
  await expect(page.getByRole('button', { name: 'ICEを選択' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: 'ICEを選択' }).click()
  await page.getByRole('button', { name: 'LONGを選択' }).click()
  await page.getByRole('button', { name: 'ゲーム開始' }).click()

  await expect(page.getByRole('heading', { name: 'Shot 1 / 5' })).toBeVisible()
  await expect(page.getByText('ICE')).toBeVisible()
  await expect(page.getByText('LONG')).toBeVisible()
  await expect(page.getByText('投射準備OK')).toBeVisible()
  await expect(page.getByLabel('カーリング盤面')).toBeVisible()
})

test('スコア確認と遊び方からTOPへ戻れる', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'スコア確認' }).click()
  await expect(page.getByRole('heading', { name: 'スコア確認' })).toBeVisible()
  await page.getByRole('tab', { name: 'WOOD' }).click()
  await page.getByRole('tab', { name: 'MEDIUM' }).click()
  await expect(page.getByText('WOOD / MEDIUM')).toBeVisible()
  await expect(page.getByText('まだ記録がありません')).toBeVisible()
  await page.getByRole('button', { name: 'TOPへ' }).click()

  await page.getByRole('button', { name: '遊び方' }).click()
  await expect(page.getByRole('heading', { name: '遊び方' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Powerを決めて投げる' }),
  ).toBeVisible()
  await expect(
    page.getByText(/タブを閉じるか再読み込みした場合も/),
  ).toBeVisible()
  await page.getByRole('button', { name: 'TOPへ' }).click()

  await expect(
    page.getByRole('heading', { name: 'テーブルカーリング' }),
  ).toBeVisible()
})

test('効果音設定をメモリ内で切り替えて画面遷移中は維持する', async ({
  page,
}) => {
  await page.goto('/')

  const soundSwitch = page.getByRole('switch', { name: '効果音' })
  await expect(soundSwitch).toBeChecked()
  await soundSwitch.click()
  await expect(soundSwitch).not.toBeChecked()
  await expect(page.getByText('効果音 OFF')).toBeVisible()

  await page.getByRole('button', { name: 'スコア確認' }).click()
  await page.getByRole('button', { name: 'TOPへ' }).click()

  await expect(page.getByRole('switch', { name: '効果音' })).not.toBeChecked()
})
