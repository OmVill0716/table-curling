import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { COLLISION_AUDIO_TUNING } from '../../config/audio'
import { CollisionAudioCalibrationHarness } from './CollisionAudioCalibrationHarness'

const meta = {
  title: 'Audio/Collision Calibration',
  component: CollisionAudioCalibrationHarness,
  args: {
    minRelativeSpeed: COLLISION_AUDIO_TUNING.minRelativeSpeed,
    cooldownMs: COLLISION_AUDIO_TUNING.cooldownMs,
    volume: 0.35,
  },
  argTypes: {
    minRelativeSpeed: {
      control: { type: 'number', min: 0, max: 20, step: 0.1 },
    },
    cooldownMs: {
      control: { type: 'number', min: 0, max: 1000, step: 25 },
    },
    volume: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
    },
  },
} satisfies Meta<typeof CollisionAudioCalibrationHarness>

export default meta
type Story = StoryObj<typeof meta>

export const InteractiveCalibration: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: '衝突音 Calibration' }),
    ).toBeVisible()
    await expect(canvas.getByText(/仮調整値/)).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '単発衝突' }),
    ).toBeEnabled()
  },
}

export const QuietBell: Story = {
  args: { volume: 0.2 },
}

export const LongerCooldown: Story = {
  args: { cooldownMs: 500 },
}
