import { describe, expect, it } from 'vitest'
import {
  getStoneFillColor,
  TARGET_SCORE_LABELS,
} from '../../game/renderer/canvasRenderer'
import { SCORE_COLORS } from '../../game/scoring/scoreRules'
import type { StoneSnapshot } from '../../game/types'

function stoneAt(x: number, motionState: StoneSnapshot['motionState'] = 'stopped') {
  return {
    id: 'stone-1',
    position: { x, y: 220 },
    velocity: { x: 0, y: 0 },
    speed: 0,
    angularVelocity: 0,
    motionState,
  } satisfies StoneSnapshot
}

describe('Canvas Renderer rules', () => {
  it.each([
    [300, 100],
    [345, 50],
    [375, 30],
    [405, 10],
    [421, 0],
  ] as const)('Stone位置から%s点色を導出する', (x, score) => {
    expect(getStoneFillColor(stoneAt(x))).toBe(SCORE_COLORS[score])
  })

  it('盤外Stoneは0点色として扱う', () => {
    expect(getStoneFillColor(stoneAt(300, 'outOfBounds'))).toBe(
      SCORE_COLORS[0],
    )
  })

  it('ターゲットへ100・50・30・10の固定配点を置く', () => {
    expect(TARGET_SCORE_LABELS.map(({ score }) => score)).toEqual([
      100, 50, 30, 10,
    ])
    expect(TARGET_SCORE_LABELS[0].position).toEqual({ x: 300, y: 220 })
    expect(TARGET_SCORE_LABELS.every(({ position }) => position.x === 300)).toBe(
      true,
    )
  })
})
