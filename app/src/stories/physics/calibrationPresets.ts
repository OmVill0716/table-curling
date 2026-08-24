import { LAUNCH_POSITION_STEP } from '../../config/physics'
import {
  findLaunchPosition,
  getBaseLaunchPosition,
} from '../../game/physics/gamePhysicsRules'
import type { StoneId, ThrowDistance, Vector2 } from '../../game/types'
import type { CalibrationPreset } from './calibrationTypes'

export interface CalibrationStoneSetup {
  readonly id: StoneId
  readonly position: Vector2
}

export interface CalibrationScene {
  readonly name: CalibrationPreset
  readonly launchId: StoneId
  readonly launchPosition: Vector2
  readonly backtrackSteps: number
  readonly stones: readonly CalibrationStoneSetup[]
}

function singleStoneScene(
  name: CalibrationPreset,
  distance: ThrowDistance,
  backtrackSteps = 0,
): CalibrationScene {
  const basePosition = getBaseLaunchPosition(distance)
  const launchPosition = {
    x: basePosition.x,
    y: basePosition.y + LAUNCH_POSITION_STEP * backtrackSteps,
  }

  return {
    name,
    launchId: 'stone-1',
    launchPosition,
    backtrackSteps,
    stones: [{ id: 'stone-1', position: launchPosition }],
  }
}

export function createCalibrationScene(
  preset: CalibrationPreset,
  distance: ThrowDistance,
): CalibrationScene {
  switch (preset) {
    case 'MaximumPowerFeltLong':
      return singleStoneScene(preset, 'LONG', 4)

    case 'HeadOnCollision': {
      const launchPosition = getBaseLaunchPosition('LONG')
      return {
        name: preset,
        launchId: 'striker',
        launchPosition,
        backtrackSteps: 0,
        stones: [
          { id: 'target', position: { x: 300, y: 220 } },
          { id: 'striker', position: launchPosition },
        ],
      }
    }

    case 'LaunchPositionFallback': {
      const blockers = [0, 1, 2, 3].map((step) => ({
        x: 335,
        y: 940 + LAUNCH_POSITION_STEP * step - 40,
      }))
      const result = findLaunchPosition('LONG', blockers)

      if (!result.available) {
        throw new Error('LaunchPositionFallback scene could not be created')
      }

      return {
        name: preset,
        launchId: 'stone-1',
        launchPosition: result.position,
        backtrackSteps: result.backtrackSteps,
        stones: [
          ...blockers.map((position, index) => ({
            id: `blocker-${index + 1}`,
            position,
          })),
          { id: 'stone-1', position: result.position },
        ],
      }
    }

    case 'OutOfBounds': {
      const launchPosition = { x: -80, y: 500 }
      return {
        name: preset,
        launchId: 'left',
        launchPosition,
        backtrackSteps: 0,
        stones: [
          { id: 'left', position: launchPosition },
          { id: 'right', position: { x: 680, y: 500 } },
          { id: 'top', position: { x: 300, y: -80 } },
          { id: 'bottom', position: { x: 300, y: 1580 } },
        ],
      }
    }

    case 'MinimumPowerFelt':
    case 'StopDetection':
    case 'InteractiveCalibration':
      return singleStoneScene(preset, distance)
  }
}
