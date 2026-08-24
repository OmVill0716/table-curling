import {
  MAX_FRAME_DELTA_MS,
  MAX_PHYSICS_STEPS_PER_FRAME,
  PHYSICS_STEP_MS,
  type PhysicsTuning,
} from '../../config/physics'
import type {
  PhysicsSnapshot,
  StoneId,
  Surface,
  Vector2,
} from '../types'
import {
  createMatterAdapter,
  type MatterAdapter,
} from '../physics/matterAdapter'
import { getLaunchVelocity } from '../physics/gamePhysicsRules'
import {
  createFixedTimestep,
  type FixedTimestepAdvanceResult,
} from './fixedTimestep'

export interface PhysicsRuntimeOptions {
  readonly surface: Surface
  readonly tuning: PhysicsTuning
  readonly onComplete?: (snapshot: PhysicsSnapshot) => void
}

export interface PhysicsRuntimeDiagnostics {
  readonly accumulatorMs: number
  readonly totalDroppedDeltaMs: number
  readonly lastAdvance: FixedTimestepAdvanceResult | null
}

export interface PhysicsRuntime {
  addStone(id: StoneId, position: Vector2): void
  launchStone(id: StoneId, power: number): Vector2
  advanceFrame(frameDeltaMs: number): FixedTimestepAdvanceResult
  resetAccumulator(): void
  getSnapshot(): PhysicsSnapshot
  getDiagnostics(): PhysicsRuntimeDiagnostics
  dispose(): void
  readonly isDisposed: boolean
}

function findStonePosition(adapter: MatterAdapter, id: StoneId): Vector2 {
  const stone = adapter
    .getStoneSnapshots()
    .find((candidate) => candidate.id === id)

  if (!stone) {
    throw new Error(`Unknown stone: ${id}`)
  }

  if (stone.motionState === 'outOfBounds') {
    throw new Error(`Cannot launch an out-of-bounds stone: ${id}`)
  }

  if (stone.motionState === 'moving') {
    throw new Error(`Cannot launch a moving stone: ${id}`)
  }

  return stone.position
}

export function createPhysicsRuntime({
  surface,
  tuning,
  onComplete,
}: PhysicsRuntimeOptions): PhysicsRuntime {
  const adapter = createMatterAdapter({ surface, tuning })
  const fixedTimestep = createFixedTimestep({
    stepMs: PHYSICS_STEP_MS,
    maxFrameDeltaMs: MAX_FRAME_DELTA_MS,
    maxStepsPerFrame: MAX_PHYSICS_STEPS_PER_FRAME,
  })
  let elapsedMs = 0
  let stepCount = 0
  let completionPending = false
  let disposed = false
  let totalDroppedDeltaMs = 0
  let lastAdvance: FixedTimestepAdvanceResult | null = null

  const assertActive = () => {
    if (disposed) {
      throw new Error('PhysicsRuntime has been disposed')
    }
  }

  const getSnapshot = (): PhysicsSnapshot => {
    assertActive()

    return {
      stones: adapter.getStoneSnapshots(),
      elapsedMs,
      stepCount,
      isComplete: adapter.areAllStonesComplete(),
    }
  }

  return {
    addStone(id, position) {
      assertActive()
      adapter.addStone(id, position)
    },

    launchStone(id, power) {
      assertActive()

      if (completionPending || !adapter.areAllStonesComplete()) {
        throw new Error('Cannot launch while stones are moving')
      }

      const velocity = getLaunchVelocity(
        findStonePosition(adapter, id),
        power,
        tuning.minSpeed,
        tuning.maxSpeed,
      )
      adapter.setStoneVelocity(id, velocity)
      completionPending = true
      return velocity
    },

    advanceFrame(frameDeltaMs) {
      assertActive()
      let completedSnapshot: PhysicsSnapshot | null = null

      const result = fixedTimestep.advance(frameDeltaMs, (stepMs) => {
        adapter.update(stepMs)
        elapsedMs += stepMs
        stepCount += 1

        if (completionPending && adapter.areAllStonesComplete()) {
          completionPending = false
          completedSnapshot = getSnapshot()
          return false
        }
      })

      if (result.interrupted) {
        fixedTimestep.reset()
      }

      lastAdvance = {
        ...result,
        accumulatorMs: fixedTimestep.accumulatorMs,
      }
      totalDroppedDeltaMs += result.droppedDeltaMs

      if (completedSnapshot) {
        onComplete?.(completedSnapshot)
      }

      return lastAdvance
    },

    resetAccumulator() {
      assertActive()
      fixedTimestep.reset()
    },

    getSnapshot,

    getDiagnostics() {
      assertActive()
      return {
        accumulatorMs: fixedTimestep.accumulatorMs,
        totalDroppedDeltaMs,
        lastAdvance,
      }
    },

    dispose() {
      if (disposed) {
        return
      }

      fixedTimestep.reset()
      adapter.dispose()
      disposed = true
    },

    get isDisposed() {
      return disposed
    },
  }
}
