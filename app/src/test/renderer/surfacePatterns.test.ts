import { describe, expect, it, vi } from 'vitest'
import {
  SURFACE_RENDER_STYLES,
  drawSurfaceBackground,
} from '../../game/renderer/surfacePatterns'
import type { Surface } from '../../game/types'

function createContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D
}

const viewport = {
  cssWidth: 300,
  cssHeight: 500,
  pixelRatio: 2,
  bufferWidth: 600,
  bufferHeight: 1000,
}

describe('surfacePatterns', () => {
  it('3 Surfaceへ異なる基調色とパターン色を割り当てる', () => {
    const styles = Object.values(SURFACE_RENDER_STYLES)

    expect(new Set(styles.map(({ baseColor }) => baseColor)).size).toBe(3)
    expect(
      new Set(styles.map(({ primaryPatternColor }) => primaryPatternColor)).size,
    ).toBe(3)
  })

  it.each(['ICE', 'WOOD', 'FELT'] as const)(
    '%sを基調色で塗って決定的なパターンを重ねる',
    (surface) => {
      const first = createContext()
      const second = createContext()

      drawSurfaceBackground(first, surface, viewport)
      drawSurfaceBackground(second, surface, viewport)

      expect(first.fillRect).toHaveBeenCalledWith(0, 0, 300, 500)
      expect(first.save).toHaveBeenCalledOnce()
      expect(first.restore).toHaveBeenCalledOnce()
      expect(drawCalls(first, surface)).toEqual(drawCalls(second, surface))
      expect(drawCalls(first, surface).length).toBeGreaterThan(1)
    },
  )
})

function drawCalls(context: CanvasRenderingContext2D, surface: Surface) {
  if (surface === 'ICE') {
    return [
      ...(context.moveTo as ReturnType<typeof vi.fn>).mock.calls,
      ...(context.lineTo as ReturnType<typeof vi.fn>).mock.calls,
    ]
  }
  if (surface === 'WOOD') {
    return [
      ...(context.lineTo as ReturnType<typeof vi.fn>).mock.calls,
      ...(context.ellipse as ReturnType<typeof vi.fn>).mock.calls,
    ]
  }
  return (context.fillRect as ReturnType<typeof vi.fn>).mock.calls
}
