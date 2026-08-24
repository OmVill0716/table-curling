import type { Surface, ThrowDistance, Vector2 } from '../game/types'
import { SURFACE_FRICTION_AIR } from './surfaces'

export const WORLD_WIDTH = 600
export const WORLD_HEIGHT = 1500
export const VIEWPORT_WIDTH = 600
export const VIEWPORT_HEIGHT = 1000

export const TARGET_CENTER: Vector2 = { x: 300, y: 220 }
export const TARGET_OUTER_RADIUS = 120

export const STONE_RADIUS = 18
export const STONE_DIAMETER = STONE_RADIUS * 2

export const MINIMUM_TRAVEL_DISTANCE = 40
export const LAUNCH_POSITION_STEP = STONE_DIAMETER
export const MAX_LAUNCH_POSITION_STEPS = 4

export const BASE_LAUNCH_POSITIONS: Readonly<Record<ThrowDistance, Vector2>> = {
  SHORT: { x: 300, y: 740 },
  MEDIUM: { x: 300, y: 840 },
  LONG: { x: 300, y: 940 },
}

export const PHYSICS_STEP_MS = 1000 / 120
export const MAX_FRAME_DELTA_MS = 100
export const MAX_PHYSICS_STEPS_PER_FRAME = 12

export interface PhysicsTuning {
  readonly minSpeed: number
  readonly maxSpeed: number
  readonly frictionAir: Readonly<Record<Surface, number>>
  readonly restitution: number
  readonly stopSpeed: number
  readonly stopDurationMs: number
}

export const PHYSICS_MIN_SPEED = 2
export const PHYSICS_MAX_SPEED = 14
export const PHYSICS_RESTITUTION = 0.85
export const PHYSICS_STOP_SPEED = 1
export const PHYSICS_STOP_DURATION_MS = 250

export const PHYSICS_TUNING: PhysicsTuning = Object.freeze({
  minSpeed: PHYSICS_MIN_SPEED,
  maxSpeed: PHYSICS_MAX_SPEED,
  frictionAir: SURFACE_FRICTION_AIR,
  restitution: PHYSICS_RESTITUTION,
  stopSpeed: PHYSICS_STOP_SPEED,
  stopDurationMs: PHYSICS_STOP_DURATION_MS,
})

export function getPhysicsTuningErrors(tuning: PhysicsTuning): readonly string[] {
  const errors: string[] = []

  if (!Number.isFinite(tuning.minSpeed) || tuning.minSpeed <= 0) {
    errors.push('minSpeed must be a finite number greater than 0')
  }

  if (!Number.isFinite(tuning.maxSpeed) || tuning.maxSpeed <= 0) {
    errors.push('maxSpeed must be a finite number greater than 0')
  }

  if (
    Number.isFinite(tuning.minSpeed) &&
    Number.isFinite(tuning.maxSpeed) &&
    tuning.minSpeed > tuning.maxSpeed
  ) {
    errors.push('minSpeed must be less than or equal to maxSpeed')
  }

  for (const [surface, frictionAir] of Object.entries(tuning.frictionAir)) {
    if (!Number.isFinite(frictionAir) || frictionAir < 0 || frictionAir >= 1) {
      errors.push(`${surface} frictionAir must be between 0 (inclusive) and 1`)
    }
  }

  if (
    !Number.isFinite(tuning.restitution) ||
    tuning.restitution < 0 ||
    tuning.restitution > 1
  ) {
    errors.push('restitution must be between 0 and 1 (inclusive)')
  }

  if (!Number.isFinite(tuning.stopSpeed) || tuning.stopSpeed < 0) {
    errors.push('stopSpeed must be a finite number greater than or equal to 0')
  }

  if (!Number.isFinite(tuning.stopDurationMs) || tuning.stopDurationMs < 0) {
    errors.push(
      'stopDurationMs must be a finite number greater than or equal to 0',
    )
  }

  return errors
}
