import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import App from '../App'

const meta = {
  title: 'Screens/Complete Flow',
  component: App,
  parameters: { appScreen: true },
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

export const GameSetupToReady: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'ゲームプレイ' }))
    await userEvent.click(canvas.getByRole('button', { name: 'ICEを選択' }))
    await userEvent.click(canvas.getByRole('button', { name: 'LONGを選択' }))

    await expect(
      canvas.getByRole('heading', { name: '選択内容確認' }),
    ).toBeVisible()
    await expect(canvas.getByText('ICE')).toBeVisible()
    await expect(canvas.getByText('LONG')).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: '戻る' }))
    await expect(canvas.getByRole('button', { name: 'LONGを選択' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'LONGを選択' }))
    await userEvent.click(canvas.getByRole('button', { name: 'ゲーム開始' }))

    await expect(canvas.getByRole('heading', { name: 'Shot 1 / 5' })).toBeVisible()
    await expect(canvas.getByText('投射準備OK')).toBeVisible()
  },
}

export const TopInformationRoundTrip: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'スコア確認' }))
    await expect(canvas.getByRole('heading', { name: 'スコア確認' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'TOPへ' }))

    await userEvent.click(canvas.getByRole('button', { name: '遊び方' }))
    await expect(canvas.getByRole('heading', { name: '遊び方' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'TOPへ' }))

    await expect(
      canvas.getByRole('heading', { name: 'テーブルカーリング' }),
    ).toBeVisible()
  },
}
