export interface FixedTimestepOptions {
  readonly stepMs: number
  readonly maxFrameDeltaMs: number
  readonly maxStepsPerFrame: number
}

export interface FixedTimestepAdvanceResult {
  readonly inputDeltaMs: number
  readonly appliedFrameDeltaMs: number
  readonly steps: number
  readonly droppedDeltaMs: number
  readonly accumulatorMs: number
  readonly interrupted: boolean
}

export interface FixedTimestep {
  advance(
    frameDeltaMs: number,
    onStep: (stepMs: number) => void | boolean,
  ): FixedTimestepAdvanceResult
  reset(): void
  readonly accumulatorMs: number
}

function assertOptions({
  stepMs,
  maxFrameDeltaMs,
  maxStepsPerFrame,
}: FixedTimestepOptions) {
  if (!Number.isFinite(stepMs) || stepMs <= 0) {
    throw new RangeError('stepMs must be a finite number greater than 0')
  }

  if (!Number.isFinite(maxFrameDeltaMs) || maxFrameDeltaMs <= 0) {
    throw new RangeError(
      'maxFrameDeltaMs must be a finite number greater than 0',
    )
  }

  if (!Number.isInteger(maxStepsPerFrame) || maxStepsPerFrame <= 0) {
    throw new RangeError('maxStepsPerFrame must be a positive integer')
  }
}

export function createFixedTimestep(
  options: FixedTimestepOptions,
): FixedTimestep {
  assertOptions(options)
  const { stepMs, maxFrameDeltaMs, maxStepsPerFrame } = options
  const comparisonEpsilon = stepMs * 1e-9
  let accumulatorMs = 0

  return {
    advance(frameDeltaMs, onStep) {
      if (!Number.isFinite(frameDeltaMs) || frameDeltaMs < 0) {
        throw new RangeError(
          'frameDeltaMs must be a finite number greater than or equal to 0',
        )
      }

      const appliedFrameDeltaMs = Math.min(frameDeltaMs, maxFrameDeltaMs)
      let droppedDeltaMs = frameDeltaMs - appliedFrameDeltaMs
      accumulatorMs += appliedFrameDeltaMs
      let steps = 0
      let interrupted = false

      while (
        accumulatorMs + comparisonEpsilon >= stepMs &&
        steps < maxStepsPerFrame
      ) {
        accumulatorMs -= stepMs
        if (Math.abs(accumulatorMs) <= comparisonEpsilon) {
          accumulatorMs = 0
        }
        steps += 1

        if (onStep(stepMs) === false) {
          interrupted = true
          break
        }
      }

      if (
        !interrupted &&
        steps === maxStepsPerFrame &&
        accumulatorMs + comparisonEpsilon >= stepMs
      ) {
        const retainedRemainder = accumulatorMs % stepMs
        droppedDeltaMs += accumulatorMs - retainedRemainder
        accumulatorMs = retainedRemainder
      }

      return {
        inputDeltaMs: frameDeltaMs,
        appliedFrameDeltaMs,
        steps,
        droppedDeltaMs,
        accumulatorMs,
        interrupted,
      }
    },

    reset() {
      accumulatorMs = 0
    },

    get accumulatorMs() {
      return accumulatorMs
    },
  }
}
