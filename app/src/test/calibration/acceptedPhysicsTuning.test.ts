import { describe, expect, it } from 'vitest'
import {
  PHYSICS_STEP_MS,
  PHYSICS_TUNING,
  TARGET_CENTER,
} from '../../config/physics'
import { createPhysicsRuntime } from '../../game/runtime/physicsRuntime'
import type { PhysicsSnapshot, StoneId, Vector2 } from '../../game/types'
import {
  PHYSICS_CALIBRATION_ARGS,
  argsToPhysicsTuning,
  type PhysicsCalibrationArgs,
} from '../../stories/physics/calibrationTypes'
import {
  createCalibrationScene,
  type CalibrationScene,
} from '../../stories/physics/calibrationPresets'

interface SimulationObservation {
  readonly snapshot: PhysicsSnapshot
  readonly launchSpeed: number
  readonly launchTravelDistance: number
  readonly minimumTargetDistance: number
  readonly maximumSpeeds: ReadonlyMap<StoneId, number>
  readonly stoneOrderReversed: boolean
}

function distanceBetween(a: Vector2, b: Vector2) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function simulate(
  args: PhysicsCalibrationArgs,
  scene: CalibrationScene,
): SimulationObservation {
  let didComplete = false
  const tuning = argsToPhysicsTuning(args)
  const runtime = createPhysicsRuntime({
    surface: args.surface,
    tuning,
    onComplete: () => {
      didComplete = true
    },
  })
  const startPositions = new Map(
    scene.stones.map(({ id, position }) => [id, position]),
  )
  const maximumSpeeds = new Map<StoneId, number>()
  let minimumTargetDistance = distanceBetween(
    scene.launchPosition,
    TARGET_CENTER,
  )
  let stoneOrderReversed = false

  for (const stone of scene.stones) {
    runtime.addStone(stone.id, stone.position)
  }
  const velocity = runtime.launchStone(scene.launchId, args.power)

  for (let step = 0; step < 5_000 && !didComplete; step += 1) {
    runtime.advanceFrame(PHYSICS_STEP_MS)
    const snapshot = runtime.getSnapshot()
    const launchStone = snapshot.stones.find(
      ({ id }) => id === scene.launchId,
    )

    if (launchStone) {
      minimumTargetDistance = Math.min(
        minimumTargetDistance,
        distanceBetween(launchStone.position, TARGET_CENTER),
      )
    }

    for (const stone of snapshot.stones) {
      maximumSpeeds.set(
        stone.id,
        Math.max(maximumSpeeds.get(stone.id) ?? 0, stone.speed),
      )
    }

    const target = snapshot.stones.find(({ id }) => id === 'target')
    const striker = snapshot.stones.find(({ id }) => id === 'striker')
    if (
      target?.motionState !== 'outOfBounds' &&
      striker?.motionState !== 'outOfBounds' &&
      target &&
      striker &&
      striker.position.y < target.position.y
    ) {
      stoneOrderReversed = true
    }
  }

  if (!didComplete) {
    throw new Error(`Simulation did not complete: ${scene.name}`)
  }

  const completedSnapshot = runtime.getSnapshot()
  const finalLaunchStone = completedSnapshot.stones.find(
    ({ id }) => id === scene.launchId,
  )
  const startPosition = startPositions.get(scene.launchId)
  if (!finalLaunchStone || !startPosition) {
    throw new Error(`Launch stone is missing: ${scene.launchId}`)
  }

  return {
    snapshot: completedSnapshot,
    launchSpeed: Math.hypot(velocity.x, velocity.y),
    launchTravelDistance: distanceBetween(
      finalLaunchStone.position,
      startPosition,
    ),
    minimumTargetDistance,
    maximumSpeeds,
    stoneOrderReversed,
  }
}

function calibrationArgs(
  overrides: Partial<PhysicsCalibrationArgs>,
): PhysicsCalibrationArgs {
  return { ...PHYSICS_CALIBRATION_ARGS, ...overrides }
}

describe('承認済みPhysics設定', () => {
  it('production設定とStorybook初期設定が一致する', () => {
    expect(argsToPhysicsTuning(PHYSICS_CALIBRATION_ARGS)).toEqual(
      PHYSICS_TUNING,
    )
  })

  it('FELTのPower 1が40 logical px以上進む', () => {
    const args = calibrationArgs({
      preset: 'MinimumPowerFelt',
      surface: 'FELT',
      distance: 'SHORT',
      power: 1,
    })
    const observation = simulate(
      args,
      createCalibrationScene(args.preset, args.distance),
    )

    expect(observation.launchTravelDistance).toBeGreaterThanOrEqual(40)
    expect(observation.launchTravelDistance).toBeCloseTo(79.5140948965, 6)
    expect(observation.snapshot.stepCount).toBe(122)
    expect(observation.snapshot.stones[0].motionState).toBe('stopped')
  })

  it('FELT・LONG最大後退のPower 100がターゲット中心120以内へ入る', () => {
    const args = calibrationArgs({
      preset: 'MaximumPowerFeltLong',
      surface: 'FELT',
      distance: 'LONG',
      power: 100,
    })
    const scene = createCalibrationScene(args.preset, args.distance)
    const observation = simulate(args, scene)

    expect(scene.launchPosition).toEqual({ x: 300, y: 1084 })
    expect(scene.backtrackSteps).toBe(4)
    expect(observation.minimumTargetDistance).toBeLessThanOrEqual(120)
    expect(observation.minimumTargetDistance).toBeCloseTo(0.2259576278, 6)
    expect(observation.snapshot.stepCount).toBe(380)
    expect(observation.snapshot.stones[0].motionState).toBe('stopped')
  })

  it('同じPowerでICE、WOOD、FELTの初速度が等しく移動距離に差が出る', () => {
    const observations = (['ICE', 'WOOD', 'FELT'] as const).map((surface) => {
      const args = calibrationArgs({
        preset: 'InteractiveCalibration',
        surface,
        distance: 'SHORT',
        power: 1,
      })
      return simulate(
        args,
        createCalibrationScene(args.preset, args.distance),
      )
    })

    expect(observations.map(({ launchSpeed }) => launchSpeed)).toEqual([
      2, 2, 2,
    ])
    expect(
      observations.map(({ launchTravelDistance }) => launchTravelDistance),
    ).toEqual([
      expect.closeTo(263.9371108896, 6),
      expect.closeTo(138.1882767566, 6),
      expect.closeTo(79.5140948965, 6),
    ])
    expect(observations[0].launchTravelDistance).toBeGreaterThan(
      observations[1].launchTravelDistance,
    )
    expect(observations[1].launchTravelDistance).toBeGreaterThan(
      observations[2].launchTravelDistance,
    )
  })

  it('最大Powerの正面衝突で速度を伝え、Stoneの順序がすり抜けない', () => {
    const args = calibrationArgs({
      preset: 'HeadOnCollision',
      surface: 'WOOD',
      distance: 'LONG',
      power: 100,
    })
    const observation = simulate(
      args,
      createCalibrationScene(args.preset, args.distance),
    )

    expect(observation.maximumSpeeds.get('target')).toBeCloseTo(
      7.425493841,
      6,
    )
    expect(observation.stoneOrderReversed).toBe(false)
    expect(observation.snapshot.stepCount).toBe(287)
  })

  it('LaunchPositionFallbackが候補4を選ぶ', () => {
    const scene = createCalibrationScene('LaunchPositionFallback', 'LONG')

    expect(scene.launchPosition).toEqual({ x: 300, y: 1084 })
    expect(scene.backtrackSteps).toBe(4)
  })

  it('OutOfBoundsで四辺のStoneをすべて盤外へ移す', () => {
    const args = calibrationArgs({
      preset: 'OutOfBounds',
      surface: 'ICE',
      power: 100,
    })
    const observation = simulate(
      args,
      createCalibrationScene(args.preset, args.distance),
    )

    expect(observation.snapshot.stones).toHaveLength(4)
    expect(
      observation.snapshot.stones.every(
        ({ motionState }) => motionState === 'outOfBounds',
      ),
    ).toBe(true)
  })
})
