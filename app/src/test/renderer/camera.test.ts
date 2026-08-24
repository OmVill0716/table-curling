import { describe, expect, it } from 'vitest'
import {
  NORMAL_CAMERA,
  createCameraForLaunch,
  viewportToWorld,
  worldToViewport,
} from '../../game/renderer/camera'

describe('Camera', () => {
  it('通常範囲内の投射位置では600x1000を維持する', () => {
    expect(createCameraForLaunch({ x: 300, y: 940 })).toBe(NORMAL_CAMERA)
  })

  it('LONG最大後退でターゲット外周上端とStone下端を含める', () => {
    const camera = createCameraForLaunch({ x: 300, y: 1084 })

    expect(camera).toEqual({
      x: expect.closeTo(-0.6),
      y: 100,
      width: expect.closeTo(601.2),
      height: 1002,
    })
    expect(worldToViewport({ x: 300, y: 100 }, camera, {
      width: 600,
      height: 1000,
    }).y).toBe(0)
    expect(worldToViewport({ x: 300, y: 1102 }, camera, {
      width: 600,
      height: 1000,
    }).y).toBe(1000)
  })

  it('表示窓を拡張せずに収まる後退ではCameraを投射側へ移動する', () => {
    expect(createCameraForLaunch({ x: 300, y: 1012 })).toEqual({
      x: 0,
      y: 30,
      width: 600,
      height: 1000,
    })
  })

  it('World→表示→Worldの往復が一致する', () => {
    const camera = createCameraForLaunch({ x: 300, y: 1084 })
    const viewport = { width: 360, height: 600 }
    const original = { x: 417.25, y: 823.75 }
    const restored = viewportToWorld(
      worldToViewport(original, camera, viewport),
      camera,
      viewport,
    )

    expect(restored.x).toBeCloseTo(original.x, 10)
    expect(restored.y).toBeCloseTo(original.y, 10)
  })
})
