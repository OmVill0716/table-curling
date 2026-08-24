import type { PowerReading } from '../types'

export const MIN_POWER = 1
export const MAX_POWER = 100
export const POWER_HALF_CYCLE_MS = 1500
export const POWER_CYCLE_MS = POWER_HALF_CYCLE_MS * 2

function assertElapsedMs(elapsedMs: number) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError('elapsedMs must be a finite number greater than or equal to 0')
  }
}

export function getPowerReadingAtElapsedMs(elapsedMs: number): PowerReading {
  assertElapsedMs(elapsedMs)

  const cycleElapsedMs = elapsedMs % POWER_CYCLE_MS
  const isIncreasing = cycleElapsedMs < POWER_HALF_CYCLE_MS
  const sectionProgress = isIncreasing
    ? cycleElapsedMs / POWER_HALF_CYCLE_MS
    : (POWER_CYCLE_MS - cycleElapsedMs) / POWER_HALF_CYCLE_MS
  const value = Math.round(
    MIN_POWER + sectionProgress * (MAX_POWER - MIN_POWER),
  )

  return {
    value,
    direction: isIncreasing ? 'increasing' : 'decreasing',
  }
}
