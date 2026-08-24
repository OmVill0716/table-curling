import { BASE_LAUNCH_POSITIONS, TARGET_CENTER } from '../../config/physics'
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
