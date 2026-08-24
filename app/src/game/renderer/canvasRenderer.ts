import {
  STONE_RADIUS,
  TARGET_CENTER,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../../config/physics'
import { getScoreForPosition, SCORE_COLORS } from '../scoring/scoreRules'
import type {
  PhysicsSnapshot,
  StoneScore,
  StoneSnapshot,
  Surface,
  Vector2,
} from '../types'
import type { Camera } from './camera'
import { getCameraScale, worldToViewport } from './camera'
import type { CanvasViewport } from './canvasSizing'
import { drawSurfaceBackground } from './surfacePatterns'

const TARGET_RINGS: readonly {
  readonly radius: number
  readonly score: Exclude<StoneScore, 0>
}[] = [
  { radius: 120, score: 10 },
  { radius: 90, score: 30 },
  { radius: 60, score: 50 },
  { radius: 30, score: 100 },
] as const

export const TARGET_SCORE_LABELS: readonly {
  readonly score: Exclude<StoneScore, 0>
  readonly position: Vector2
}[] = [
  { score: 100, position: TARGET_CENTER },
  { score: 50, position: { x: TARGET_CENTER.x, y: TARGET_CENTER.y - 45 } },
  { score: 30, position: { x: TARGET_CENTER.x, y: TARGET_CENTER.y - 75 } },
  { score: 10, position: { x: TARGET_CENTER.x, y: TARGET_CENTER.y - 105 } },
]

export interface CalibrationRenderOptions {
  readonly snapshot: PhysicsSnapshot
  readonly camera: Camera
  readonly viewport: CanvasViewport
  readonly surface: Surface
  readonly launchPosition?: Vector2
}

export type GameRenderOptions = Omit<
  CalibrationRenderOptions,
  'launchPosition'
>

export function getStoneFillColor(stone: StoneSnapshot) {
  return stone.motionState === 'outOfBounds'
    ? SCORE_COLORS[0]
    : SCORE_COLORS[getScoreForPosition(stone.position)]
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

function prepareContext(
  canvas: HTMLCanvasElement,
  viewport: CanvasViewport,
  surface: Surface,
) {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context is not available')
  }

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
  drawSurfaceBackground(context, surface, viewport)

  return context
}

function drawTarget(
  context: CanvasRenderingContext2D,
  camera: Camera,
  viewport: CanvasViewport,
  showScoreLabels: boolean,
) {
  const displaySize = {
    width: viewport.cssWidth,
    height: viewport.cssHeight,
  }
  const scale = getCameraScale(camera, displaySize)
  const targetCenter = worldToViewport(TARGET_CENTER, camera, displaySize)

  context.lineWidth = 1.5
  for (const ring of TARGET_RINGS) {
    drawCircle(
      context,
      targetCenter,
      ring.radius * scale,
      SCORE_COLORS[ring.score],
      'rgba(20, 25, 30, 0.75)',
    )
  }

  if (!showScoreLabels) {
    return
  }

  context.save()
  context.font = `900 ${Math.max(12, 17 * scale)}px system-ui, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.lineJoin = 'round'
  context.lineWidth = Math.max(3, 4 * scale)

  for (const label of TARGET_SCORE_LABELS) {
    const position = worldToViewport(label.position, camera, displaySize)
    const text = String(label.score)
    context.strokeStyle = 'rgba(255, 255, 255, 0.96)'
    context.strokeText(text, position.x, position.y)
    context.fillStyle = SCORE_COLORS[label.score]
    context.fillText(text, position.x, position.y)
  }
  context.restore()
}

function drawWorldBoundary(
  context: CanvasRenderingContext2D,
  camera: Camera,
  viewport: CanvasViewport,
) {
  const displaySize = {
    width: viewport.cssWidth,
    height: viewport.cssHeight,
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
}

function drawStones(
  context: CanvasRenderingContext2D,
  snapshot: PhysicsSnapshot,
  camera: Camera,
  viewport: CanvasViewport,
  dynamicScoreColors: boolean,
) {
  const displaySize = {
    width: viewport.cssWidth,
    height: viewport.cssHeight,
  }
  const scale = getCameraScale(camera, displaySize)

  for (const stone of snapshot.stones) {
    if (stone.motionState === 'outOfBounds') {
      continue
    }

    const center = worldToViewport(stone.position, camera, displaySize)
    drawCircle(
      context,
      center,
      STONE_RADIUS * scale,
      dynamicScoreColors ? getStoneFillColor(stone) : '#ECEFF1',
      '#20252A',
    )
  }
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
  const displaySize = {
    width: viewport.cssWidth,
    height: viewport.cssHeight,
  }
  const targetCenter = worldToViewport(TARGET_CENTER, camera, displaySize)
  const context = prepareContext(canvas, viewport, surface)

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

  drawTarget(context, camera, viewport, false)
  drawWorldBoundary(context, camera, viewport)
  drawStones(context, snapshot, camera, viewport, false)

  context.restore()
}

export function renderGameScene(
  canvas: HTMLCanvasElement,
  { snapshot, camera, viewport, surface }: GameRenderOptions,
) {
  const context = prepareContext(canvas, viewport, surface)

  drawTarget(context, camera, viewport, true)
  drawWorldBoundary(context, camera, viewport)
  drawStones(context, snapshot, camera, viewport, true)
  context.restore()
}
