export const SURFACES = ['ICE', 'WOOD', 'FELT'] as const

export type Surface = (typeof SURFACES)[number]

export const THROW_DISTANCES = ['SHORT', 'MEDIUM', 'LONG'] as const

export type ThrowDistance = (typeof THROW_DISTANCES)[number]

export interface Vector2 {
  readonly x: number
  readonly y: number
}

export type StoneId = string

export type StoneMotionState = 'moving' | 'stopped' | 'outOfBounds'

export interface StoneSnapshot {
  readonly id: StoneId
  readonly position: Vector2
  readonly velocity: Vector2
  readonly speed: number
  readonly angularVelocity: number
  readonly motionState: StoneMotionState
}

export interface PhysicsSnapshot {
  readonly stones: readonly StoneSnapshot[]
  readonly elapsedMs: number
  readonly stepCount: number
  readonly isComplete: boolean
}

export type StoneScore = 0 | 10 | 30 | 50 | 100

export interface StoneResult {
  readonly id: StoneId
  readonly position: Vector2
  readonly inPlay: boolean
  readonly score: StoneScore
}

export type HighScoreRank = 1 | 2 | 3

export interface GameResult {
  readonly stones: readonly StoneResult[]
  readonly totalScore: number
  readonly highScoreRank: HighScoreRank | null
}
