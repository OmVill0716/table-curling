import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { GameScreen } from './GameScreen'

const meta = {
  title: 'Screens/Game',
  component: GameScreen,
  parameters: { appScreen: true },
  args: {
    completedShots: 0,
    gamePhase: 'ready',
    maxShots: 5,
    onChargeCancel: fn(),
    onChargeRelease: fn(),
    onChargeStart: fn(),
    onCloseRetireConfirmation: fn(),
    onConfirmRetire: fn(),
    onOpenRetireConfirmation: fn(),
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
    await expect(
      canvas.getByRole('button', { name: 'ストーンを投射' }),
    ).toBeEnabled()
    await expect(canvas.queryByText(/\d+ pt/)).not.toBeInTheDocument()
  },
}

export const Charging: Story = {
  args: {
    displayedPower: 50,
    gamePhase: 'charging',
    powerDirection: 'increasing',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('ボタンを離して投射')).toBeVisible()
    await expect(canvas.getByText(/現在のPower 50、上昇中/)).toBeVisible()
  },
}

export const Moving: Story = {
  args: { gamePhase: 'moving' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('全ストーンの停止を待っています')).toBeVisible()
    await expect(
      canvas.queryByRole('button', { name: 'ストーンを投射' }),
    ).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'リタイア' })).toBeVisible()
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
    await expect(canvas.getByRole('heading', { name: 'Shot 4 / 5' })).toBeVisible()
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
    await expect(
      canvas.queryByRole('button', { name: 'リタイア' }),
    ).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '結果を見る' }))
    await expect(args.onViewResult).toHaveBeenCalledOnce()
  },
}

export const RetireConfirmation: Story = {
  args: {
    gamePhase: 'moving',
    retireConfirmationOpen: true,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await waitFor(async () => {
      await expect(
        canvas.getByRole('heading', { name: 'ゲームをリタイアしますか？' }),
      ).toBeVisible()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'ゲームへ戻る' }))
    await expect(args.onCloseRetireConfirmation).toHaveBeenCalledOnce()
  },
}
