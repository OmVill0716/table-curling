import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { createEmptyHighScores } from '../config/highScores'
import { mockHighScores } from '../mocks/gameScreenMocks'
import { HowToPlayScreen } from './HowToPlayScreen'
import { ScoreScreen } from './ScoreScreen'

const meta = {
  title: 'Screens/Information',
  parameters: { appScreen: true },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const ScoreTopThree: Story = {
  render: () => <ScoreScreen highScores={mockHighScores} onBack={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('430 pt')).toBeVisible()
    await expect(canvas.getByText('350 pt')).toBeVisible()
    await expect(canvas.getByText('280 pt')).toBeVisible()

    await userEvent.click(canvas.getByRole('tab', { name: 'WOOD' }))
    await expect(canvas.getByText('まだ記録がありません')).toBeVisible()
  },
}

export const ScoreEmpty: Story = {
  render: () => <ScoreScreen highScores={createEmptyHighScores()} onBack={fn()} />,
}

export const HowToPlay: Story = {
  render: () => <HowToPlayScreen onBack={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const text of [
      'フィールドと長さを選ぶ',
      'Powerを決めて投げる',
      'ストーンの動きを読む',
      '得点を狙う',
      '5投を完了する',
      '途中で終了するとき',
      '効果音設定',
    ]) {
      await expect(canvas.getByRole('heading', { name: text })).toBeVisible()
    }
  },
}
