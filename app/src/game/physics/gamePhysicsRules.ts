import {
  BASE_LAUNCH_POSITIONS,
  LAUNCH_POSITION_STEP,
  MAX_LAUNCH_POSITION_STEPS,
  MINIMUM_TRAVEL_DISTANCE,
  STONE_DIAMETER,
  STONE_RADIUS,
  TARGET_CENTER,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../../config/physics'
import type { ThrowDistance, Vector2 } from '../types'

function assertFiniteVector(vector: Vector2, name: string) {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new RangeError(`${name} must contain finite coordinates`)
  }
}

export function powerToSpeed(
  power: number,
  minSpeed: number,
  maxSpeed: number,
) {
  if (!Number.isFinite(power) || power < 1 || power > 100) {
    throw new RangeError('power must be between 1 and 100 (inclusive)')
  }

  if (
    !Number.isFinite(minSpeed) ||
    !Number.isFinite(maxSpeed) ||
    minSpeed <= 0 ||
    maxSpeed <= 0 ||
    minSpeed > maxSpeed
  ) {
    throw new RangeError(
      'minSpeed and maxSpeed must be finite positive numbers in ascending order',
    )
  }

  const normalizedPower = (power - 1) / 99

  return minSpeed + normalizedPower * (maxSpeed - minSpeed)
}

export function directionBetween(from: Vector2, to: Vector2): Vector2 {
  assertFiniteVector(from, 'from')
  assertFiniteVector(to, 'to')

  const x = to.x - from.x
  const y = to.y - from.y
  const length = Math.hypot(x, y)

  if (length === 0) {
    throw new RangeError('from and to must be different positions')
  }

  return { x: x / length, y: y / length }
}

export function getThrowDirection(launchPosition: Vector2): Vector2 {
  return directionBetween(launchPosition, TARGET_CENTER)
}

export function getLaunchVelocity(
  launchPosition: Vector2,
  power: number,
  minSpeed: number,
  maxSpeed: number,
): Vector2 {
  const direction = getThrowDirection(launchPosition)
  const speed = powerToSpeed(power, minSpeed, maxSpeed)

  return {
    x: direction.x * speed,
    y: direction.y * speed,
  }
}

export function getBaseLaunchPosition(distance: ThrowDistance): Vector2 {
  const position = BASE_LAUNCH_POSITIONS[distance]

  return { ...position }
}

export function distanceFromPointToSegment(
  point: Vector2,
  segmentStart: Vector2,
  segmentEnd: Vector2,
) {
  assertFiniteVector(point, 'point')
  assertFiniteVector(segmentStart, 'segmentStart')
  assertFiniteVector(segmentEnd, 'segmentEnd')

  const segmentX = segmentEnd.x - segmentStart.x
  const segmentY = segmentEnd.y - segmentStart.y
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2

  if (segmentLengthSquared === 0) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y)
  }

  const projection =
    ((point.x - segmentStart.x) * segmentX +
      (point.y - segmentStart.y) * segmentY) /
    segmentLengthSquared
  const clampedProjection = Math.max(0, Math.min(1, projection))
  const nearestX = segmentStart.x + segmentX * clampedProjection
  const nearestY = segmentStart.y + segmentY * clampedProjection

  return Math.hypot(point.x - nearestX, point.y - nearestY)
}

export function isLaunchPathClear(
  launchPosition: Vector2,
  existingStonePositions: readonly Vector2[],
) {
  const direction = getThrowDirection(launchPosition)
  const pathEnd = {
    x: launchPosition.x + direction.x * MINIMUM_TRAVEL_DISTANCE,
    y: launchPosition.y + direction.y * MINIMUM_TRAVEL_DISTANCE,
  }

  return existingStonePositions.every(
    (position) =>
      distanceFromPointToSegment(position, launchPosition, pathEnd) >=
      STONE_DIAMETER,
  )
}

export type LaunchPositionResult =
  | {
      readonly available: true
      readonly position: Vector2
      readonly backtrackSteps: number
    }
  | {
      readonly available: false
      readonly reason: 'blocked'
    }

export function findLaunchPosition(
  distance: ThrowDistance,
  existingStonePositions: readonly Vector2[],
): LaunchPositionResult {
  const basePosition = getBaseLaunchPosition(distance)

  for (let step = 0; step <= MAX_LAUNCH_POSITION_STEPS; step += 1) {
    const candidate = {
      x: basePosition.x,
      y: basePosition.y + LAUNCH_POSITION_STEP * step,
    }

    if (isLaunchPathClear(candidate, existingStonePositions)) {
      return { available: true, position: candidate, backtrackSteps: step }
    }
  }

  return { available: false, reason: 'blocked' }
}

export function isStoneOutOfBounds(position: Vector2) {
  assertFiniteVector(position, 'position')

  return (
    position.x < -STONE_RADIUS ||
    position.x > WORLD_WIDTH + STONE_RADIUS ||
    position.y < -STONE_RADIUS ||
    position.y > WORLD_HEIGHT + STONE_RADIUS
  )
}
