import { describe, expect, it } from 'vitest'
import { createEmptyHighScores } from '../../config/highScores'
import {
  MAX_GAME_SCORE,
  addHighScore,
  decodeHighScores,
  isValidAchievedAt,
  isValidScore,
} from '../../game/persistence/highScoreRanking'

describe('highScoreRanking', () => {
  it('9カテゴリーを混在させず上位3件と順位を返す', () => {
    let highScores = createEmptyHighScores()

    for (const [score, achievedAt] of [
      [100, '2026-08-20T10:00:00+09:00'],
      [300, '2026-08-21T10:00:00+09:00'],
      [200, '2026-08-22T10:00:00+09:00'],
      [250, '2026-08-23T10:00:00+09:00'],
    ] as const) {
      highScores = addHighScore(
        highScores,
        'ICE',
        'SHORT',
        score,
        achievedAt,
      ).highScores
    }

    const update = addHighScore(
      highScores,
      'WOOD',
      'LONG',
      50,
      '2026-08-24T10:00:00+09:00',
    )

    expect(highScores.ICE.SHORT.map(({ score }) => score)).toEqual([
      300, 250, 200,
    ])
    expect(update.rank).toBe(1)
    expect(update.highScores.WOOD.LONG).toEqual([
      { score: 50, achievedAt: '2026-08-24T10:00:00+09:00' },
    ])
    expect(update.highScores.ICE.SHORT).toEqual(highScores.ICE.SHORT)
  })

  it('同点では新しい日時と今回追加した記録を先にする', () => {
    let highScores = createEmptyHighScores()
    highScores = addHighScore(
      highScores,
      'FELT',
      'MEDIUM',
      300,
      '2026-08-24T09:00:00+09:00',
    ).highScores

    const newer = addHighScore(
      highScores,
      'FELT',
      'MEDIUM',
      300,
      '2026-08-24T10:00:00+09:00',
    )
    const sameInstant = addHighScore(
      newer.highScores,
      'FELT',
      'MEDIUM',
      300,
      '2026-08-24T10:00:00+09:00',
    )

    expect(newer.rank).toBe(1)
    expect(sameInstant.rank).toBe(1)
    expect(sameInstant.highScores.FELT.MEDIUM).toHaveLength(3)
  })

  it('4位以下は順位nullとして上位3件を変えない', () => {
    let highScores = createEmptyHighScores()
    for (const score of [400, 300, 200]) {
      highScores = addHighScore(
        highScores,
        'ICE',
        'LONG',
        score,
        `2026-08-${score / 100 + 10}T10:00:00+09:00`,
      ).highScores
    }

    const update = addHighScore(
      highScores,
      'ICE',
      'LONG',
      100,
      '2026-08-24T10:00:00+09:00',
    )

    expect(update.rank).toBeNull()
    expect(update.highScores).toEqual(highScores)
  })

  it('保存値を検証して並びと件数を正規化する', () => {
    const raw = createEmptyHighScores() as Record<string, Record<string, unknown>>
    raw.ICE.SHORT = [
      { score: 10, achievedAt: '2026-08-20T10:00:00+09:00', ignored: true },
      { score: 300, achievedAt: '2026-08-21T10:00:00+09:00' },
      { score: 100, achievedAt: '2026-08-22T10:00:00+09:00' },
      { score: 200, achievedAt: '2026-08-23T10:00:00+09:00' },
    ]
    raw.UNKNOWN = { SHORT: [] }

    const decoded = decodeHighScores(raw)

    expect(decoded?.ICE.SHORT.map(({ score }) => score)).toEqual([
      300, 200, 100,
    ])
    expect(decoded).not.toHaveProperty('UNKNOWN')
    expect(decoded?.ICE.SHORT[2]).not.toHaveProperty('ignored')
  })

  it.each([
    null,
    {},
    { ICE: {}, WOOD: {}, FELT: {} },
    {
      ...createEmptyHighScores(),
      ICE: {
        ...createEmptyHighScores().ICE,
        SHORT: [{ score: 501, achievedAt: '2026-08-24T10:00:00+09:00' }],
      },
    },
  ])('破損データ%jを拒否する', (value) => {
    expect(decodeHighScores(value)).toBeNull()
  })

  it('得点と日時の境界を検証する', () => {
    expect(isValidScore(0)).toBe(true)
    expect(isValidScore(MAX_GAME_SCORE)).toBe(true)
    expect(isValidScore(-1)).toBe(false)
    expect(isValidScore(MAX_GAME_SCORE + 1)).toBe(false)
    expect(isValidScore(10.5)).toBe(false)
    expect(isValidScore(Number.NaN)).toBe(false)
    expect(isValidAchievedAt('2026-08-24T10:00:00+09:00')).toBe(true)
    expect(isValidAchievedAt('2026-08-24T01:00:00.000Z')).toBe(true)
    expect(isValidAchievedAt('2026-08-24')).toBe(false)
    expect(isValidAchievedAt('not-a-date')).toBe(false)
  })

  it('不正な追加値を拒否する', () => {
    expect(() =>
      addHighScore(
        createEmptyHighScores(),
        'ICE',
        'SHORT',
        501,
        '2026-08-24T10:00:00+09:00',
      ),
    ).toThrow(RangeError)
    expect(() =>
      addHighScore(
        createEmptyHighScores(),
        'ICE',
        'SHORT',
        100,
        'invalid',
      ),
    ).toThrow(RangeError)
  })
})
