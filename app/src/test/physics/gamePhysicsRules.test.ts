import { describe, expect, it } from 'vitest'
import {
  PHYSICS_TUNING,
  TARGET_CENTER,
  getPhysicsTuningErrors,
} from '../../config/physics'
import {
  directionBetween,
  distanceFromPointToSegment,
  findLaunchPosition,
  getBaseLaunchPosition,
  getLaunchVelocity,
  getThrowDirection,
  isLaunchPathClear,
  isStoneOutOfBounds,
  powerToSpeed,
} from '../../game/physics/gamePhysicsRules'

describe('Powerから初速度への変換', () => {
  it('Power 1をminSpeedへ、Power 100をmaxSpeedへ対応させる', () => {
    expect(powerToSpeed(1, 2, 12)).toBe(2)
    expect(powerToSpeed(100, 2, 12)).toBe(12)
  })

  it('中間Powerを線形補間する', () => {
    expect(powerToSpeed(50.5, 2, 12)).toBe(7)
  })

  it.each([0, 101, Number.NaN, Number.POSITIVE_INFINITY])(
    '不正なPower %sを拒否する',
    (power) => {
      expect(() => powerToSpeed(power, 2, 12)).toThrow(RangeError)
    },
  )
})

describe('固定投射方向', () => {
  it('投射位置からターゲット中心へ向かう単位Vectorを返す', () => {
    const direction = getThrowDirection({ x: 300, y: 740 })

    expect(direction.x).toBeCloseTo(0)
    expect(direction.y).toBeCloseTo(-1)
    expect(Math.hypot(direction.x, direction.y)).toBeCloseTo(1)
  })

  it('方向へ初速度を掛けたVelocityを返す', () => {
    expect(getLaunchVelocity({ x: 300, y: 740 }, 100, 2, 12)).toEqual({
      x: 0,
      y: -12,
    })
  })

  it('同じ位置から方向を作らない', () => {
    expect(() => directionBetween(TARGET_CENTER, TARGET_CENTER)).toThrow(
      RangeError,
    )
  })
})

describe('基本投射位置', () => {
  it('SHORT、MEDIUM、LONGの仕様値を返す', () => {
    expect(getBaseLaunchPosition('SHORT')).toEqual({ x: 300, y: 740 })
    expect(getBaseLaunchPosition('MEDIUM')).toEqual({ x: 300, y: 840 })
    expect(getBaseLaunchPosition('LONG')).toEqual({ x: 300, y: 940 })
  })

  it('呼び出し元による固定設定の変更を防ぐ', () => {
    const position = getBaseLaunchPosition('SHORT') as { x: number; y: number }
    position.y = 0

    expect(getBaseLaunchPosition('SHORT')).toEqual({ x: 300, y: 740 })
  })
})

describe('投射位置探索', () => {
  it('点と線分の最短距離を端点の外側も含めて求める', () => {
    expect(
      distanceFromPointToSegment(
        { x: 3, y: 4 },
        { x: 0, y: 0 },
        { x: 0, y: 10 },
      ),
    ).toBe(3)
    expect(
      distanceFromPointToSegment(
        { x: 3, y: -4 },
        { x: 0, y: 0 },
        { x: 0, y: 10 },
      ),
    ).toBe(5)
  })

  it('進路との距離36ちょうどを接触として許可する', () => {
    expect(
      isLaunchPathClear({ x: 300, y: 940 }, [{ x: 336, y: 920 }]),
    ).toBe(true)
    expect(
      isLaunchPathClear({ x: 300, y: 940 }, [{ x: 335.99, y: 920 }]),
    ).toBe(false)
  })

  it('最も近い空き候補まで36ずつ後退する', () => {
    const blockers = [0, 1, 2, 3].map((step) => ({
      x: 335,
      y: 940 + 36 * step - 40,
    }))

    expect(findLaunchPosition('LONG', blockers)).toEqual({
      available: true,
      position: { x: 300, y: 1084 },
      backtrackSteps: 4,
    })
  })

  it('5候補すべてが塞がれている場合は配置不能を返す', () => {
    const blockers = [0, 1, 2, 3, 4].map((step) => ({
      x: 335,
      y: 940 + 36 * step - 40,
    }))

    expect(findLaunchPosition('LONG', blockers)).toEqual({
      available: false,
      reason: 'blocked',
    })
  })
})

describe('盤外判定', () => {
  it.each([
    { position: { x: -18, y: 200 }, expected: false },
    { position: { x: -18.001, y: 200 }, expected: true },
    { position: { x: 618, y: 200 }, expected: false },
    { position: { x: 618.001, y: 200 }, expected: true },
    { position: { x: 300, y: -18 }, expected: false },
    { position: { x: 300, y: -18.001 }, expected: true },
    { position: { x: 300, y: 1518 }, expected: false },
    { position: { x: 300, y: 1518.001 }, expected: true },
  ])('中心$positionの境界を判定する', ({ position, expected }) => {
    expect(isStoneOutOfBounds(position)).toBe(expected)
  })
})

describe('Physics調整値の検証', () => {
  it('承認済み設定を有効な値として受け付ける', () => {
    expect(getPhysicsTuningErrors(PHYSICS_TUNING)).toEqual([])
  })

  it('不正な範囲を暗黙補正せず列挙する', () => {
    const errors = getPhysicsTuningErrors({
      minSpeed: 3,
      maxSpeed: 2,
      frictionAir: { ICE: -0.1, WOOD: 1, FELT: Number.NaN },
      restitution: 1.1,
      stopSpeed: -1,
      stopDurationMs: -1,
    })

    expect(errors).toHaveLength(7)
  })
})
