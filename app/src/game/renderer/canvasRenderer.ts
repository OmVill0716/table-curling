import {
  STONE_RADIUS,
  TARGET_CENTER,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../../config/physics'
import type { PhysicsSnapshot, Surface, Vector2 } from '../types'
import type { Camera } from './camera'
import { getCameraScale, worldToViewport } from './camera'
import type { CanvasViewport } from './canvasSizing'

const SURFACE_COLORS: Readonly<Record<Surface, string>> = {
  ICE: '#DDF5FF',
  WOOD: '#B98252',
  FELT: '#287A4B',
}

const TARGET_RINGS = [
  { radius: 120, color: '#1976D2' },
  { radius: 90, color: '#FBC02D' },
  { radius: 60, color: '#F57C00' },
  { radius: 30, color: '#D32F2F' },
] as const

export interface CalibrationRenderOptions {
  readonly snapshot: PhysicsSnapshot
  readonly camera: Camera
  readonly viewport: CanvasViewport
  readonly surface: Surface
  readonly launchPosition?: Vector2
}

function drawCircle(
  context: CanvasRenderingContext2D,
  center: Vector2,
  radius: number,
  fillColor: string,
  outlineColor: string,
) {
  context.beginPath()
  context.arc(center.x, center.y, radius, 0, Math.PI * 2)
  context.fillStyle = fillColor
  context.fill()
  context.strokeStyle = outlineColor
  context.stroke()
}

export function renderCalibrationScene(
  canvas: HTMLCanvasElement,
  {
    snapshot,
    camera,
    viewport,
    surface,
    launchPosition,
  }: CalibrationRenderOptions,
) {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context is not available')
  }

  const displaySize = {
    width: viewport.cssWidth,
    height: viewport.cssHeight,
  }
  const scale = getCameraScale(camera, displaySize)
  const targetCenter = worldToViewport(TARGET_CENTER, camera, displaySize)

  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.setTransform(
    viewport.pixelRatio,
    0,
    0,
    viewport.pixelRatio,
    0,
    0,
  )
  context.fillStyle = SURFACE_COLORS[surface]
  context.fillRect(0, 0, viewport.cssWidth, viewport.cssHeight)

  if (launchPosition) {
    const launch = worldToViewport(launchPosition, camera, displaySize)
    context.save()
    context.setLineDash([8, 8])
    context.lineWidth = 1.5
    context.strokeStyle = 'rgba(20, 25, 30, 0.65)'
    context.beginPath()
    context.moveTo(launch.x, launch.y)
    context.lineTo(targetCenter.x, targetCenter.y)
    context.stroke()
    context.restore()
  }

  context.lineWidth = 1.5
  for (const ring of TARGET_RINGS) {
    drawCircle(
      context,
      targetCenter,
      ring.radius * scale,
      ring.color,
      'rgba(20, 25, 30, 0.75)',
    )
  }

  const worldTopLeft = worldToViewport({ x: 0, y: 0 }, camera, displaySize)
  const worldBottomRight = worldToViewport(
    { x: WORLD_WIDTH, y: WORLD_HEIGHT },
    camera,
    displaySize,
  )
  context.lineWidth = 2
  context.strokeStyle = 'rgba(20, 25, 30, 0.85)'
  context.strokeRect(
    worldTopLeft.x,
    worldTopLeft.y,
    worldBottomRight.x - worldTopLeft.x,
    worldBottomRight.y - worldTopLeft.y,
  )

  for (const stone of snapshot.stones) {
    if (stone.motionState === 'outOfBounds') {
      continue
    }

    const center = worldToViewport(stone.position, camera, displaySize)
    drawCircle(
      context,
      center,
      STONE_RADIUS * scale,
      '#ECEFF1',
      '#20252A',
    )
  }

  context.restore()
}
