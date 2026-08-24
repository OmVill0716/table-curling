import { describe, expect, it } from 'vitest'
import type { StoneCollisionEvent } from '../../game/types'
import { selectCollisionForPlayback } from '../../game/audio/collisionAudioPolicy'

const tuning = { minRelativeSpeed: 1, cooldownMs: 250 }

function collision(
  relativeSpeed: number,
  stepCount = 1,
): StoneCollisionEvent {
  return {
    type: 'stoneCollision',
    stepCount,
    stoneIds: ['stone-1', 'stone-2'],
    relativeSpeed,
  }
}

describe('collisionAudioPolicy', () => {
  it('同一stepでは最大相対速度の候補だけを選ぶ', () => {
    expect(
      selectCollisionForPlayback(
        [collision(2), collision(5), collision(3)],
        1000,
        null,
        tuning,
      )?.relativeSpeed,
    ).toBe(5)
  })

  it('弱い接触を除外して閾値境界を含める', () => {
    expect(
      selectCollisionForPlayback([collision(0.99)], 1000, null, tuning),
    ).toBeNull()
    expect(
      selectCollisionForPlayback([collision(1)], 1000, null, tuning),
    ).not.toBeNull()
  })

  it('再生後250ms未満を除外して境界を許可する', () => {
    expect(
      selectCollisionForPlayback([collision(5)], 1249, 1000, tuning),
    ).toBeNull()
    expect(
      selectCollisionForPlayback([collision(5)], 1250, 1000, tuning),
    ).not.toBeNull()
  })

  it('候補なしと不正設定を安全に扱う', () => {
    expect(selectCollisionForPlayback([], 1000, null, tuning)).toBeNull()
    expect(() =>
      selectCollisionForPlayback([collision(5)], -1, null, tuning),
    ).toThrow(RangeError)
    expect(() =>
      selectCollisionForPlayback([collision(5)], 1, null, {
        ...tuning,
        cooldownMs: -1,
      }),
    ).toThrow(RangeError)
  })
})
