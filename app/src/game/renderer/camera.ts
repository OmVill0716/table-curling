import {
  STONE_RADIUS,
  TARGET_CENTER,
  TARGET_OUTER_RADIUS,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  WORLD_WIDTH,
} from '../../config/physics'
import type { Vector2 } from '../types'

export interface Camera {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface ViewportSize {
  readonly width: number
  readonly height: number
}

export const NORMAL_CAMERA: Camera = Object.freeze({
  x: 0,
  y: 0,
  width: VIEWPORT_WIDTH,
  height: VIEWPORT_HEIGHT,
})

export function createCameraForLaunch(launchPosition: Vector2): Camera {
  const stoneBottom = launchPosition.y + STONE_RADIUS

  if (stoneBottom <= VIEWPORT_HEIGHT) {
    return NORMAL_CAMERA
  }

  const targetTop = TARGET_CENTER.y - TARGET_OUTER_RADIUS
  const height = Math.max(VIEWPORT_HEIGHT, stoneBottom - targetTop)
  const width = height * (VIEWPORT_WIDTH / VIEWPORT_HEIGHT)

  return {
    x: (WORLD_WIDTH - width) / 2,
    y: stoneBottom - height,
    width,
    height,
  }
}

function assertViewport(viewport: ViewportSize) {
  if (
    !Number.isFinite(viewport.width) ||
    viewport.width <= 0 ||
    !Number.isFinite(viewport.height) ||
    viewport.height <= 0
  ) {
    throw new RangeError('viewport dimensions must be finite and greater than 0')
  }
}

export function worldToViewport(
  point: Vector2,
  camera: Camera,
  viewport: ViewportSize,
): Vector2 {
  assertViewport(viewport)

  return {
    x: ((point.x - camera.x) / camera.width) * viewport.width,
    y: ((point.y - camera.y) / camera.height) * viewport.height,
  }
}

export function viewportToWorld(
  point: Vector2,
  camera: Camera,
  viewport: ViewportSize,
): Vector2 {
  assertViewport(viewport)

  return {
    x: camera.x + (point.x / viewport.width) * camera.width,
    y: camera.y + (point.y / viewport.height) * camera.height,
  }
}

export function getCameraScale(camera: Camera, viewport: ViewportSize) {
  assertViewport(viewport)
  return Math.min(viewport.width / camera.width, viewport.height / camera.height)
}
