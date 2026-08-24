import { describe, expect, it } from 'vitest'
import { TARGET_CENTER } from '../../config/physics'
import { scoreGame } from '../../game/scoring/scoreGame'
import {
  getScoreForPosition,
  SCORE_COLORS,
} from '../../game/scoring/scoreRules'
import type { PhysicsSnapshot, StoneMotionState } from '../../game/types'

function positionAtDistance(distance: number) {
  return { x: TARGET_CENTER.x + distance, y: TARGET_CENTER.y }
}

function createSnapshot(
  entries: readonly { distance: number; motionState?: StoneMotionState }[],
): PhysicsSnapshot {
  return {
    elapsedMs: 0,
    stepCount: 0,
    isComplete: true,
    stones: entries.map(({ distance, motionState = 'stopped' }, index) => ({
      id: `stone-${index + 1}`,
      position: positionAtDistance(distance),
      velocity: { x: 0, y: 0 },
      speed: 0,
      angularVelocity: 0,
      motionState,
    })),
  }
}

describe('Scoring', () => {
  it.each([
    [0, 100],
    [29.999, 100],
    [30, 100],
    [30.001, 50],
    [59.999, 50],
    [60, 50],
    [60.001, 30],
    [89.999, 30],
    [90, 30],
    [90.001, 10],
    [119.999, 10],
    [120, 10],
    [120.001, 0],
  ])('中心距離%sを%s点にする', (distance, expected) => {
    expect(getScoreForPosition(positionAtDistance(distance))).toBe(expected)
  })

  it('盤外Stoneを座標にかかわらず0点にする', () => {
    const result = scoreGame(
      createSnapshot([{ distance: 0, motionState: 'outOfBounds' }]),
    )

    expect(result.stones[0]).toMatchObject({ inPlay: false, score: 0 })
  })

  it('5投を投射順で採点して合計する', () => {
    const result = scoreGame(
      createSnapshot([
        { distance: 0 },
        { distance: 45 },
        { distance: 75 },
        { distance: 105 },
        { distance: 121 },
      ]),
    )

    expect(result.stones.map(({ id, score }) => ({ id, score }))).toEqual([
      { id: 'stone-1', score: 100 },
      { id: 'stone-2', score: 50 },
      { id: 'stone-3', score: 30 },
      { id: 'stone-4', score: 10 },
      { id: 'stone-5', score: 0 },
    ])
    expect(result.totalScore).toBe(190)
    expect(result.highScoreRank).toBeNull()
  })

  it('最大500点になる', () => {
    expect(
      scoreGame(createSnapshot(Array.from({ length: 5 }, () => ({ distance: 0 })))).totalScore,
    ).toBe(500)
  })

  it('仕様の得点色を一元管理する', () => {
    expect(SCORE_COLORS).toEqual({
      0: '#757575',
      10: '#1976D2',
      30: '#FBC02D',
      50: '#F57C00',
      100: '#D32F2F',
    })
  })
})
