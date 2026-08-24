import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { PhysicsCalibrationHarness } from './PhysicsCalibrationHarness'
import {
  PHYSICS_CALIBRATION_ARGS,
  type PhysicsCalibrationArgs,
} from './calibrationTypes'

const meta = {
  title: 'Physics/Calibration',
  component: PhysicsCalibrationHarness,
  args: PHYSICS_CALIBRATION_ARGS,
  argTypes: {
    preset: {
      control: 'select',
      options: [
        'MinimumPowerFelt',
        'MaximumPowerFeltLong',
        'HeadOnCollision',
        'StopDetection',
        'LaunchPositionFallback',
        'OutOfBounds',
        'InteractiveCalibration',
      ],
    },
    surface: { control: 'select', options: ['ICE', 'WOOD', 'FELT'] },
    distance: { control: 'select', options: ['SHORT', 'MEDIUM', 'LONG'] },
    power: { control: { type: 'range', min: 1, max: 100, step: 1 } },
    minSpeed: { control: { type: 'number', min: 0.1, max: 5, step: 0.1 } },
    maxSpeed: { control: { type: 'number', min: 2, max: 30, step: 0.5 } },
    iceFrictionAir: {
      control: { type: 'number', min: 0, max: 0.05, step: 0.001 },
    },
    woodFrictionAir: {
      control: { type: 'number', min: 0, max: 0.05, step: 0.001 },
    },
    feltFrictionAir: {
      control: { type: 'number', min: 0, max: 0.05, step: 0.001 },
    },
    restitution: {
      control: { type: 'number', min: 0, max: 1, step: 0.05 },
    },
    stopSpeed: { control: { type: 'number', min: 0, max: 3, step: 0.1 } },
    stopDurationMs: {
      control: { type: 'number', min: 0, max: 1000, step: 25 },
    },
  },
} satisfies Meta<typeof PhysicsCalibrationHarness>

export default meta
type Story = StoryObj<typeof meta>

export const MinimumPowerFelt: Story = {
  args: {
    preset: 'MinimumPowerFelt',
    surface: 'FELT',
    distance: 'SHORT',
    power: 1,
  },
  play: async ({ canvasElement }) => {
    const story = within(canvasElement)
    const board = story.getByLabelText('物理調整盤面') as HTMLCanvasElement

    await expect(story.getByText('承認済み設定')).toBeVisible()
    await expect(board).toBeVisible()
    expect(board.width).toBeGreaterThan(0)
    expect(board.height).toBeGreaterThan(0)

    await expect(story.getByText('initial')).toBeVisible()
    await expect(story.getByText(/初速度: 未投射/)).toBeVisible()
  },
}

export const MaximumPowerFeltLong: Story = {
  args: {
    preset: 'MaximumPowerFeltLong',
    surface: 'FELT',
    distance: 'LONG',
    power: 100,
  },
}

export const SurfaceComparison: Story = {
  args: {
    preset: 'InteractiveCalibration',
    distance: 'MEDIUM',
    power: 50,
  },
  render: (args) => (
    <Stack spacing={3} sx={{ width: '100%' }}>
      {(['ICE', 'WOOD', 'FELT'] as const).map((surface) => (
        <PhysicsCalibrationHarness
          {...(args as PhysicsCalibrationArgs)}
          key={surface}
          surface={surface}
        />
      ))}
    </Stack>
  ),
}

export const HeadOnCollision: Story = {
  args: {
    preset: 'HeadOnCollision',
    surface: 'WOOD',
    distance: 'LONG',
    power: 100,
  },
}

export const StopDetection: Story = {
  args: {
    preset: 'StopDetection',
    surface: 'FELT',
    distance: 'SHORT',
    power: 1,
  },
}

export const LaunchPositionFallback: Story = {
  args: {
    preset: 'LaunchPositionFallback',
    surface: 'WOOD',
    distance: 'LONG',
    power: 50,
  },
}

export const OutOfBounds: Story = {
  args: {
    preset: 'OutOfBounds',
    surface: 'ICE',
    distance: 'MEDIUM',
    power: 100,
  },
}

export const InteractiveCalibration: Story = {
  args: {
    preset: 'InteractiveCalibration',
  },
}
