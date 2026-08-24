import type { Surface } from '../game/types'

export const SURFACE_FRICTION_AIR: Readonly<Record<Surface, number>> =
  Object.freeze({
    ICE: 0.004,
    WOOD: 0.008,
    FELT: 0.015,
  })
