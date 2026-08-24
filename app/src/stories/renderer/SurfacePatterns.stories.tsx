import { Box, Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useLayoutEffect, useRef } from 'react'
import { expect, within } from 'storybook/test'
import { NORMAL_CAMERA } from '../../game/renderer/camera'
import { renderGameScene } from '../../game/renderer/canvasRenderer'
import type { PhysicsSnapshot, Surface } from '../../game/types'

const snapshot: PhysicsSnapshot = {
  elapsedMs: 0,
  stepCount: 0,
  isComplete: true,
  stones: [
    { id: '100', position: { x: 300, y: 220 } },
    { id: '50', position: { x: 345, y: 220 } },
    { id: '30', position: { x: 375, y: 220 } },
    { id: '10', position: { x: 405, y: 220 } },
    { id: '0', position: { x: 450, y: 220 } },
  ].map(({ id, position }) => ({
    id: `stone-${id}`,
    position,
    velocity: { x: 0, y: 0 },
    speed: 0,
    angularVelocity: 0,
    motionState: 'stopped' as const,
  })),
}

function SurfacePreview({ surface }: { readonly surface: Surface }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }

    renderGameScene(canvas, {
      surface,
      snapshot,
      camera: NORMAL_CAMERA,
      viewport: {
        cssWidth: 300,
        cssHeight: 500,
        pixelRatio: 1,
        bufferWidth: 300,
        bufferHeight: 500,
      },
    })
  }, [surface])

  return (
    <Stack spacing={1} sx={{ alignItems: 'center' }}>
      <Typography component="h2" sx={{ fontWeight: 900 }}>
        {surface}
      </Typography>
      <Box
        aria-label={`${surface}の盤面パターン`}
        component="canvas"
        height={500}
        ref={canvasRef}
        sx={{ border: '1px solid', borderColor: 'divider', maxWidth: '100%' }}
        width={300}
      />
    </Stack>
  )
}

const meta = {
  title: 'Renderer/Surface Patterns',
  component: SurfacePreview,
  args: { surface: 'ICE' },
  argTypes: {
    surface: { control: 'select', options: ['ICE', 'WOOD', 'FELT'] },
  },
} satisfies Meta<typeof SurfacePreview>

export default meta
type Story = StoryObj<typeof meta>

export const Ice: Story = {}
export const Wood: Story = { args: { surface: 'WOOD' } }
export const Felt: Story = { args: { surface: 'FELT' } }

export const Comparison: Story = {
  render: () => (
    <Stack direction={{ md: 'row', xs: 'column' }} spacing={3}>
      {(['ICE', 'WOOD', 'FELT'] as const).map((surface) => (
        <SurfacePreview key={surface} surface={surface} />
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const surface of ['ICE', 'WOOD', 'FELT'] as const) {
      const board = canvas.getByLabelText(
        `${surface}の盤面パターン`,
      ) as HTMLCanvasElement
      await expect(board).toBeVisible()
      expect(board.width).toBe(300)
      expect(board.height).toBe(500)
    }
  },
}
