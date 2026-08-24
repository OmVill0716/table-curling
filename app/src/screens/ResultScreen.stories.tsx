import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import {
  firstPlaceResult,
  maximumScoreResult,
  outsideRankingResult,
} from '../mocks/gameScreenMocks'
import { ResultScreen } from './ResultScreen'

const meta = {
  title: 'Screens/Result',
  component: ResultScreen,
  parameters: { appScreen: true },
  args: {
    result: firstPlaceResult,
    surface: 'ICE',
    throwDistance: 'LONG',
    onRetry: fn(),
    onTop: fn(),
  },
} satisfies Meta<typeof ResultScreen>

export default meta
type Story = StoryObj<typeof meta>

export const FirstPlace: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('合計 190点')).toBeVisible()
    await expect(canvas.getByText('NEW HIGH SCORE · 1st')).toBeVisible()
    await expect(canvas.getByText('OUT / 0')).toBeVisible()
    await expect(canvas.queryByText(/x:/i)).not.toBeInTheDocument()
  },
}

export const SecondPlaceMaximumScore: Story = {
  args: {
    result: maximumScoreResult,
    surface: 'WOOD',
    throwDistance: 'SHORT',
  },
}

export const OutsideRankingWithZero: Story = {
  args: {
    result: outsideRankingResult,
    surface: 'FELT',
    throwDistance: 'MEDIUM',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('合計 0点')).toBeVisible()
    await expect(canvas.queryByText(/NEW HIGH SCORE/)).not.toBeInTheDocument()
    await expect(canvas.getAllByText('OUT / 0')).toHaveLength(5)
  },
}
