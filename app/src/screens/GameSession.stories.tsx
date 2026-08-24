import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { Surface } from '../game/types'
import { GameStoreProvider } from '../stores/GameStoreProvider'
import { GameSession } from './GameSession'

interface SessionStoryProps {
  readonly surface: Surface
}

function SessionStory({ surface }: SessionStoryProps) {
  return (
    <GameStoreProvider
      initialState={{
        screen: 'game',
        surface,
        throwDistance: 'SHORT',
        gamePhase: 'ready',
      }}
    >
      <GameSession surface={surface} throwDistance="SHORT" />
    </GameStoreProvider>
  )
}

const meta = {
  title: 'Screens/Game Runtime',
  component: SessionStory,
  parameters: { appScreen: true },
  args: { surface: 'ICE' },
} satisfies Meta<typeof SessionStory>

export default meta
type Story = StoryObj<typeof meta>

export const Ice: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('カーリング盤面')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'ストーンを投射' }),
    ).toBeEnabled()
    await expect(canvas.queryByText(/\d+ pt/)).not.toBeInTheDocument()
  },
}

export const Wood: Story = { args: { surface: 'WOOD' } }

export const Felt: Story = { args: { surface: 'FELT' } }
