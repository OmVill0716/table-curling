export const SOUND_EFFECTS = [
  'shot',
  'stoneCollision',
  'allStonesStopped',
  'outOfBounds',
] as const

export type SoundEffect = (typeof SOUND_EFFECTS)[number]

export const AUDIO_SOURCES: Readonly<Record<SoundEffect, string>> = {
  shot: '/audio/shot.ogg',
  stoneCollision: '/audio/stone-collision.ogg',
  allStonesStopped: '/audio/all-stones-stopped.ogg',
  outOfBounds: '/audio/out-of-bounds.ogg',
}

export const AUDIO_VOLUMES: Readonly<Record<SoundEffect, number>> = {
  shot: 1,
  stoneCollision: 0.35,
  allStonesStopped: 1,
  outOfBounds: 1,
}

export interface CollisionAudioTuning {
  readonly minRelativeSpeed: number
  readonly cooldownMs: number
}

export const COLLISION_AUDIO_TUNING: CollisionAudioTuning = {
  // Provisional until the Collision Audio Calibration Story is approved.
  minRelativeSpeed: 1,
  cooldownMs: 250,
}
