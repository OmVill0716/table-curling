import { describe, expect, it } from 'vitest'
import {
  INITIAL_RESTITUTION,
  INITIAL_STOP_DURATION_MS,
  INITIAL_STOP_SPEED,
  TARGET_CENTER,
  getPhysicsTuningErrors,
} from '../../config/physics'
import {
  directionBetween,
  getBaseLaunchPosition,
  getLaunchVelocity,
  getThrowDirection,
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

describe('Physics調整値の検証', () => {
  it('仕様上の初期値を含む有効な設定を受け付ける', () => {
    expect(
      getPhysicsTuningErrors({
        minSpeed: 2,
        maxSpeed: 12,
        frictionAir: { ICE: 0.005, WOOD: 0.01, FELT: 0.015 },
        restitution: INITIAL_RESTITUTION,
        stopSpeed: INITIAL_STOP_SPEED,
        stopDurationMs: INITIAL_STOP_DURATION_MS,
      }),
    ).toEqual([])
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
