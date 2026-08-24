import type { PhysicsTuning } from '../../config/physics'
import type { Surface, ThrowDistance } from '../../game/types'

export const CALIBRATION_PRESETS = [
  'MinimumPowerFelt',
  'MaximumPowerFeltLong',
  'HeadOnCollision',
  'StopDetection',
  'LaunchPositionFallback',
  'OutOfBounds',
  'InteractiveCalibration',
] as const

export type CalibrationPreset = (typeof CALIBRATION_PRESETS)[number]

export interface PhysicsCalibrationArgs {
  readonly preset: CalibrationPreset
  readonly surface: Surface
  readonly distance: ThrowDistance
  readonly power: number
  readonly minSpeed: number
  readonly maxSpeed: number
  readonly iceFrictionAir: number
  readonly woodFrictionAir: number
  readonly feltFrictionAir: number
  readonly restitution: number
  readonly stopSpeed: number
  readonly stopDurationMs: number
}

export const CALIBRATION_CANDIDATE_ARGS: PhysicsCalibrationArgs = {
  preset: 'InteractiveCalibration',
  surface: 'FELT',
  distance: 'MEDIUM',
  power: 50,
  minSpeed: 2,
  maxSpeed: 14,
  iceFrictionAir: 0.004,
  woodFrictionAir: 0.008,
  feltFrictionAir: 0.015,
  restitution: 0.85,
  stopSpeed: 1,
  stopDurationMs: 250,
}

export function argsToPhysicsTuning(
  args: PhysicsCalibrationArgs,
): PhysicsTuning {
  return {
    minSpeed: args.minSpeed,
    maxSpeed: args.maxSpeed,
    frictionAir: {
      ICE: args.iceFrictionAir,
      WOOD: args.woodFrictionAir,
      FELT: args.feltFrictionAir,
    },
    restitution: args.restitution,
    stopSpeed: args.stopSpeed,
    stopDurationMs: args.stopDurationMs,
  }
}
