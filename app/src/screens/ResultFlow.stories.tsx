import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { AppContent } from '../App'
import { firstPlaceResult } from '../mocks/gameScreenMocks'
import { GameStoreProvider } from '../stores/GameStoreProvider'

const meta = {
  title: 'Screens/Result Store Flow',
  component: AppContent,
  parameters: { appScreen: true },
} satisfies Meta<typeof AppContent>

export default meta
type Story = StoryObj<typeof meta>

export const RetryKeepsSelection: Story = {
  render: () => (
    <GameStoreProvider
      initialState={{
        screen: 'result',
        surface: 'FELT',
        throwDistance: 'LONG',
        gamePhase: null,
        completedShots: 5,
        result: firstPlaceResult,
      }}
    >
      <AppContent />
    </GameStoreProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))

    await expect(canvas.getByRole('heading', { name: 'Shot 1 / 5' })).toBeVisible()
    await expect(canvas.getByText('FELT')).toBeVisible()
    await expect(canvas.getByText('LONG')).toBeVisible()
    await expect(canvas.getByText('投射準備OK')).toBeVisible()
  },
}

export const TopClearsSelection: Story = {
  render: () => (
    <GameStoreProvider
      initialState={{
        screen: 'result',
        surface: 'ICE',
        throwDistance: 'SHORT',
        gamePhase: null,
        completedShots: 5,
        result: firstPlaceResult,
      }}
    >
      <AppContent />
    </GameStoreProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'TOPへ' }))
    await userEvent.click(canvas.getByRole('button', { name: 'ゲームプレイ' }))

    await expect(
      canvas.getByRole('heading', { name: 'フィールド選択' }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'ICEを選択' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}
