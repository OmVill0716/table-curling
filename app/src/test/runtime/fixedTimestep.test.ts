import { describe, expect, it, vi } from 'vitest'
import { createFixedTimestep } from '../../game/runtime/fixedTimestep'

describe('fixed timestep', () => {
  it('固定幅を満たす回数だけstepを実行し、端数を次回へ保持する', () => {
    const timestep = createFixedTimestep({
      stepMs: 10,
      maxFrameDeltaMs: 100,
      maxStepsPerFrame: 10,
    })
    const onStep = vi.fn()

    expect(timestep.advance(16, onStep)).toMatchObject({
      steps: 1,
      accumulatorMs: 6,
      droppedDeltaMs: 0,
    })
    expect(timestep.advance(4, onStep)).toMatchObject({
      steps: 1,
      accumulatorMs: 0,
      droppedDeltaMs: 0,
    })
    expect(onStep).toHaveBeenCalledTimes(2)
    expect(onStep).toHaveBeenNthCalledWith(1, 10)
  })

  it('frame deltaを上限へ制限する', () => {
    const timestep = createFixedTimestep({
      stepMs: 10,
      maxFrameDeltaMs: 100,
      maxStepsPerFrame: 12,
    })

    expect(timestep.advance(250, () => undefined)).toEqual({
      inputDeltaMs: 250,
      appliedFrameDeltaMs: 100,
      steps: 10,
      droppedDeltaMs: 150,
      accumulatorMs: 0,
      interrupted: false,
    })
  })

  it('最大step数を超える時間を次frameへ持ち越さない', () => {
    const timestep = createFixedTimestep({
      stepMs: 10,
      maxFrameDeltaMs: 100,
      maxStepsPerFrame: 2,
    })

    expect(timestep.advance(55, () => undefined)).toEqual({
      inputDeltaMs: 55,
      appliedFrameDeltaMs: 55,
      steps: 2,
      droppedDeltaMs: 30,
      accumulatorMs: 5,
      interrupted: false,
    })
    expect(timestep.advance(5, () => undefined).steps).toBe(1)
  })

  it('callbackがfalseを返した時点でstepを中断できる', () => {
    const timestep = createFixedTimestep({
      stepMs: 10,
      maxFrameDeltaMs: 100,
      maxStepsPerFrame: 10,
    })

    expect(timestep.advance(50, () => false)).toMatchObject({
      steps: 1,
      accumulatorMs: 40,
      interrupted: true,
    })
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    '不正なframe delta %sを拒否する',
    (frameDeltaMs) => {
      const timestep = createFixedTimestep({
        stepMs: 10,
        maxFrameDeltaMs: 100,
        maxStepsPerFrame: 10,
      })

      expect(() => timestep.advance(frameDeltaMs, () => undefined)).toThrow(
        RangeError,
      )
    },
  )
})
