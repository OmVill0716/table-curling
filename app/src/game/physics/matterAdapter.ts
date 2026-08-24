import { Body, Composite, Engine } from 'matter-js'
import type { PhysicsTuning } from '../../config/physics'
import { STONE_RADIUS, getPhysicsTuningErrors } from '../../config/physics'
import type {
  StoneId,
  StoneMotionState,
  StoneSnapshot,
  Surface,
  Vector2,
} from '../types'
import { createMatterEngine, createStoneBody } from './createBodies'
import { isStoneOutOfBounds } from './gamePhysicsRules'

interface StoneRecord {
  readonly body: Body
  motionState: StoneMotionState
  belowStopSpeedMs: number
}

export interface MatterAdapterOptions {
  readonly surface: Surface
  readonly tuning: PhysicsTuning
}

export interface StoneDiagnostics {
  readonly density: number
  readonly friction: number
  readonly frictionStatic: number
  readonly frictionAir: number
  readonly restitution: number
  readonly radius: number
  readonly isInWorld: boolean
}

export interface MatterAdapter {
  addStone(id: StoneId, position: Vector2): void
  setStoneVelocity(id: StoneId, velocity: Vector2): void
  update(deltaMs: number): void
  getStoneSnapshots(): readonly StoneSnapshot[]
  getStoneDiagnostics(id: StoneId): StoneDiagnostics
  areAllStonesComplete(): boolean
  dispose(): void
  readonly isDisposed: boolean
}

function copyVector(vector: Vector2): Vector2 {
  return { x: vector.x, y: vector.y }
}

function assertFiniteVector(vector: Vector2, name: string) {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new RangeError(`${name} must contain finite coordinates`)
  }
}

export function createMatterAdapter({
  surface,
  tuning,
}: MatterAdapterOptions): MatterAdapter {
  const tuningErrors = getPhysicsTuningErrors(tuning)

  if (tuningErrors.length > 0) {
    throw new RangeError(tuningErrors.join('; '))
  }

  const engine = createMatterEngine()
  const stones = new Map<StoneId, StoneRecord>()
  let disposed = false

  const assertActive = () => {
    if (disposed) {
      throw new Error('MatterAdapter has been disposed')
    }
  }

  const getStone = (id: StoneId) => {
    const stone = stones.get(id)

    if (!stone) {
      throw new Error(`Unknown stone: ${id}`)
    }

    return stone
  }

  const updateMotionState = (stone: StoneRecord, deltaMs: number) => {
    const { body } = stone

    if (isStoneOutOfBounds(body.position)) {
      stone.motionState = 'outOfBounds'
      stone.belowStopSpeedMs = 0
      Composite.remove(engine.world, body)
      return
    }

    if (body.speed >= tuning.stopSpeed) {
      stone.motionState = 'moving'
      stone.belowStopSpeedMs = 0
      return
    }

    if (body.speed === 0 && stone.motionState === 'stopped') {
      return
    }

    stone.motionState = 'moving'
    stone.belowStopSpeedMs += deltaMs

    if (stone.belowStopSpeedMs >= tuning.stopDurationMs) {
      Body.setVelocity(body, { x: 0, y: 0 })
      Body.setAngularVelocity(body, 0)
      stone.motionState = 'stopped'
      stone.belowStopSpeedMs = 0
    }
  }

  return {
    addStone(id, position) {
      assertActive()
      assertFiniteVector(position, 'position')

      if (stones.has(id)) {
        throw new Error(`Duplicate stone: ${id}`)
      }

      const body = createStoneBody({ id, position, surface, tuning })
      stones.set(id, {
        body,
        motionState: 'stopped',
        belowStopSpeedMs: 0,
      })
      Composite.add(engine.world, body)
    },

    setStoneVelocity(id, velocity) {
      assertActive()
      assertFiniteVector(velocity, 'velocity')
      const stone = getStone(id)

      if (stone.motionState === 'outOfBounds') {
        throw new Error(`Cannot move an out-of-bounds stone: ${id}`)
      }

      Body.setVelocity(stone.body, velocity)
      stone.motionState = Math.hypot(velocity.x, velocity.y) > 0 ? 'moving' : 'stopped'
      stone.belowStopSpeedMs = 0
    },

    update(deltaMs) {
      assertActive()

      if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
        throw new RangeError('deltaMs must be a finite number greater than 0')
      }

      Engine.update(engine, deltaMs)

      for (const stone of stones.values()) {
        if (stone.motionState !== 'outOfBounds') {
          updateMotionState(stone, deltaMs)
        }
      }
    },

    getStoneSnapshots() {
      assertActive()

      return [...stones.entries()].map(([id, stone]) => ({
        id,
        position: copyVector(stone.body.position),
        velocity: copyVector(stone.body.velocity),
        speed: stone.body.speed,
        angularVelocity: stone.body.angularVelocity,
        motionState: stone.motionState,
      }))
    },

    getStoneDiagnostics(id) {
      assertActive()
      const stone = getStone(id)

      return {
        density: stone.body.density,
        friction: stone.body.friction,
        frictionStatic: stone.body.frictionStatic,
        frictionAir: stone.body.frictionAir,
        restitution: stone.body.restitution,
        radius: STONE_RADIUS,
        isInWorld: Composite.allBodies(engine.world).includes(stone.body),
      }
    },

    areAllStonesComplete() {
      assertActive()

      return (
        stones.size > 0 &&
        [...stones.values()].every(
          ({ motionState }) =>
            motionState === 'stopped' || motionState === 'outOfBounds',
        )
      )
    },

    dispose() {
      if (disposed) {
        return
      }

      Composite.clear(engine.world, false, true)
      Engine.clear(engine)
      stones.clear()
      disposed = true
    },

    get isDisposed() {
      return disposed
    },
  }
}
