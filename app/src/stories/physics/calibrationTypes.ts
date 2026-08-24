import { PHYSICS_TUNING, type PhysicsTuning } from '../../config/physics'
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

export const PHYSICS_CALIBRATION_ARGS: PhysicsCalibrationArgs = {
  preset: 'InteractiveCalibration',
  surface: 'FELT',
  distance: 'MEDIUM',
  power: 50,
  minSpeed: PHYSICS_TUNING.minSpeed,
  maxSpeed: PHYSICS_TUNING.maxSpeed,
  iceFrictionAir: PHYSICS_TUNING.frictionAir.ICE,
  woodFrictionAir: PHYSICS_TUNING.frictionAir.WOOD,
  feltFrictionAir: PHYSICS_TUNING.frictionAir.FELT,
  restitution: PHYSICS_TUNING.restitution,
  stopSpeed: PHYSICS_TUNING.stopSpeed,
  stopDurationMs: PHYSICS_TUNING.stopDurationMs,
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
