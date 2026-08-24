import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from '../../config/physics'

export const MAX_CANVAS_PIXEL_RATIO = 2

export interface CanvasCssSize {
  readonly width: number
  readonly height: number
}

export interface CanvasViewport {
  readonly cssWidth: number
  readonly cssHeight: number
  readonly pixelRatio: number
  readonly bufferWidth: number
  readonly bufferHeight: number
}

function assertAvailableSize(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    width < 0 ||
    !Number.isFinite(height) ||
    height < 0
  ) {
    throw new RangeError(
      'available dimensions must be finite and greater than or equal to 0',
    )
  }
}

export function fitCanvasCssSize(
  availableWidth: number,
  availableHeight: number,
): CanvasCssSize {
  assertAvailableSize(availableWidth, availableHeight)
  const aspectRatio = VIEWPORT_WIDTH / VIEWPORT_HEIGHT
  const width = Math.min(availableWidth, availableHeight * aspectRatio)

  return {
    width,
    height: width / aspectRatio,
  }
}

export function normalizeCanvasPixelRatio(pixelRatio: number | undefined) {
  if (!Number.isFinite(pixelRatio) || (pixelRatio ?? 0) <= 0) {
    return 1
  }

  return Math.min(pixelRatio as number, MAX_CANVAS_PIXEL_RATIO)
}

export function getCanvasViewport(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio?: number,
): CanvasViewport {
  assertAvailableSize(cssWidth, cssHeight)
  const pixelRatio = normalizeCanvasPixelRatio(devicePixelRatio)

  return {
    cssWidth,
    cssHeight,
    pixelRatio,
    bufferWidth: Math.round(cssWidth * pixelRatio),
    bufferHeight: Math.round(cssHeight * pixelRatio),
  }
}

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  viewport: CanvasViewport,
) {
  canvas.style.width = `${viewport.cssWidth}px`
  canvas.style.height = `${viewport.cssHeight}px`
  canvas.width = viewport.bufferWidth
  canvas.height = viewport.bufferHeight
}
