import { describe, expect, it } from 'vitest'
import {
  getPowerReadingAtElapsedMs,
  POWER_CYCLE_MS,
} from '../../game/runtime/powerGauge'

describe('Power Gauge', () => {
  it.each([
    [0, 1, 'increasing'],
    [750, 51, 'increasing'],
    [1500, 100, 'decreasing'],
    [2250, 51, 'decreasing'],
    [3000, 1, 'increasing'],
    [3750, 51, 'increasing'],
  ] as const)('%dmsのPowerを経過時間から求める', (elapsedMs, value, direction) => {
    expect(getPowerReadingAtElapsedMs(elapsedMs)).toEqual({ value, direction })
  })

  it('複数周期後も同じPowerへ戻る', () => {
    expect(getPowerReadingAtElapsedMs(750 + POWER_CYCLE_MS * 4)).toEqual(
      getPowerReadingAtElapsedMs(750),
    )
  })

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    '不正な経過時間%sを拒否する',
    (elapsedMs) => {
      expect(() => getPowerReadingAtElapsedMs(elapsedMs)).toThrow(RangeError)
    },
  )
})
