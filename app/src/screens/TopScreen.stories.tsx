import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TopScreen } from './TopScreen'

const meta = {
  title: 'Screens/TOP',
  component: TopScreen,
  parameters: { appScreen: true },
  args: {
    soundEnabled: true,
    onSoundEnabledChange: fn(),
    onStartGame: fn(),
    onOpenScore: fn(),
    onOpenHowToPlay: fn(),
  },
} satisfies Meta<typeof TopScreen>

export default meta
type Story = StoryObj<typeof meta>

export const SoundOn: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('heading', { name: 'テーブルカーリング' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'ゲームプレイ' }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'スコア確認' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '遊び方' })).toBeVisible()

    await userEvent.click(canvas.getByRole('switch', { name: '効果音' }))
    await expect(args.onSoundEnabledChange).toHaveBeenCalledWith(false)
  },
}

export const SoundOff: Story = {
  args: { soundEnabled: false },
}
