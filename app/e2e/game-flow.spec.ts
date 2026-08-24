import { expect, test, type Page } from '@playwright/test'

async function startGame(
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

async function throwAtMinimumPower(page: Page) {
  const button = page.getByRole('button', { name: 'ストーンを投射' })
  const box = await button.boundingBox()
  expect(box).not.toBeNull()

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await expect(page.getByText('Power調整中')).toBeVisible()
  await page.mouse.up()
  await expect(page.getByText('ストーン移動中')).toBeVisible()
}

test('9カテゴリーすべてでゲームを開始できる', async ({ page }) => {
  for (const surface of ['ICE', 'WOOD', 'FELT'] as const) {
    for (const distance of ['SHORT', 'MEDIUM', 'LONG'] as const) {
      await startGame(page, surface, distance)
      await expect(page.getByText(surface)).toBeVisible()
      await expect(page.getByText(distance)).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Shot 1 / 5' })).toBeVisible()
    }
  }
})

test('5投を完了してResultとRetryへ進める', async ({ page }) => {
  test.slow()
  await startGame(page)

  for (let shot = 1; shot <= 5; shot += 1) {
    await expect(
      page.getByRole('heading', { name: `Shot ${shot} / 5` }),
    ).toBeVisible()
    await throwAtMinimumPower(page)

    if (shot < 5) {
      const nextButton = page.getByRole('button', { name: '次の投射へ' })
      await expect(nextButton).toBeVisible({ timeout: 15_000 })
      await expect(
        page.getByRole('heading', { name: `Shot ${shot} / 5` }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'ストーンを投射' }),
      ).toHaveCount(0)
      await nextButton.click()
    } else {
      await expect(
        page.getByRole('button', { name: '結果を見る' }),
      ).toBeVisible({ timeout: 15_000 })
    }
  }

  await page.getByRole('button', { name: '結果を見る' }).click()
  await expect(page.getByRole('heading', { name: 'RESULT' })).toBeVisible()

  const shotResults = page.locator('[aria-label^="Shot "]')
  await expect(shotResults).toHaveCount(5)
  const scores = await shotResults.evaluateAll((elements) =>
    elements.map((element) => {
      const match = element.getAttribute('aria-label')?.match(/(\d+)点$/)
      return Number(match?.[1] ?? 0)
    }),
  )
  const expectedTotal = scores.reduce((total, score) => total + score, 0)
  await expect(page.getByLabel(`合計 ${expectedTotal}点`)).toBeVisible()
  await expect(page.getByText('NEW HIGH SCORE')).toHaveCount(0)

  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByRole('heading', { name: 'Shot 1 / 5' })).toBeVisible()
  await expect(page.getByText('FELT')).toBeVisible()
  await expect(page.getByText('SHORT')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ストーンを投射' })).toBeEnabled()
})

test('未完了ゲームをリタイアしてResultを経由せずTOPへ戻る', async ({
  page,
}) => {
  await startGame(page, 'WOOD', 'MEDIUM')

  await page.getByRole('button', { name: 'リタイア' }).click()
  await expect(
    page.getByRole('heading', { name: 'ゲームをリタイアしますか？' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'ゲームへ戻る' }).click()
  await expect(page.getByRole('button', { name: 'ストーンを投射' })).toBeEnabled()

  await page.getByRole('button', { name: 'リタイア' }).click()
  await page.getByRole('button', { name: 'リタイアする' }).click()
  await expect(
    page.getByRole('heading', { name: 'テーブルカーリング' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'RESULT' })).toHaveCount(0)
})

test('Space長押しで上昇中と下降中のPowerを投射できる', async ({ page }) => {
  test.slow()
  await startGame(page)

  const shotButton = page.getByRole('button', { name: 'ストーンを投射' })
  await shotButton.focus()
  await page.keyboard.down('Space')
  await expect(page.getByText(/現在のPower \d+、上昇中/)).toBeVisible()
  await page.waitForTimeout(700)
  await page.keyboard.up('Space')
  await expect(page.getByRole('button', { name: '次の投射へ' })).toBeVisible({
    timeout: 15_000,
  })

  await page.getByRole('button', { name: '次の投射へ' }).click()
  await page.getByRole('button', { name: 'ストーンを投射' }).focus()
  await page.keyboard.down('Space')
  await page.waitForTimeout(1900)
  await expect(page.getByText(/現在のPower \d+、下降中/)).toBeVisible()
  await page.keyboard.up('Space')
  await expect(page.getByText('ストーン移動中')).toBeVisible()
})

test('moving中のリタイア確認時間をPhysicsへ加算しない', async ({ page }) => {
  await startGame(page)
  await throwAtMinimumPower(page)

  await page.getByRole('button', { name: 'リタイア' }).click()
  await expect(
    page.getByRole('heading', { name: 'ゲームをリタイアしますか？' }),
  ).toBeVisible()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'ゲームへ戻る' }).click()

  await expect(page.getByText('ストーン移動中')).toBeVisible()
  await expect(page.getByRole('button', { name: '次の投射へ' })).toBeVisible({
    timeout: 15_000,
  })
})

async function setPageVisibility(page: Page, state: 'hidden' | 'visible') {
  await page.evaluate((visibilityState) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  }, state)
}

test('charging中にページを非表示にすると投射せずreadyへ戻る', async ({
  page,
}) => {
  await startGame(page)
  const button = page.getByRole('button', { name: 'ストーンを投射' })
  const box = await button.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await expect(page.getByText('Power調整中')).toBeVisible()

  await setPageVisibility(page, 'hidden')
  await page.waitForTimeout(500)
  await setPageVisibility(page, 'visible')
  await page.mouse.up()

  await expect(page.getByText('投射準備OK')).toBeVisible()
  await expect(page.getByText('ストーン移動中')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Shot 1 / 5' })).toBeVisible()
})

test('moving中の非表示時間をPhysicsへ加算せず再表示後に再開する', async ({
  page,
}) => {
  await startGame(page)
  await throwAtMinimumPower(page)

  await setPageVisibility(page, 'hidden')
  await page.waitForTimeout(1200)
  await expect(page.getByText('ストーン移動中')).toBeVisible()

  await setPageVisibility(page, 'visible')
  await expect(page.getByText('ストーン移動中')).toBeVisible()
  await expect(page.getByRole('button', { name: '次の投射へ' })).toBeVisible({
    timeout: 15_000,
  })
})
