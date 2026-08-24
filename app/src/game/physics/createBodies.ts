import { Bodies, Engine, type Body } from 'matter-js'
import { STONE_RADIUS } from '../../config/physics'
import type { PhysicsTuning } from '../../config/physics'
import type { StoneId, Surface, Vector2 } from '../types'

export function createMatterEngine() {
  return Engine.create({
    enableSleeping: false,
    gravity: { x: 0, y: 0, scale: 0 },
  })
}

export interface CreateStoneBodyOptions {
  readonly id: StoneId
  readonly position: Vector2
  readonly surface: Surface
  readonly tuning: PhysicsTuning
}

export function createStoneBody({
  id,
  position,
  surface,
  tuning,
}: CreateStoneBodyOptions): Body {
  return Bodies.circle(position.x, position.y, STONE_RADIUS, {
    label: `Stone:${id}`,
    frictionAir: tuning.frictionAir[surface],
    restitution: tuning.restitution,
  })
}
