export type AnimationFrameMode = 'static' | 'charging' | 'moving'

export interface AnimationFrameClock {
  now(): number
}

export interface AnimationFrameApi {
  request(callback: (timestampMs: number) => void): number
  cancel(requestId: number): void
}

export interface AnimationFrameInfo {
  readonly timestampMs: number
  readonly deltaMs: number
  readonly mode: AnimationFrameMode
}

export interface AnimationFrameSchedulerOptions {
  readonly clock: AnimationFrameClock
  readonly animationFrame: AnimationFrameApi
  readonly onFrame: (frame: AnimationFrameInfo) => void
}

export interface AnimationFrameScheduler {
  setMode(mode: AnimationFrameMode): void
  requestRender(): void
  pause(): void
  resume(): void
  dispose(): void
  readonly mode: AnimationFrameMode | null
  readonly isPaused: boolean
  readonly isDisposed: boolean
  readonly hasPendingFrame: boolean
}

function isDynamicMode(mode: AnimationFrameMode | null) {
  return mode === 'charging' || mode === 'moving'
}

export function createAnimationFrameScheduler({
  clock,
  animationFrame,
  onFrame,
}: AnimationFrameSchedulerOptions): AnimationFrameScheduler {
  let mode: AnimationFrameMode | null = null
  let frameRequestId: number | null = null
  let lastTimestampMs: number | null = null
  let paused = false
  let disposed = false

  const cancelPendingFrame = () => {
    if (frameRequestId !== null) {
      animationFrame.cancel(frameRequestId)
      frameRequestId = null
    }
  }

  const scheduleFrame = () => {
    if (disposed || paused || mode === null || frameRequestId !== null) {
      return
    }

    frameRequestId = animationFrame.request((timestampMs) => {
      frameRequestId = null

      if (disposed || paused || mode === null) {
        return
      }

      const currentMode = mode
      const validTimestamp = Number.isFinite(timestampMs)
        ? timestampMs
        : clock.now()
      const deltaMs =
        lastTimestampMs === null
          ? 0
          : Math.max(0, validTimestamp - lastTimestampMs)
      lastTimestampMs = validTimestamp
      onFrame({ timestampMs: validTimestamp, deltaMs, mode: currentMode })

      if (isDynamicMode(mode)) {
        scheduleFrame()
      }
    })
  }

  return {
    setMode(nextMode) {
      if (disposed) {
        return
      }

      if (mode === nextMode) {
        if (isDynamicMode(mode)) {
          scheduleFrame()
        }
        return
      }

      cancelPendingFrame()
      mode = nextMode
      lastTimestampMs = isDynamicMode(mode) ? clock.now() : null
      scheduleFrame()
    },

    requestRender() {
      scheduleFrame()
    },

    pause() {
      if (disposed || paused) {
        return
      }

      paused = true
      lastTimestampMs = null
      cancelPendingFrame()
    },

    resume() {
      if (disposed || !paused) {
        return
      }

      paused = false
      lastTimestampMs = isDynamicMode(mode) ? clock.now() : null
      scheduleFrame()
    },

    dispose() {
      if (disposed) {
        return
      }

      cancelPendingFrame()
      lastTimestampMs = null
      disposed = true
    },

    get mode() {
      return mode
    },

    get isPaused() {
      return paused
    },

    get isDisposed() {
      return disposed
    },

    get hasPendingFrame() {
      return frameRequestId !== null
    },
  }
}
