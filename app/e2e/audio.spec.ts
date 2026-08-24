import { expect, test, type Page } from '@playwright/test'
import { startGame, throwAtMinimumPower } from './helpers/game'

async function installAudioSpy(page: Page) {
  await page.addInitScript(() => {
    const playedAudio: string[] = []
    Object.defineProperty(window, '__tableCurlingPlayedAudio', {
      configurable: true,
      value: playedAudio,
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
      configurable: true,
      get: () => 4,
    })
    HTMLMediaElement.prototype.load = () => undefined
    HTMLMediaElement.prototype.pause = () => undefined
    HTMLMediaElement.prototype.play = function play() {
      playedAudio.push(new URL(this.src).pathname)
      return Promise.resolve()
    }
  })
}

async function getPlayedAudio(page: Page) {
  return page.evaluate(
    () =>
      (
        window as typeof window & {
          __tableCurlingPlayedAudio: string[]
        }
      ).__tableCurlingPlayedAudio,
  )
}

async function throwAtMaximumPower(page: Page) {
  await throwWithHold(page, 1500)
}

async function throwWithHold(page: Page, holdMs: number) {
  const button = page.getByRole('button', { name: 'ストーンを投射' })
  const box = await button.boundingBox()
  expect(box).not.toBeNull()

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(holdMs)
  await page.mouse.up()
  await expect(page.getByText('ストーン移動中')).toBeVisible()
}

test('投射・衝突・停止・盤外を対応する音源へ接続する', async ({ page }) => {
  test.slow()
  await installAudioSpy(page)
  await startGame(page, 'FELT', 'SHORT')

  await throwAtMinimumPower(page)
  await expect(page.getByRole('button', { name: '次の投射へ' })).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole('button', { name: '次の投射へ' }).click()
  await throwWithHold(page, 400)
  await expect(page.getByRole('button', { name: '次の投射へ' })).toBeVisible({
    timeout: 15_000,
  })

  let played = await getPlayedAudio(page)
  expect(played.filter((path) => path === '/audio/shot.ogg')).toHaveLength(2)
  expect(
    played.filter((path) => path === '/audio/all-stones-stopped.ogg'),
  ).toHaveLength(2)
  expect(played).toContain('/audio/stone-collision.ogg')

  await page.getByRole('button', { name: 'リタイア' }).click()
  await page.getByRole('button', { name: 'リタイアする' }).click()
  await page.getByRole('button', { name: 'ゲームプレイ' }).click()
  await page.getByRole('button', { name: 'ICEを選択' }).click()
  await page.getByRole('button', { name: 'LONGを選択' }).click()
  await page.getByRole('button', { name: 'ゲーム開始' }).click()
  await throwAtMaximumPower(page)
  await expect(page.getByRole('button', { name: '次の投射へ' })).toBeVisible({
    timeout: 15_000,
  })

  played = await getPlayedAudio(page)
  expect(played).toContain('/audio/out-of-bounds.ogg')
})

test('効果音OFFでは再生を開始しない', async ({ page }) => {
  await installAudioSpy(page)
  await page.goto('/')
  await page.getByRole('switch', { name: '効果音' }).click()
  await startGame(page)
  await throwAtMinimumPower(page)
  await expect(page.getByRole('button', { name: '次の投射へ' })).toBeVisible({
    timeout: 15_000,
  })

  expect(await getPlayedAudio(page)).toEqual([])
})
