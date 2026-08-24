import { describe, expect, it, vi } from 'vitest'
import {
  createAnimationFrameScheduler,
  type AnimationFrameApi,
  type AnimationFrameClock,
} from '../../game/runtime/animationFrameScheduler'

function createFakeAnimationFrame() {
  let currentTimeMs = 0
  let nextRequestId = 1
  const callbacks = new Map<number, (timestampMs: number) => void>()
  const cancelled: number[] = []

  const clock: AnimationFrameClock = {
    now: () => currentTimeMs,
  }
  const animationFrame: AnimationFrameApi = {
    request(callback) {
      const requestId = nextRequestId
      nextRequestId += 1
      callbacks.set(requestId, callback)
      return requestId
    },
    cancel(requestId) {
      cancelled.push(requestId)
      callbacks.delete(requestId)
    },
  }

  return {
    clock,
    animationFrame,
    cancelled,
    get pendingCount() {
      return callbacks.size
    },
    setTime(timestampMs: number) {
      currentTimeMs = timestampMs
    },
    runNext(timestampMs: number) {
      currentTimeMs = timestampMs
      const next = callbacks.entries().next().value
      if (!next) {
        throw new Error('No pending Animation Frame')
      }
      const [requestId, callback] = next
      callbacks.delete(requestId)
      callback(timestampMs)
    },
  }
}

describe('Animation Frame Scheduler', () => {
  it.each(['charging', 'moving'] as const)(
    '%sではAnimation Frameを1件だけ継続予約する',
    (mode) => {
      const fake = createFakeAnimationFrame()
      const onFrame = vi.fn()
      const scheduler = createAnimationFrameScheduler({
        clock: fake.clock,
        animationFrame: fake.animationFrame,
        onFrame,
      })

      scheduler.setMode(mode)
      scheduler.setMode(mode)
      expect(fake.pendingCount).toBe(1)

      fake.runNext(16)
      expect(onFrame).toHaveBeenCalledWith({
        timestampMs: 16,
        deltaMs: 16,
        mode,
      })
      expect(fake.pendingCount).toBe(1)
    },
  )

  it('staticでは単発描画後に継続予約しない', () => {
    const fake = createFakeAnimationFrame()
    const onFrame = vi.fn()
    const scheduler = createAnimationFrameScheduler({
      clock: fake.clock,
      animationFrame: fake.animationFrame,
      onFrame,
    })

    scheduler.setMode('static')
    expect(fake.pendingCount).toBe(1)
    fake.runNext(10)

    expect(onFrame).toHaveBeenCalledTimes(1)
    expect(onFrame).toHaveBeenCalledWith({
      timestampMs: 10,
      deltaMs: 0,
      mode: 'static',
    })
    expect(fake.pendingCount).toBe(0)
  })

  it('同一frameの単発描画要求を重複予約しない', () => {
    const fake = createFakeAnimationFrame()
    const scheduler = createAnimationFrameScheduler({
      clock: fake.clock,
      animationFrame: fake.animationFrame,
      onFrame: vi.fn(),
    })
    scheduler.setMode('static')
    fake.runNext(10)

    scheduler.requestRender()
    scheduler.requestRender()
    expect(fake.pendingCount).toBe(1)
  })

  it('pauseとresumeの間の実時間をdeltaへ加えない', () => {
    const fake = createFakeAnimationFrame()
    const onFrame = vi.fn()
    const scheduler = createAnimationFrameScheduler({
      clock: fake.clock,
      animationFrame: fake.animationFrame,
      onFrame,
    })
    scheduler.setMode('moving')
    fake.runNext(10)
    fake.setTime(1000)

    scheduler.pause()
    expect(fake.pendingCount).toBe(0)
    scheduler.resume()
    expect(fake.pendingCount).toBe(1)
    fake.runNext(1016)

    expect(onFrame.mock.calls[1][0].deltaMs).toBe(16)
  })

  it('disposeで予約をcancelし、以後描画しない', () => {
    const fake = createFakeAnimationFrame()
    const onFrame = vi.fn()
    const scheduler = createAnimationFrameScheduler({
      clock: fake.clock,
      animationFrame: fake.animationFrame,
      onFrame,
    })
    scheduler.setMode('moving')

    scheduler.dispose()
    scheduler.dispose()
    scheduler.resume()
    scheduler.requestRender()

    expect(scheduler.isDisposed).toBe(true)
    expect(fake.cancelled).toEqual([1])
    expect(fake.pendingCount).toBe(0)
    expect(onFrame).not.toHaveBeenCalled()
  })

  it('Strict Mode相当の破棄と再生成でloopを二重化しない', () => {
    const fake = createFakeAnimationFrame()
    const firstFrame = vi.fn()
    const first = createAnimationFrameScheduler({
      clock: fake.clock,
      animationFrame: fake.animationFrame,
      onFrame: firstFrame,
    })
    first.setMode('moving')
    first.dispose()

    const secondFrame = vi.fn()
    const second = createAnimationFrameScheduler({
      clock: fake.clock,
      animationFrame: fake.animationFrame,
      onFrame: secondFrame,
    })
    second.setMode('moving')
    expect(fake.pendingCount).toBe(1)

    fake.runNext(16)
    expect(firstFrame).not.toHaveBeenCalled()
    expect(secondFrame).toHaveBeenCalledTimes(1)
    expect(fake.pendingCount).toBe(1)
  })
})
