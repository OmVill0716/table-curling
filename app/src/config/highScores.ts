import { SURFACES, THROW_DISTANCES } from '../game/types'
import type { HighScores, Surface, ThrowDistance } from '../game/types'

export function createEmptyHighScores(): HighScores {
  return Object.fromEntries(
    SURFACES.map((surface) => [
      surface,
      Object.fromEntries(
        THROW_DISTANCES.map((distance) => [distance, []]),
      ) as Record<ThrowDistance, []>,
    ]),
  ) as Record<Surface, Record<ThrowDistance, []>>
}
