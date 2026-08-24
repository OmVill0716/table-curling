import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { GameScreen } from './GameScreen'

const meta = {
  title: 'Screens/Game',
  component: GameScreen,
  parameters: { appScreen: true },
  args: {
    completedShots: 0,
    gamePhase: 'ready',
    maxShots: 5,
    surface: 'ICE',
    throwDistance: 'SHORT',
  },
} satisfies Meta<typeof GameScreen>

export default meta
type Story = StoryObj<typeof meta>

export const FirstShotReady: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Shot 1 / 5' })).toBeVisible()
    await expect(canvas.getByLabelText('カーリング盤面')).toBeVisible()
    await expect(canvas.queryByText(/\d+ pt/)).not.toBeInTheDocument()
  },
}

export const FourthShotReview: Story = {
  args: {
    completedShots: 4,
    gamePhase: 'review',
    onNextShot: fn(),
    surface: 'WOOD',
    throwDistance: 'MEDIUM',
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '次の投射へ' }))
    await expect(args.onNextShot).toHaveBeenCalledOnce()
  },
}

export const FifthShotReview: Story = {
  args: {
    completedShots: 5,
    gamePhase: 'review',
    onViewResult: fn(),
    surface: 'FELT',
    throwDistance: 'LONG',
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Shot 5 / 5' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '結果を見る' }))
    await expect(args.onViewResult).toHaveBeenCalledOnce()
  },
}
