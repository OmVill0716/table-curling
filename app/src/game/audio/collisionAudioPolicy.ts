import type { CollisionAudioTuning } from '../../config/audio'
import type { StoneCollisionEvent } from '../types'

export function selectCollisionForPlayback(
  candidates: readonly StoneCollisionEvent[],
  physicsElapsedMs: number,
  lastPlayedAtMs: number | null,
  tuning: CollisionAudioTuning,
): StoneCollisionEvent | null {
  if (!Number.isFinite(physicsElapsedMs) || physicsElapsedMs < 0) {
    throw new RangeError('physicsElapsedMs must be a finite non-negative number')
  }
  if (
    !Number.isFinite(tuning.minRelativeSpeed) ||
    tuning.minRelativeSpeed < 0 ||
    !Number.isFinite(tuning.cooldownMs) ||
    tuning.cooldownMs < 0
  ) {
    throw new RangeError('collision audio tuning must be finite and non-negative')
  }

  const strongest = candidates.reduce<StoneCollisionEvent | null>(
    (selected, candidate) =>
      selected === null || candidate.relativeSpeed > selected.relativeSpeed
        ? candidate
        : selected,
    null,
  )

  if (strongest === null || strongest.relativeSpeed < tuning.minRelativeSpeed) {
    return null
  }

  if (
    lastPlayedAtMs !== null &&
    physicsElapsedMs - lastPlayedAtMs < tuning.cooldownMs
  ) {
    return null
  }

  return strongest
}
