import type { Surface } from '../types'
import type { CanvasViewport } from './canvasSizing'

export interface SurfaceRenderStyle {
  readonly baseColor: string
  readonly primaryPatternColor: string
  readonly secondaryPatternColor: string
}

export const SURFACE_RENDER_STYLES: Readonly<
  Record<Surface, SurfaceRenderStyle>
> = {
  ICE: {
    baseColor: '#DDF5FF',
    primaryPatternColor: 'rgba(255, 255, 255, 0.48)',
    secondaryPatternColor: 'rgba(86, 154, 184, 0.16)',
  },
  WOOD: {
    baseColor: '#B98252',
    primaryPatternColor: 'rgba(91, 48, 25, 0.20)',
    secondaryPatternColor: 'rgba(244, 205, 158, 0.18)',
  },
  FELT: {
    baseColor: '#287A4B',
    primaryPatternColor: 'rgba(225, 246, 230, 0.15)',
    secondaryPatternColor: 'rgba(10, 55, 31, 0.14)',
  },
}

function drawIce(
  context: CanvasRenderingContext2D,
  viewport: CanvasViewport,
  style: SurfaceRenderStyle,
) {
  context.lineWidth = 1
  context.strokeStyle = style.primaryPatternColor
  for (
    let offset = -viewport.cssHeight;
    offset < viewport.cssWidth + viewport.cssHeight;
    offset += 72
  ) {
    context.beginPath()
    context.moveTo(offset, 0)
    context.lineTo(offset + viewport.cssHeight * 0.28, viewport.cssHeight)
    context.stroke()
  }

  context.strokeStyle = style.secondaryPatternColor
  for (let row = 0; row < viewport.cssHeight; row += 140) {
    const x = (row * 1.7 + 43) % Math.max(1, viewport.cssWidth)
    context.beginPath()
    context.moveTo(x, row + 18)
    context.lineTo(x + 22, row + 38)
    context.lineTo(x + 12, row + 58)
    context.stroke()
  }
}

function drawWood(
  context: CanvasRenderingContext2D,
  viewport: CanvasViewport,
  style: SurfaceRenderStyle,
) {
  context.lineWidth = 1.25
  for (let x = 18; x < viewport.cssWidth; x += 34) {
    context.strokeStyle =
      Math.floor(x / 34) % 2 === 0
        ? style.primaryPatternColor
        : style.secondaryPatternColor
    context.beginPath()
    context.moveTo(x, 0)
    for (let y = 32; y <= viewport.cssHeight + 32; y += 32) {
      const wave = Math.sin((y + x) / 62) * 5
      context.lineTo(x + wave, y)
    }
    context.stroke()
  }

  context.strokeStyle = style.primaryPatternColor
  context.lineWidth = 1.5
  for (let row = 100; row < viewport.cssHeight; row += 220) {
    const x = ((row * 0.9 + 67) % Math.max(1, viewport.cssWidth - 36)) + 18
    context.beginPath()
    context.ellipse(x, row, 12, 28, 0.15, 0, Math.PI * 2)
    context.stroke()
  }
}

function drawFelt(
  context: CanvasRenderingContext2D,
  viewport: CanvasViewport,
  style: SurfaceRenderStyle,
) {
  for (let y = 8; y < viewport.cssHeight; y += 18) {
    const row = Math.floor(y / 18)
    for (let x = 8; x < viewport.cssWidth; x += 18) {
      context.fillStyle =
        (Math.floor(x / 18) + row) % 2 === 0
          ? style.primaryPatternColor
          : style.secondaryPatternColor
      context.fillRect(x + (row % 2) * 3, y, 1.2, 1.2)
    }
  }
}

export function drawSurfaceBackground(
  context: CanvasRenderingContext2D,
  surface: Surface,
  viewport: CanvasViewport,
) {
  const style = SURFACE_RENDER_STYLES[surface]
  context.fillStyle = style.baseColor
  context.fillRect(0, 0, viewport.cssWidth, viewport.cssHeight)

  context.save()
  if (surface === 'ICE') {
    drawIce(context, viewport, style)
  } else if (surface === 'WOOD') {
    drawWood(context, viewport, style)
  } else {
    drawFelt(context, viewport, style)
  }
  context.restore()
}
